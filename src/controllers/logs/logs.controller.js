const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const LogsService = require('../../services/logs/logs.service');
const { ErrorHandler } = require('../../utils/error-handler');
const Log = require('../../models/Log');  // ADD THIS LINE
// Get billing logs
const getBillingLogs = wrapAsync(async (req, res) => {
    const { page = 1, limit = 50, search } = req.query;
    
    const logs = await LogsService.readLogFile('billing', {
        page: parseInt(page),
        limit: parseInt(limit),
        search
    });
    
    return sendResponse(res, logs, 'Billing logs retrieved successfully');
});

// Get combined logs
const getCombinedLogs = wrapAsync(async (req, res) => {
    const { page = 1, limit = 50, search } = req.query;
    
    const logs = await LogsService.readLogFile('combined', {
        page: parseInt(page),
        limit: parseInt(limit),
        search
    });
    
    return sendResponse(res, logs, 'Combined logs retrieved successfully');
});

// Get error logs
const getErrorLogs = wrapAsync(async (req, res) => {
    const { page = 1, limit = 50, search } = req.query;
    
    const logs = await LogsService.readLogFile('error', {
        page: parseInt(page),
        limit: parseInt(limit),
        search
    });
    
    return sendResponse(res, logs, 'Error logs retrieved successfully');
});

// Get log statistics
const getLogStats = wrapAsync(async (req, res) => {
    const stats = await LogsService.getLogStatistics();
    return sendResponse(res, stats, 'Log statistics retrieved successfully');
});

// Search logs across all files
const searchLogs = wrapAsync(async (req, res) => {
    const { query, page = 1, limit = 50, logType = 'all' } = req.query;
    
    if (!query) {
        throw new ErrorHandler(400, 'Search query is required');
    }
    
    const results = await LogsService.searchLogs(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        logType
    });
    
    return sendResponse(res, results, 'Log search completed successfully');
});

// Clear billing logs
const clearBillingLogs = wrapAsync(async (req, res) => {
    const result = await LogsService.clearLogFile('billing');
    return sendResponse(res, result, result.message);
});

// Clear combined logs
const clearCombinedLogs = wrapAsync(async (req, res) => {
    const result = await LogsService.clearLogFile('combined');
    return sendResponse(res, result, result.message);
});

// Clear error logs
const clearErrorLogs = wrapAsync(async (req, res) => {
    const result = await LogsService.clearLogFile('error');
    return sendResponse(res, result, result.message);
});

// Clear all logs
const clearAllLogs = wrapAsync(async (req, res) => {
    const result = await LogsService.clearAllLogFiles();
    return sendResponse(res, result, result.message);
});
// Sync specific log type to database
const syncLogs = wrapAsync(async (req, res) => {
    const { logType } = req.params;
    
    const result = await LogsService.syncFileLogsToDatabase(logType);
    
    return sendResponse(res, result, `${logType} logs synced successfully`);
});

// Sync all logs to database
const syncAllLogs = wrapAsync(async (req, res) => {
    const logTypes = ['billing', 'combined', 'error'];
    const results = [];
    let totalSynced = 0;
    
    for (const logType of logTypes) {
        const result = await LogsService.syncFileLogsToDatabase(logType);
        results.push({ logType, ...result });
        totalSynced += result.synced || 0;
    }
    
    return sendResponse(res, {
        results,
        totalSynced,
        message: `Synced ${totalSynced} logs to database`
    }, 'All logs synced successfully');
});

module.exports = {
    getBillingLogs,
    getCombinedLogs,
    getErrorLogs,
    getLogStats,
    searchLogs,
    clearBillingLogs,
    clearCombinedLogs,
    clearErrorLogs,
    clearAllLogs,
    syncLogs,      // NEW
    syncAllLogs    // NEW
};
