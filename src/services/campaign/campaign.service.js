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

    const newCampaign = await Campaign.create(data);
    campaignLogger.info(`Campaign created in DB`, { user_id: data.user_id, campaign_id: newCampaign.campaign_id });


    let populatedCampaign = await Campaign.findById(newCampaign._id)
      .populate('geography.state', 'name abbreviation')
      .populate('user_id', 'name email integrations.boberdoo.external_id')
      .lean();


    const user = await User.findById(data.user_id).lean();
    const partnerId = user?.integrations?.boberdoo?.external_id;

    if (partnerId) {
      await Campaign.findByIdAndUpdate(newCampaign._id, {
        $set: { boberdoo_sync_status: 'PENDING', boberdoo_last_sync_at: new Date() }
      });
      campaignLogger.info(`Starting Boberdoo sync`, { campaign_id: newCampaign.campaign_id, user_id: data.user_id });

      const boberdooResult = await createCampaignInBoberdoo(populatedCampaign, partnerId);

      if (boberdooResult.success) {
        await Campaign.findByIdAndUpdate(newCampaign._id, {
          $set: {
            boberdoo_filter_set_id: boberdooResult.filterSetId,
            boberdoo_sync_status: 'SUCCESS',
            boberdoo_last_sync_at: new Date(),
            boberdoo_last_error: null
          }
        });

        try {
          populatedCampaign = await Campaign.findById(newCampaign._id)
            .populate('geography.state', 'name abbreviation')
            .populate('user_id', 'name email integrations.boberdoo.external_id')
            .lean();
        } catch (refetchError) {
          campaignLogger.warn('Failed to re-fetch campaign after Boberdoo sync', { campaign_id: newCampaign.campaign_id, error: refetchError.message });
        }

        campaignLogger.info(`Campaign synced to Boberdoo`, { campaign_id: newCampaign.campaign_id, filter_set_id: boberdooResult.filterSetId, boberdooResult });
      } else {
        await Campaign.findByIdAndUpdate(newCampaign._id, {
          $set: { boberdoo_sync_status: 'FAILED', boberdoo_last_sync_at: new Date(), boberdoo_last_error: boberdooResult.error }
        });
        campaignLogger.error(`Failed Boberdoo sync`, null, { campaign_id: newCampaign.campaign_id, error: boberdooResult.error });
      }
    } else {
      await Campaign.findByIdAndUpdate(newCampaign._id, {
        $set: { boberdoo_sync_status: 'FAILED', boberdoo_last_error: 'User does not have a Boberdoo partner ID' }
      });
      campaignLogger.warn(`Skipping Boberdoo sync - missing partner ID`, { campaign_id: newCampaign.campaign_id, user_id: data.user_id });
    }

    // Trigger N8N webhook to alert N8N that campaign is created
    try {
      const resultForN8n = await sendToN8nWebhook(populatedCampaign);
      campaignLogger.info('N8N Webhook sent successfully', { campaign_id: newCampaign.campaign_id, resultForN8n });
    } catch (n8nError) {
      campaignLogger.error('Failed to send N8N webhook', n8nError, { campaign_id: newCampaign.campaign_id });
    }


    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Send Email to N8N that camapign is created
    try {
      await MAIL_HANDLER.sendCampaignCreatedEmailtoN8N(populatedCampaign);
      campaignLogger.info('N8N email sent', { campaign_id: newCampaign.campaign_id });
    } catch (err) {
      campaignLogger.error('Failed to send N8N email', err, {
        campaign_id: newCampaign.campaign_id
      });
    }

    await delay(600);
    // Send Email to admin that camapign is created
    try {
      await MAIL_HANDLER.sendCampaignCreatedEmailToAdmin(populatedCampaign);
      campaignLogger.info('Admin email sent', { campaign_id: newCampaign.campaign_id });
    } catch (err) {
      campaignLogger.error('Failed to send admin email', err, {
        campaign_id: newCampaign.campaign_id
      });
    }

    await delay(600);
    // Send Email to user that camapign is created
    try {
      await MAIL_HANDLER.sendCampaignCreatedEmailToUser(populatedCampaign);
      campaignLogger.info('User email sent', { campaign_id: newCampaign.campaign_id });
    } catch (err) {
      campaignLogger.error('Failed to send user email', err, {
        campaign_id: newCampaign.campaign_id
      });
    }

    //  SMS send to user registe mobile number while creating campaign
    if (user?.phoneNumber && user?.phoneNumber?.length > 0) {
      try {
        const campaignName = newCampaign?.name || 'N/A';
        const smsMessage = `Hello, Your new campaign "${campaignName}" has been created successfully.`;
        const logMeta = { user_id: data.user_id, campaign_id: newCampaign.campaign_id };

        const smsResult = await SmsServices.sendSms({
          to: user.phoneNumber,
          message: smsMessage,
          from: process.env.SMS_SENDER_ID || '+18563908470',
        });

        if (smsResult.success) {
          leadLogger.info('Campaign SMS sent successfully', {
            ...logMeta,
            sent_to: smsResult.sentTo.join(', ')
          });
        } else {
          leadLogger.warn('Campaign SMS failed', {
            ...logMeta,
            error: smsResult
          });
        }
      } catch (err) {
        leadLogger.error('Fatal error during SMS sending', err, {
          user_id: data.user_id,
          campaign_id: newCampaign.campaign_id,
          error: err.message
        });
      }
    }

    return newCampaign;
  } catch (error) {
    campaignLogger.error('Failed to create campaign', error, { campaignData: data });
    throw new ErrorHandler(500, error.message || 'Failed to create campaign');
  }
};


const updateCampaign = async (campaignId, userId, role, updateData) => {
  try {
    if (updateData.geography?.coverage?.type === 'FULL_STATE' && (!updateData.geography.state || updateData.geography.state.length === 0)) {
      const msg = 'State is required for FULL_STATE coverage';
      campaignLogger.error(msg, null, { campaign_id: campaignId, user_id: userId });
      throw new ErrorHandler(400, msg);
    }
    if (updateData.geography?.coverage?.type === 'PARTIAL') {
      if (!updateData.geography.coverage.partial.zip_codes || updateData.geography.coverage.partial.zip_codes.length === 0) {
        const msg = 'ZIP codes are required for PARTIAL coverage';
        campaignLogger.error(msg, null, { campaign_id: campaignId, user_id: userId });
        throw new ErrorHandler(400, msg);
      }
      if (!updateData.geography.state) updateData.geography.state = [];
    }

    const filter = { _id: campaignId };
    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) filter.user_id = userId;

    const updatedCampaign = await Campaign.findOneAndUpdate(filter, updateData, { new: true, runValidators: true })
      .populate('user_id', 'integrations.boberdoo.external_id name email')
      .populate('geography.state', 'name abbreviation')
      .lean();

    if (!updatedCampaign) {
      const msg = 'Campaign not found or access denied';
      campaignLogger.error(msg, null, { campaign_id: campaignId, user_id: userId });
      throw new ErrorHandler(404, msg);
    }
    campaignLogger.info('Campaign updated in DB', { campaign_id: campaignId, user_id: userId, updateData });

    if (updatedCampaign.geography?.coverage?.type === 'PARTIAL') {
      const countyIds = updatedCampaign.geography.coverage.partial.counties || [];
      const counties = await County.find({ _id: { $in: countyIds } }).select('_id name fips_code state').lean();
      updatedCampaign.geography.coverage.partial.countyDetails = counties;
    }

    // Boberdoo checking partner id and filter set id
    const partnerId = updatedCampaign?.user_id?.integrations?.boberdoo?.external_id;
    let filterSetId = updatedCampaign?.boberdoo_filter_set_id;

    if (partnerId) {
      campaignLogger.info('Starting Boberdoo sync', { campaign_id: campaignId, filterSetId, user_id: userId });

      if (!filterSetId) {
        campaignLogger.warn('Missing filter_set_id, creating in Boberdoo', { campaign_id: campaignId });
        await Campaign.findByIdAndUpdate(campaignId, { $set: { boberdoo_sync_status: 'PENDING', boberdoo_last_sync_at: new Date() } });

        const createResult = await updateCampaignInBoberdoo(updatedCampaign, filterSetId, partnerId);
        if (createResult.success) {
          filterSetId = createResult.filterSetId;
          await Campaign.findByIdAndUpdate(campaignId, {
            $set: { boberdoo_filter_set_id: filterSetId, boberdoo_sync_status: 'SUCCESS', boberdoo_last_sync_at: new Date(), boberdoo_last_error: null }
          });
          campaignLogger.info('Campaign created in Boberdoo', { campaign_id: campaignId, filterSetId, createResult });
        } else {
          await Campaign.findByIdAndUpdate(campaignId, {
            $set: { boberdoo_sync_status: 'FAILED', boberdoo_last_sync_at: new Date(), boberdoo_last_error: createResult.error }
          });
          campaignLogger.error('Failed Boberdoo creation', null, { campaign_id: campaignId, error: createResult.error });
        }
      } else {
        await Campaign.findByIdAndUpdate(campaignId, { $set: { boberdoo_sync_status: 'PENDING', boberdoo_last_sync_at: new Date() } });
        const boberdooResult = await updateCampaignInBoberdoo(updatedCampaign, filterSetId, partnerId);

        if (boberdooResult.success) {
          await Campaign.findByIdAndUpdate(campaignId, { $set: { boberdoo_sync_status: 'SUCCESS', boberdoo_last_sync_at: new Date(), boberdoo_last_error: null } });
          campaignLogger.info('Campaign updated in Boberdoo', { campaign_id: campaignId, filterSetId, boberdooResult });
        } else {
          await Campaign.findByIdAndUpdate(campaignId, { $set: { boberdoo_sync_status: 'FAILED', boberdoo_last_sync_at: new Date(), boberdoo_last_error: boberdooResult.error } });
          campaignLogger.error('Failed Boberdoo update', null, { campaign_id: campaignId, error: boberdooResult.error });
        }
      }
    } else {
      await Campaign.findByIdAndUpdate(campaignId, { $set: { boberdoo_sync_status: 'FAILED', boberdoo_last_error: 'User does not have a Boberdoo partner ID' } });
      campaignLogger.warn('Skipping Boberdoo sync - missing partner ID', { campaign_id: campaignId, user_id: userId });
    }

    // N8N webhook trigger for campaign is updated.
    try {
      const resultForN8n = await sendToN8nWebhook({ ...updatedCampaign, action: 'update' });
      campaignLogger.info('N8N Webhook sent successfully (update)', { campaign_id: campaignId, resultForN8n });
    } catch (n8nError) {
      campaignLogger.error('Failed to send update webhook to N8N', n8nError, { campaign_id: campaignId });
    }

    return updatedCampaign;
  } catch (error) {
    campaignLogger.error('Failed to update campaign', error, { campaign_id: campaignId, updateData });
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to update campaign');
  }
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
