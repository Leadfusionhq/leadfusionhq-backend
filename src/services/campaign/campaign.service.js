const  Campaign  = require('../../models/campaign.model');
const  State  = require('../../models/state.model');
const  County  = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const {getLeadCountByCampaignId} = require('../../services/lead/lead.service.js');
const Lead = require('../../models/lead.model.js'); 

const createCampaign = async (data) => {
  try {
    const newCampaign = await Campaign.create(data);
    return newCampaign;
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to create campaign');
  }
};
// const updateCampaign = async (campaignId, userId, updateData) => {
//   try {
//     const updatedCampaign = await Campaign.findOneAndUpdate(
//       { _id: campaignId, user_id: userId },
//       updateData,
//       { new: true, runValidators: true }
//     ).lean();

//     if (!updatedCampaign) {
//       throw new ErrorHandler(404, 'Campaign not found or access denied');
//     }

//     if (updatedCampaign.geography?.coverage?.type === 'PARTIAL') {
//       const countyIds = updatedCampaign.geography.coverage.partial.counties || [];

//       const counties = await County.find({ _id: { $in: countyIds } })
//         .select('_id name fips_code state')
//         .lean();

//       updatedCampaign.geography.coverage.partial.countyDetails = counties;
//     }

//     return updatedCampaign;

//   } catch (error) {
//     throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to update campaign');
//   }
// };
const updateCampaign = async (campaignId, userId, role, updateData) => {
  try {
    const filter = { _id: campaignId };

    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) {
      filter.user_id = userId;
    }

    const updatedCampaign = await Campaign.findOneAndUpdate(
      filter,
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

// const getCampaignsByUserId = async (page = 1, limit = 10, user_id) => {
//   try {
//     const skip = (page - 1) * limit;

//     const filter = { user_id };

//     const [campaigns, total] = await Promise.all([
//       Campaign.find(filter)
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 }),
//       Campaign.countDocuments(filter),
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

// const getCampaigns = async (page = 1, limit = 10, user_id) => {
//   try {
//     const skip = (page - 1) * limit;
//     const query = user_id ? { user_id } : {};

//     const [campaigns, total] = await Promise.all([
//       Campaign.find(query)
//         .populate('geography.state', 'name abbreviation')
//         .populate('user_id', 'name email')
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 }),
//       Campaign.countDocuments(query),
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
// Admin usage: filters is an object


const getCampaignsByUserId = async (page = 1, limit = 10, user_id) => {
  try {
    const skip = (page - 1) * limit;

    const filter = { user_id };

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(), // Use lean for better performance
      Campaign.countDocuments(filter),
    ]);

    // 👇 Add lead counts for each campaign
    const enrichedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        const leadCount = await Lead.countDocuments({ campaign_id: campaign._id });
        return {
          ...campaign,
          leadCount,
        };
      })
    );

    return {
      data: enrichedCampaigns,
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

const stateCache = {};
const getCampaigns = async (page = 1, limit = 10, filters = {}) => {
  try {
    const skip = (page - 1) * limit;

    const query = {
      ...(filters.user_id && { user_id: filters.user_id }),
      ...(filters.status && { status: filters.status }),
      ...(filters.lead_type && { lead_type: filters.lead_type }),
    };

    if (filters.state) {
      const stateAbbr = filters.state.toUpperCase();

      if (!stateCache[stateAbbr]) {
        const stateDoc = await State.findOne({ abbreviation: stateAbbr })
          .select('_id')
          .lean();

        if (stateDoc) {
          stateCache[stateAbbr] = stateDoc._id.toString();
        } else {
          return {
            data: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          };
        }
      }

      query['geography.state'] = stateCache[stateAbbr];
    }

    const projection = 'campaign_id name status lead_type exclusivity language geography delivery user_id note createdAt updatedAt';

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .select(projection)
        .populate('geography.state', 'name abbreviation')
        .populate('user_id', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
    console.error('Error in getCampaigns:', error);
    throw new ErrorHandler(500, error.message || 'Failed to fetch campaigns');
  }
};
const getCampaignById = async (campaignId, userId) => {
  const campaign = await Campaign.findOne({ _id: campaignId, user_id: userId })
    .populate('user_id', 'name email')
    .lean();

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
    // .populate('geography.state', 'name abbreviation')
    .populate('user_id', 'name email')
    // .populate('geography.coverage.partial.counties', 'name code fips_code state')
    .lean();
  console.log('campaign data : ',campaign);
  if (!campaign) {
    throw new ErrorHandler(404, 'Campaign not found');
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

const searchCampaigns = async (page = 1, limit = 10, userId, role, searchQuery = '', filters = {}) => {
  try {
    const skip = (page - 1) * limit;

    // Build base query
    let query = {};

    // Role-based filtering
    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) {
      query.user_id = userId;
    }

    // Apply additional filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.lead_type) {
      query.lead_type = filters.lead_type;
    }
    if (filters.user_id && role === CONSTANT_ENUM.USER_ROLE.ADMIN) {
      query.user_id = filters.user_id;
    }

    // Handle state filter
    if (filters.state) {
      const stateAbbr = filters.state.toUpperCase();
      if (!stateCache[stateAbbr]) {
        const stateDoc = await State.findOne({ abbreviation: stateAbbr })
          .select('_id')
          .lean();
        if (stateDoc) {
          stateCache[stateAbbr] = stateDoc._id.toString();
        } else {
          return {
            data: [],
            meta: { total: 0, page, limit, totalPages: 0 }
          };
        }
      }
      query['geography.state'] = stateCache[stateAbbr];
    }

    // Add search functionality
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { campaign_id: searchRegex },
        { note: searchRegex }
      ];
    }

    const projection = 'campaign_id name status lead_type exclusivity language geography delivery user_id note createdAt updatedAt';

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .select(projection)
        .populate('geography.state', 'name abbreviation')
        .populate('user_id', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(query)
    ]);

    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        searchQuery: searchQuery || null
      }
    };

  } catch (error) {
    console.error('Error in searchCampaigns:', error);
    throw new ErrorHandler(500, error.message || 'Failed to search campaigns');
  }
};

// Quick search function for dropdowns/autocomplete
const quickSearchCampaigns = async (userId, role, searchQuery = '', limit = 20) => {
  try {
    let query = {};

    // Role-based filtering
    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) {
      query.user_id = userId;
    }

    // Only search active campaigns for uploads
    query.status = 'ACTIVE';

    // Add search functionality only if searchQuery is non-empty
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { campaign_id: searchRegex }
      ];
    }

    const campaigns = await Campaign.find(query)
      .select('campaign_id name status user_id')
      .populate('user_id', 'name email')
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    return campaigns;

  } catch (error) {
    console.error('Error in quickSearchCampaigns:', error);
    throw new ErrorHandler(500, error.message || 'Failed to quick search campaigns');
  }
};


module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  getCampaignsByUserId,
  getCampaignByIdForAdmin,
  searchCampaigns,      
  quickSearchCampaigns,    
};
