const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const CampaignServices = require('../../services/campaign/campaign.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const { getPaginationParams } = require('../../utils/pagination');

const createCampaign = wrapAsync(async (req, res) => {
    const data = req.body;
    const user_id = req.user._id;

    const campaignData = { ...data, user_id };
    const  campaign  = await CampaignServices.createCampaign(campaignData);
    sendResponse(res, { data }, 'campaign has been create succefully', 201);
});

const getCampaigns = wrapAsync(async (req, res) => {
  const user_id = req.user._id;
  const { page, limit } = getPaginationParams(req.query);

  const campaignsData = await CampaignServices.getCampaigns(page, limit,user_id);

  sendResponse(res, campaignsData, 'Campaign fetched successfully', 200);
});

module.exports = {
    createCampaign,
    getCampaigns,
     
};
