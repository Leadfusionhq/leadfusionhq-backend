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

const getAllLogs = async (req, res) => {
    try {
      const {
        level,
        source,
        message,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;
  
      // Build query
      const query = {};
      
      if (level) {
        query.level = level.toUpperCase();
      }
      
      if (source) {
        query.module = { $regex: source, $options: 'i' };
      }
      
      if (message) {
        query.message = { $regex: message, $options: 'i' };
      }
  
      // Date range
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
  
      const limitNum = Math.min(parseInt(limit), 200);
      const pageNum = parseInt(page);
      const skip = (pageNum - 1) * limitNum;
  
      console.log('📊 Query:', JSON.stringify(query, null, 2));
  
      // Execute query
      const [logs, total] = await Promise.all([
        Log.find(query)
          .sort({ timestamp: -1 })
          .limit(limitNum)
          .skip(skip)
          .lean(),
        Log.countDocuments(query),
      ]);
  
      console.log(`✅ Found ${logs.length} logs out of ${total} total`);
  
      // ✅ Transform response - use metadata.error if available for ERROR level
      const transformedLogs = logs.map(log => {
        let displayMessage = log.message;
        
        // For ERROR level logs, prioritize metadata.error
        if (log.level === 'ERROR' && log.metadata && log.metadata.error) {
          displayMessage = log.metadata.error;
        }
        
        return {
          ...log,
          level: log.level ? log.level.toLowerCase() : 'info',
          source: log.module || 'System',
          message: displayMessage, // ✅ Use transformed message
          meta: log.metadata || log.meta || {}, // Include metadata for detail view
        };
      });
  
      res.status(200).json({
        success: true,
        data: transformedLogs,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching logs',
        error: error.message,
      });
    }
  };
  
  /**
   * @desc    Get single log detail
   * @route   GET /api/logs/:id
   * @access  Private/Admin
   */
  const getLogDetail = async (req, res) => {
    try {
      const { id } = req.params;
      const log = await Log.findById(id).lean();
  
      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Log not found',
        });
      }
  
      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error('Error fetching log detail:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching log detail',
        error: error.message,
      });
    }
  };
  
  /**
   * @desc    Get log statistics
   * @route   GET /api/logs/stats
   * @access  Private/Admin
   */
  const getLogStats = async (req, res) => {
    try {
      const [levelStats, sourceStats, total, todayCount, errorCount] = await Promise.all([
        // Count by level
        Log.aggregate([
          { $group: { _id: '$level', count: { $sum: 1 } } },
        ]),
        // Count by source
        Log.aggregate([
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        // Total logs
        Log.countDocuments(),
        // Today's logs
        Log.countDocuments({
          timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        }),
        // Error count (last 24h)
        Log.countDocuments({
          level: 'error',
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
      ]);
  
      // Format level stats
      const levels = {};
      levelStats.forEach((item) => {
        levels[item._id] = item.count;
      });
  
      // Format source stats
      const sources = sourceStats.map((item) => ({
        source: item._id,
        count: item.count,
      }));
  
      res.status(200).json({
        success: true,
        data: {
          total,
          todayCount,
          errorCount24h: errorCount,
          byLevel: levels,
          topSources: sources,
        },
      });
    } catch (error) {
      console.error('Error fetching log stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching log statistics',
        error: error.message,
      });
    }
  };
  
  /**
   * @desc    Clear logs with filters
   * @route   DELETE /api/logs/clear
   * @access  Private/Admin
   */
  const clearLogs = async (req, res) => {
    try {
      const { level, source, beforeDate } = req.query;
  
      const query = {};
      if (level) query.level = level;
      if (source) query.source = source;
      if (beforeDate) query.timestamp = { $lte: new Date(beforeDate) };
  
      // Safety check
      if (Object.keys(query).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No filters provided. Please specify filters to clear logs.',
        });
      }
  
      const result = await Log.deleteMany(query);
  
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} logs.`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing logs',
        error: error.message,
      });
    }
  };
  
  /**
   * @desc    Export logs as CSV or JSON
   * @route   GET /api/logs/export
   * @access  Private/Admin
   */
  const exportLogs = async (req, res) => {
    try {
      const { format = 'json', level, source, startDate, endDate } = req.query;
  
      // Build query (same as getAllLogs)
      const query = {};
      if (level) query.level = level;
      if (source) query.source = { $regex: source, $options: 'i' };
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
  
      const logs = await Log.find(query).sort({ timestamp: -1 }).limit(10000).lean();
  
      if (format === 'csv') {
        // Convert to CSV
        const csv = [
          'Timestamp,Level,Source,Message',
          ...logs.map((log) =>
            `"${log.timestamp}","${log.level}","${log.source}","${log.message.replace(/"/g, '""')}"`
          ),
        ].join('\n');
  
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=logs-${Date.now()}.csv`);
        res.send(csv);
      } else {
        // Return JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=logs-${Date.now()}.json`);
        res.json(logs);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting logs',
        error: error.message,
      });
    }
  };

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
    syncAllLogs, // NEW
    getAllLogs,
    getLogDetail,
    getLogStats,
    clearLogs,
    exportLogs,
};
