const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const LeadServices = require('../../services/lead/lead.service.js');
const { ErrorHandler } = require('../../utils/error-handler');
const Lead = require('../../models/lead.model.js'); 

const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const { getPaginationParams , extractFilters} = require('../../utils/pagination');
const generateUniqueLeadId = require('../../utils/idGenerator');

const createLead = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const lead_id = await generateUniqueLeadId();
    const leadData = { ...req.body, user_id , lead_id };
    const  result  = await LeadServices.createLead(leadData);
    sendResponse(res, { leadData }, 'lead has been create succefully', 201);
});

const getLeads = wrapAsync(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const user = req.user;

    let data;

    const allowedFilterKeys = ['campaign_id'];
    const filters = extractFilters(req.query, allowedFilterKeys);

    data = await LeadServices.getLeads(page, limit, filters);
  

    sendResponse(res, data, "Leads fetched successfully", 200);
});
module.exports = {
    createLead,
    getLeads,
};
