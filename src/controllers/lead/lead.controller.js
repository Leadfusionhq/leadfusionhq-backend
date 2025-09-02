const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const LeadServices = require('../../services/lead/lead.service.js');
const NotificationServices = require('../../services/notification/notification.service');


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
    const message = 'New Lead has been assign to your campain!';
    console.log('Campaign User ID:', result?.campaign_id?.user_id);

    try{
      await NotificationServices.createNotification(
        user_id,        
        result?.campaign_id?.user_id,   
        'info',          
        message,         
        0,               
        `/dashboard/leads`
      );
    } catch (err) {
        console.error(`Failed to send notification`, err.message);
    }
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


const uploadCSV = wrapAsync(async (req, res) => {
    const role = req.user.role;
    const user_id = req.user._id;
    const { column_mapping } = req.body;

    if (!req.file) {
        throw new ErrorHandler(400, 'CSV file is required');
    }

    // Parse column mapping
    let mappings;
    try {
        mappings = typeof column_mapping === 'string' 
            ? JSON.parse(column_mapping) 
            : column_mapping;
    } catch (error) {
        throw new ErrorHandler(400, 'Invalid column mapping format');
    }

    // const result = await LeadServices.processCSVUpload(
    //     req.file.buffer, 
    //     user_id, 
    //     mappings
    // );

    sendResponse(res, { mappings }, 'CSV processed successfully', 201);
});


module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    uploadCSV
};
