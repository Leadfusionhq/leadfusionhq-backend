
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    transports: ["websocket"],
    cors: {
      // origin: "*",
      origin: [
        "http://localhost:3000",
        `${process.env.BACKEND_LINK}`,
        `${process.env.UI_LINK}`
      ],
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      jwt.verify(token, config.server.jwtSecretKey, (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error: Invalid token'));
        }
        socket.user = decoded;
        next();
      });
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);
    socket.join(userId.toString());
    console.log(`User ${userId} joined room: ${userId}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  console.log('Socket.IO initialized successfully');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };