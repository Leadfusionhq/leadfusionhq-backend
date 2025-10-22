// src/controllers/boberdo/boberdo.controller.js
const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const BoberDoService = require('../../services/boberdoo/boberdoo.service');

const healthCheck = wrapAsync(async (req, res) => {
    sendResponse(res, { 
        status: 'healthy',
        timestamp: new Date(),
        service: 'Boberdo Lead API'
    }, 'Boberdo API is operational', 200);
});

const postLead = wrapAsync(async (req, res) => {
    const leadData = req.body;
    
    // Process lead with Boberdoo filter_set_id
    const result = await BoberDoService.processBoberdoLead(leadData);
    
    // Update API key usage count
    await req.boberdoApiKey.updateOne({ 
        $inc: { total_leads_received: 1 } 
    });
    
    sendResponse(res, { 
        lead_id: result.lead_id,
        internal_id: result._id,
        campaign_id: result.campaign_id._id,
        campaign_name: result.campaign_id.name,
        status: result.status
    }, 'Lead received successfully', 201);
});

module.exports = {
    healthCheck,
    postLead
};