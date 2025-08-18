const  Campaign  = require('../../models/campaign.model');
const { ErrorHandler } = require('../../utils/error-handler');
 
const createCampaign = async (data) => {
  try {
    const newCampaign = await Campaign.create(data);
    return newCampaign;
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to create campaign');
  }
};

const getCampaigns = async (page = 1, limit = 10, user_id) => {
  try {
    const skip = (page - 1) * limit;

    const filter = { user_id };

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Campaign.countDocuments(filter),
    ]);

    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to fetch campaigns');
  }
};

const getCampaignById = async (campaignId, userId) => {
  const campaign = await Campaign.findOne({ _id: campaignId, user_id: userId }).lean();
  if (!campaign) {
    throw new ErrorHandler(404, 'Campaign not found or access denied');
  }

  return campaign;
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
};
