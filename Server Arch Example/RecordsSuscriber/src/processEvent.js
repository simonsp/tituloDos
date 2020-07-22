'use strict';
const logger = require('peanut-restify/logger');
const chalk = require('chalk').default;

let counter = 0;
module.exports = (message, publishMessageOnQueue, markAsProcessed) => {
  logger.info(chalk.yellow('Cantidad de Registros: '), ++counter);
  markAsProcessed();
};
