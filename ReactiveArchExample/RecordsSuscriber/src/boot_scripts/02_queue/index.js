'use strict';
const BootScript = require('./../../utils/BootScript');

class CustomModule extends BootScript {
  getName() {
    return 'queue';
  }

  boot(next) {
    this.hydrate([
      'connect_to_queue',
    ]).then((steps) => {
      this.emitter().emit('module:queue:ready', steps);
      next(steps);
    });
  }
};

module.exports = CustomModule;
