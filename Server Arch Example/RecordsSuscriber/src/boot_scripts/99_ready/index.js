'use strict';
const BootScript = require('./../../utils/BootScript');
const chalk = require('chalk');
const emoji = require('node-emoji');
const logger = require('peanut-restify/logger');

class CustomModule extends BootScript {
  boot(next) {
    logger.info(emoji.emojify(`:white_check_mark:  ${chalk.bold.green('TODO LISTO!!')}`));
    console.log('');
    next();
  }
};

module.exports = CustomModule;
