const Lead = require('../../models/lead.model.js');
const Campaign = require('../../models/campaign.model.js');
const State = require('../../models/state.model');
const County = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const { addCSVProcessingJob, getJobStatus } = require('../../queue/csvProcessor');
const mongoose = require('mongoose');
const { User } = require('../../models/user.model.js');

const createLead = async (data,  options = {}) => {
  try {
    const { session } = options;

    const newLead = await Lead.create([data], { session });
    const populatedLead = await Lead.findById(newLead[0]._id)
    .populate('campaign_id', 'user_id')
    .session(session || null) 
    .exec();

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

// Updated CSV processing function that handles campaign_id from CSV
const processCSVUpload = async (filePath, userId, columnMapping) => {
  try {
    // Validate required column mappings, including campaign_id
    const requiredFields = [
      'first_name', 'last_name', 'phone_number', 'address.street', 'address.city', 'address.state', 'address.zip', 'campaign_id'
    ];
    
    const mappedDbColumns = Object.values(columnMapping);
    const missingRequired = requiredFields.filter(field => !mappedDbColumns.includes(field));

    if (missingRequired.length > 0) {
      throw new ErrorHandler(400, `Missing required column mappings: ${missingRequired.join(', ')}`);
    }

    
    // Add job to processing queue
    const jobInfo = await addCSVProcessingJob(filePath, null, userId, columnMapping);
    console.log('CSV processing job added:', jobInfo);
    return {
      success: true,
      message: 'CSV upload queued for processing',
      jobId: jobInfo.jobId,
      queueJobId: jobInfo.queueJobId
    };

  } catch (error) {
    console.log('Error in processCSVUpload:', error);
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to process CSV upload');
  }
};

// Validate CSV format and return sample data with better campaign handling
const validateCSVFormat = async (filePath, sampleRows = 5) => {
  try {
    const fs = require('fs');
    const csv = require('csv-parser');
    
    return new Promise((resolve, reject) => {
      const results = [];
      let headers = [];
      let rowCount = 0;
      
      fs.createReadStream(filePath)
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim(),
          skipEmptyLines: true
        }))
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', async (data) => {
          if (rowCount < sampleRows) {
            // Validate campaign_id for each sample row
            const campaignIdColumn = headers.find(header => columnMapping[header] === 'campaign_id');
            if (campaignIdColumn && data[campaignIdColumn]) {
              try {
                const campaign = await Campaign.findOne({
                  $or: [
                    { campaign_id: data[campaignIdColumn] },
                    { _id: mongoose.Types.ObjectId.isValid(data[campaignIdColumn]) ? data[campaignIdColumn] : null }
                  ]
                });
                if (!campaign) {
                  data[campaignIdColumn] = `${data[campaignIdColumn]} (Invalid Campaign ID)`;
                }
              } catch (error) {
                data[campaignIdColumn] = `${data[campaignIdColumn]} (Error validating Campaign ID)`;
              }
            }
            results.push(data);
            rowCount++;
          } else {
            return; // Stop reading after sample rows
          }
        })
        .on('end', () => {
          // Check if campaign_id exists in the CSV
          const hasCampaignId = headers.some(header => 
            header.toLowerCase().includes('campaign') && header.toLowerCase().includes('id')
          );

          resolve({
            headers,
            sampleData: results,
            totalSampleRows: rowCount,
            hasCampaignId,
            suggestions: {
              campaignIdColumn: headers.find(header => 
                header.toLowerCase().includes('campaign') && header.toLowerCase().includes('id')
              ),
              stateColumn: headers.find(header => 
                header.toLowerCase().includes('state')
              )
            }
          });
        })
        .on('error', (error) => {
          reject(new ErrorHandler(400, `CSV validation error: ${error.message}`));
        });
    });
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to validate CSV format');
  }
};

// Get CSV processing status
const getProcessingStatus = async (jobId, userId) => {
  try {
    const jobStatus = await getJobStatus(jobId);
    
    // Check if user has access to this job
    if (jobStatus.userId.toString() !== userId.toString()) {
      throw new ErrorHandler(403, 'Access denied to this job');
    }

    return jobStatus;
  } catch (error) {
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to get processing status');
  }
};

// Get user's processing jobs
const getUserProcessingJobs = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const JobStatus = require('../../models/jobStatus.model');
    
    const [jobs, total] = await Promise.all([
      JobStatus.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobStatus.countDocuments({ userId })
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to fetch processing jobs');
  }
};

const validatePrepaidCampaignBalance = async (campaign_id, leadPrice = 10) => {

  try {

    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) {
      throw new ErrorHandler(404, 'Campaign not found');
    }

    if (campaign.payment_type === 'prepaid') {
      const campaignUser = await User.findById(campaign.user_id);

      if (!campaignUser) {
        throw new ErrorHandler(404, 'Campaign user not found');
      }

      console.log(`User Balance: ${campaignUser.balance}, Lead Price: ${leadPrice}`);

      if (campaignUser.balance < leadPrice) {
        throw new ErrorHandler(400, 'Insufficient balance to create lead');
      }
    }

    return campaign;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, error.message || 'Failed to validate campaign balance');
  }
};
const getLeadCountByCampaignId = async (campaign_id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(campaign_id)) {
      throw new ErrorHandler(400, 'Invalid campaign ID');
    }

    const count = await Lead.countDocuments({ campaign_id });

    return {
      campaign_id,
      totalLeads: count
    };
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to count leads for campaign');
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
  getProcessingStatus,
  getUserProcessingJobs,
  validateCSVFormat,
  validatePrepaidCampaignBalance,
  getLeadCountByCampaignId,
};