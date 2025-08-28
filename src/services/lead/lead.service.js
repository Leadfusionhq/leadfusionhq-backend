const  Lead  = require('../../models/lead.model.js');
const  Campaign  = require('../../models/campaign.model.js');
const  State  = require('../../models/state.model');
const  County  = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

const createLead = async (data) => {
  try {
    const newLead = await Lead.create(data);
    const populatedLead = await Lead.findById(newLead._id).populate('campaign_id', 'user_id').exec();

    return populatedLead;
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
        .populate('address.state', 'name abbreviation')
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
      .populate('address.state', 'name abbreviation')
      
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

const getLeadById = async (leadId, userId) => {
  const lead = await Lead.findOne({ _id: leadId, user_id: userId }).lean();

  if (!lead) {
    throw new ErrorHandler(404, 'Lead not found or access denied');
  }

  return lead;
};
const getLeadByIdForAdmin = async (leadId) => {
  const lead = await Lead.findById(leadId)
    // .populate('campaign_id', 'campaign_id name status lead_type exclusivity language geography delivery user_id note')
    .populate('user_id', 'name email')
    .populate('address.state', 'name abbreviation')
    .lean();

  if (!lead) {
    throw new ErrorHandler(404, 'lead not found');
  }

  return lead;
};
const updateLead = async (leadId, userId, role, updateData) => {
  try {
    const filter = { _id: leadId };

    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) {
      filter.user_id = userId;
    }

    const updatedLead = await Lead.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedLead) {
      throw new ErrorHandler(404, 'lead not found or access denied');
    }

    return updatedLead;
  } catch (error) {
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to update lead');
  }
};
module.exports = {
  createLead,
  getLeads,
  getLeadByUserId,
  getLeadByIdForAdmin,
  getLeadById,
  updateLead,
};
