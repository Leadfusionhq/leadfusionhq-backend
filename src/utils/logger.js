const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add stack trace for errors
        if (stack) {
            log += `\n${stack}`;
        }
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Create Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Write all logs to combined.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }), 
        
        // Write error logs to error.log
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write billing specific logs
        new winston.transports.File({ 
            filename: path.join(logsDir, 'billing.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                    if (service === 'billing') {
                        let log = `${timestamp} [${level.toUpperCase()}] [BILLING]: ${message}`;
                        if (Object.keys(meta).length > 0) {
                            log += `\nData: ${JSON.stringify(meta, null, 2)}`;
                        }
                        return log;
                    }
                    return false; // Don't log non-billing messages to billing.log
                })
            )
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Create billing-specific logger
const billingLogger = {
    info: (message, data = {}) => {
        logger.info(message, { service: 'billing', ...data });
    },
    error: (message, error = null, data = {}) => {
        const logData = { service: 'billing', ...data };
        if (error) {
            logData.error = error.message || error;
            logData.stack = error.stack;
        }
        logger.error(message, logData);
    },
    warn: (message, data = {}) => {
        logger.warn(message, { service: 'billing', ...data });
    },
    debug: (message, data = {}) => {
        logger.debug(message, { service: 'billing', ...data });
    }
};

module.exports = {
    logger,
    billingLogger
};
