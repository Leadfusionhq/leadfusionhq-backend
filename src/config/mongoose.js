const mongoose = require('mongoose');
const config = require('./config');
const cluster = require('cluster');

const {
  server: { mongoHost, mongoPort, db, poolSize, MONGODB_URI },
} = config;

const mongoUrl = MONGODB_URI || `mongodb://${mongoHost}:${mongoPort}/${db}?maxPoolSize=${poolSize}`;
// const mongoUrl = `mongodb://${mongoHost}:${mongoPort}/${db}?maxPoolSize=${poolSize}`;
// Making MongoDB Connection using mongoose
exports.connect = () => {
  mongoose.set('strictQuery', true);
  mongoose
    .connect(mongoUrl)
    .then(() => {
      if (cluster.isMaster) console.log('Successfully connected to mongo database');
    })
    .catch((error) => {
      console.log('Mongo connection failed. exiting now...');
      console.error(error);
      /* eslint-disable */
      process.exit(1);
      /* eslint-disable */
    });
};
