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


    // Send plain text message (exactly what Boberdoo expects)
    res.status(201).send('Lead received successfully');
});

module.exports = {
    healthCheck,
    postLead
};