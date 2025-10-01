const express = require('express');
const router = express.Router();
const { billingLogger } = require('../../utils/logger');

// Test endpoint to demonstrate billing logging
router.get('/test-billing-logs', (req, res) => {
    billingLogger.info('Testing billing logger functionality', { 
        testType: 'manual',
        timestamp: new Date().toISOString(),
        endpoint: '/test-billing-logs'
    });

    billingLogger.warn('This is a warning log example', { 
        warningType: 'test',
        details: 'Sample warning message for testing'
    });

    billingLogger.error('This is an error log example', new Error('Sample error for testing'), { 
        errorType: 'test',
        details: 'Sample error message for testing'
    });

    res.json({ 
        message: 'Billing logs have been generated successfully!',
        logFiles: [
            'logs/billing.log - Contains billing-specific logs',
            'logs/combined.log - Contains all logs',
            'logs/error.log - Contains error logs only'
        ],
        instructions: 'Check the log files to see the generated logs'
    });
});

module.exports = router;
