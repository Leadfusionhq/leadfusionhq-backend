// src/controllers/n8n/n8n-admin.controller.js
const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const N8nApiKey = require('../../models/n8nApiKey.model');
const { ErrorHandler } = require('../../utils/error-handler');

const createApiKey = wrapAsync(async (req, res) => {
    const { name } = req.body;
    
    // Check if one already exists
    const existing = await N8nApiKey.findOne({ is_active: true });
    
    if (existing) {
        return sendResponse(res, {
            api_key: existing.api_key,
            name: existing.name,
            created_at: existing.created_at,
            total_leads_received: existing.total_leads_received,
            message: 'Active API key already exists. Use this one or deactivate it first.'
        }, 'Existing API key retrieved', 200);
    }
    
    const apiKey = N8nApiKey.generateApiKey();
    
    const newKey = await N8nApiKey.create({
        api_key: apiKey,
        name: name || 'n8n Global API Key'
    });
    
    sendResponse(res, { 
        api_key: newKey.api_key,
        name: newKey.name,
        created_at: newKey.created_at
    }, 'n8n API key created successfully', 201);
});

const getApiKey = wrapAsync(async (req, res) => {
    const apiKey = await N8nApiKey.findOne({ is_active: true });
    
    if (!apiKey) {
        throw new ErrorHandler(404, 'No active n8n API key found');
    }
    
    sendResponse(res, {
        api_key: apiKey.api_key,
        name: apiKey.name,
        created_at: apiKey.created_at,
        last_used_at: apiKey.last_used_at,
        total_leads_received: apiKey.total_leads_received
    }, 'API key retrieved successfully', 200);
});

const revokeApiKey = wrapAsync(async (req, res) => {
    const apiKey = await N8nApiKey.findOneAndUpdate(
        { is_active: true },
        { is_active: false },
        { new: true }
    );
    
    if (!apiKey) {
        throw new ErrorHandler(404, 'No active API key found');
    }
    
    sendResponse(res, { 
        message: 'API key revoked successfully',
        revoked_key: `${apiKey.api_key.substring(0, 10)}...`
    }, 'API key revoked', 200);
});

const getApiKeyStats = wrapAsync(async (req, res) => {
    const Lead = require('../../models/lead.model');
    const apiKey = await N8nApiKey.findOne({ is_active: true });
    
    if (!apiKey) {
        throw new ErrorHandler(404, 'No active API key found');
    }
    
    // Get lead statistics for source: 'n8n' (or source_info: 'n8n')
    const totalLeads = await Lead.countDocuments({ 
        $or: [{ source: 'n8n' }, { source_info: 'n8n' }] 
    });
    const last24Hours = await Lead.countDocuments({
        $or: [{ source: 'n8n' }, { source_info: 'n8n' }],
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const last7Days = await Lead.countDocuments({
        $or: [{ source: 'n8n' }, { source_info: 'n8n' }],
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    sendResponse(res, {
        api_key_info: {
            name: apiKey.name,
            created_at: apiKey.created_at,
            last_used_at: apiKey.last_used_at,
            is_active: apiKey.is_active
        },
        statistics: {
            total_leads: totalLeads,
            last_24_hours: last24Hours,
            last_7_days: last7Days
        }
    }, 'API key statistics retrieved', 200);
});

module.exports = {
    createApiKey,
    getApiKey,
    revokeApiKey,
    getApiKeyStats
};
