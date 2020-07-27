const socket = require('socket.io');

const ioWrapper = {
  io: null,
  sockets: {},
  initialize: function initialize(server) {
    this.io = socket(server)
    return this.io
  },
}

module.exports = ioWrapper