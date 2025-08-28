const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const http = require('http'); 
const { initSocket } = require('./src/config/socket');

const app = express();
const server = http.createServer(app);
require('./src/config/mongoose').connect(); 

const config = require('./src/config/config');
const { ErrorHandler } = require('./src/utils/error-handler');
const { errors } = require('celebrate');

const authRoutes = require('./src/routes/auth/auth.routes');
const userRoutes = require('./src/routes/user-routes');
const adminRoutes = require('./src/routes/admin-routes');
const campaignRoutes = require('./src/routes/campaign/campaign.routes');
const leadRoutes = require('./src/routes/lead/lead.route');
const locationRoutes = require('./src/routes/location/location.routes');
const notificationRoutes = require('./src/routes/notification/notification.route');
const utilityRoutes = require('./src/routes/utility/utility.routes');
const ghlRoutes = require('./src/routes/ghl.route');


const testRoutes = require('./src/routes/test/email-routes');


app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hey dev your api is running...' });

});


/** Example: if config.server.route = 'api' in .env → route becomes: /api/ */
app.use(`/${config.server.route}/auth`, authRoutes);
app.use(`/${config.server.route}/users`, userRoutes);
app.use(`/${config.server.route}/admins`, adminRoutes);
app.use(`/${config.server.route}/campaigns`, campaignRoutes);
app.use(`/${config.server.route}/leads`, leadRoutes);
app.use(`/${config.server.route}/locations`, locationRoutes);
app.use(`/${config.server.route}/notifications`, notificationRoutes);
app.use(`/${config.server.route}/utilities`, utilityRoutes);
app.use(`/${config.server.route}/ghl`, ghlRoutes);
app.use(`/${config.server.route}/test`, testRoutes);

app.use(errors());

/**  404 handler (after all routes)  */
app.use((req, res, next) => {
  next(new ErrorHandler(404, 'Route not found'));
});

app.use((err, req, res, next) => {
  if (err.joi) {
    return res.status(400).json({
      error: true,
      message: err.joi.message || 'Validation failed',
      details: err.joi.details,
    });
  }
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Something went wrong',
  });
});


// Initialize Socket.IO by passing the HTTP server
initSocket(server);
/**   Server start */
const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
server.listen(PORT, () => { 
  console.log(`Server running on http://localhost:${PORT}`);
});