const app = require('./src')

app.listen(process.env.NODE_PORT, function () {
  console.log(`Servidor listo!. Escuchando en el puerto: ${process.env.NODE_PORT}!`);
});
