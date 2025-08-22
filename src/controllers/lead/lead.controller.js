const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const LeadServices = require('../../services/lead/lead.service.js');
const { ErrorHandler } = require('../../utils/error-handler');
const Lead = require('../../models/lead.model.js'); 
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

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
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;


    // data = await LeadServices.getLeads(page, limit, filters);
    let data;
    if (isAdmin) {
      const allowedFilterKeys = ['campaign_id'];
      const filters = extractFilters(req.query, allowedFilterKeys);

      data = await LeadServices.getLeads(page, limit, filters);
    } else {
      data = await LeadServices.getLeadByUserId(page, limit, user._id);
    }

    sendResponse(res, data, "Leads fetched successfully", 200);
});

const getLeadById = wrapAsync(async (req, res) => {
  const user_id = req.user._id;
  const { leadId } = req.params;
  const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

  let data;
  if (isAdmin) {
    data = await LeadServices.getLeadByIdForAdmin(leadId);
  } else {
    data = await LeadServices.getLeadById(leadId, user_id);
  }

  sendResponse(res, { data }, 'Lead fetched successfully', 200);
});

const updateLead = wrapAsync(async (req, res) => {
  const { _id: user_id, role } = req.user;
  const { leadId } = req.params;
  const leadData = { ...req.body };

  const result = await LeadServices.updateLead(leadId, user_id, role, leadData);

  sendResponse(res, { result }, 'Lead has been updated successfully', 200);
});
module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead
};
