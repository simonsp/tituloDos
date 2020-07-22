'use strict';
const app = require('./MainApp');
const expr = require('peanut-restify/expressions');
const path = require('path');

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
class BootScript {
  constructor() {

  }

  boot(next) {
    console.log(`loaded ${__filename}`);
    next();
  }

  getName() {
    return null;
  }

  hydrate(modulePath) {
    const callerPath = path.dirname(_getCallerFile());
    // Always change to single file array load
    expr.whenTrue(typeof modulePath == 'string', () => {
      modulePath = [modulePath];
    });
    return app._hydrate(modulePath, callerPath, null);
  }

  emitter() {
    return app;
  }
}

module.exports = BootScript;
