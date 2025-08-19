const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const CampaignServices = require('../../services/campaign/campaign.service');
const N8NCampaignServices = require('../../services/n8n/n8n.campaign.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const { getPaginationParams } = require('../../utils/pagination');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
 const generateUniqueCampaignId = require('../../utils/generateCampaignId');

const createCampaign = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const campaign_id = await generateUniqueCampaignId();
    const campaignData = { ...req.body, user_id , campaign_id };
    const  result  = await CampaignServices.createCampaign(campaignData);
    sendResponse(res, { result }, 'campaign has been create succefully', 201);
});
const updateCampaign = wrapAsync(async (req, res) => {
  const user_id = req.user._id;
  const { campaignId } = req.params;
  const campaignData = { ...req.body };

  const result = await CampaignServices.updateCampaign(campaignId, user_id, campaignData);
  
  sendResponse(res, { result }, 'Campaign has been updated successfully', 200);
});

// const getCampaigns = wrapAsync(async (req, res) => {
//   const user_id = req.user._id;
//   const { page, limit } = getPaginationParams(req.query);

//   const data = await CampaignServices.getCampaigns(page, limit,user_id);

//   sendResponse(res, data, 'Campaign fetched successfully', 200);
// });
const getCampaigns = wrapAsync(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const user = req.user;

  let data;

  if (user.role === CONSTANT_ENUM.USER_ROLE.ADMIN) {
    data = await CampaignServices.getCampaigns(page, limit);
  } else {
    data = await CampaignServices.getCampaignsByUserId(page, limit, user._id);
  }

  sendResponse(res, data, "Campaigns fetched successfully", 200);
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
    updateCampaign,
     
};
