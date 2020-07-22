'use strict';
const BootScript = require('./../../utils/BootScript');

const logger = require('peanut-restify/logger');
const emoji = require('node-emoji');

class CustomScript extends BootScript {
  boot(next) {
    logger.info(emoji.emojify(':coffee:  Levantando aplicación!'));
    next();
  }
}

module.exports = CustomScript;
