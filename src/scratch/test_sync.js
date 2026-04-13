require('dotenv').config();
require('../config/mongoose').connect();
require('../models/lead.model');
require('../models/campaign.model');
require('../models/state.model');
const GoogleSheetsService = require('../services/googleSheets/googleSheets.service');

const leadId = '6989b0591ea79c2c9bd511e2'; // New lead from Testing Camp PAYG

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
