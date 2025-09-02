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


const processCSVUpload = async (fileBuffer, campaign_id, user_id, columnMapping) => {
    try {
        const results = [];
        const errors = [];
        let processedCount = 0;
        let errorCount = 0;

        // Required fields validation
        const requiredFields = ['lead_id','campaign_id','first_name', 'last_name', 'email', 'street_address', 'city', 'state', 'zip_code'];
        const mappedDbColumns = Object.values(columnMapping);
        const missingRequired = requiredFields.filter(field => !mappedDbColumns.includes(field));

        if (missingRequired.length > 0) {
            throw new ErrorHandler(400, `Missing required column mappings: ${missingRequired.join(', ')}`);
        }

        // Parse CSV
        const csvData = await new Promise((resolve, reject) => {
            const rows = [];
            const stream = Readable.from(fileBuffer.toString());
            
            stream
                .pipe(csv())
                .on('data', (data) => rows.push(data))
                .on('end', () => resolve(rows))
                .on('error', (error) => reject(error));
        });

        // Process each row
        for (let i = 0; i < csvData.length; i++) {
            try {
                const row = csvData[i];
                const leadData = {
                    campaign_id,
                    user_id,
                    status: 'active'
                };

                // Map CSV columns to database fields
                for (const [csvColumn, dbColumn] of Object.entries(columnMapping)) {
                    if (row[csvColumn] !== undefined && row[csvColumn] !== '') {
                        leadData[dbColumn] = row[csvColumn].trim();
                    }
                }

                // Validate required fields are present
                const missingData = requiredFields.filter(field => !leadData[field] || leadData[field] === '');
                if (missingData.length > 0) {
                    errors.push(`Row ${i + 2}: Missing required data for ${missingData.join(', ')}`);
                    errorCount++;
                    continue;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(leadData.email)) {
                    errors.push(`Row ${i + 2}: Invalid email format`);
                    errorCount++;
                    continue;
                }

                // Check for duplicate email in campaign
                const existingLead = await Lead.findOne({
                    campaign_id,
                    email: leadData.email
                });

                if (existingLead) {
                    errors.push(`Row ${i + 2}: Duplicate email ${leadData.email} in campaign`);
                    errorCount++;
                    continue;
                }

                // Create lead
                const newLead = await Lead.create(leadData);
                results.push(newLead);
                processedCount++;

            } catch (error) {
                errors.push(`Row ${i + 2}: ${error.message}`);
                errorCount++;
            }
        }

        // Update campaign lead count
        await Campaign.findByIdAndUpdate(campaign_id, {
            $inc: { lead_count: processedCount }
        });

        return {
            success: true,
            processed: processedCount,
            errors: errorCount,
            errorDetails: errors.slice(0, 50), // Limit error details to first 50
            totalRows: csvData.length
        };

    } catch (error) {
        throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to process CSV upload');
    }
};

module.exports = {
  createLead,
  getLeads,
  getLeadByUserId,
  getLeadByIdForAdmin,
  getLeadById,
  updateLead,
  processCSVUpload,
};
