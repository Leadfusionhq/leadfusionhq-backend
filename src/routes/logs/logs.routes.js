const express = require('express');
const logsRouter = express.Router();
const logsController = require('../../controllers/logs/logs.controller');

const API = {
  LOGS_INFO: '/',
  BILLING_LOGS: '/billing',
  COMBINED_LOGS: '/combined',
  ERROR_LOGS: '/errors',
  STATS: '/stats',
  SEARCH: '/search' 
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

// Info endpoint for Logs API
logsRouter.get(API.LOGS_INFO, (req, res) => {
  res.json({
    message: 'LeadFusionHQ Logs API',
    version: '1.0.0',
    siteURL: 'https://api.leadfusionhq.com',
    baseUrl: '/api/logs',
    endpoints: {
      logs: {
        billingLogs: 'GET /api/logs/billing?page=1&limit=50&search=userId',
        combinedLogs: 'GET /api/logs/combined?page=1&limit=50&search=error',
        errorLogs: 'GET /api/logs/errors?page=1&limit=50',
        searchLogs: 'GET /api/logs/search?query=payment&page=1&limit=50&logType=billing'
      },
      statistics: {
        getStats: 'GET /api/logs/stats'
      }
    },
    logTypes: {
      billing: 'Billing-specific logs with [BILLING] tag',
      combined: 'All application logs from all services',
      error: 'Error logs only with stack traces'
    },
    queryParameters: {
      page: 'Page number for pagination (default: 1)',
      limit: 'Number of logs per page (default: 50, max: 100)',
      search: 'Search term to filter logs',
      query: 'Search query for cross-file search',
      logType: 'Log type for search: billing, combined, error, or all (default: all)'
    },
    security: {
      auth: 'No authentication required - Public access',
      roles: 'Open access for all users'
    },
    features: [
      'Real-time log access',
      'Pagination support',
      'Search functionality',
      'Cross-file search',
      'Structured JSON responses',
      'Log statistics and file info'
    ]
  });
});

module.exports = logsRouter;
