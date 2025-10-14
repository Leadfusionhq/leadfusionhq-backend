const express = require('express');
const leadRouter = express.Router();
const leadController = require('../../controllers/lead/lead.controller.js');
const LeadSchema = require('../../request-schemas/lead.schema.js');
const { celebrate } = require('celebrate');
const checkAuth = require('../../middleware/check-auth');
const { upload } = require('../../middleware/csv-upload.js');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

const API = {
    CREATE_LEAD: '/',
    RETURN_LEAD: '/return',
    GET_RETURN_LEADS:'/getReturnLeads',
    APPROVE_RETURN_LEAD:'/returns/approve',
    REJECT_RETURN_LEAD:'/returns/reject',
    UPLOAD_CSV: '/upload-csv',
    VALIDATE_CSV: '/validate-csv',
    GET_ALL_LEADS: '/',
    GET_LEAD: '/:leadId',
    UPDATE_LEAD: '/:leadId',
    DELETE_LEAD: '/:leadId',
    GET_LEADS_BY_CAMPAIGN: '/campaign/:campaignId',
    GET_LEADS_BY_USER: '/user/:userId',
    GET_PROCESSING_STATUS: '/processing/:jobId',
    GET_PROCESSING_JOBS: '/processing-jobs',
    CANCEL_PROCESSING_JOB: '/processing/:jobId/cancel',
};

// Apply authentication and authorization to all routes
leadRouter.use(
    checkAuth,
    authorizedRoles([
        CONSTANT_ENUM.USER_ROLE.ADMIN,
        CONSTANT_ENUM.USER_ROLE.USER
    ])
);

// CSV related routes
leadRouter.post(
    API.UPLOAD_CSV,
    upload,
    leadController.uploadCSV
);

leadRouter.post(
    API.VALIDATE_CSV,
    upload,
    leadController.validateCSV
);

leadRouter.get(
    API.GET_PROCESSING_STATUS,
    leadController.getProcessingStatus
);

leadRouter.get(
    API.GET_PROCESSING_JOBS,
    leadController.getProcessingJobs
);

leadRouter.patch(
    API.CANCEL_PROCESSING_JOB,
    leadController.cancelProcessingJob
);

// Standard CRUD operations
leadRouter.post(
    API.CREATE_LEAD,
    celebrate(LeadSchema.createLead),
    leadController.createLead
);

leadRouter.post(
    API.RETURN_LEAD,
    celebrate(LeadSchema.returnLead),
    leadController.returnLead
);

leadRouter.get(
    API.GET_RETURN_LEADS, 
    leadController.getReturnLeads
);

leadRouter.patch(
  API.REJECT_RETURN_LEAD,                 
  celebrate(LeadSchema.rejectReturnLead),
  leadController.rejectReturnLead
);

leadRouter.patch(
  API.APPROVE_RETURN_LEAD,                 
  celebrate(LeadSchema.approveReturnLead),
  leadController.approveReturnLead
);

leadRouter.get(
    API.GET_ALL_LEADS, 
    leadController.getLeads
);

leadRouter.get(
    API.GET_LEAD, 
    leadController.getLeadById
);

leadRouter.put(
    API.UPDATE_LEAD,
    celebrate(LeadSchema.updateLead), 
    leadController.updateLead
);
// Add this route in lead.route.js (before module.exports)
leadRouter.delete(
    API.DELETE_LEAD,  // '/:leadId'
    leadController.deleteLead
);
module.exports = leadRouter;