require('dotenv').config();
require('../config/mongoose').connect();
require('../models/lead.model');
require('../models/campaign.model');
require('../models/state.model');
const GoogleSheetsService = require('../services/googleSheets/googleSheets.service');

const leadId = '69dc8cb6d7f5176caaa98826'; // From the user's error logs

async function testSync() {
  try {
    console.log('Testing sync for lead:', leadId);
    const result = await GoogleSheetsService.syncLeadById(leadId);
    console.log('Sync result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Sync test failed:', err);
    process.exit(1);
  }
}

// Wait for mongo connection
setTimeout(testSync, 2000);
