const  Campaign  = require('../../models/campaign.model');
const  State  = require('../../models/state.model');
const  County  = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const {getLeadCountByCampaignId} = require('../../services/lead/lead.service.js');
const Lead = require('../../models/lead.model.js'); 
const { sendToN8nWebhook } = require('../../services/n8n/webhookService.js');
const { createCampaignInBoberdoo ,updateCampaignInBoberdoo} = require('../boberdoo/boberdoo.service');
const { User } = require('../../models/user.model');
// const createCampaign = async (data) => {
//   try {
//     const newCampaign = await Campaign.create(data);
//     return newCampaign;
//   } catch (error) {
//     throw new ErrorHandler(500, error.message || 'Failed to create campaign');
//   }
// };

const createCampaign = async (data) => {
  try {
    // Create campaign in database first
    const newCampaign = await Campaign.create(data);

    // Populate state and user to get their names
    const populatedCampaign = await Campaign.findById(newCampaign._id)
      .populate('geography.state', 'name abbreviation')
      .populate('user_id', 'name email integrations.boberdoo.external_id')
      .lean();

    // Get the user's Boberdoo partner ID
    const user = await User.findById(data.user_id).lean();
    const partnerId = user?.integrations?.boberdoo?.external_id;

    if (partnerId) {
      // Update sync status to pending
      await Campaign.findByIdAndUpdate(newCampaign._id, {
        $set: {
          boberdoo_sync_status: 'PENDING',
          boberdoo_last_sync_at: new Date()
        }
      });

      // Sync to Boberdoo
      const boberdooResult = await createCampaignInBoberdoo(populatedCampaign, partnerId);
      
      if (boberdooResult.success) {
        // Update campaign with Boberdoo filter set ID
        await Campaign.findByIdAndUpdate(newCampaign._id, {
          $set: {
            boberdoo_filter_set_id: boberdooResult.filterSetId,
            boberdoo_sync_status: 'SUCCESS',
            boberdoo_last_sync_at: new Date(),
            boberdoo_last_error: null
          }
        });
        console.log(`✓ Campaign ${newCampaign.campaign_id} synced to Boberdoo with filter_set_ID: ${boberdooResult.filterSetId}`);
      } else {
        // Update with error status
        await Campaign.findByIdAndUpdate(newCampaign._id, {
          $set: {
            boberdoo_sync_status: 'FAILED',
            boberdoo_last_sync_at: new Date(),
            boberdoo_last_error: boberdooResult.error
          }
        });
        console.warn(`✗ Failed to sync campaign ${newCampaign.campaign_id} to Boberdoo: ${boberdooResult.error}`);
      }
    } else {
      console.warn(`⚠ User ${data.user_id} doesn't have a Boberdoo partner ID, skipping sync`);
      await Campaign.findByIdAndUpdate(newCampaign._id, {
        $set: {
          boberdoo_sync_status: 'FAILED',
          boberdoo_last_error: 'User does not have a Boberdoo partner ID'
        }
      });
    }

    // Send webhook notification (your existing code)
    const resultforN8n = await sendToN8nWebhook(populatedCampaign);
    console.log('📊 N8N Webhook Result:', resultforN8n);

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

    // Update campaign in DB
    const updatedCampaign = await Campaign.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user_id', 'integrations.boberdoo.external_id name email')
      .lean();

    if (!updatedCampaign) {
      throw new ErrorHandler(404, 'Campaign not found or access denied');
    }

    // Add county details if partial coverage
    if (updatedCampaign.geography?.coverage?.type === 'PARTIAL') {
      const countyIds = updatedCampaign.geography.coverage.partial.counties || [];
      const counties = await County.find({ _id: { $in: countyIds } })
        .select('_id name fips_code state')
        .lean();

      updatedCampaign.geography.coverage.partial.countyDetails = counties;
    }

    // --- BOBERDOO SYNC START ---
    const partnerId = updatedCampaign?.user_id?.integrations?.boberdoo?.external_id;
    const filterSetId = updatedCampaign?.boberdoo_filter_set_id;

    if (partnerId && filterSetId) {
      // Set sync status to pending before API call
      await Campaign.findByIdAndUpdate(campaignId, {
        $set: {
          boberdoo_sync_status: 'PENDING',
          boberdoo_last_sync_at: new Date()
        }
      });

      console.log(`🔄 Syncing campaign ${campaignId} to Boberdoo (update)...`);

      const boberdooResult = await updateCampaignInBoberdoo(updatedCampaign, filterSetId, partnerId);

      if (boberdooResult.success) {
        await Campaign.findByIdAndUpdate(campaignId, {
          $set: {
            boberdoo_sync_status: 'SUCCESS',
            boberdoo_last_sync_at: new Date(),
            boberdoo_last_error: null
          }
        });
        console.log(`✅ Campaign ${campaignId} updated successfully in Boberdoo`);
      } else {
        await Campaign.findByIdAndUpdate(campaignId, {
          $set: {
            boberdoo_sync_status: 'FAILED',
            boberdoo_last_sync_at: new Date(),
            boberdoo_last_error: boberdooResult.error
          }
        });
        console.warn(`❌ Boberdoo update failed for campaign ${campaignId}: ${boberdooResult.error}`);
      }
    } else {
      console.warn(`⚠ Campaign ${campaignId} not synced to Boberdoo: missing Partner ID or Filter Set ID`);
    }
    // --- BOBERDOO SYNC END ---

    return updatedCampaign;
  } catch (error) {
    console.error('Campaign update error:', error.message);
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
// Permanent delete campaign
const deleteCampaign = async (campaignId, userId, role) => {
  try {
    // Build filter based on role
    const filter = { _id: campaignId };
  

    // Find campaign first
    const campaign = await Campaign.findOne(filter);
    
    if (!campaign) {
      throw new ErrorHandler(404, 'Campaign not found or access denied');
    }

    // Count associated leads
    const leadCount = await Lead.countDocuments({ campaign_id: campaignId });
    
    console.log(`🗑️ Deleting campaign ${campaign.campaign_id} and ${leadCount} associated lead(s)...`);

    // Delete all associated leads first
    if (leadCount > 0) {
      await Lead.deleteMany({ campaign_id: campaignId });
      console.log(`✅ Deleted ${leadCount} lead(s) associated with campaign ${campaignId}`);
    }

    // Delete the campaign
    await Campaign.findByIdAndDelete(campaignId);

    console.log(`✅ Campaign ${campaignId} permanently deleted by user ${userId}`);
    
    return {
      deleted: true,
      campaign_id: campaign.campaign_id,
      leads_deleted: leadCount,
      message: leadCount > 0 
        ? `Campaign and ${leadCount} associated lead(s) permanently deleted `
        : 'Campaign permanently deleted '
    };
  } catch (error) {
    console.error('❌ deleteCampaign error:', error);
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to delete campaign');
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
  deleteCampaign,
};
