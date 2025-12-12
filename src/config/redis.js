const { createClient } = require('redis');
const config = require('./config');
const { logger } = require('../utils/logger');

const redisUrl = `redis://${config.server.redisPassword ? `:${config.server.redisPassword}@` : ''}${config.server.redisHost}:${config.server.redisPort}`;

const client = createClient({
    url: redisUrl
});

client.on('error', (err) => {
    console.error('Redis Client Error', err);
    // logger.error('Redis Client Error', err);
});

client.on('connect', () => {
    console.log('Redis Client Connected');
    // logger.info('Redis Client Connected');
});

const connectRedis = async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
    } catch (err) {
        console.warn('Redis Connection Failed: Caching will be disabled. App will continue running.');
        console.warn('Error:', err.message);
        // We do NOT exit here, so the app can still run without Redis
    }
};

connectRedis();

module.exports = client;
