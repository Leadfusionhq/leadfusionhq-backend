const express = require('express');
const campaignRouter = express.Router();
const campaignController = require('../../controllers/campaign/campaign.controller');
const CampaignSchema = require('../../request-schemas/campaign.schema');
const { celebrate } = require('celebrate');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

const API = {
    CREATE_CAMPAIGN: '/',
    CREATE_CAMPAIGN_BY_ADMIN:'/:userId/add',
    GET_ALL_CAMPAIGNS:'/',
    QUICK_SEARCH: '/quick-search',    
    GET_CAMPAIGN:'/:campaignId',
    UPDATE_CAMPAIGN:'/:campaignId',
    SEARCH_CAMPAIGNS: '/search',    
};
campaignRouter.use(
    checkAuth,
    authorizedRoles([
        CONSTANT_ENUM.USER_ROLE.ADMIN,
        CONSTANT_ENUM.USER_ROLE.USER
    ])

);


campaignRouter.get( API.GET_ALL_CAMPAIGNS, campaignController.getCampaigns);


campaignRouter.get(
    API.SEARCH_CAMPAIGNS,
    // celebrate(CampaignSchema.searchCampaigns), 
    campaignController.searchCampaigns
);

campaignRouter.get(
    API.QUICK_SEARCH,
    // celebrate(CampaignSchema.quickSearchCampaigns), 
    campaignController.quickSearchCampaigns
);

campaignRouter.get( 
    API.GET_CAMPAIGN,
    celebrate(CampaignSchema.getCampaign), 
    campaignController.getCampaignById
);

campaignRouter.post(
    API.CREATE_CAMPAIGN,
    celebrate(CampaignSchema.createCampaign),
    campaignController.createCampaign
);
campaignRouter.post(
    API.CREATE_CAMPAIGN_BY_ADMIN,
    celebrate(CampaignSchema.createCampaignByAdmin),
    campaignController.createCampaignByAdmin
);

campaignRouter.put( 
    API.UPDATE_CAMPAIGN,
    celebrate(CampaignSchema.updateCampaign), 
    campaignController.updateCampaign
);


module.exports = campaignRouter;
