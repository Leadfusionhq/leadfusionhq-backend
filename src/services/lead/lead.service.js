const Lead = require('../../models/lead.model.js');
const Campaign = require('../../models/campaign.model.js');
const State = require('../../models/state.model');
const County = require('../../models/county.model');
const { ErrorHandler } = require('../../utils/error-handler');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const { addCSVProcessingJob, getJobStatus } = require('../../queue/csvProcessor');
const mongoose = require('mongoose');
const { User } = require('../../models/user.model.js');
const MAIL_HANDLER = require('../../mail/mails');
const { sendToN8nWebhook, sendLowBalanceAlert } = require('../../services/n8n/webhookService.js');
const { leadLogger , logger } = require('../../utils/logger');
// services/lead.service.js

// New code start

const generateUniqueLeadId = require('../../utils/idGenerator');
const BillingServices = require('../billing/billing.service');
const GoogleSheetsService = require('../googleSheets/googleSheets.service');

const ReceiptService = require("../billing/receipt.service");
const { formatFullAddress } = require("../../utils/address.utile.js");
const SmsServices = require("../../services/sms/sms.service");
// New code End

const createLead = async (data, options = {}) => {
  try {
    const { session, transaction_id, original_cost } = options;

    // 🔥 LOG: Check incoming data
    console.log('📥 createLead service received data:', JSON.stringify(data, null, 2));
    console.log('📍 Incoming coordinates:', data.address?.coordinates);
    console.log('🆔 Incoming place_id:', data.address?.place_id);
    console.log('💰 Transaction ID:', transaction_id);
    console.log('💵 Original Cost:', original_cost);

    // 🔥 FIX: Ensure coordinates are properly formatted
    if (data.address?.coordinates) {
      const { lat, lng } = data.address.coordinates;

      if (lat !== undefined && lng !== undefined &&
        lat !== null && lng !== null &&
        lat !== '' && lng !== '') {
        data.address.coordinates = {
          lat: Number(lat),
          lng: Number(lng)
        };
        console.log('✅ Coordinates formatted:', data.address.coordinates);
      } else {
        // Remove incomplete coordinates
        delete data.address.coordinates;
        console.log('⚠️ Incomplete coordinates removed');
      }
    }

    // 🔥 FIX: Ensure place_id is preserved
    if (data.address?.place_id !== undefined) {
      if (data.address.place_id && data.address.place_id.trim() !== '') {
        console.log('✅ Place ID preserved:', data.address.place_id);
      } else {
        delete data.address.place_id;
        console.log('⚠️ Empty place_id removed');
      }
    }

    // ✅ ADD: Store transaction_id and original_cost if provided
    if (transaction_id) {
      data.transaction_id = transaction_id;
    }
    if (original_cost !== undefined && original_cost !== null) {
      data.original_cost = original_cost;
    }

    console.log('📤 Data being saved to MongoDB:', JSON.stringify(data, null, 2));

    // Create lead
    const newLead = await Lead.create([data], { session });

    // Populate and return
    const populatedLead = await Lead.findById(newLead[0]._id)
      .populate('campaign_id')
      .populate('address.state')
      .session(session || null)
      .exec();

    console.log('✅ Lead created successfully');
    console.log('📍 Saved coordinates:', populatedLead.address?.coordinates);
    console.log('🆔 Saved place_id:', populatedLead.address?.place_id);
    console.log('💰 Saved transaction_id:', populatedLead.transaction_id);
    console.log('💵 Saved original_cost:', populatedLead.original_cost);

    return populatedLead;
  } catch (error) {
    console.error('❌ createLead error:', error);
    throw new ErrorHandler(500, error.message || 'Failed to create lead');
  }
};

const getLeads = async (page = 1, limit = 10, filters = {}, search = "") => {
  try {
    const skip = (page - 1) * limit;

    const normalizeId = (val) => String(val).split('|')[0]; // trims any accidental "|…"

    const query = {
      ...(filters.campaign_id && { campaign_id: filters.campaign_id }),
      ...(filters.status && { status: filters.status }),
      ...(filters.state && { 'address.state': normalizeId(filters.state) }),
      ...(filters.payment_status && { payment_status: new RegExp(filters.payment_status, 'i') }),
      ...(filters.return_status && { return_status: new RegExp(filters.return_status, 'i') }),
    };

    if (search) {
      const parts = search.trim().split(/\s+/);
      const regexParts = parts.map(p => new RegExp(p, "i"));

      query.$or = [];

      regexParts.forEach(rgx => {
        query.$or.push({ first_name: rgx });
        query.$or.push({ middle_name: rgx });
        query.$or.push({ last_name: rgx });

        query.$or.push({ email: rgx });
        query.$or.push({ phone: rgx });
      });
    }

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

const getLeadByUserId = async (page = 1, limit = 10, user_id, filters = {}, search = "") => {
  const skip = (page - 1) * limit;
  const campaigns = await Campaign.find({ user_id }).select('_id');

  if (!campaigns.length) {
    return {
      data: [],
      meta: { total: 0, page, limit, totalPages: 0 }
    };
  }

  const normalizeId = (val) => String(val).split('|')[0];

  const baseQuery = { campaign_id: { $in: campaigns.map(c => c._id) } };

  if (filters.status) baseQuery.status = filters.status;
  if (filters.state) baseQuery['address.state'] = normalizeId(filters.state);
  if (filters.return_status) baseQuery.return_status = new RegExp(filters.return_status, 'i');
  if (filters.payment_status) baseQuery.payment_status = new RegExp(filters.payment_status, 'i');

  if (search) {
    const parts = search.trim().split(/\s+/);
    const regexParts = parts.map(p => new RegExp(p, "i"));

    baseQuery.$or = [];

    regexParts.forEach(rgx => {
      baseQuery.$or.push({ first_name: rgx });
      baseQuery.$or.push({ middle_name: rgx });
      baseQuery.$or.push({ last_name: rgx });

      baseQuery.$or.push({ email: rgx });
      baseQuery.$or.push({ phone: rgx });
    });

    baseQuery.$or.push({
      $expr: {
        $regexMatch: {
          input: {
            $trim: {
              input: {
                $concat: [
                  "$first_name", " ",
                  { $ifNull: ["$middle_name", ""] }, " ",
                  "$last_name"
                ]
              }
            }
          },
          regex: new RegExp(search, "i")
        }
      }
    });
  }





  const [leads, total] = await Promise.all([
    Lead.find(baseQuery)
      .populate('campaign_id', 'campaign_id name status lead_type exclusivity language geography delivery user_id note')
      .populate('address.state', 'name abbreviation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(baseQuery),
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
};

// const getLeadByUserId = async (page = 1, limit = 10, user_id, filters = {}) => {
//   const skip = (page - 1) * limit;
//   const campaigns = await Campaign.find({ user_id }).select('_id');
//   if (!campaigns.length) {
//     return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
//   }

//   const normalizeId = (val) => String(val).split('|')[0];

//   const baseQuery = { campaign_id: { $in: campaigns.map(c => c._id) } };
//   if (filters.status) baseQuery.status = filters.status;
//   if (filters.state) baseQuery['address.state'] = normalizeId(filters.state);

//   const [leads, total] = await Promise.all([
//     Lead.find(baseQuery)
//       .populate('campaign_id', 'campaign_id name status lead_type exclusivity language geography delivery user_id note')
//       .populate('address.state', 'name abbreviation')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean(),
//     Lead.countDocuments(baseQuery),
//   ]);

//   return {
//     data: leads,
//     meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
//   };
// };

const getLeadById = async (leadId, userId) => {
  // const lead = await Lead.findOne({ _id: leadId, user_id: userId }).lean();
  // console.log('userId',userId)
  // console.log('leadId',leadId)
  // console.log(lead)
  // if (!lead) {
  //   throw new ErrorHandler(404, 'Lead not found or access denied');
  // }

  // return lead;

  const lead = await Lead.findOne({ _id: leadId })
    .populate({
      path: 'campaign_id',
    })
    .populate('address.state', 'name abbreviation')
    .lean();

  if (!lead || String(lead.campaign_id?.user_id) !== String(userId)) {
    throw new ErrorHandler(404, 'Lead not found or access denied');
  }

  return lead;

};

const getLeadByIdForAdmin = async (leadId) => {
  const lead = await Lead.findById(leadId)
    .populate('user_id', 'name email')
    .populate('address.state', 'name abbreviation')
    .populate({
      path: 'campaign_id',
    })
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

    // 🔥 LOG: Check incoming update data
    console.log('📥 updateLead service received data:', JSON.stringify(updateData, null, 2));
    console.log('📍 Incoming coordinates:', updateData.address?.coordinates);
    console.log('🆔 Incoming place_id:', updateData.address?.place_id);

    // 🔥 FIX: Handle nested address updates properly
    if (updateData.address) {
      // Get existing lead
      const existingLead = await Lead.findOne(filter);

      if (!existingLead) {
        throw new ErrorHandler(404, 'Lead not found or access denied');
      }

      // Merge address fields
      const mergedAddress = {
        ...existingLead.address.toObject(),
        ...updateData.address,
      };

      // 🔥 FIX: Handle coordinates update
      if (updateData.address.coordinates !== undefined) {
        if (updateData.address.coordinates === null) {
          // Explicitly remove coordinates
          mergedAddress.coordinates = undefined;
          console.log('⚠️ Coordinates removed');
        } else {
          const { lat, lng } = updateData.address.coordinates;

          if (lat !== undefined && lng !== undefined &&
            lat !== null && lng !== null &&
            lat !== '' && lng !== '') {
            mergedAddress.coordinates = {
              lat: Number(lat),
              lng: Number(lng)
            };
            console.log('✅ Coordinates updated:', mergedAddress.coordinates);
          } else {
            // Keep existing coordinates if new ones are incomplete
            mergedAddress.coordinates = existingLead.address.coordinates;
            console.log('⚠️ Incomplete coordinates, keeping existing');
          }
        }
      }

      // 🔥 FIX: Handle place_id explicitly
      if (updateData.address.place_id !== undefined) {
        if (updateData.address.place_id && updateData.address.place_id.trim() !== '') {
          mergedAddress.place_id = updateData.address.place_id;
          console.log('✅ Place ID updated:', mergedAddress.place_id);
        } else {
          mergedAddress.place_id = undefined;
          console.log('⚠️ Place ID removed (empty)');
        }
      }

      updateData.address = mergedAddress;
    }

    console.log('📤 Update data being saved:', JSON.stringify(updateData, null, 2));

    // Update lead
    const updatedLead = await Lead.findOneAndUpdate(
      filter,
      {
        ...updateData,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('address.state')
      .populate('campaign_id');

    if (!updatedLead) {
      throw new ErrorHandler(404, 'Lead not found or access denied');
    }

    console.log('✅ Lead updated successfully');
    console.log('📍 Updated coordinates:', updatedLead.address?.coordinates);
    console.log('🆔 Updated place_id:', updatedLead.address?.place_id);

    return updatedLead;
  } catch (error) {
    console.error('❌ updateLead error:', error);
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
      message: jobInfo.message || 'CSV upload queued for processing',
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

const validatePrepaidCampaignBalanceOld = async (campaign_id, leadPrice = 10) => {

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

const validatePrepaidCampaignBalance = async (campaign_id) => {
  try {

    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) {
      throw new ErrorHandler(404, 'Campaign not found');
    }

    // const leadCost = campaign.bid_price || 0;
    // if (leadCost <= 0) {
    //   throw new ErrorHandler(400, 'Campaign has invalid bid_price');
    // }
    const leadCost = Number(campaign.bid_price) || 0;

    if (leadCost < 0) {
      throw new ErrorHandler(400, 'Campaign has invalid bid_price');
    }

    if (campaign.payment_type === 'prepaid') {
      const campaignUser = await User.findById(campaign.user_id);
      if (!campaignUser) {
        throw new ErrorHandler(404, 'Campaign user not found');
      }

      const totalAvailable = (campaignUser.balance || 0) + (campaignUser.refundMoney || 0);

      console.log(
        `User Balance: ${campaignUser.balance}, Refund Money: ${campaignUser.refundMoney}, Lead Price: ${leadCost}`
      );

      if (totalAvailable < leadCost) {


        // 🔹 Call NEW LOW BALANCE API
        try {
          const lowBalanceResp = await sendLowBalanceAlert({
            campaign_name: campaign.name,
            filter_set_id: campaign.boberdoo_filter_set_id,
            partner_id: campaignUser.integrations?.boberdoo?.external_id || "",
            email: campaignUser.email
          });


          // define once at top of function


          if (lowBalanceResp.success) {
            leadLogger.info('Low Balance webhook sent successfully', {

              webhook_status: "success",
              response: lowBalanceResp
            });
          } else {
            leadLogger.warn('Low Balance webhook failed', {

              webhook_status: "failed",
              error: lowBalanceResp.error || "Unknown error",
              response: lowBalanceResp
            });
          }


        } catch (err) {
          leadLogger.error('Fatal error while sending low balance webhook', err, {

            error: err.message
          });
        }
        // 🔹 Send detailed insufficient balance email
        try {
          const emailResp = await MAIL_HANDLER.sendInsufficientBalanceEmail({
            to: campaignUser.email,
            userName: campaignUser.name || campaignUser.fullName || campaignUser.email,
            requiredAmount: leadCost,
            currentBalance: totalAvailable,
            campaignName: campaign.name || `Campaign #${campaign._id}`,
            campaignId: campaign._id
          });

          if (emailResp?.data?.id) {
            leadLogger.info('Low Balance email sent successfully', {

              email_to: campaignUser.email,
              response_id: emailResp.data.id
            });
          } else {
            leadLogger.warn('Low Balance email sending failed', {

              email_to: campaignUser.email,
              error: emailResp?.error || "Unknown error",
              response: emailResp
            });
          }

          const EXCLUDED = new Set([
            'admin@gmail.com',
            'admin123@gmail.com',
            'admin1234@gmail.com',
          ]);

          const adminUsers = await User.find({
            role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
            isActive: { $ne: false },
          }).select('email');



          let adminEmails = (adminUsers || [])
            .map(a => a.email)
            .filter(Boolean)
            .map(e => e.trim().toLowerCase())
            .filter(e => !EXCLUDED.has(e));


          // ✅ NEW: override with env emails if present (still an array)
          console.log("ENV CHECK → ADMIN_NOTIFICATION_EMAILS =", process.env.ADMIN_NOTIFICATION_EMAILS);

          console.log("Admin before override =", adminEmails);

          if (process.env.ADMIN_NOTIFICATION_EMAILS) {
            adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS
              .split(',')
              .map(e => e.trim().toLowerCase())
              .filter(Boolean);
          }

          console.log("Admin AFTER override =", adminEmails);
          const emailString = adminEmails.join(',');
          // ---------------------------------------
          // 🔹 SEND LOW BALANCE ADMIN EMAIL
          // ---------------------------------------
          const adminEmailResp = await MAIL_HANDLER.sendLowBalanceAdminEmail({
            to: emailString,  // <-- NOW SENDING TO MULTIPLE OR SINGLE (same key)
            userEmail: campaignUser.email,
            userName: campaignUser.name || campaignUser.fullName || "",
            campaignName: campaign.name,
            campaignId: campaign._id,
            requiredAmount: leadCost,
            currentBalance: totalAvailable
          });

          if (adminEmailResp?.data?.id) {
            leadLogger.info('Low Balance ADMIN email sent successfully', {
              email_to: adminEmails,
              response_id: adminEmailResp.data.id
            });
          }

        } catch (err) {
          leadLogger.error('Fatal error while sending low balance email', err, {

            error: err.message
          });
        }


        throw new ErrorHandler(400, 'Insufficient funds to create lead');
      }

      return { campaignData: campaign, user: campaignUser, leadCost };
    }

    return { campaignData: campaign, leadCost };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, error.message || 'Failed to validate campaign balance');
  }
};

const getCampaignByLead = async (leadId) => {
  try {

    const lead = await Lead.findById(leadId).lean();
    if (!lead) {
      throw new ErrorHandler(404, 'Lead not found');
    }

    const campaignId = lead.campaign_id;
    if (!campaignId) {
      throw new ErrorHandler(400, 'Lead does not have a campaign associated');
    }

    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) {
      throw new ErrorHandler(404, 'Campaign not found for this lead');
    }

    return campaign;
  } catch (error) {
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to get campaign');
  }
};

const returnLead = async (leadId, returnStatus, returnReason, returnComments) => {
  try {
    const lead = await Lead.findById(leadId);

    if (!lead) {
      throw new ErrorHandler(404, 'Lead not found');
    }

    const currentStatus = lead.return_status ?? 'Not Returned';
    const attempts = lead.return_attempts ?? 0;
    const maxAttempts = lead.max_return_attempts ?? 2;

    if (currentStatus !== 'Not Returned' && currentStatus !== 'Rejected') {
      throw new ErrorHandler(400, 'This lead has already been marked for return');
    }

    if (attempts >= maxAttempts) {
      throw new ErrorHandler(400, 'Maximum return attempts reached for this lead');
    }

    // ✅ Update with reason and comments
    lead.return_status = returnStatus;
    lead.return_attempts = attempts + 1;
    lead.return_reason = returnReason;
    lead.return_comments = returnComments;
    // NEW FIELD
    lead.return_requested_at = new Date();

    await lead.save();

    return lead.toObject();

  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || 'Failed to process return request'
    );
  }
};

const getReturnLeads = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const query = {
      return_status: 'Pending',
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
    console.error('Error in getReturnLeads:', error);
    throw new ErrorHandler(500, error.message || 'Failed to fetch return leads');
  }
};

const rejectReturnLead = async (leadId, returnStatus) => {
  try {

    const lead = await Lead.findById(leadId);

    if (!lead) {
      throw new ErrorHandler(404, 'Lead not found');
    }

    const currentStatus = lead.return_status ?? 'Not Returned';
    if (currentStatus !== 'Pending') {
      throw new ErrorHandler(400, 'Lead return is not pending and cannot be rejected');
    }

    lead.return_status = returnStatus;

    await lead.save();

    return lead.toObject();
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || 'Failed to reject return request'
    );
  }
};
const approveReturnLead = async (leadId, returnStatus, isDirectReturn = false) => {
  const Transaction = require('../../models/transaction.model');

  try {
    const lead = await Lead.findById(leadId);

    if (!lead) {
      throw new ErrorHandler(404, 'Lead not found');
    }

    const currentStatus = lead.return_status ?? 'Not Returned';

    // ✅ Validation logic
    if (isDirectReturn) {
      if (currentStatus === 'Approved') {
        throw new ErrorHandler(400, 'Lead has already been returned and refunded. Cannot return again.');
      }
    } else {
      if (currentStatus !== 'Pending') {
        throw new ErrorHandler(400, 'Lead return is not pending and cannot be approved');
      }
    }

    const campaign = await Campaign.findById(lead.campaign_id);
    if (!campaign) {
      throw new ErrorHandler(404, 'Campaign not found for this lead');
    }

    const { user_id } = campaign;
    if (!user_id) {
      throw new ErrorHandler(400, 'Campaign is missing user_id');
    }

    const user = await User.findById(user_id);
    if (!user) {
      throw new ErrorHandler(404, 'User not found for this campaign');
    }

    let originalLeadCost = 0;
    let transactionId = null;
    let fetchMethod = 'unknown';

    // ✅ Get original cost (Priority: stored > transaction > fallback)
    if (lead.original_cost && lead.original_cost > 0) {
      originalLeadCost = lead.original_cost;
      transactionId = lead.transaction_id;
      fetchMethod = 'stored_in_lead';
      console.log('✅ Using stored original_cost from lead:', originalLeadCost);
    }
    else if (lead.transaction_id) {
      const transaction = await Transaction.findById(lead.transaction_id);
      if (transaction) {
        originalLeadCost = Math.abs(transaction.amount);
        transactionId = transaction._id;
        fetchMethod = 'transaction_by_id';
        console.log('✅ Fetched from transaction by stored ID:', originalLeadCost);
      }
    }

    if (originalLeadCost <= 0) {
      const transaction = await Transaction.findOne({
        userId: user_id,
        createdAt: {
          $gte: new Date(lead.createdAt.getTime() - 10000),
          $lte: new Date(lead.createdAt.getTime() + 10000)
        }
      }).sort({ createdAt: 1 });

      if (transaction) {
        originalLeadCost = Math.abs(transaction.amount);
        transactionId = transaction._id;
        fetchMethod = 'transaction_by_time';
        console.log('⚠️ Fallback: Fetched from transaction by time:', originalLeadCost);
      }
    }

    if (originalLeadCost <= 0) {
      throw new ErrorHandler(404, 'Original transaction/cost not found for this lead. Cannot process refund.');
    }

    // ✅ Process refund
    const previousBalance = user.balance || 0;
    user.balance = previousBalance + originalLeadCost;
    await user.save();

    // ✅ Update lead status
    const previousReturnStatus = lead.return_status;
    lead.return_status = returnStatus;
    lead.returned_at = new Date();
    await lead.save();

    // ✅✅ CREATE REFUND TRANSACTION RECORD ✅✅
    const refundTransaction = new Transaction({
      userId: user_id,
      amount: originalLeadCost, // Positive amount for refund
      type: 'REFUND',
      status: 'COMPLETED',
      description: `Lead return refund - Lead ID: ${leadId}${isDirectReturn ? ' (Admin Direct Return)' : ''}`,
      paymentMethod: 'BALANCE',
      transactionId: `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      balanceAfter: user.balance,
      note: `Return reason: ${lead.return_reason || 'Not specified'}. Original transaction: ${transactionId || 'N/A'}`
    });

    await refundTransaction.save();

    console.log(`✅ Refund processed: $${originalLeadCost} added to user ${user_id}`);
    console.log(`   Previous return status: ${previousReturnStatus}`);
    console.log(`   New return status: ${returnStatus}`);
    console.log(`   Previous balance: $${previousBalance}`);
    console.log(`   New balance: $${user.balance}`);
    console.log(`   Fetch method: ${fetchMethod}`);
    console.log(`   Direct admin return: ${isDirectReturn}`);
    console.log(`   ✅ Refund transaction created: ${refundTransaction._id}`);

    return {
      lead: lead.toObject(),
      originalLeadCost,
      currentBidPrice: campaign.bid_price,
      refundedAmount: originalLeadCost,
      transactionId,
      fetchMethod,
      previousBalance,
      newBalance: user.balance,
      isDirectReturn,
      previousReturnStatus,
      refundTransactionId: refundTransaction._id, // ✅ Return transaction ID
      message: `Refund of $${originalLeadCost} added to user balance. New balance: $${user.balance}`,
    };
  } catch (error) {
    throw new ErrorHandler(
      error.statusCode || 500,
      error.message || 'Failed to approve return request'
    );
  }
};

// Permanent delete lead
const deleteLead = async (leadId, userId, role) => {
  try {
    // Non-admin users can only delete their own leads
    if (role !== CONSTANT_ENUM.USER_ROLE.ADMIN) {
      // Get lead's campaign to check ownership
      const lead = await Lead.findById(leadId).populate('campaign_id');

      if (!lead) {
        throw new ErrorHandler(404, 'Lead not found');
      }

      if (lead.campaign_id.user_id.toString() !== userId.toString()) {
        throw new ErrorHandler(403, 'Access denied: You can only delete your own leads');
      }
    }

    // Permanently delete the lead
    const deletedLead = await Lead.findByIdAndDelete(leadId);

    if (!deletedLead) {
      throw new ErrorHandler(404, 'Lead not found');
    }

    console.log(`✅ Lead ${leadId} permanently deleted by user ${userId}`);

    return {
      deleted: true,
      lead_id: leadId,
      message: 'Lead permanently deleted from database'
    };
  } catch (error) {
    console.error('❌ deleteLead error:', error);
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to delete lead');
  }
};



// New Code
const processN8nLead = async (leadData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const campaign = await Campaign.findOne({
      boberdoo_filter_set_id: leadData.filter_set_id
    });

    if (!campaign) {
      throw new ErrorHandler(404, `Campaign not found for filter_set_id: ${leadData.filter_set_id}`);
    }

    console.log(' Campaign found:', {
      internal_id: campaign._id,
      name: campaign.name,
      filter_set_id: campaign.boberdoo_filter_set_id
    });

    const isActive = String(campaign.status).toUpperCase() === 'ACTIVE';
    if (!isActive) {
      throw new ErrorHandler(400, `Campaign "${campaign.name}" is not active. Status: ${campaign.status}`);
    }

    const state = await State.findOne({
      abbreviation: leadData.address.state_code.toUpperCase()
    });

    if (!state) {
      throw new ErrorHandler(400, `Invalid state code: ${leadData.address.state_code}`);
    }

    const leadCost = campaign.bid_price || 0;

    const lead_id = await generateUniqueLeadId();

    let billingResult;

    // if (campaign.payment_type === "prepaid" && leadCost > 0) {
    if (campaign.payment_type === "prepaid") {
      billingResult = await BillingServices.assignLeadPrepaid(
        campaign.user_id,
        lead_id,
        leadCost,
        campaign.user_id,
        session
      );
    } else if (campaign.payment_type === "payasyougo") {
      billingResult = await BillingServices.assignLeadPayAsYouGo(
        campaign.user_id,
        lead_id,
        leadCost,
        campaign.user_id,
        session,
        campaign
      );
    } else {
      throw new ErrorHandler(400, "Invalid campaign payment type.");
    }

    const isPaid = billingResult.success;
    console.log(`Payment result: ${isPaid ? 'SUCCESS' : 'FAILED'} - ${billingResult.message || ''}`);

    const preparedLead = {
      lead_id,
      user_id: campaign.user_id,
      campaign_id: campaign._id,
      first_name: leadData.first_name,
      last_name: leadData.last_name,
      middle_name: leadData.middle_name,
      suffix: leadData.suffix,
      phone_number: leadData.phone_number,
      email: leadData.email,
      age: leadData.age,
      gender: leadData.gender,
      address: {
        street: leadData.address.street,
        city: leadData.address.city,
        state: state._id,
        zip_code: leadData.address.zip_code,
        full_address: leadData.address.full_address ||
          `${leadData.address.street}, ${leadData.address.city}, ${state.abbreviation} ${leadData.address.zip_code}`,
        coordinates: leadData.address.coordinates,
        place_id: leadData.address.place_id
      },
      note: leadData.note,
      source: 'boberdo',

      status: isPaid ? 'active' : 'payment_pending',
      payment_status: isPaid ? 'paid' : 'pending',
      lead_cost: leadCost,
      transaction_id: isPaid ? billingResult.transactionId : null,
      original_cost: leadCost,
      payment_error_message: isPaid ? null : billingResult.message,

      boberdo_metadata: {
        external_id: leadData.external_lead_id,
        filter_set_id: leadData.filter_set_id,
        source_campaign: leadData.source_info,
        received_at: new Date()
      }
    };

    const newLead = await Lead.create([preparedLead], { session });
    const createdLead = newLead[0];

    console.log('Lead created:', {
      lead_id: createdLead.lead_id,
      internal_id: createdLead._id,
      status: createdLead.status,
      payment_status: createdLead.payment_status
    });

    await session.commitTransaction();
    session.endSession();

    // ── Google Sheets: append lead (fire-and-forget) ──
    setImmediate(() => {
      GoogleSheetsService.syncLeadById(createdLead._id);
    });

    const populatedLead = await Lead.findById(createdLead._id)
      .populate('campaign_id', 'name campaign_id')
      .populate('address.state', 'name abbreviation');

    if (isPaid) {
      // ✅ Parallelize all post-payment notifications & wait for them (Reliability Fix)
      console.log('⏳ Starting Boberdoo lead notifications (Parallel Execution)...');

      // Consolidated Notification Flow

      await sendN8NLeadNotifications(populatedLead, campaign, billingResult, leadCost)
        .then(() => console.log('✅ Boberdoo lead notifications completed'))
        .catch(err => console.error('❌ Failed to run Boberdoo notifications:', err));

      console.log('🏁 All Boberdoo post-processing tasks finished.');

    } else {
      // Payment Failed Handling - also await this
      await BillingServices.handlePaymentFailure({
        userId: campaign.user_id,
        leadId: lead_id,
        leadCost,
        campaign,
        billingResult,
        leadData: populatedLead,
        logger: billingLogger
      });
    }

    return populatedLead;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// New Code for notifications

const sendN8NLeadNotifications = async (lead, campaign, billingResult, leadCost = 0) => {
  const logMeta = {
    campaign_id: campaign?._id,
    campaign_name: campaign?.name,
    lead_id: lead?.lead_id,
    lead_internal_id: lead?._id,
    action: "Send Boberdo Lead Notifications",
  };

  try {
    // CRITICAL: Fetch user with all required fields
    const campaignOwner = await User.findById(campaign.user_id).select(
      "+email +name +fullName",
    );

    if (!campaignOwner) {
      leadLogger.error(
        "Campaign owner not found - cannot send notifications",
        logMeta,
      );
      return;
    }

    // Validate owner has email
    if (!campaignOwner.email) {
      leadLogger.error("Campaign owner missing email address", {
        ...logMeta,
        userId: campaign.user_id,
      });
    }

    const tasks = [];

    // 1. Email to User
    if (
      campaign?.delivery?.method?.includes("email") &&
      campaign?.delivery?.email?.addresses
    ) {
      tasks.push(async () => {
        try {
          await MAIL_HANDLER.sendLeadAssignEmail({
            to: campaign.delivery.email.addresses,
            name:
              campaignOwner.name || campaignOwner.fullName || "Campaign User",
            leadName: lead.lead_id,
            assignedBy: "Boberdo Integration",
            leadDetailsUrl: `${process.env.UI_LINK}/dashboard/leads/${lead._id}`,
            campaignName: campaign.name,
            note: lead.note ?? "",
            leadData: {
              ...(lead.toObject ? lead.toObject() : lead),
              note: lead.note ?? "",
            },
            realleadId: lead._id,
            subject: `Lead Fusion - New Lead`,
          });
          leadLogger.info("Boberdo lead assignment email sent successfully", {
            ...logMeta,
            email_to: campaign.delivery.email.addresses,
          });
        } catch (emailErr) {
          leadLogger.error(
            "Failed to send Boberdo lead assignment email",
            emailErr,
            {
              ...logMeta,
              error: emailErr.message,
              stack: emailErr.stack,
            },
          );
        }
      });
    }

    // 2. Email to Admin
    tasks.push(async () => {
      try {
        const EXCLUDED = new Set([
          "admin@gmail.com",
          "admin123@gmail.com",
          "admin1234@gmail.com",
        ]);

        let adminEmails = [];
        if (process.env.ADMIN_NOTIFICATION_EMAILS) {
          adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS.split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        } else {
          const adminUsers = await User.find({
            role: { $in: ["ADMIN", "SUPER_ADMIN"] },
            isActive: { $ne: false },
          }).select("email");

          adminEmails = (adminUsers || [])
            .map((a) => a.email)
            .filter(Boolean)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => !EXCLUDED.has(e));
        }

        const emailString = adminEmails.join(",");

        if (adminEmails.length > 0) {
          await MAIL_HANDLER.sendLeadAssignAdminEmail({
            to: emailString,
            userName: campaignOwner.name || campaignOwner.fullName || "N/A",
            userEmail: campaignOwner.email,
            leadName: lead.lead_id,
            assignedBy: "Boberdo Integration",
            leadDetailsUrl: `${process.env.UI_LINK}/dashboard/leads/${lead._id}`,
            campaignName: campaign.name,
            note: lead.note ?? "",
            leadData: {
              ...(lead.toObject ? lead.toObject() : lead),
              note: lead.note ?? "",
            },
            realleadId: lead._id,
          });
          leadLogger.info(
            "Boberdoo lead assignment admin email sent successfully",
            {
              ...logMeta,
              admin_count: adminEmails.length,
            },
          );
        }
      } catch (err) {
        leadLogger.error(
          "Failed to send Boberdoo lead assignment admin email",
          err,
          {
            ...logMeta,
            error: err.message,
            stack: err.stack,
          },
        );
      }
    });

    tasks.push(async () => {
      try {
        // Additional validation before sending receipt
        if (!campaignOwner.email) {
          leadLogger.error(
            "Cannot send receipt - campaign owner has no email",
            {
              ...logMeta,
              userId: campaign.user_id,
            },
          );
          return;
        }

        // Log what we're passing to the receipt service
        leadLogger.info("Attempting to send Boberdoo payment receipt", {
          ...logMeta,
          userEmail: campaignOwner.email,
          userName: campaignOwner.name || campaignOwner.fullName,
          hasLead: !!lead,
          hasCampaign: !!campaign,
          hasBillingResult: !!billingResult,
          billingResultKeys: billingResult ? Object.keys(billingResult) : [],
        });

        await ReceiptService.sendLeadPaymentReceipt({
          user: {
            _id: campaignOwner._id,
            email: campaignOwner.email,
            name: campaignOwner.name || campaignOwner.fullName || "User",
            // Include any other fields ReceiptService might need
          },
          lead: lead.toObject ? lead.toObject() : lead,
          campaign: campaign.toObject ? campaign.toObject() : campaign,
          billingResult: billingResult || {},
        });

        leadLogger.info("✅ Boberdoo lead receipt email sent successfully", {
          ...logMeta,
          recipientEmail: campaignOwner.email,
        });
      } catch (receiptErr) {
        leadLogger.error(
          "❌ CRITICAL: Failed to send Boberdoo lead receipt email",
          receiptErr,
          {
            ...logMeta,
            error: receiptErr.message,
            stack: receiptErr.stack,
            userEmail: campaignOwner?.email,
            userId: campaign?.user_id,
          },
        );

        // Optional: You might want to throw here to ensure it's tracked
        // throw receiptErr;
      }
    });
    // 3. SMS delivery
    if (
      campaign?.delivery?.method?.includes("phone") &&
      campaign?.delivery?.phone?.numbers
    ) {
      tasks.push(async () => {
        try {
          const fullName =
            `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
          const phoneNumber = lead.phone_number || lead.phone || "";
          const email = lead.email || "";
          const address = formatFullAddress(lead.address);
          const campaignName = campaign?.name || "N/A";
          const MAX_NOTE_LENGTH = 100;
          let notes = lead.note || "No notes provided";
          if (notes.length > MAX_NOTE_LENGTH)
            notes = notes.substring(0, MAX_NOTE_LENGTH) + "...";

          const smsMessage = `New Lead Assigned

                        Name: ${fullName}
                        Phone: ${phoneNumber}
                        Email: ${email}
                        Address: ${address}
                        Lead ID: ${lead.lead_id}
                        Campaign: ${campaignName}
                        Notes: ${notes}

                        View Lead: ${process.env.UI_LINK}/dashboard/leads/${lead._id}`;

          leadLogger.info("Attempting to send Boberdo lead assignment SMS", {
            ...logMeta,
            to_numbers: campaign.delivery.phone.numbers,
          });

          const smsResult = await SmsServices.sendSms({
            to: campaign.delivery.phone.numbers,
            message: smsMessage,
            from: process.env.SMS_SENDER_ID || "+12157026445",
          });

          if (smsResult.success) {
            leadLogger.info("Boberdo lead assignment SMS sent successfully", {
              ...logMeta,
              sent_to: smsResult.sentTo.join(", "),
              total_sent: smsResult.successful,
            });
          } else {
            leadLogger.warn("Boberdo SMS failed", {
              ...logMeta,
              failed_count: smsResult.failed,
              error: smsResult.results?.map((r) => r.error?.message).join("; "),
            });
          }
        } catch (err) {
          leadLogger.error("Fatal error during Boberdo SMS sending", err, {
            ...logMeta,
            error: err.message,
            stack: err.stack,
          });
        }
      });
    }

    // 4. Low Balance Check
    tasks.push(async () => {
      try {
        await BillingServices.checkAndSendLowBalanceAlerts({
          campaign,
          leadCost,
          remainingBalance: billingResult?.newBalance,
          logger: leadLogger,
        });
      } catch (err) {
        leadLogger.error("Error in low balance check logic (Boberdoo)", err, {
          ...logMeta,
          error: err.message,
          stack: err.stack,
        });
      }
    });

    // 5. Send Payment Receipt - CRITICAL FIX

    // Execute tasks SEQUENTIALLY with delay to prevent Rate Limiting (Resend 2 req/s)
    const results = [];
    for (const [index, task] of tasks.entries()) {
      try {
        // Enforce 1000ms delay between tasks to avoid hitting rate limits
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        await task();
        results.push({ status: "fulfilled" });
      } catch (err) {
        results.push({ status: "rejected", reason: err });
        leadLogger.error(`Notification task ${index} failed`, err, {
          ...logMeta,
          taskIndex: index,
          error: err.message,
        });
      }
    }

    leadLogger.info("Completed sending Boberdo notifications (Sequential)", {
      ...logMeta,
      totalTasks: tasks.length,
      successful: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    leadLogger.error("Error in sendN8NLeadNotifications", error, {
      ...logMeta,
      error: error.message,
      stack: error.stack,
    });
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
  returnLead,
  getReturnLeads,
  rejectReturnLead,
  approveReturnLead,
  getLeadCountByCampaignId,
  getCampaignByLead,
  deleteLead,
  processN8nLead,
  sendN8NLeadNotifications
};