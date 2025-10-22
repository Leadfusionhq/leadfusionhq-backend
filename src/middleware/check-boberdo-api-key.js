// src/middleware/check-boberdo-api-key.js
const { ErrorHandler } = require('../utils/error-handler');
const BoberdoApiKey = require('../models/boberdoApiKey.model');

const checkBoberdoApiKey = async (req, res, next) => {
    try {
        let apiKey = null;
        
        // Check Authorization header for Bearer token
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
        }
        
        // Fallback to X-API-Key header
        if (!apiKey) {
            apiKey = req.headers['x-api-key'];
        }
        
        // Fallback to X-Boberdo-Key header
        if (!apiKey) {
            apiKey = req.headers['x-boberdo-api-key'];
        }
        
        if (!apiKey) {
            throw new ErrorHandler(401, 'Boberdo API key required');
        }

        // Verify API key exists and is active
        const keyDoc = await BoberdoApiKey.findOne({ 
            api_key: apiKey.trim(),
            is_active: true
        });

        if (!keyDoc) {
            throw new ErrorHandler(401, 'Invalid or inactive Boberdo API key');
        }

        // Update last used
        keyDoc.last_used_at = new Date();
        await keyDoc.save();

        // Attach to request for logging
        req.boberdoApiKey = keyDoc;
        
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = checkBoberdoApiKey;