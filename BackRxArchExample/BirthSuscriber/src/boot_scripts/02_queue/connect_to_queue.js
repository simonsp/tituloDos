'use strict';
const BootScript = require('./../../utils/BootScript');
const CONFIG = require('peanut-restify/config');
const logger = require('peanut-restify/logger');
const expr = require('peanut-restify/expressions');

const chalk = require('chalk').default;
const emoji = require('node-emoji');
const fs = require('fs');
const QueueClient = require('./clients/NatsStreamingClient');

class CustomScript extends BootScript {
  getName() {
    return 'client';
  }

  boot(next) {
    const clientId = `client_${(new Date()).getTime()}`;
    const eventsToSubscribe = CONFIG.get('QUEUE_EVENT_TO_SUBSCRIBE').split(',');
    const clusterName = CONFIG.get('QUEUE_CLUSTER_NAME');
    const cnx = CONFIG.get('QUEUE_CONNECTIONSTRING');
    const packageJSON = JSON.parse(fs.readFileSync(`${__dirname}/../../../package.json`));
    const queueGroup = packageJSON.name;

    logger.info(emoji.emojify(`:left_speech_bubble:  ID Consumidor:    ${chalk.bold.green(clientId)}`));
    logger.info(emoji.emojify(`:left_speech_bubble:  ID Grupo: ${chalk.bold.green(queueGroup)}`));
    logger.info(emoji.emojify(':left_speech_bubble:  Suscrito al evento:'));
    eventsToSubscribe.forEach((eventName) => {
      logger.info(emoji.emojify(`:left_speech_bubble:  - ${chalk.bold.green(eventName)}`));
    });

    const configurations = {
      url: cnx,
      maxReconnectAttempts: -1,
      reconnectTimeWait: 4000,
    };

    // Is Nats Clustered?? (multiple)
    expr.whenTrue(cnx.indexOf(',') > 0, () => {
      // Remove no clustered url options and added Clustered configuration
      logger.info(chalk.green(':left_speech_bubble:  running on clustered mode'));
      delete configurations.url;
      configurations.servers = cnx.split(',');
    });

    // Minutes before alert when Queue Disconnection
    expr.whenTrue(CONFIG.exists('QUEUE_WAITING_TIME_IN_MINUTES_BEFORE_ALERT_ON_DISCONNECTION'), () => {
      configurations.timeInMinutesBeforeAlertOnQueueRetries = CONFIG.getNumber('QUEUE_WAITING_TIME_IN_MINUTES_BEFORE_ALERT_ON_DISCONNECTION');
    });

    // Connect to NATS Endpoints
    const client = new QueueClient(clusterName, clientId, configurations);

    client
      .on('queue:connect', (nc) => {
        const opts = nc.subscriptionOptions();
        // opts.setAckWait(5 * 1000); // 5s change default timeout
        opts.setManualAckMode(true); // Manual ACK (30s default)
        opts.setDeliverAllAvailable(); // Deliver all message (even from the persistent store)

        eventsToSubscribe.forEach((eventName) => {
          const subject = `${eventName}`;
          client.subscribeWithQueueGroup(subject, queueGroup, opts, (msg) => {
            try {
              this.emitter().emit('module:queue:message:new', subject, {
                data: msg.getData(),
                createdAt: msg.getTimestamp(),
                sequence: msg.getSequence(),
              }, () => {
                msg.ack();
              });
            } catch (ex) {
              const e = {
                error: ex,
                handled: false,
              };
              this.emitter().emit('module:queue:unhandled_exception', e);
              expr.whenFalse(e.handled, () => {
                throw ex;
              });
            }
          });
        });

        console.log('');

        next({
          sdk: client,
          clientId,
          clusterName,
          queueGroup,
          configurations,
          type: 'NATS',
        });
      })
      .on('queue:state_changed', (newState) => {
        const state = newState == 'connected' ? chalk.bold.green(newState) : chalk.bold.yellow(newState);
        logger.info(emoji.emojify(`:left_speech_bubble:  Nuevo Estado: ${state}`));
        this.emitter().emit('module:queue:state_changed', newState); // expose to commun layer
      })
      .on('queue:max_retries_reached', (retries) => {
        this.emitter().emit('module:queue:max_retries_reached', retries); // expose to commun layer
      });
  }
}

module.exports = CustomScript;
