const ioWrapper = require(`./socketIO`)

const createUser = (queueClient) => {
	return (req, res) => {
		const { name, age, company } = req.body;
		
		queueClient.publish(process.env.QUEUE_EVENT_TO_PUBLISH_CREATE, JSON.stringify({ name, age, company }))
			.then(done => {
				console.log(`Publicado a la cola con el ack: ${done}`);
				ioWrapper.io.emit('userPublished', {name, age, company})
				res.send(`Listo, ack: ${done}`)
			})
			.catch(err => {
				console.log(`Error publicando en la cola: ${err}`);
				res.send(`error: ${err}`)
			});
	}
};

const deleteUser  = (queueClient) => {
	return (req, res) => {
		const { id } = req.query;
		queueClient.publish(process.env.QUEUE_EVENT_TO_PUBLISH_DELETE, JSON.stringify({ id }))
			.then(done => {
				console.log(`Publicado a la cola con el ack: ${done}`);
				ioWrapper.io.emit('deleteUser', { id })
				return res.status(200).json({
					success: true,
					ack: done,
					userId: id,
				  })
			})
			.catch(err => {
				console.log(`Error publicando en la cola: ${err}`);
				return next(error)
			});
	}
};

module.exports = {createUser, deleteUser};