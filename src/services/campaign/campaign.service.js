const  Campaign  = require('../../models/campaign.model');
const  County  = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');

const createCampaign = async (data) => {
  try {
    const newCampaign = await Campaign.create(data);
    return newCampaign;
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to create campaign');
  }
};
const updateCampaign = async (campaignId, userId, updateData) => {
  try {
    const updatedCampaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, user_id: userId },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCampaign) {
      throw new ErrorHandler(404, 'Campaign not found or access denied');
    }

    if (updatedCampaign.geography?.coverage?.type === 'PARTIAL') {
      const countyIds = updatedCampaign.geography.coverage.partial.counties || [];

      const counties = await County.find({ _id: { $in: countyIds } })
        .select('_id name fips_code state')
        .lean();

      updatedCampaign.geography.coverage.partial.countyDetails = counties;
    }

    return updatedCampaign;

  } catch (error) {
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to update campaign');
  }
};

const getCampaignsByUserId = async (page = 1, limit = 10, user_id) => {
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
// const getCampaigns = async (page = 1, limit = 10, user_id) => {
//   try {
//     const skip = (page - 1) * limit;

//     const [campaigns, total] = await Promise.all([
//       Campaign.find()
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 }),
//       Campaign.countDocuments(),
//     ]);

//     return {
//       data: campaigns,
//       meta: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   } catch (error) {
//     throw new ErrorHandler(500, error.message || 'Failed to fetch campaigns');
//   }
// };
const getCampaigns = async (page = 1, limit = 10, user_id) => {
  try {
    const skip = (page - 1) * limit;
    const query = user_id ? { user_id } : {};

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('geography.state', 'name abbreviation')
        .populate('user_id', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Campaign.countDocuments(query),
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

  if (campaign.geography?.coverage?.type === 'PARTIAL') {
    const countyIds = campaign.geography.coverage.partial.counties || [];

    const counties = await County.find({ _id: { $in: countyIds } })
      .select('_id name fips_code state')
      .lean();

    campaign.geography.coverage.partial.countyDetails = counties;
  }

  return campaign;
};
// const getCampaignByIdForAdmin = async (campaignId) => {
//   const campaign = await Campaign.findById(campaignId)
//                                   .populate('geography.state', 'name abbreviation')
//                                   .populate('user_id', 'name email')
//                                   .lean();

//   if (!campaign) {
//     throw new ErrorHandler(404, 'Campaign not found');
//   }

//   if (campaign.geography?.coverage?.type === 'PARTIAL') {
//     const countyIds = campaign.geography.coverage.partial.counties || [];

//     const counties = await County.find({ _id: { $in: countyIds } })
//       .select('_id name fips_code state')
//       .lean();

//     campaign.geography.coverage.partial.countyDetails = counties;
//   }

//   return campaign;
// };
const getCampaignByIdForAdmin = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId)
    .populate('geography.state', 'name abbreviation')
    .populate('user_id', 'name email')
    .populate('geography.coverage.partial.counties', 'name code fips_code state')
    .lean();

  if (!campaign) {
    throw new ErrorHandler(404, 'Campaign not found');
  }

  return campaign;
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  getCampaignsByUserId,
  getCampaignByIdForAdmin,
};
