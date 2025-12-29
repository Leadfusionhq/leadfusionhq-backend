const { User } = require('../models/user.model');
const UserServices = require('../services/user.service');
const config = require('../config/config');
const { ErrorHandler } = require('../utils/error-handler');
const { isEmpty } = require('../utils/utils');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (isEmpty(token)) {
            return next(new ErrorHandler(403, 'Token is missing'));
        }

        try {
            const decoded = jwt.verify(token, config.server.jwtSecretKey);

            let user = null;
            const redisKey = `auth:user:${decoded.id}`;

            // Try fetching from Redis first
            try {
                if (redisClient.isOpen) {
                    const cachedUser = await redisClient.get(redisKey);
                    if (cachedUser) {
                        user = JSON.parse(cachedUser);
                        // console.log(` Cache Hit for User: ${decoded.id}`);
                    }
                }
            } catch (redisErr) {
                console.error("Redis Error (Read):", redisErr.message);
            }

            // If not in cache, fetch from DB
            if (!user) {
                user = await UserServices.getUserByID(decoded.id, true);
                // console.log(` Cache Miss - Fetched from DB: ${decoded.id}`);

                // Store in Redis (TTL: 1 hour)
                try {
                    if (user && redisClient.isOpen) {
                        await redisClient.set(redisKey, JSON.stringify(user), {
                            EX: 3600 // 1 hour
                        });
                    }
                } catch (redisErr) {
                    console.error("Redis Error (Write):", redisErr.message);
                }
            }

            if (!user) {
                return next(new ErrorHandler(404, "Couldn't find your account, please create an account"));
            }

            // Add id as an alias for _id for convenience
            user.id = user._id;
            req.user = user;
        } catch (err) {
            console.error("Auth Middleware Error:", err);
            return next(new ErrorHandler(401, "Couldn't verify your identity, please try logging in again"));
        }
        next();
    } catch (err) {
        return next(new ErrorHandler(404, 'User account not found'));
    }
};
