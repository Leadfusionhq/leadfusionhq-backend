const  Lead  = require('../../models/lead.model.js');
const  Campaign  = require('../../models/campaign.model.js');
const  State  = require('../../models/state.model');
const  County  = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

const createLead = async (data) => {
  try {
    const newLead = await Lead.create(data);
    return newLead;
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to create lead');
  }
};
const getLeads = async (page = 1, limit = 10, filters = {}) => {
  try {
    const skip = (page - 1) * limit;

    const query = {
      ...(filters.campaign_id && { campaign_id: filters.campaign_id }),
    };

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('campaign_id', 'campaign_id name status lead_type exclusivity language geography delivery user_id note')
        .populate('user_id', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query),
    ]);

    return {
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getLeads:', error);
    throw new ErrorHandler(500, error.message || 'Failed to fetch leads');
  }
};
const getLeadByUserId = async (page = 1, limit = 10, user_id) => {
  try {
    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find({ user_id }).select('_id');

    if (!campaigns.length) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const leads = await Lead.find({ campaign_id: { $in: campaigns.map(c => c._id) } })
      .skip(skip)
      .limit(limit)
      .populate('campaign_id', 'campaign_id name status lead_type exclusivity language geography delivery user_id note')
      .sort({ createdAt: -1 })
      .lean();

    const total = await Lead.countDocuments({ campaign_id: { $in: campaigns.map(c => c._id) } });

    return {
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error in getLeadsByUserId:', error);
    throw new ErrorHandler(500, error.message || 'Failed to fetch leads');
  }
};


module.exports = {
  createLead,
  getLeads,
  getLeadByUserId,
};
