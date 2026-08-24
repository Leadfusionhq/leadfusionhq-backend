// src/middleware/check-n8n-api-key.js
const { ErrorHandler } = require('../utils/error-handler');
const N8nApiKey = require('../models/n8nApiKey.model');

const checkN8nApiKey = async (req, res, next) => {
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
        
        // Fallback to X-N8N-API-Key header
        if (!apiKey) {
            apiKey = req.headers['x-n8n-api-key'];
        }

        // Fallback to request body
        if (!apiKey && req.body) {
            apiKey = req.body.api_key || req.body.apiKey || req.body.token || req.body.n8n_api_key;
        }

        // Fallback to query params
        if (!apiKey && req.query) {
            apiKey = req.query.api_key || req.query.apiKey || req.query.token;
        }
        
        if (!apiKey) {
            throw new ErrorHandler(401, 'n8n API key required');
        }

        // Verify API key exists and is active
        const keyDoc = await N8nApiKey.findOne({ 
            api_key: apiKey.trim(),
            is_active: true
        });

        if (!keyDoc) {
            throw new ErrorHandler(401, 'Invalid or inactive n8n API key');
        }

        // Update last used timestamp
        keyDoc.last_used_at = new Date();
        await keyDoc.save();

        // Attach to request for downstream handlers / logging
        req.n8nApiKey = keyDoc;
        
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = checkN8nApiKey;
