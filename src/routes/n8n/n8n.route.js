const express = require('express');
const leadRouter = express.Router();
const leadController = require('../../controllers/lead/lead.controller.js');
const LeadSchema = require('../../request-schemas/lead.schema.js');
const { celebrate } = require('celebrate');
const checkN8nApiKey = require('../../middleware/check-n8n-api-key');

// Apply global API key check to all routes
leadRouter.use(checkN8nApiKey);

const API = {
    /*** new */
    POST_LEADS: '/post-leads',
    POST_LEADS_DETAILS: '/post-leads-details-doc'
};

leadRouter.get(
    API.POST_LEADS_DETAILS,
    leadController.postLeadDetailsDoc
);

/*** new ******/
leadRouter.post(
    API.POST_LEADS,
    celebrate(LeadSchema.postLead),
    leadController.postLead
);

module.exports = leadRouter;