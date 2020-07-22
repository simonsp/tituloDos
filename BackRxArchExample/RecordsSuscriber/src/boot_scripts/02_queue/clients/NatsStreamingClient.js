'use strict';
const logger = require('peanut-restify/logger');
const expr = require('peanut-restify/expressions');
const EventEmitter = require('events');
const chalk = require('chalk').default;
const stan = require('node-nats-streaming');
const nats = require('nats');
const emoji = require('node-emoji');
const prefix = emoji.emojify(':left_speech_bubble:  ');
/**
 * Enum connection state
 * @readonly
 * @enum {string}
 */
let STATES_ENUM = {
  'INITIALIZING': 'initializing',
  'DISCONNECTED': 'disconnected',
  'CONNECTED': 'connected',
};

let retriesBeforeAlert = Number.MAX_SAFE_INTEGER;
class NatsStreamingClient extends EventEmitter {
  /**
   * Creates an instance of NatsStreamingClient.
   * @param {String} clusterName Cluster Name to connect in the queue
   * @param {String} clientId Client Id to register
   * @param {Object} options Nats Setup Options
   * @memberof NatsStreamingClient
   */
  constructor(clusterName, clientId, options) {
    super();
    this.currentState = STATES_ENUM.INITIALIZING;
    if (options.timeInMinutesBeforeAlertOnQueueRetries) {
      retriesBeforeAlert = Math.ceil(
        (options.timeInMinutesBeforeAlertOnQueueRetries * 1000 * 60) /
        options.reconnectTimeWait
      );
    }

    // Add some required options for this client
    options.encoding = 'binary';
    options.waitOnFirstConnect = true;

    // Connect to the Queue
    this.__connect(clusterName, clientId, options);
  }

  /**
   * Return the current state for the queue Connection
   */
  getState() {
    return this.currentState;
  }

  /**
   * Return is the connection to queue is connected
   */
  isConnected() {
    return this.currentState == STATES_ENUM.CONNECTED;
  }

  /**
   * Change the current state
   * @param {STATES_ENUM} newState newState to change
   * @returns {String} new State applied
   * @memberof NatsStreamingClient
   */
  __changeState(newState) {
    if (this.currentState !== newState) {
      this.emit('queue:state_changed', newState); // Only when update
    }
    this.currentState = newState;
    return this.currentState;
  }

  /**
   * Connect to the Queue
   * @param {String} clusterName Cluster Name to connect in the queue
   * @param {String} clientId Client Id to register
   * @param {Object} options Nats Setup Options
   */
  __connect(clusterName, clientId, options) {
    // Create nats client with default options
    const natsClient = nats.connect(options);
    const stanClient = stan.connect(clusterName, clientId, {
      nc: natsClient,
    });

    let disconnectCounter = retriesBeforeAlert;
    stanClient.on('connect', (nc) => {
      this.__changeState(STATES_ENUM.CONNECTED);
      logger.info(`${prefix} ${chalk.bold.green('Conectado a la cola!')}`);
      this.emit('queue:connect', nc);
    });

    natsClient.on('disconnect', () => {
      disconnectCounter -= 1;
      expr.whenTrue(disconnectCounter <= 0, () => {
        disconnectCounter = retriesBeforeAlert; // Reset Counter Again

        // Send a Message for Alert that Queue is Disconnected
        this.emit('queue:max_retries_reached', retriesBeforeAlert);
      });
      this.__changeState(STATES_ENUM.DISCONNECTED);
      this.emit('queue:disconnect');
    });

    stanClient.on('reconnecting', () => {
      logger.debug(chalk.bold.yellow(`${prefix} Intentando reconectar a la cola...`));
      this.emit('queue:reconnecting');
    });

    stanClient.on('reconnect', (nc) => {
      this.__changeState(STATES_ENUM.CONNECTED);
      logger.info(`${prefix} ${chalk.bold.green('Reconectado a la cola.')}`);
      this.emit('queue:reconnect', nc);

      try {
        natsClient.close();
      } catch (ex) {
        console.error(ex);
      }

      this.__connect(clusterName, clientId, options);
    });

    stanClient.on('error', (err) => {
      logger.error(chalk.red(`${prefix}`, err));
      this.emit('queue:error', err);
    });

    this.stanClient = stanClient;
  }

  /**
   * Publish a message to the given subject, with optional reply and callback.
   * @param {string} subject Event Name
   * @param {(string | Buffer)} msg Message Payload
   */
  publish(subject, payload) {
    return new Promise((resolve, reject) => {
      this.stanClient.publish(subject, payload, (err, ackGuid) => {
        if (err) {
          return reject(err);
        }
        resolve(ackGuid);
      });
    });
  }

  /**
   * Subscribe to a given subject, with optional options and callback. opts can be
   * ommitted, even with a callback. The Subscriber Id is returned.
   * @param {String|Array<String>} subject Event Name
   * @param {Object} options Nats Configuration Options
   * @param {Function} onMessageFn Callback Function when message is arrived
   */
  subscribe(subject, options, onMessageFn) {
    let subjects = Array.isArray(subject) ? subject : [subject];

    const subscriptions = [];
    subjects.forEach((subject) => {
      const subscription = this.stanClient.subscribe(subject, options);
      subscription.on('message', (msg) => {
        onMessageFn(msg);
      });
      subscriptions.push(subscription);
    });

    if (subscriptions.length == 1) {
      return subscriptions[0];
    }
    return subscriptions;
  }

  /**
   * Subscribe to a given subject, with optional options and callback. opts can be
   * ommitted, even with a callback. The Subscriber Id is returned.
   * @param {String|Array<String>} subject Event Name
   * @param {String} queueGroup Queue Group
   * @param {Object} options Nats Configuration Options
   * @param {Function} onMessageFn Callback Function when message is arrived
   */
  subscribeWithQueueGroup(subject, queueGroup, options, onMessageFn) {
    let subjects = Array.isArray(subject) ? subject : [subject];

    const subscriptions = [];
    subjects.forEach((subject) => {
      const subscription = this.stanClient.subscribe(subject, queueGroup, options);
      subscription.on('message', (msg) => {
        onMessageFn(msg);
      });
      subscriptions.push(subscription);
    });

    if (subscriptions.length == 1) {
      return subscriptions[0];
    }
    return subscriptions;
  }
};

module.exports = NatsStreamingClient;
