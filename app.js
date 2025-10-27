const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const http = require('http');
// const { initSocket } = require('./src/config/socket');

const app = express();
// const server = http.createServer(app);
require('./src/config/mongoose').connect();

const path = require('path');

const config = require('./src/config/config');
const { ErrorHandler } = require('./src/utils/error-handler');
const { errors } = require('celebrate');

const authRoutes = require('./src/routes/auth/auth.routes');
const userRoutes = require('./src/routes/user-routes');

const logsRoutes = require('./src/routes/logs/logs.routes');

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hey dev your api is running...' });
});
app.get('/health', (req, res) => {
  return res.status(200).json({ message: 'OK' });
});
// serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

/** Example: if config.server.route = 'api' in .env → route becomes: /api/ */
app.use(`/${config.server.route}/auth`, authRoutes);
app.use(`/${config.server.route}/users`, userRoutes);

/** ::::::::::::::::::logs routes:::::::::::::::::: */
app.use(`/${config.server.route}/logs`, logsRoutes);

app.use(errors());

/**  404 handler (after all routes)  */
app.use((req, res, next) => {
  next(new ErrorHandler(404, 'Route not found'));
});

app.use((err, req, res, next) => {
  if (err.joi) {
    return res
      .status(400)
      .json({ error: true, message: err.joi.message, details: err.joi.details });
  }
  console.error(err);
  res
    .status(err.statusCode || 500)
    .json({ error: true, message: err.message || 'Something went wrong' });
});

module.exports = app;

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// uncomment this if you want to use socket::::

// initSocket(server);

// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
