const app = require('./src')
const ioWrapper = require(`./src/socketIO`)

const server = app.listen(process.env.NODE_PORT, function () {
  console.log(`Servidor listo!. Escuchando en el puerto: ${process.env.NODE_PORT}!`);
});

const io = ioWrapper.initialize(server)

io.on(`connection`, socket => {
  socket.on(`socketConnection`, room => {
    socket.join(room)
  })
})

server