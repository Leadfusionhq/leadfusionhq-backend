const { createClient } = require('redis');
const config = require('./config');
const { logger } = require('../utils/logger');

const redisUrl = `redis://${config.server.redisPassword ? `:${config.server.redisPassword}@` : ''}${config.server.redisHost}:${config.server.redisPort}`;

const client = createClient({
    url: redisUrl,
    disableOfflineQueue: true,
    socket: {
        reconnectStrategy: (retries) => {
            return Math.min(retries * 50, 5000);
        }
    }
});

let lastErrorLog = 0;
client.on('error', (err) => {
    const now = Date.now();
    if (now - lastErrorLog > 10000) {
        console.error('Redis Client Error (throttled):', err.message);
        lastErrorLog = now;
    }
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
    }
};

connectRedis();

module.exports = client;
