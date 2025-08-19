const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
require('./src/config/mongoose').connect(); 

const config = require('./src/config/config');
const { ErrorHandler } = require('./src/utils/error-handler');
const { errors } = require('celebrate');

const authRoutes = require('./src/routes/auth/auth.routes');
const userRoutes = require('./src/routes/user-routes');
const adminRoutes = require('./src/routes/admin-routes');
const campaignRoutes = require('./src/routes/campaign/campaign.routes');
const locationRoutes = require('./src/routes/location/location.routes');
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

/** ::::::::::::::::::campaign route::::::::::::::::: */
app.use(`/${config.server.route}/campaigns`, campaignRoutes);
/** ::::::::::::::::::location route::::::::::::::::: */
app.use(`/${config.server.route}/locations`, locationRoutes);
/** ::::::::::::::::::utilities route::::::::::::::::: */
app.use(`/${config.server.route}/utilities`, utilityRoutes);


app.use(`/${config.server.route}/ghl`, ghlRoutes);

/** ::::::::::::::::::testign routes:::::::::::::::::: */
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

/**   Server start */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
