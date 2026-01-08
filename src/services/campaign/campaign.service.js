const Campaign = require('../../models/campaign.model');
const State = require('../../models/state.model');
const County = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const { getLeadCountByCampaignId } = require('../../services/lead/lead.service.js');
const Lead = require('../../models/lead.model.js');
const { sendToN8nWebhook } = require('../../services/n8n/webhookService.js');
const { createCampaignInBoberdoo, updateCampaignInBoberdoo, deleteCampaignFromBoberdoo } = require('../boberdoo/boberdoo.service');
const { User } = require('../../models/user.model');
const { campaignLogger } = require('../../utils/logger');
const MAIL_HANDLER = require('../../mail/mails');
const SmsServices = require('../sms/sms.service');
const { leadLogger } = require('../../utils/logger');


const createCampaign = async (data) => {
  try {
    _validateCampaignGeography(data);

    const newCampaign = await Campaign.create(data);
    campaignLogger.info(`Campaign created in DB`, { user_id: data.user_id, campaign_id: newCampaign.campaign_id });

    // Fetch ONCE with everything needed for sync and notifications
    let campaign = await Campaign.findById(newCampaign._id)
      .populate('geography.state', 'name abbreviation')
      .populate('user_id', 'name email integrations.boberdoo.external_id phoneNumber')
      .lean();

    // Boberdoo sync now returns the updated campaign object
    campaign = await _syncCampaignToBoberdoo(campaign);

    // Post-creation tasks (Background - do not await)
    _handlePostCampaignCreationTasks(campaign).catch(err => {
      campaignLogger.error('Post-creation tasks background error', err, { campaign_id: campaign.campaign_id });
    });

    return newCampaign;
  } catch (error) {
    campaignLogger.error('Failed to create campaign', error, { campaignData: data });
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to create campaign');
  }
};


const _validateCampaignGeography = (data) => {
  if (data.geography.coverage.type === 'FULL_STATE' && (!data.geography.state || data.geography.state.length === 0)) {
    const msg = 'State is required for FULL_STATE coverage';
    campaignLogger.error(msg, null, { user_id: data.user_id, campaignData: data });
    throw new ErrorHandler(400, msg);
  }

  if (data.geography.coverage.type === 'PARTIAL') {
    if (!data.geography.coverage.partial.zip_codes || data.geography.coverage.partial.zip_codes.length === 0) {
      const msg = 'ZIP codes are required for PARTIAL coverage';
      campaignLogger.error(msg, null, { user_id: data.user_id, campaignData: data });
      throw new ErrorHandler(400, msg);
    }
    if (!data.geography.state) data.geography.state = [];
  }
};


const _syncCampaignToBoberdoo = async (campaign) => {
  const partnerId = campaign.user_id?.integrations?.boberdoo?.external_id;
  const campaign_id = campaign.campaign_id;
  const dbId = campaign._id;

  if (partnerId) {
    await Campaign.findByIdAndUpdate(dbId, {
      $set: { boberdoo_sync_status: 'PENDING', boberdoo_last_sync_at: new Date() }
    });
    campaignLogger.info(`Starting Boberdoo sync`, { campaign_id, user_id: campaign.user_id?._id });

    const boberdooResult = await createCampaignInBoberdoo(campaign, partnerId);

    const updateFields = boberdooResult.success
      ? {
        boberdoo_filter_set_id: boberdooResult.filterSetId,
        boberdoo_sync_status: 'SUCCESS',
        boberdoo_last_sync_at: new Date(),
        boberdoo_last_error: null
      }
      : {
        boberdoo_sync_status: 'FAILED',
        boberdoo_last_sync_at: new Date(),
        boberdoo_last_error: boberdooResult.error
      };

    const updatedCampaign = await Campaign.findByIdAndUpdate(dbId, { $set: updateFields }, { new: true })
      .populate('geography.state', 'name abbreviation')
      .populate('user_id', 'name email integrations.boberdoo.external_id phoneNumber')
      .lean();

    if (boberdooResult.success) {
      campaignLogger.info(`Campaign synced to Boberdoo`, { campaign_id, filter_set_id: boberdooResult.filterSetId });
    } else {
      campaignLogger.error(`Failed Boberdoo sync`, null, { campaign_id, error: boberdooResult.error });
    }

    return updatedCampaign;
  } else {
    const updatedCampaign = await Campaign.findByIdAndUpdate(dbId, {
      $set: { boberdoo_sync_status: 'FAILED', boberdoo_last_error: 'User does not have a Boberdoo partner ID' }
    }, { new: true })
      .populate('geography.state', 'name abbreviation')
      .populate('user_id', 'name email integrations.boberdoo.external_id phoneNumber')
      .lean();

    campaignLogger.warn(`Skipping Boberdoo sync - missing partner ID`, { campaign_id, user_id: campaign.user_id?._id });
    return updatedCampaign;
  }
};


const _handlePostCampaignCreationTasks = async (populatedCampaign) => {
  const campaign_id = populatedCampaign.campaign_id;
  const user = populatedCampaign.user_id;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 1. N8N Webhook
  try {
    const resultForN8n = await sendToN8nWebhook(populatedCampaign);
    campaignLogger.info('N8N Webhook sent successfully', { campaign_id, resultForN8n });
  } catch (n8nError) {
    campaignLogger.error('Failed to send N8N webhook', n8nError, { campaign_id });
  }

  // 2. Emails with Delays (respecting rate limits)
  const emailTasks = [
    { handler: MAIL_HANDLER.sendCampaignCreatedEmailtoN8N, label: 'N8N email' },
    { handler: MAIL_HANDLER.sendCampaignCreatedEmailToAdmin, label: 'Admin email' },
    { handler: MAIL_HANDLER.sendCampaignCreatedEmailToUser, label: 'User email' }
  ];

  for (const task of emailTasks) {
    try {
      await task.handler(populatedCampaign);
      campaignLogger.info(`${task.label} sent`, { campaign_id });
    } catch (err) {
      campaignLogger.error(`Failed to send ${task.label}`, err, { campaign_id });
    }
    await delay(600);
  }

  // 3. SMS Notification
  if (user?.phoneNumber) {
    try {
      const campaignName = populatedCampaign.name || 'N/A';
      const smsMessage = `Hello, Your new campaign "${campaignName}" has been created successfully.`;

      const smsResult = await SmsServices.sendSms({
        to: user.phoneNumber,
        message: smsMessage,
        from: process.env.SMS_SENDER_ID || '+18563908470',
      });

      if (smsResult.success) {
        leadLogger.info('Campaign SMS sent successfully', {
          user_id: user._id,
          campaign_id,
          sent_to: smsResult.sentTo.join(', ')
        });
      } else {
        leadLogger.warn('Campaign SMS failed', {
          user_id: user._id,
          campaign_id,
          error: smsResult
        });
      }
    } catch (err) {
      leadLogger.error('Fatal error during SMS sending', err, {
        user_id: user._id,
        campaign_id,
        error: err.message
      });
    }
  }
};

const updateCampaign = async (campaignId, userId, role, updateData) => {
  try {
    // 1. Fix: Only validate if geography is actually being updated
    if (updateData.geography) {
      _validateCampaignGeography(updateData);
    }

    const filter = { _id: campaignId };
    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) filter.user_id = userId;

    let updatedCampaign = await Campaign.findOneAndUpdate(filter, updateData, { new: true, runValidators: true })
      .populate('user_id', 'integrations.boberdoo.external_id name email')
      .populate('geography.state', 'name abbreviation')
      .lean();

    if (!updatedCampaign) {
      throw new ErrorHandler(404, 'Campaign not found or access denied');
    }
    campaignLogger.info('Campaign updated in DB', { campaign_id: campaignId, user_id: userId });

    // 2. Process Boberdoo sync (returns updated record)
    updatedCampaign = await _syncCampaignUpdateToBoberdoo(updatedCampaign, userId);

    // 3. Fix: Final enrichment handles PARTIAL coverage details (must happen after last DB update)
    updatedCampaign = await _enrichCampaignDetails(updatedCampaign);

    // 4. Background notifications
    _handlePostCampaignUpdateTasks(updatedCampaign).catch(err => {
      campaignLogger.error('Post-update tasks background error', err, { campaign_id: campaignId });
    });

    return updatedCampaign;
  } catch (error) {
    campaignLogger.error('Failed to update campaign', error, { campaign_id: campaignId });
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to update campaign');
  }
};

const _syncCampaignUpdateToBoberdoo = async (campaign, userId) => {
  const partnerId = campaign.user_id?.integrations?.boberdoo?.external_id;
  const campaignId = campaign._id;
  let filterSetId = campaign.boberdoo_filter_set_id;

  if (!partnerId) {
    campaignLogger.warn('Skipping Boberdoo sync - missing partner ID', { campaign_id: campaignId, user_id: userId });
    return await Campaign.findByIdAndUpdate(campaignId, {
      $set: { boberdoo_sync_status: 'FAILED', boberdoo_last_error: 'User does not have a Boberdoo partner ID' }
    }, { new: true }).populate('user_id', 'integrations.boberdoo.external_id name email').populate('geography.state', 'name abbreviation').lean();
  }

  campaignLogger.info('Starting Boberdoo update sync', { campaign_id: campaignId, filterSetId, user_id: userId });
  await Campaign.findByIdAndUpdate(campaignId, { $set: { boberdoo_sync_status: 'PENDING', boberdoo_last_sync_at: new Date() } });

  const isNewFilterSet = !filterSetId;
  const boberdooResult = await updateCampaignInBoberdoo(campaign, filterSetId, partnerId);

  const updateFields = boberdooResult.success
    ? {
      boberdoo_filter_set_id: boberdooResult.filterSetId || filterSetId,
      boberdoo_sync_status: 'SUCCESS',
      boberdoo_last_sync_at: new Date(),
      boberdoo_last_error: null
    }
    : {
      boberdoo_sync_status: 'FAILED',
      boberdoo_last_sync_at: new Date(),
      boberdoo_last_error: boberdooResult.error
    };

  const finalCampaign = await Campaign.findByIdAndUpdate(campaignId, { $set: updateFields }, { new: true })
    .populate('user_id', 'integrations.boberdoo.external_id name email')
    .populate('geography.state', 'name abbreviation')
    .lean();

  if (boberdooResult.success) {
    campaignLogger.info(isNewFilterSet ? 'Campaign created in Boberdoo' : 'Campaign updated in Boberdoo', { campaign_id: campaignId, filterSetId: boberdooResult.filterSetId || filterSetId });
  } else {
    campaignLogger.error(isNewFilterSet ? 'Failed Boberdoo creation' : 'Failed Boberdoo update', null, { campaign_id: campaignId, error: boberdooResult.error });
  }

  return finalCampaign;
};

const _handlePostCampaignUpdateTasks = async (updatedCampaign) => {
  try {
    const resultForN8n = await sendToN8nWebhook({ ...updatedCampaign, action: 'update' });
    campaignLogger.info('N8N Webhook sent successfully (update)', { campaign_id: updatedCampaign._id, resultForN8n });
  } catch (n8nError) {
    campaignLogger.error('Failed to send update webhook to N8N', n8nError, { campaign_id: updatedCampaign._id });
  }
};

const _enrichCampaignDetails = async (campaign) => {
  if (campaign.geography?.coverage?.type === 'PARTIAL') {
    const countyIds = campaign.geography.coverage.partial.counties || [];
    if (countyIds.length > 0) {
      const counties = await County.find({ _id: { $in: countyIds } })
        .select('_id name fips_code state')
        .lean();
      campaign.geography.coverage.partial.countyDetails = counties;
    }
  }
  return campaign;
};


const getCampaignsByUserId = async (page = 1, limit = 10, user_id, search = "") => {
  try {
    const skip = (page - 1) * limit;

    const filter = { user_id };

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }];
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate("geography.state", "name abbreviation")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

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
    throw new ErrorHandler(500, error.message || "Failed to fetch campaigns");
  }
};


const stateCache = {};

const getCampaigns = async (page = 1, limit = 10, filters = {}, search = "") => {
  try {
    const skip = (page - 1) * limit;

    const query = {
      ...(filters.user_id && { user_id: filters.user_id }),
      ...(filters.status && { status: filters.status }),
      ...(filters.lead_type && { lead_type: filters.lead_type }),
    };

    if (search) {
      const regex = new RegExp(search, "i");

      query.$or = [
        { name: regex },
        { "user_id.name": regex },
        { "user_id.email": regex },
      ];
    }

    if (filters.state) {
      const stateAbbr = filters.state.toUpperCase();

      if (!stateCache[stateAbbr]) {
        const stateDoc = await State.findOne({ abbreviation: stateAbbr })
          .select("_id")
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

      query["geography.state"] = { $in: [stateCache[stateAbbr]] };
    }

    const projection =
      "campaign_id name status boberdoo_filter_set_id lead_type exclusivity language geography delivery user_id note createdAt updatedAt";

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .select(projection)
        .populate("geography.state", "name abbreviation")
        .populate("user_id", "name email")
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
    console.error("Error in getCampaigns:", error);
    throw new ErrorHandler(500, error.message || "Failed to fetch campaigns");
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

const getCampaignByIdForAdmin = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId)
    // .populate('geography.state', 'name abbreviation')
    .populate('user_id', 'name email')
    // .populate('geography.coverage.partial.counties', 'name code fips_code state')
    .lean();
  console.log('campaign data : ', campaign);
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

    let query = {};

    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) {
      query.user_id = userId;
    }

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.lead_type) {
      query.lead_type = filters.lead_type;
    }
    if (filters.user_id && role === CONSTANT_ENUM.USER_ROLE.ADMIN) {
      query.user_id = filters.user_id;
    }

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
      query['geography.state'] = { $in: [stateCache[stateAbbr]] };

    }

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

const quickSearchCampaigns = async (userId, role, searchQuery = '', limit = 20) => {
  try {
    let query = {};

    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) {
      query.user_id = userId;
    }

    query.status = 'ACTIVE';

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

const deleteCampaign = async (campaignId, userId, role) => {
  try {
    console.log("[DELETE CAMPAIGN INITIATED] =>", campaignId);
    const campaign = await Campaign.findById(campaignId)
      .populate('user_id', 'name email firstName lastName username fullName integrations.boberdoo.external_id')
      .populate('geography.state', 'name abbreviation')
      .lean();

    if (!campaign) throw new ErrorHandler(404, "Campaign not found or access denied");

    // Here we delete all leads associated with the campaign
    const leadCount = await Lead.countDocuments({ campaign_id: campaignId });
    if (leadCount > 0) {
      await Lead.deleteMany({ campaign_id: campaignId });
      console.log(`Deleted ${leadCount} lead(s) for campaign ${campaignId}`);
    } else {
      console.log("No leads found for campaign:", campaignId);
    }

    // Disable in Boberdoo (Filter_Set_Status = 0)
    if (campaign.boberdoo_filter_set_id) {
      try {
        //  Map lead type string → numeric ID
        const leadTypeId =
          CONSTANT_ENUM.BOBERDOO_LEAD_TYPE_MAP[campaign.lead_type] || 33;

        console.log("Deactivating campaign in Boberdoo:", {
          filterSetId: campaign.boberdoo_filter_set_id,
          leadType: campaign.lead_type,
          mappedLeadTypeId: leadTypeId,
        });

        const boberdooResult = await deleteCampaignFromBoberdoo({
          filterSetId: campaign.boberdoo_filter_set_id,
          leadTypeId,
        });

        console.log("Boberdoo campaign deactivated:", boberdooResult);
      } catch (boberdooErr) {
        console.error(
          "Failed to deactivate campaign in Boberdoo:",
          boberdooErr.message
        );
      }
    }

    // Send delete webhook to N8N (using populated campaign)
    try {
      console.log("Sending delete webhook to N8N:", {
        campaign_id: campaign._id,
        name: campaign.name,
        client: campaign?.user_id?.name || campaign?.user_id?.email,
        action: "delete",
      });

      const webhookResult = await sendToN8nWebhook({
        ...campaign,
        action: "delete",
      });

      console.log("N8N delete webhook sent successfully:", webhookResult);
    } catch (n8nErr) {
      console.error("Failed to send delete webhook to N8N:", n8nErr.message);
    }

    // Delete from DB
    await Campaign.findByIdAndDelete(campaignId);
    console.log(`Campaign ${campaignId} deleted from DB by user ${userId}`);

    return {
      deleted: true,
      campaign_id: campaignId,
      leads_deleted: leadCount,
      message:
        leadCount > 0
          ? `Campaign and ${leadCount} lead(s) deleted successfully`
          : "Campaign deleted successfully",
    };
  } catch (error) {
    console.error("deleteCampaign error:", error);
    throw new ErrorHandler(error.statusCode || 500, error.message || "Failed to delete campaign");
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
