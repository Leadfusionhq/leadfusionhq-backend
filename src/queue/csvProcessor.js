const Queue = require('bull'); // Correct import for bull
const Lead = require('../models/lead.model.js');
const Campaign = require('../models/campaign.model.js');
const { ErrorHandler } = require('../utils/error-handler');
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const JobStatus = require('../models/jobStatus.model');
const generateUniqueLeadId = require('../utils/idGenerator');
const { resolveStateAbbreviation } = require('../utils/stateResolver');
const NotificationServices = require('../services/notification/notification.service');

const csvProcessingQueue = new Queue('csv-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // Add these to prevent crash on connection failure
    retryStrategy: function (times) {
      // Retry connection every 10 seconds, max 20 seconds
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: null,
  },
});

// CRITICAL: Prevent unhandled error events from crashing the process
csvProcessingQueue.on('error', (err) => {
  console.error('🔴 CSV Queue Error (Redis might be down):', err.message);
});

csvProcessingQueue.on('failed', (job, err) => {
  console.error(`🔴 CSV Queue Job ${job.id} failed:`, err.message);
});

const addCSVProcessingJob = async (filePath, campaignId, userId, columnMapping) => {
  try {
    const jobStatus = await JobStatus.create({
      userId,
      jobType: 'csv_processing',
      status: 'queued',
      message: 'CSV processing job queued',
      metadata: { filePath, columnMapping },
    });

    // Check if queue client is ready/connected (simplified check)
    // Bull doesn't expose a simple 'isReady', but handling the error below is key.

    // Add job with timeout to prevent hanging if Redis is dead
    const job = await csvProcessingQueue.add({
      filePath,
      jobId: jobStatus._id,
      userId,
      columnMapping,
    }, {
      attempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
      backoff: { type: 'exponential', delay: 5000 },
      timeout: 10000, // Fail if not processed (or added) quickly
      removeOnComplete: true
    });

    return {
      jobId: jobStatus._id,
      queueJobId: job.id,
    };
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to add CSV processing job');
  }
};

const getJobStatus = async (jobId) => {
  const jobStatus = await JobStatus.findById(jobId).lean();
  if (!jobStatus) {
    throw new ErrorHandler(404, 'Job not found');
  }
  return jobStatus;
};

// Process CSV job
csvProcessingQueue.process(async (job) => {
  const { filePath, jobId, userId, columnMapping } = job.data;

  try {
    await JobStatus.findByIdAndUpdate(jobId, {
      status: 'processing',
      message: 'Processing CSV file',
      startedAt: new Date(),
    });

    const results = { processed: 0, errors: 0, errorDetails: [], totalRows: 0 };

    const stream = fs.createReadStream(filePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim(),
        skipEmptyLines: true,
      }));

    for await (const row of stream) {
      results.totalRows++;
      try {
        const campaignIdColumn = Object.keys(columnMapping).find(
          (key) => columnMapping[key] === 'campaign_id'
        );

        if (!campaignIdColumn || !row[campaignIdColumn]) {
          // if (campaignIdColumn && row[campaignIdColumn]) {
          throw new Error('Missing campaign_id in row');
        }
        // else {
        //   campaignIdValue = 'CMP-FJIOV'; 
        // }

        const campaign = await Campaign.findOne({
          $or: [
            { campaign_id: row[campaignIdColumn] },
            // { campaign_id: campaignIdValue },
          ],
        });

        if (!campaign) {
          throw new Error(`Invalid campaign_id: ${row[campaignIdColumn]}`);
        }

        const leadData = {
          user_id: userId,
          campaign_id: campaign._id,
          lead_id: row[Object.keys(columnMapping).find((key) => columnMapping[key] === 'lead_id')] || await generateUniqueLeadId(),
        };

        for (const csvHeader of Object.keys(columnMapping)) {
          const dbField = columnMapping[csvHeader];
          const value = row[csvHeader] || '';

          // Handle address.state
          if (dbField === 'address.state') {
            leadData['address'] = leadData['address'] || {};
            leadData['address']['state'] = await resolveStateAbbreviation(value);
          }
          // Handle other address fields
          else if (dbField.startsWith('address.')) {
            const addressField = dbField.split('.')[1];
            leadData['address'] = leadData['address'] || {};
            leadData['address'][addressField] = value;
          }
          // Other normal fields
          else if (dbField !== 'campaign_id' && dbField !== 'lead_id') {
            leadData[dbField] = value;
          }
        }

        await Lead.create(leadData);
        results.processed++;

        await JobStatus.findByIdAndUpdate(jobId, {
          progress: Math.round((results.processed / results.totalRows) * 100),
        });

      } catch (error) {
        results.errors++;
        results.errorDetails.push(`Row ${results.totalRows}: ${error.message}`);
      }
    }


    // Update job status
    await JobStatus.findByIdAndUpdate(jobId, {
      status: results.errors === 0 ? 'completed' : 'failed',
      message: results.errors === 0 ? 'CSV processing completed' : 'CSV processing completed with errors',
      result: results,
      completedAt: new Date(),
    });

    // Clean up file
    require('../middleware/csv-upload').cleanupTempFile(filePath);
  } catch (error) {
    await JobStatus.findByIdAndUpdate(jobId, {
      status: 'failed',
      message: error.message || 'Failed to process CSV',
      error: error.message,
      completedAt: new Date(),
    });
    require('../middleware/csv-upload').cleanupTempFile(filePath);
    throw error;
  }
});

module.exports = {
  csvProcessingQueue,
  addCSVProcessingJob,
  getJobStatus,
};