const fs = require('fs');
const path = require('path');
const { ErrorHandler } = require('../../utils/error-handler');

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
    const filePath = getLogFilePath(logType);
    
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return {
                logs: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                },
                message: `${logType} log file not found or empty`
            };
        }
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.trim()) {
            return {
                logs: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                },
                message: `${logType} log file is empty`
            };
        }
        
        // Split into log entries (each log entry starts with a timestamp)
        const logEntries = content.split(/(?=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
            .filter(entry => entry.trim())
            .reverse(); // Show newest logs first
        
        // Filter logs if search query provided
        let filteredLogs = logEntries;
        if (search) {
            filteredLogs = logEntries.filter(log => 
                log.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        // Calculate pagination
        const total = filteredLogs.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        // Get paginated logs
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
        
        // Parse log entries into structured format
        const parsedLogs = paginatedLogs.map((logEntry, index) => {
            const lines = logEntry.trim().split('\n');
            const firstLine = lines[0];
            
            // Extract timestamp and level
            const timestampMatch = firstLine.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
            const levelMatch = firstLine.match(/\[(\w+)\]/);
            
            // Extract message (everything after the level)
            let message = firstLine;
            if (levelMatch) {
                message = firstLine.substring(firstLine.indexOf(levelMatch[0]) + levelMatch[0].length).trim();
                // Remove [BILLING] tag if present
                message = message.replace(/^\[BILLING\]:\s*/, '');
            }
            
            return {
                id: startIndex + index + 1,
                timestamp: timestampMatch ? timestampMatch[1] : null,
                level: levelMatch ? levelMatch[1] : 'INFO',
                message: message.replace(/^:\s*/, ''),
                rawLog: logEntry.trim()
            };
        });
        
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

module.exports = {
    readLogFile,
    getLogStatistics,
    searchLogs
};
