const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const CampaignServices = require('../../services/campaign/campaign.service');
const { sendToN8nWebhook } = require('../../services/n8n/webhookService.js');
const { ErrorHandler } = require('../../utils/error-handler');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const { getPaginationParams , extractFilters} = require('../../utils/pagination');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
 const generateUniqueCampaignId = require('../../utils/generateCampaignId');

const createCampaign = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const campaign_id = await generateUniqueCampaignId();
    const campaignData = { ...req.body, user_id , campaign_id };
    const  result  = await CampaignServices.createCampaign(campaignData);
    sendResponse(res, { result }, 'campaign has been create succefully', 201);
});

const createCampaignByAdmin = wrapAsync(async (req, res) => {
    const { userId } = req.params;
    const user_id = userId;

    const campaign_id = await generateUniqueCampaignId();
    const campaignData = { ...req.body, user_id , campaign_id };
    const  result  = await CampaignServices.createCampaign(campaignData);
    sendResponse(res, { result }, 'campaign has been create succefully', 201);
});

const updateCampaign = wrapAsync(async (req, res) => {
  const { _id: user_id, role } = req.user;
  const { campaignId } = req.params;
  const campaignData = { ...req.body };

  const result = await CampaignServices.updateCampaign(campaignId, user_id, role, campaignData);

  sendResponse(res, { result }, 'Campaign has been updated successfully', 200);
});

// const getCampaigns = wrapAsync(async (req, res) => {
//   const { page, limit } = getPaginationParams(req.query);
//   const user = req.user;

//   let data;

//   if (user.role === CONSTANT_ENUM.USER_ROLE.ADMIN) {
//     data = await CampaignServices.getCampaigns(page, limit);
//   } else {
//     data = await CampaignServices.getCampaignsByUserId(page, limit, user._id);
//   }

//   sendResponse(res, data, "Campaigns fetched successfully", 200);
// });
const getCampaigns = wrapAsync(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const user = req.user;

  let data;

  if (user.role === CONSTANT_ENUM.USER_ROLE.ADMIN) {
    const allowedFilterKeys = ['status', 'state', 'lead_type', 'user_id'];
    const filters = extractFilters(req.query, allowedFilterKeys);

    data = await CampaignServices.getCampaigns(page, limit, filters);
  } else {
    data = await CampaignServices.getCampaignsByUserId(page, limit, user._id);
  }

  sendResponse(res, data, "Campaigns fetched successfully", 200);
});


// const getCampaignById = wrapAsync(async (req, res) => {
//   const user_id = req.user._id;
//   const { campaignId } = req.params;

//   const data = await CampaignServices.getCampaignById(campaignId, user_id);

//   sendResponse(res, {data}, 'Campaign fetched successfully', 200);
// });

const getCampaignById = wrapAsync(async (req, res) => {
  const user_id = req.user._id;
  const { campaignId } = req.params;
  const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

  let data;
  if (isAdmin) {
    data = await CampaignServices.getCampaignByIdForAdmin(campaignId);
  } else {
    data = await CampaignServices.getCampaignById(campaignId, user_id);
  }

  sendResponse(res, { data }, 'Campaign fetched successfully', 200);
});

const searchCampaigns = wrapAsync(async (req, res) => {
    const { _id: user_id, role } = req.user;
    const { page, limit, q: searchQuery } = getPaginationParams(req.query);
    
    const allowedFilterKeys = ['status', 'state', 'lead_type', 'user_id'];
    const filters = extractFilters(req.query, allowedFilterKeys);

    const data = await CampaignServices.searchCampaigns(
        page, 
        limit, 
        user_id, 
        role, 
        searchQuery, 
        filters
    );

    sendResponse(res, data, "Campaigns searched successfully", 200);
});
const quickSearchCampaigns = wrapAsync(async (req, res) => {
    const { _id: user_id, role } = req.user;
    const { page, limit} = getPaginationParams(req.query);
    const { q: searchQuery } = req.query;

    const data = await CampaignServices.quickSearchCampaigns(
        user_id, 
        role, 
        searchQuery, 
        parseInt(limit)
    );

    sendResponse(res, { data }, "Quick search completed successfully", 200);
});
const deleteCampaign = wrapAsync(async (req, res) => {
  const { _id: user_id, role } = req.user;
  const { campaignId } = req.params;

  const result = await CampaignServices.deleteCampaign(campaignId, user_id, role);
  
  sendResponse(res, { result }, result.message, 200);
});


module.exports = {
    createCampaign,
    createCampaignByAdmin,
    getCampaigns,
    getCampaignById,
    updateCampaign,
    searchCampaigns,
    quickSearchCampaigns, 
    deleteCampaign
};
