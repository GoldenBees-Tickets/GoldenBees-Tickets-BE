const socketIo = require('socket.io');
const socketSeatHandler = require('./socketSeat'); // Import the new socketSeat handler

module.exports = function (server) {
  const io = socketIo(server, {
    cors: {
      origin: 'http://localhost:5173', 
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket'] // Ensure WebSocket transport is used
  });

  io.on('connection', (socket) => {
    console.log('A user connected');
    
    const userType = socket.handshake.query.userType;
    console.log(`Connected as ${userType}`);
    

    // Add logging to check the handshake query
    console.log('Handshake query:', socket.handshake.query);

    socket.on('send_message', (message) => {
      console.log(`Received message from ${userType}: `, message);

      if (userType === 'user') {
        // Send to admin
        socket.broadcast.emit('receive_message', { message, type: 'user' });
        socket.broadcast.emit('typing', { userType: '' }); 
      } else if (userType === 'admin') {
        // Send to user
        socket.broadcast.emit('receive_message', { message, type: 'admin' });
        socket.broadcast.emit('typing', { userType: '' }); 
      }
    });

    socket.on('typing', (userType) => {
      console.log(`${userType} is typing...`);
      socket.broadcast.emit('typing', { userType });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    socketSeatHandler(socket); // Handle seat booking related events
  });
};
