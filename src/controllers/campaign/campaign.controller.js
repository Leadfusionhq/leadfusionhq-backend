const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const CampaignServices = require('../../services/campaign/campaign.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const { getPaginationParams } = require('../../utils/pagination');

const createCampaign = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const campaignData = { ...req.body, user_id };
    const  result  = await CampaignServices.createCampaign(campaignData);
    sendResponse(res, { result }, 'campaign has been create succefully', 201);
});

const getCampaigns = wrapAsync(async (req, res) => {
  const user_id = req.user._id;
  const { page, limit } = getPaginationParams(req.query);

  const data = await CampaignServices.getCampaigns(page, limit,user_id);

  sendResponse(res, data, 'Campaign fetched successfully', 200);
});

const getCampaignById = wrapAsync(async (req, res) => {
  const user_id = req.user._id;
  const { campaignId } = req.params;

  const data = await CampaignServices.getCampaignById(campaignId, user_id);

  sendResponse(res, {data}, 'Campaign fetched successfully', 200);
});

module.exports = {
    createCampaign,
    getCampaigns,
    getCampaignById,
     
};
