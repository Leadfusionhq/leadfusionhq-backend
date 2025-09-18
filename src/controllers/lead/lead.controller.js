const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const LeadServices = require('../../services/lead/lead.service.js');
const NotificationServices = require('../../services/notification/notification.service');
const { ErrorHandler } = require('../../utils/error-handler');
const Lead = require('../../models/lead.model.js'); 
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const { getPaginationParams, extractFilters } = require('../../utils/pagination');
const generateUniqueLeadId = require('../../utils/idGenerator');
const { cleanupTempFile } = require('../../middleware/csv-upload');
const path = require('path');
const fs = require('fs');
const MAIL_HANDLER = require('../../mail/mails');

// Create single lead
const createLead = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const lead_id = await generateUniqueLeadId();
    const leadData = { ...req.body, user_id, lead_id };
  
    const result = await LeadServices.createLead(leadData);
    const message = 'New Lead has been assigned to your campaign!';
    await result.populate('campaign_id');

    console.log('Campaign User ID:', result?.campaign_id?.user_id);
  
    try {
      // Send notification
      await NotificationServices.createNotification(
        user_id,
        result?.campaign_id?.user_id,
        'info',
        message,
        0,
        `/dashboard/leads`
      );
  
      // ---- Send Lead Assignment Email ----
 const campaign = result.campaign_id;
console.log("Campaign after populate:", campaign?.name, campaign?.delivery);
    
      if (campaign?.delivery?.method?.includes('email') && campaign?.delivery?.email?.addresses) {
        try {
          await MAIL_HANDLER.sendLeadAssignEmail({
            to: campaign.delivery.email.addresses,
            name: campaign?.name || 'Campaign User',
            leadName: result?.lead_id,
            assignedBy: req.user?.name || 'System',
            leadDetailsUrl: `${process.env.UI_LINK}/dashboard/leads/${result?._id}`,
            campaignName: campaign?.name,
          });
          console.log(`Lead assignment email sent to ${campaign.delivery.email.addresses}`);
        } catch (err) {
          console.error('Failed to send lead assignment email:', err.message);
        }
      }
    } catch (err) {
      console.error(`Failed to send notification:`, err.message);
    }
  
    sendResponse(res, { leadData: result }, 'Lead has been created successfully', 201);
  });
  

// Get all leads (paginated with filters)
const getLeads = wrapAsync(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const user = req.user;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let data;
    if (isAdmin) {
        const allowedFilterKeys = ['campaign_id', 'status', 'state'];
        const filters = extractFilters(req.query, allowedFilterKeys);
        data = await LeadServices.getLeads(page, limit, filters);
    } else {
        data = await LeadServices.getLeadByUserId(page, limit, user._id);
    }

    sendResponse(res, data, "Leads fetched successfully", 200);
});

// Get single lead by ID
const getLeadById = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { leadId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let data;
    if (isAdmin) {
        data = await LeadServices.getLeadByIdForAdmin(leadId);
    } else {
        data = await LeadServices.getLeadById(leadId, user_id);
    }

    sendResponse(res, { data }, 'Lead fetched successfully', 200);
});

// Update existing lead
const updateLead = wrapAsync(async (req, res) => {
    const { _id: user_id, role } = req.user;
    const { leadId } = req.params;
    const leadData = { ...req.body };

    const result = await LeadServices.updateLead(leadId, user_id, role, leadData);

    sendResponse(res, { result }, 'Lead has been updated successfully', 200);
});

// Delete lead (soft delete by updating status)
const deleteLead = wrapAsync(async (req, res) => {
    const { _id: user_id, role } = req.user;
    const { leadId } = req.params;

    const result = await LeadServices.updateLead(leadId, user_id, role, { 
        status: 'inactive',
        deletedAt: new Date()
    });

    sendResponse(res, { result }, 'Lead has been deleted successfully', 200);
});

// Validate CSV format and return sample data
const validateCSV = wrapAsync(async (req, res) => {
    if (!req.file) {
        throw new ErrorHandler(400, 'CSV file is required');
    }

    try {
        const validation = await LeadServices.validateCSVFormat(req.file.path, 10);
        
        // Clean up temp file after validation
        cleanupTempFile(req.file.path);
        
        sendResponse(res, validation, 'CSV validation completed', 200);
    } catch (error) {
        // Clean up temp file on error
        cleanupTempFile(req.file.path);
        throw error;
    }
});

// Upload CSV file and start processing
const uploadCSV = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    let { column_mapping } = req.body;

    if (!req.file) {
        throw new ErrorHandler(400, 'CSV file is required');
    }

    // Parse column mapping
    let mappings;
    try {
        mappings = typeof column_mapping === 'string' 
            ? JSON.parse(column_mapping) 
            : column_mapping;
    } catch (error) {
        // Clean up uploaded file on error
        cleanupTempFile(req.file.path);
        throw new ErrorHandler(400, 'Invalid column mapping format');
    }

    // Validate mappings before processing
    const requiredFields = [
        'first_name', 'last_name', 'phone_number', 
        'address.street', 'address.city', 'address.state', 'address.zip', 'campaign_id'
    ];
        // sendResponse(res, { mappings }, 'CSV processing started successfully', 202);
    
    const mappedDbColumns = Object.values(mappings);
    const missingRequired = requiredFields.filter(field => !mappedDbColumns.includes(field));

    if (missingRequired.length > 0) {
        cleanupTempFile(req.file.path);
        throw new ErrorHandler(400, `Missing required column mappings: ${missingRequired.join(', ')}`);
    }

    try {
        const data = await LeadServices.processCSVUpload(
            req.file.path, 
            user_id, // Admin can process for any campaign
            mappings
        );

        sendResponse(res, { data }, 'CSV processing started successfully', 202);
    } catch (error) {
        // Clean up uploaded file on error
        cleanupTempFile(req.file.path);
        throw error;
    }
});

// Get CSV processing status by job ID
const getProcessingStatus = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { jobId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let jobStatus;
    if (isAdmin) {
        // Admin can check any job status
        const JobStatus = require('../../models/jobStatus.model');
        jobStatus = await JobStatus.findById(jobId);
        if (!jobStatus) {
            throw new ErrorHandler(404, 'Job not found');
        }
    } else {
        jobStatus = await LeadServices.getProcessingStatus(jobId, user_id);
    }

    sendResponse(res, { jobStatus }, 'Processing status retrieved successfully', 200);
});

// Get user's processing jobs (paginated)
const getProcessingJobs = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { page, limit } = getPaginationParams(req.query);
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let data;
    if (isAdmin) {
        // Admin can see all processing jobs
        const JobStatus = require('../../models/jobStatus.model');
        const skip = (page - 1) * limit;
        
        const [jobs, total] = await Promise.all([
            JobStatus.find({})
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            JobStatus.countDocuments({})
        ]);

        data = {
            data: jobs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } else {
        data = await LeadServices.getUserProcessingJobs(user_id, page, limit);
    }

    sendResponse(res, data, 'Processing jobs retrieved successfully', 200);
});

// Cancel processing job
const cancelProcessingJob = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { jobId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    const JobStatus = require('../../models/jobStatus.model');
    
    const filter = { _id: jobId };
    if (!isAdmin) {
        filter.userId = user_id;
    }

    const job = await JobStatus.findOne(filter);
    if (!job) {
        throw new ErrorHandler(404, 'Job not found or access denied');
    }

    if (job.status === 'completed' || job.status === 'failed') {
        throw new ErrorHandler(400, 'Cannot cancel completed or failed job');
    }

    // Update job status to cancelled
    await JobStatus.findByIdAndUpdate(jobId, {
        status: 'cancelled',
        message: 'Job cancelled by user',
        completedAt: new Date()
    });

    // Try to remove from queue (if still queued)
    try {
        const { csvProcessingQueue } = require('../../services/queue/csvProcessor');
        const queueJobs = await csvProcessingQueue.getJobs(['waiting', 'active']);
        const queueJob = queueJobs.find(qJob => qJob.data.jobId === jobId);
        if (queueJob) {
            await queueJob.remove();
        }
    } catch (error) {
        console.error('Error removing job from queue:', error);
    }

    sendResponse(res, null, 'Job cancelled successfully', 200);
});

// Retry failed processing job
const retryProcessingJob = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { jobId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    const JobStatus = require('../../models/jobStatus.model');
    
    const filter = { _id: jobId };
    if (!isAdmin) {
        filter.userId = user_id;
    }

    const job = await JobStatus.findOne(filter);
    if (!job) {
        throw new ErrorHandler(404, 'Job not found or access denied');
    }

    if (job.status !== 'failed') {
        throw new ErrorHandler(400, 'Only failed jobs can be retried');
    }

    // Reset job status
    await JobStatus.findByIdAndUpdate(jobId, {
        status: 'queued',
        message: 'Job retried by user',
        progress: 0,
        error: null,
        result: null,
        completedAt: null
    });

    // Add back to queue
    try {
        const { csvProcessingQueue } = require('../../services/queue/csvProcessor');
        await csvProcessingQueue.add('process-csv', {
            ...job.metadata,
            jobId: job._id,
            userId: job.userId
        }, {
            attempts: 3,
            backoff: 'exponential',
            delay: 5000
        });
    } catch (error) {
        console.error('Error adding job to queue:', error);
        throw new ErrorHandler(500, 'Failed to retry job');
    }

    sendResponse(res, null, 'Job retry started successfully', 200);
});

// Get leads by campaign ID
const getLeadsByCampaign = wrapAsync(async (req, res) => {
    const { campaignId } = req.params;
    const { page, limit } = getPaginationParams(req.query);
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    const filters = { campaign_id: campaignId };
    
    let data;
    if (isAdmin) {
        data = await LeadServices.getLeads(page, limit, filters);
    } else {
        // Verify user has access to this campaign
        const Campaign = require('../../models/campaign.model');
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign || campaign.user_id.toString() !== user_id.toString()) {
            throw new ErrorHandler(403, 'Access denied to this campaign');
        }
        
        data = await LeadServices.getLeads(page, limit, filters);
    }

    sendResponse(res, data, 'Campaign leads fetched successfully', 200);
});

// Bulk update leads
const bulkUpdateLeads = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    const { leadIds, updateData } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        throw new ErrorHandler(400, 'Lead IDs array is required');
    }

    if (!updateData || Object.keys(updateData).length === 0) {
        throw new ErrorHandler(400, 'Update data is required');
    }

    const filter = { _id: { $in: leadIds } };
    if (!isAdmin) {
        filter.user_id = user_id;
    }

    const result = await Lead.updateMany(filter, {
        ...updateData,
        updatedAt: new Date()
    });

    sendResponse(res, { 
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount 
    }, 'Bulk update completed successfully', 200);
});

// Get lead statistics
const getLeadStats = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    const { campaignId } = req.query;

    let matchFilter = {};
    
    if (!isAdmin) {
        matchFilter.user_id = user_id;
    }
    
    if (campaignId) {
        matchFilter.campaign_id = campaignId;
    }

    const stats = await Lead.aggregate([
        { $match: matchFilter },
        {
            $group: {
                _id: null,
                totalLeads: { $sum: 1 },
                activeLeads: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                },
                contactedLeads: {
                    $sum: { $cond: [{ $eq: ["$status", "contacted"] }, 1, 0] }
                },
                convertedLeads: {
                    $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] }
                },
                leadsThisMonth: {
                    $sum: {
                        $cond: [
                            {
                                $gte: [
                                    "$createdAt",
                                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const result = stats[0] || {
        totalLeads: 0,
        activeLeads: 0,
        contactedLeads: 0,
        convertedLeads: 0,
        leadsThisMonth: 0
    };

    sendResponse(res, { stats: result }, 'Lead statistics retrieved successfully', 200);
});

// Export leads to CSV
const exportLeads = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    const { campaignId, status, format = 'csv' } = req.query;

    let filter = {};
    if (!isAdmin) {
        filter.user_id = user_id;
    }
    if (campaignId) {
        filter.campaign_id = campaignId;
    }
    if (status) {
        filter.status = status;
    }

    const leads = await Lead.find(filter)
        .populate('campaign_id', 'name campaign_id')
        .populate('address.state', 'name abbreviation')
        .lean();

    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=leads-export.json');
        res.json(leads);
    } else {
        // CSV export
        const csv = require('csv-writer').createObjectCsvStringifier({
            header: [
                { id: 'lead_id', title: 'Lead ID' },
                { id: 'first_name', title: 'First Name' },
                { id: 'last_name', title: 'Last Name' },
                { id: 'email', title: 'Email' },
                { id: 'phone_number', title: 'Phone' },
                { id: 'address.full_address', title: 'Address' },
                { id: 'address.city', title: 'City' },
                { id: 'address.state.abbreviation', title: 'State' },
                { id: 'address.zip_code', title: 'Zip Code' },
                { id: 'status', title: 'Status' },
                { id: 'createdAt', title: 'Created At' }
            ]
        });

        const csvString = csv.getHeaderString() + csv.stringifyRecords(leads);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
        res.send(csvString);
    }
});

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    uploadCSV,
    validateCSV,
    getProcessingStatus,
    getProcessingJobs,
    cancelProcessingJob,
    retryProcessingJob,
    getLeadsByCampaign,
    bulkUpdateLeads,
    getLeadStats,
    exportLeads
};