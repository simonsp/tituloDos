//Express and BodyParser
const express = require('express');
const cors = require(`cors`)
const bodyParser = require('body-parser');
//Chalk
const chalk = require('chalk');
//Queue configuration
const QueueClient = require('./NatsStreamingClient');
//Controller
const {createUser, deleteUser} = require('./userController');

const clientId = `client_${(new Date()).getTime()}`;
const clusterName = process.env.QUEUE_CLUSTER_NAME;
const cnx = process.env.QUEUE_CONNECTIONSTRING;

const configurations = {
	url: cnx,
	maxReconnectAttempts: -1,
	reconnectTimeWait: 4000,
};

// Connect to NATS Endpoints
const client = new QueueClient(clusterName, clientId, configurations);

client
	.on('queue:connect', (nc) => {
		const opts = nc.subscriptionOptions();
		opts.setManualAckMode(true);
		opts.setDeliverAllAvailable();
		console.log('');
	})
	.on('queue:state_changed', (newState) => {
		const state = newState == 'connected' ? chalk.bold.green(newState) : chalk.bold.yellow(newState);
		console.log(`[NATS] Nuevo estado: ${state}`);
	})
	.on('queue:max_retries_reached', (retries) => {
		console.log('Máx. de intentos alcanzados', retries);
	});

const app = express();
app.use(cors())
app.use(bodyParser.json());
app.post('/create', createUser(client));
app.delete('/delete', deleteUser(client));

module.exports = app;