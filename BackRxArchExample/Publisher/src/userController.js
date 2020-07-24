const createUser = (queueClient) => {
	return (req, res) => {
		const { name, age, company } = req.body;
		
		queueClient.publish(process.env.QUEUE_EVENT_TO_PUBLISH, JSON.stringify({ name, age, company }))
			.then(done => {
				console.log(`Publicado a la cola con el ack: ${done}`);
				res.send(`Listo, ack: ${done}`)
			})
			.catch(err => {
				console.log(`Error publicando en la cola: ${err}`);
				res.send(`error: ${err}`)
			});
	}
};

module.exports = createUser;