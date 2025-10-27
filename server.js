const app = require('./app');
require('./src/config/mongoose').connect();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
