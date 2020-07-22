'use strict';
const BootScript = require('./../../utils/BootScript');

class CustomModule extends BootScript {
  getName() {
    return 'setup';
  }

  boot(next) {
    this.hydrate([
      'welcome_message',
      'show_package_info',
    ]).then((steps) => {
      this.emitter().emit('module:setup:ready', steps);
      next(steps);
    });
  }
};

module.exports = CustomModule;
