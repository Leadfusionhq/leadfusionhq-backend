const fs = require('fs');
const path = require('path');
const { ErrorHandler } = require('../../utils/error-handler');
const Log = require('../../models/Log');  // ADD THIS LINE
const LOGS_DIR = path.join(__dirname, '../../../logs');

// Helper function to check if log file exists
const getLogFilePath = (logType) => {
    const logFiles = {
        'billing': 'billing.log',
        'combined': 'combined.log',
        'error': 'error.log'
    };
    
    const fileName = logFiles[logType];
    if (!fileName) {
        throw new ErrorHandler(400, `Invalid log type: ${logType}`);
    }
    
    return path.join(LOGS_DIR, fileName);
};

// Read and parse log file with pagination
const readLogFile = async (logType, options = {}) => {
    const { page = 1, limit = 50, search } = options;
    
    try {
        // Build query
        const query = { logType: logType };
        
        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { rawLog: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get total count
        const total = await Log.countDocuments(query);
        
        if (total === 0) {
            return {
                logs: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                },
                message: `${logType} log file not found or empty`
            };
        }
        
        // Get paginated logs from database
        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();
        
        const totalPages = Math.ceil(total / limit);
        
        const parsedLogs = logs.map((log, index) => ({
            id: ((page - 1) * limit) + index + 1,
            timestamp: log.timestamp ? log.timestamp.toISOString().replace('T', ' ').substring(0, 19) : null,
            level: log.level || 'INFO',
            message: log.message,
            rawLog: log.rawLog
        }));
        
        return {
            logs: parsedLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            logType,
            searchQuery: search || null
        };
        
    } catch (error) {
        throw new ErrorHandler(500, `Failed to read ${logType} logs: ${error.message}`);
    }
};

// Get log file statistics
const getLogStatistics = async () => {
    const stats = {};
    const logTypes = ['billing', 'combined', 'error'];
    
    for (const logType of logTypes) {
        try {
            const filePath = getLogFilePath(logType);
            
            if (fs.existsSync(filePath)) {
                const fileStats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                const logCount = content.split(/(?=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
                    .filter(entry => entry.trim()).length;
                
                stats[logType] = {
                    exists: true,
                    size: fileStats.size,
                    sizeFormatted: formatBytes(fileStats.size),
                    lastModified: fileStats.mtime,
                    logCount: logCount,
                    isEmpty: logCount === 0
                };
            } else {
                stats[logType] = {
                    exists: false,
                    size: 0,
                    sizeFormatted: '0 B',
                    lastModified: null,
                    logCount: 0,
                    isEmpty: true
                };
            }
        } catch (error) {
            stats[logType] = {
                exists: false,
                error: error.message,
                size: 0,
                logCount: 0,
                isEmpty: true
            };
        }
    }
    
    return {
        statistics: stats,
        totalLogs: Object.values(stats).reduce((sum, stat) => sum + (stat.logCount || 0), 0),
        totalSize: Object.values(stats).reduce((sum, stat) => sum + (stat.size || 0), 0),
        logsDirectory: LOGS_DIR
    };
};

// Search across multiple log files
const searchLogs = async (query, options = {}) => {
    const { page = 1, limit = 50, logType = 'all' } = options;
    const results = [];
    
    const logTypesToSearch = logType === 'all' 
        ? ['billing', 'combined', 'error'] 
        : [logType];
    
    for (const type of logTypesToSearch) {
        try {
            const logs = await readLogFile(type, { 
                page: 1, 
                limit: 1000, // Get more logs for searching
                search: query 
            });
            
            // Add log type to each result
            const logsWithType = logs.logs.map(log => ({
                ...log,
                logFile: type
            }));
            
            results.push(...logsWithType);
        } catch (error) {
            // Continue searching other files even if one fails
            continue;
        }
    }
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Apply pagination to combined results
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    
    return {
        logs: paginatedResults,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        searchQuery: query,
        searchedLogTypes: logTypesToSearch
    };
};

// Helper function to format bytes
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Clear log file
const clearLogFile = async (logType) => {
    try {
        const count = await Log.countDocuments({ logType: logType });
        
        if (count === 0) {
            return {
                success: true,
                message: `${logType} log file does not exist - nothing to clear`,
                logType,
                cleared: false,
                deletedCount: 0
            };
        }
        
        // Delete from database
        const result = await Log.deleteMany({ logType: logType });
        
        return {
            success: true,
            message: `${logType} log file cleared successfully`,
            logType,
            cleared: true,
            originalSize: 0,
            originalSizeFormatted: '0 B',
            deletedCount: result.deletedCount,
            clearedAt: new Date().toISOString()
        };
        
    } catch (error) {
        throw new ErrorHandler(500, `Failed to clear ${logType} logs: ${error.message}`);
    }
};

// Clear all log files
const clearAllLogFiles = async () => {
    const logTypes = ['billing', 'combined', 'error'];
    const results = [];
    let totalCleared = 0;
    let totalSize = 0;
    
    for (const logType of logTypes) {
        try {
            const result = await clearLogFile(logType);
            results.push(result);
            
            if (result.cleared) {
                totalCleared++;
                totalSize += result.originalSize || 0;
            }
        } catch (error) {
            results.push({
                success: false,
                message: error.message,
                logType,
                cleared: false
            });
        }
    }
    
    return {
        success: true,
        message: `Cleared ${totalCleared} out of ${logTypes.length} log files`,
        results,
        summary: {
            totalFilesCleared: totalCleared,
            totalSizeCleared: totalSize,
            totalSizeClearedFormatted: formatBytes(totalSize),
            clearedAt: new Date().toISOString()
        }
    };
};

// NEW METHOD: Sync file logs to database
const syncFileLogsToDatabase = async (logType) => {
    const filePath = getLogFilePath(logType);
    
    try {
        if (!fs.existsSync(filePath)) {
            return { 
                success: true,
                synced: 0, 
                total: 0,
                message: `${logType} log file not found` 
            };
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.trim()) {
            return { 
                success: true,
                synced: 0, 
                total: 0,
                message: `${logType} log file is empty` 
            };
        }
        
        const logEntries = content.split(/(?=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
            .filter(entry => entry.trim());
        
        let syncedCount = 0;
        
        for (const logEntry of logEntries) {
            await Log.create({
                logType: logType,
                message: logEntry.substring(0, 200),
                rawLog: logEntry.trim(),
                timestamp: new Date()
            });
            syncedCount++;
        }
        
        return { 
            success: true,
            synced: syncedCount, 
            total: logEntries.length,
            message: `Synced ${syncedCount} logs to database`
        };
    } catch (error) {
        throw new ErrorHandler(500, `Failed to sync ${logType} logs: ${error.message}`);
    }
};

module.exports = {
    readLogFile,
    getLogStatistics,
    searchLogs,
    clearLogFile,
    clearAllLogFiles,
    syncFileLogsToDatabase
};
