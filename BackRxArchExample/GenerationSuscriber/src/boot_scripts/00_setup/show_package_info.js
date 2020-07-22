'use strict';
const BootScript = require('./../../utils/BootScript');
const logger = require('peanut-restify/logger');
const emoji = require('node-emoji');
const chalk = require('chalk');
const fs = require('fs');

class CustomScript extends BootScript {
  getName() {
    return 'info';
  }

  boot(next) {
    const packageJSON = JSON.parse(fs.readFileSync(`${__dirname}/../../../package.json`));

    const settings = {
      createdAt: (new Date()).toISOString(),
      name: packageJSON.name,
    };

    logger.info(emoji.emojify(`:information_source:  Fecha :   ${chalk.bold.green(settings.createdAt)}`));
    logger.info(emoji.emojify(`:information_source:  Nombre:       ${chalk.bold.green(settings.name)}`));
    console.log(' ');
    next(settings);
  }
}

module.exports = CustomScript;
