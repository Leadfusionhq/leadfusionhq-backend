const Log = require('../models/Log');

// Database logger helper function
const saveToDatabase = async (logData) => {
  try {
    await Log.create({
      level: logData.level.toUpperCase(),
      message: logData.message,
      logType: logData.logType || 'combined',
      module: logData.module || 'GENERAL',
      userId: logData.userId?.toString() || null,
      metadata: logData.metadata || {},
      rawLog: logData.rawLog,
      timestamp: new Date(),
    });
  } catch (error) {
    // Silent fail - don't break the app if DB logging fails
    console.error('Failed to save log to database:', error.message);
  }
};

// Console logger (for development only)
const consoleLog = (level, message, data = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${timestamp}] [${level}] ${message}`, data);
  }
};

// Billing Logger
const billingLogger = {
  info: (message, data = {}) => {
    consoleLog('INFO', `[BILLING] ${message}`, data);

    saveToDatabase({
      level: 'INFO',
      message,
      logType: 'billing',
      module: 'BILLING',
      userId: data.user_id,
      metadata: data,
      rawLog: `[INFO] [BILLING]: ${message}`,
    });
  },
  error: (message, error = null, data = {}) => {
    consoleLog('ERROR', `[BILLING] ${message}`, { ...data, error: error?.message });

    saveToDatabase({
      level: 'ERROR',
      message,
      logType: 'error',
      module: 'BILLING',
      userId: data.user_id,
      metadata: { ...data, error: error?.message, stack: error?.stack },
      rawLog: `[ERROR] [BILLING]: ${message}`,
    });
  },
  warn: (message, data = {}) => {
    consoleLog('WARN', `[BILLING] ${message}`, data);

    saveToDatabase({
      level: 'WARN',
      message,
      logType: 'billing',
      module: 'BILLING',
      userId: data.user_id,
      metadata: data,
      rawLog: `[WARN] [BILLING]: ${message}`,
    });
  },
  debug: (message, data = {}) => {
    consoleLog('DEBUG', `[BILLING] ${message}`, data);

    saveToDatabase({
      level: 'DEBUG',
      message,
      logType: 'billing',
      module: 'BILLING',
      userId: data.user_id,
      metadata: data,
      rawLog: `[DEBUG] [BILLING]: ${message}`,
    });
  },
};

// Lead Logger
const leadLogger = {
  info: (message, data = {}) => {
    consoleLog('INFO', `[LEAD] ${message}`, data);

    saveToDatabase({
      level: 'INFO',
      message,
      logType: 'combined',
      module: 'LEAD',
      userId: data.user_id,
      metadata: data,
      rawLog: `[INFO] [LEAD]: ${message}`,
    });
  },
  error: (message, error = null, data = {}) => {
    consoleLog('ERROR', `[LEAD] ${message}`, { ...data, error: error?.message });

    saveToDatabase({
      level: 'ERROR',
      message,
      logType: 'error',
      module: 'LEAD',
      userId: data.user_id,
      metadata: { ...data, error: error?.message, stack: error?.stack },
      rawLog: `[ERROR] [LEAD]: ${message}`,
    });
  },
  warn: (message, data = {}) => {
    consoleLog('WARN', `[LEAD] ${message}`, data);

    saveToDatabase({
      level: 'WARN',
      message,
      logType: 'combined',
      module: 'LEAD',
      userId: data.user_id,
      metadata: data,
      rawLog: `[WARN] [LEAD]: ${message}`,
    });
  },
  debug: (message, data = {}) => {
    consoleLog('DEBUG', `[LEAD] ${message}`, data);

    saveToDatabase({
      level: 'DEBUG',
      message,
      logType: 'combined',
      module: 'LEAD',
      userId: data.user_id,
      metadata: data,
      rawLog: `[DEBUG] [LEAD]: ${message}`,
    });
  },
};

// General Logger (for other modules)
const logger = {
  info: (message, data = {}) => {
    consoleLog('INFO', message, data);

    saveToDatabase({
      level: 'INFO',
      message,
      logType: 'combined',
      module: data.module || 'GENERAL',
      userId: data.user_id,
      metadata: data,
      rawLog: `[INFO]: ${message}`,
    });
  },
  error: (message, error = null, data = {}) => {
    consoleLog('ERROR', message, { ...data, error: error?.message });

    saveToDatabase({
      level: 'ERROR',
      message,
      logType: 'error',
      module: data.module || 'GENERAL',
      userId: data.user_id,
      metadata: { ...data, error: error?.message, stack: error?.stack },
      rawLog: `[ERROR]: ${message}`,
    });
  },
  warn: (message, data = {}) => {
    consoleLog('WARN', message, data);

    saveToDatabase({
      level: 'WARN',
      message,
      logType: 'combined',
      module: data.module || 'GENERAL',
      userId: data.user_id,
      metadata: data,
      rawLog: `[WARN]: ${message}`,
    });
  },
  debug: (message, data = {}) => {
    consoleLog('DEBUG', message, data);

    saveToDatabase({
      level: 'DEBUG',
      message,
      logType: 'combined',
      module: data.module || 'GENERAL',
      userId: data.user_id,
      metadata: data,
      rawLog: `[DEBUG]: ${message}`,
    });
  },
};

module.exports = {
  logger,
  billingLogger,
  leadLogger,
};
