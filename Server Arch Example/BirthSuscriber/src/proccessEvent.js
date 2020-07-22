'use strict';
const chalk = require('chalk').default;
const CONFIG = require('peanut-restify/config');

const calculateBirhtYear = age => (new Date()).getFullYear() - age;

module.exports = (message, publishMessageOnQueue, markAsProcessed, log) => {
  const newMessage = {
    ...message,
    'birth_year': calculateBirhtYear(message.age),
  };

  publishMessageOnQueue(newMessage)
    .then(ack => {
      log(newMessage, chalk.yellow('Fecha de nacimiento calculada.'), chalk.yellow(`Registro publicado al canal: ${chalk.redBright(CONFIG.get('QUEUE_EVENT_TO_PUBLISH'))} | ack: ${ack}`));
      markAsProcessed();
    })
    .catch(err => console.error(err));
};
