require('dotenv').config();
const { cleanEnv, str, port, num, url } = require('envalid');

const env = cleanEnv(process.env, {
    // MongoDB
    MONGODB_URI: str({ default: '', desc: 'Full MongoDB Connection String (optional)' }),
    MONGO_DB_HOST: str({ default: '127.0.0.1', desc: 'MongoDB Host' }),
    MONGO_DB_PORT: port({ default: 27017, desc: 'MongoDB Port' }),
    MONGO_DB: str({ desc: 'MongoDB Database Name' }),
    MONGO_POOL_SIZE: num({ default: 100, desc: 'MongoDB Connection Pool Size' }),

    // Server
    PORT: port({ default: 4000, desc: 'API Server Port' }),
    NODE_ENV: str({ choices: ['development', 'test', 'production', 'dev', 'prod'], default: 'dev', desc: 'Node.js Environment' }),
    ROUTE: str({ default: 'api', desc: 'API Route Prefix' }),

    // Security
    JWT_SECRET: str({ desc: 'Secret key for signing JWTs' }),

    // External Services
    BACKEND_LINK: url({ default: '', desc: 'Backend URL' }),
    UI_LINK: url({ default: '', desc: 'UI Link for redirecting after login' }),

    // Mail
    RESEND_API_KEY: str({ default: '', desc: 'RESEND API KEY for sending emails are required.' }),

    // Redis
    REDIS_HOST: str({ default: '127.0.0.1', desc: 'Redis Host' }),
    REDIS_PORT: port({ default: 6379, desc: 'Redis Port' }),
    REDIS_PASSWORD: str({ default: '', desc: 'Redis Password (optional)' })
});

const config = {
    server: {
        MONGODB_URI: env.MONGODB_URI,
        mongoHost: env.MONGO_DB_HOST,
        mongoPort: env.MONGO_DB_PORT,
        mongoDb: env.MONGO_DB,
        poolSize: env.MONGO_POOL_SIZE,
        route: env.ROUTE,
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        jwtSecretKey: env.JWT_SECRET,
        db: env.MONGO_DB,
        backendLink: env.BACKEND_LINK,
        // smtpMail: env.SMTP_MAIL,
        // smtpPassword: env.SMTP_PASS,

        // Redis
        redisHost: env.REDIS_HOST,
        redisPort: env.REDIS_PORT,
        redisPassword: env.REDIS_PASSWORD
    }
};

module.exports = config;
