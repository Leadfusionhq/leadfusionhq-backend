// index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
require('./src/config/mongoose').connect(); 

const config = require('./src/config/config');
const { ErrorHandler } = require('./src/utils/error-handler');

const authRoutes = require('./src/routes/auth/auth.routes');


app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hey dev your api is running...' });

});


// Example: if config.server.route = 'api' in .env → route becomes: /api/
app.use(`/${config.server.route}/auth`, authRoutes);





// ✅ 404 handler (after all routes)
app.use((req, res, next) => {
  next(new ErrorHandler(404, 'Route not found'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Something went wrong',
  });
});

// ✅ Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
