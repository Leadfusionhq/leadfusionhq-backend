const socketIoClient = require('socket.io-client');

// Connect to the server
const socket = socketIoClient('http://localhost:8080');

socket.on('connect', () => {
  console.log('Client connected to server with Socket ID:', socket.id);

  // Join a room with user ID (if you want room-based notifications)
  const testUserId = '68a330cce1a720c014d615bc';
  socket.emit('join-room', testUserId);

  // Listen for the specific notification event
  socket.on(`new-notification-${testUserId}`, (notification) => {
    console.log('Received specific notification:', notification);
  });

  // Listen for general notifications
  socket.on('notification', (notification) => {
    console.log('Received general notification:', notification);
  });

  // Listen for welcome message
  socket.on('message', (msg) => {
    console.log('Message from server:', msg);
  });
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Keep the connection alive for testing
console.log('Socket test client running... Press Ctrl+C to exit');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nDisconnecting...');
  socket.disconnect();
  process.exit(0);
});