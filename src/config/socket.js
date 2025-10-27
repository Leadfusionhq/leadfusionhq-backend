const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  // Initialize socket.io with the HTTP server
  io = socketIo(server, {
    cors: {
      origin: '*', // Configure as needed for your client
      methods: ['GET', 'POST'],
    },
  });

  // Set up the connection event for users
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Emit a test message to the user
    socket.emit('message', 'Welcome to the notification service!');

    // Handle when the user disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });

    // Allow users to join rooms based on their user ID
    socket.on('join-room', (userId) => {
      socket.join(userId.toString());
      console.log(`User ${socket.id} joined room: ${userId}`);
    });

    // Handle other custom events here
    socket.on('send-notification', (notification) => {
      io.emit('notification', notification);
    });
  });

  console.log('Socket.IO initialized successfully');
  return io;
};

// Function to get the io instance safely
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
