const express = require('express');
const campaignRouter = express.Router();
const campaignController = require('../../controllers/campaign/campaign.controller');
const CampaignSchema = require('../../request-schemas/campaign.schema');
const { celebrate } = require('celebrate');

const API = {
    CREATE_CAMPAIGN: '/',

    
};

campaignRouter.post(
    API.CREATE_CAMPAIGN,
    celebrate(CampaignSchema.createCampaign),
    campaignController.createCampaign
);

module.exports = campaignRouter;
