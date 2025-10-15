const express = require('express');
const logsRouter = express.Router();
const logsController = require('../../controllers/logs/logs.controller');
const Log = require('../../models/Log');  // ADD THIS LINE
const API = {
  LOGS_INFO: '/',
  BILLING_LOGS: '/billing',
  COMBINED_LOGS: '/combined',
  ERROR_LOGS: '/errors',
  STATS: '/stats',
  SEARCH: '/search',
  CLEAR_BILLING: '/clear/billing',
  CLEAR_COMBINED: '/clear/combined',
  CLEAR_ERRORS: '/clear/errors',
  CLEAR_ALL: '/clear/all',

  SYNC_LOGS: '/sync/:logType',  // NEW
  SYNC_ALL: '/sync'   ,           // NEW

  
  GET_ALL_LOGS: '/all',
  GET_LOG_DETAIL: '/:id',
 
  CLEAR_LOGS: '/clear',
  EXPORT_LOGS: '/export',
};


 

// Get billing logs
// GET /api/logs/billing?page=1&limit=50&search=userId
logsRouter.get(API.BILLING_LOGS, logsController.getBillingLogs);

// Get combined logs (all logs)
// GET /api/logs/combined?page=1&limit=50&search=error
logsRouter.get(API.COMBINED_LOGS, logsController.getCombinedLogs);

// Get error logs only
// GET /api/logs/errors?page=1&limit=50
logsRouter.get(API.ERROR_LOGS, logsController.getErrorLogs);

// Get log statistics
// GET /api/logs/stats
logsRouter.get(API.STATS, logsController.getLogStats);

// Search across all log files
// GET /api/logs/search?query=payment&page=1&limit=50&logType=billing
logsRouter.get(API.SEARCH, logsController.searchLogs);



// Clear billing logs
// DELETE /api/logs/clear/billing
logsRouter.delete(API.CLEAR_BILLING, logsController.clearBillingLogs);

// Clear combined logs
// DELETE /api/logs/clear/combined
logsRouter.delete(API.CLEAR_COMBINED, logsController.clearCombinedLogs);

// Clear error logs
// DELETE /api/logs/clear/errors
logsRouter.delete(API.CLEAR_ERRORS, logsController.clearErrorLogs);

// Clear all logs
// DELETE /api/logs/clear/all
logsRouter.delete(API.CLEAR_ALL, logsController.clearAllLogs);

// POST /api/logs/sync/billing
logsRouter.post(API.SYNC_LOGS, logsController.syncLogs);

// Sync all logs to database
// POST /api/logs/sync
logsRouter.post(API.SYNC_ALL, logsController.syncAllLogs);


// GET /api/logs/all?page=1&limit=50&level=error&source=AuthService&startDate=2024-01-01&endDate=2024-01-31&message=failed
logsRouter.get(API.GET_ALL_LOGS, logsController.getAllLogs);

// Get single log detail
// GET /api/logs/:id
logsRouter.get(API.GET_LOG_DETAIL, logsController.getLogDetail);

// Get log statistics
// GET /api/logs/stats
logsRouter.get(API.STATS, logsController.getLogStats);

// Clear logs with filters
// DELETE /api/logs/clear?level=debug&beforeDate=2024-01-01
logsRouter.delete(API.CLEAR_LOGS, logsController.clearLogs);

// Export logs as CSV/JSON
// GET /api/logs/export?format=csv&level=error
logsRouter.get(API.EXPORT_LOGS, logsController.exportLogs);

// Info endpoint
logsRouter.get(API.LOGS_INFO, (req, res) => {
  res.json({
    message: 'LeadFusionHQ Logs API',
    version: '2.0.0',
    siteURL: 'https://api.leadfusionhq.com',
    baseUrl: '/api/logs',
    endpoints: {
      logs: {
        getAllLogs: 'GET /api/logs/all?page=1&limit=50&level=error&source=AuthService&startDate=2024-01-01&endDate=2024-01-31&message=failed',
        getLogDetail: 'GET /api/logs/:id',
        exportLogs: 'GET /api/logs/export?format=csv&level=error'
      },
      statistics: {
        getStats: 'GET /api/logs/stats'
      },
      management: {
        clearLogs: 'DELETE /api/logs/clear?level=debug&beforeDate=2024-01-01'
      }
    },
    logLevels: ['info', 'warn', 'error', 'debug'],
    queryParameters: {
      page: 'Page number for pagination (default: 1)',
      limit: 'Number of logs per page (default: 50, max: 200)',
      level: 'Filter by log level: info, warn, error, debug',
      source: 'Filter by source (e.g., AuthService, API-Gateway)',
      message: 'Search in message field (case-insensitive)',
      startDate: 'Filter logs from this date (ISO format)',
      endDate: 'Filter logs until this date (ISO format)'
    }
  });
});
module.exports = logsRouter;
