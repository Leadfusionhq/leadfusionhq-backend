const express = require('express');
const leadRouter = express.Router();
const leadController = require('../../controllers/lead/lead.controller.js');
const LeadSchema = require('../../request-schemas/lead.schema.js');
const { celebrate } = require('celebrate');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

const API = {
    CREATE_LEAD: '/',
    GET_ALL_LEADS: '/',
    GET_LEAD: '/:leadId',
    UPDATE_LEAD: '/:leadId',
    DELETE_LEAD: '/:leadId',
    GET_LEADS_BY_CAMPAIGN: '/campaign/:campaignId',
    GET_LEADS_BY_USER: '/user/:userId',
};
leadRouter.use(
    checkAuth,
    authorizedRoles([
        CONSTANT_ENUM.USER_ROLE.ADMIN,
        CONSTANT_ENUM.USER_ROLE.USER
    ])

);

leadRouter.post(
    API.CREATE_LEAD,
    celebrate(LeadSchema.createLead),
    leadController.createLead
);
leadRouter.get( API.GET_ALL_LEADS, leadController.getLeads);

module.exports = leadRouter;
