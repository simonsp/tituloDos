'use strict';
const EventEmitter = require('events');
const expr = require('peanut-restify/expressions');
const CONFIG = require('peanut-restify/config');
const logger = require('peanut-restify/logger');
const fs = require('fs');
const path = require('path');
let modulesLoaded = {};

function _getCallerFile() {
  var originalFunc = Error.prepareStackTrace;
  var callerfile, currentfile;
  try {
    var err = new Error();

    Error.prepareStackTrace = function (err, stack) {
      return stack;
    };

    currentfile = err.stack.shift().getFileName();

    while (err.stack.length) {
      callerfile = err.stack.shift().getFileName();

      if (currentfile !== callerfile) break;
    }
  } catch (e) {}

  Error.prepareStackTrace = originalFunc;

  return callerfile;
}

class MainApp extends EventEmitter {
  _hydrate(modulePath, basePath, fileToLoad) {
    return new Promise((resolve, reject) => {
      const modulesToLoad = [];
      expr.whenTrue(Array.isArray(modulePath), () => {
        // Load each array as "single module", but in array order
        modulePath.forEach((moduleSinglePath) => {
          let fullPath = path.join(basePath, moduleSinglePath);
          expr.whenTrue(fileToLoad, () => {
            fullPath = path.join(fullPath, fileToLoad);
          });

          let moduleName = moduleSinglePath;
          expr.whenTrue(moduleName.indexOf('/') >= 0, () => {
            moduleName = moduleName.substring(moduleName.lastIndexOf('/') + 1);
          });
          modulesToLoad.push({
            moduleName: moduleName,
            relativePath: moduleSinglePath,
            fullPath: fullPath,
          });
        });
      });

      expr.whenTrue(typeof modulePath === 'string', () => {
        // Load each module inside the containing folder (module Path)
        const folderPath = path.join(basePath, modulePath);
        fs.readdirSync(folderPath).filter((file) => {
          let fullPath = path.join(folderPath, file);
          expr.whenTrue(fileToLoad, () => {
            fullPath = path.join(fullPath, fileToLoad);
          });
          modulesToLoad.push({
            moduleName: file,
            relativePath: path.join(modulePath, file),
            fullPath: fullPath,
          });
        });
      });

      const resolves = {};
      const nextModule = (currentIndex) => {
        // Call the boot method from each module file
        try {
          if (currentIndex == modulesToLoad.length) {
            return resolve(resolves);
          }
          const moduleToLoad = modulesToLoad[currentIndex];
          const moduleToBoot = require(moduleToLoad.fullPath);

          /** @type {MainApp} */
          const $this = this;
          let nextFn = function (result) {
            if (result instanceof Error) {
              throw result;
            }

            // Override default module name??
            const name = this.getName() || moduleToLoad.moduleName;

            // Save the granular response
            expr.whenTrue(result, () => {
              resolves[name] = result;
            });

            // Emit for someone which need to do something in ready
            $this.emit('module:ready', moduleToLoad.moduleName);

            // Load next module (sync mode)
            nextModule(currentIndex + 1);
          };
          this.emit('module:initializing', moduleToLoad.moduleName);

          /** @type {BootScript} */
          const instance = new moduleToBoot();
          nextFn = nextFn.bind(instance);
          instance.boot(nextFn);
        } catch (ex) {
          console.error(ex);
          reject(ex);
        }
      };
      nextModule(0);
    });
  }
  /**
   * Hydrate the target(s) modules
   * @param {String|Array<String>} modulePath the modules path wich are modules to load (relative to caller file) or an array of single modules to load
   */
  hydrate(modulePath) {
    const basePath = path.dirname(_getCallerFile());
    const defer = this._hydrate(modulePath, basePath, 'index.js');
    defer.then((modules) => {
      modulesLoaded = modules;
      this.emit('application:loaded', modules);
    });
    defer.catch((ex) => {
      throw ex;
    });
    return defer;
  }

  get(name) {
    switch (name) {
      case 'is-dev-mode':
        return CONFIG.get('NODE_ENV') == 'development';
      case 'is-prod-mode':
        return CONFIG.get('NODE_ENV') == 'production';
      case 'is-test-mode':
        return CONFIG.get('NODE_ENV') == 'test';
      default:
        try {
          return name.split('/').reduce((o, i) => o[i], modulesLoaded);
        } catch (ex) {
          throw ex;
        }
        break;
    }
  }
}

const instance = new MainApp();

// Call shutdown
(() => {
  process.on('unhandledRejection', error => {
    const e = {
      error: error,
      handled: false,
    };
    instance.emit('application:unhandled_rejection', e);
    expr.whenFalse(e.handled, () => {
      // if is not handled via app , then log the exception and exit!
      logger.error('unhandled rejection error', error);
      logger.debug(error);
      process.exit(1);
    });
  });

  let called = false; // called once!!
  const shutdown = () => {
    expr.whenFalse(called, () => {
      called = true;
      const eventName = 'application:shutdown';
      const handlers = instance.listeners(eventName);
      let counter = handlers.length;
      expr.whenTrue(counter == 0, () => {
        process.exit(0);
      });
      // count the handlers , and when handler call next, augment +1 counter
      // when counter is equal to the handler , close in a 'sign kill'
      instance.emit(eventName, () => {
        counter--;
        if (counter <= 0) {
          // console.log(chalk.green('all process exited ok, called application shutdown (process.exit)... bye bye!'));
          // kill process in a sigterm
          process.exit(1);
        }
      });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();

module.exports = instance;
