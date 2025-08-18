const express = require('express');
const campaignRouter = express.Router();
const campaignController = require('../../controllers/campaign/campaign.controller');
const CampaignSchema = require('../../request-schemas/campaign.schema');
const { celebrate } = require('celebrate');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');

const API = {
    CREATE_CAMPAIGN: '/',
    GET_ALL_CAMPAIGNS:'/',
    GET_CAMPAIGN:'/:campaignId',
    
};
campaignRouter.use(
    checkAuth,
    // authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN], [CONSTANT_ENUM.USER_ROLE.USER])
);
campaignRouter.get( API.GET_ALL_CAMPAIGNS, campaignController.getCampaigns);

campaignRouter.get( 
    API.GET_CAMPAIGN,
    celebrate(CampaignSchema.createCampaign), 
    campaignController.getCampaignById
);

campaignRouter.post(
    API.CREATE_CAMPAIGN,
    celebrate(CampaignSchema.createCampaign),
    campaignController.createCampaign
);


module.exports = campaignRouter;
