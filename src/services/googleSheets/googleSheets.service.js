// services/googleSheets/googleSheets.service.js
// ─────────────────────────────────────────────────────────────────────────────
// Reusable Google Sheets integration service.
// Auth: Google Service Account credentials stored as ENV variables.
//
// Required ENV:
//   SPREADSHEET_ID      – target spreadsheet ID
//   SERVICE_EMAIL       – service-account client_email
//   GOOGLE_PRIVATE_KEY  – service-account private_key  (PEM, newlines as \n)
//
// Usage:
//   const GoogleSheetsService = require('./googleSheets.service');
//   await GoogleSheetsService.appendRow('Leads', ['val1', 'val2', ...]);
// ─────────────────────────────────────────────────────────────────────────────

const { google } = require('googleapis');
const { logger } = require('../../utils/logger');
const mongoose = require('mongoose');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// ─── Business Rules: Campaign Whitelist ──────────────────────────────────────
const ALLOWED_CAMPAIGN_IDS = [
  '68de7d90e1c60ebbb1f16637', // New York Campaign
];

// ─── Build Auth Client (lazy-singleton) ──────────────────────────────────────
let _authClient = null;

const getAuthClient = () => {
  if (_authClient) return _authClient;

  const clientEmail = process.env.SERVICE_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    // 1. Remove wrapping quotes if present (at start and end of the full string)
    privateKey = privateKey.trim().replace(/^"/, '').replace(/"$/, '');
    // 2. Handle literal \n as well as actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!clientEmail || !privateKey) {
    throw new Error(
      '[GoogleSheets] Missing credentials. Set SERVICE_EMAIL and GOOGLE_PRIVATE_KEY in .env'
    );
  }

  _authClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
  return _authClient;
};

// ─── Get Sheets API instance ──────────────────────────────────────────────────
const getSheetsApi = async () => {
  const auth = getAuthClient();
  // No need to call authorize() explicitly; the library handles it on the first request
  return google.sheets({ version: 'v4', auth });
};

// ─── Ensure a sheet/tab exists, create it if not ─────────────────────────────
/**
 * @param {object} sheetsApi - authenticated sheets API instance
 * @param {string} spreadsheetId
 * @param {string} sheetName
 */
const ensureSheetExists = async (sheetsApi, spreadsheetId, sheetName) => {
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets.find(
    (s) => s.properties.title === sheetName
  );

  if (!existing) {
    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: sheetName },
            },
          },
        ],
      },
    });
    logger.info(`[GoogleSheets] Created new sheet tab: "${sheetName}"`);
  }
};

/**
 * Sanitizes a string for use as a Google Sheets tab name.
 * Tab names cannot contain: / \ ? * : [ ] '
 * and must be between 1 and 100 characters.
 */
const sanitizeSheetName = (name) => {
  if (!name) return 'Unknown Campaign';
  // Remove disallowed characters
  let sanitized = name.replace(/[\/\\\?\* :\[\]']/g, ' ');
  // Multiple spaces to single space
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  // Max 50 chars for safety
  return sanitized.substring(0, 50) || 'Unnamed';
};

/**
 * Checks if a Lead ID already exists in Col B of the given sheet.
 */
const isLeadInSheet = async (sheetsApi, spreadsheetId, sheetName, leadId) => {
  try {
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!B:B`, // Lead ID column
    });
    const rows = response.data.values || [];
    // Skip header and check for leadId
    return rows.some((row) => row[0] === leadId);
  } catch (err) {
    // If sheet is empty or error reading, assume it doesn't exist
    return false;
  }
};


// ─── Append a single row ──────────────────────────────────────────────────────
/**
 * Appends one row of values to the given sheet/tab.
 *
 * @param {string}   sheetName   - tab name inside the spreadsheet
 * @param {Array}    values      - flat array of cell values
 * @param {string}  [spreadsheetId] - override the ENV spreadsheet ID
 * @returns {Promise<object>}    Google API response
 */
const appendRow = async (sheetName, values, spreadsheetId) => {
  const ssId = spreadsheetId || process.env.SPREADSHEET_ID;

  if (!ssId) {
    throw new Error('[GoogleSheets] SPREADSHEET_ID is not set in .env');
  }

  const sheetsApi = await getSheetsApi();
  await ensureSheetExists(sheetsApi, ssId, sheetName);

  const response = await sheetsApi.spreadsheets.values.append({
    spreadsheetId: ssId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [values],
    },
  });

  logger.info(`[GoogleSheets] Row appended to "${sheetName}"`, {
    spreadsheetId: ssId,
    updatedRange: response.data.updates?.updatedRange,
    updatedRows: response.data.updates?.updatedRows,
  });

  return response.data;
};

// ─── Append multiple rows at once ────────────────────────────────────────────
/**
 * Batch append multiple rows.
 *
 * @param {string}   sheetName
 * @param {Array[]}  rows        - array of row arrays
 * @param {string}  [spreadsheetId]
 */
const appendRows = async (sheetName, rows, spreadsheetId) => {
  const ssId = spreadsheetId || process.env.SPREADSHEET_ID;

  if (!ssId) {
    throw new Error('[GoogleSheets] SPREADSHEET_ID is not set in .env');
  }

  if (!rows?.length) return null;

  const sheetsApi = await getSheetsApi();
  await ensureSheetExists(sheetsApi, ssId, sheetName);

  const response = await sheetsApi.spreadsheets.values.append({
    spreadsheetId: ssId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });

  logger.info(`[GoogleSheets] ${rows.length} row(s) batch-appended to "${sheetName}"`, {
    spreadsheetId: ssId,
    updatedRange: response.data.updates?.updatedRange,
  });

  return response.data;
};

// ─── Write header row if sheet is empty ──────────────────────────────────────
/**
 * Writes a header row only if row 1 is empty.
 *
 * @param {string}  sheetName
 * @param {Array}   headers
 * @param {string} [spreadsheetId]
 */
const ensureHeaders = async (sheetName, headers, spreadsheetId) => {
  const ssId = spreadsheetId || process.env.SPREADSHEET_ID;
  const sheetsApi = await getSheetsApi();
  await ensureSheetExists(sheetsApi, ssId, sheetName);

  const existing = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: ssId,
    range: `${sheetName}!A1:Z1`,
  });

  if (!existing.data.values || existing.data.values.length === 0) {
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId: ssId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
    logger.info(`[GoogleSheets] Header row written to "${sheetName}"`);
  }
};

// ─── High-level: Append Lead row ─────────────────────────────────────────────
/**
 * Appends a lead record to the "Leads" sheet with a standard column layout.
 * Auto-creates headers on first run.
 *
 * @param {object} leadData
 * @param {string} [sheetName='Leads']
 * @param {string} [spreadsheetId]
 */
const LEAD_HEADERS = [
  'Date',
  'Lead ID',
  'Full Name',
  'Phone',
  'Full Address',
];

const appendLead = async (leadData, sheetName = 'Leads', spreadsheetId) => {
  const ssId = spreadsheetId || process.env.SPREADSHEET_ID;

  // 1. Ensure sheet exists and has headers
  await ensureHeaders(sheetName, LEAD_HEADERS, ssId);

  // 2. Duplicacy Check (Requirement: No duplicacy)
  const sheetsApi = await getSheetsApi();
  const exists = await isLeadInSheet(sheetsApi, ssId, sheetName, leadData.lead_id);
  if (exists) {
    logger.info(`[GoogleSheets] Lead ${leadData.lead_id} already exists in "${sheetName}". Skipping.`);
    return { skipped: true, reason: 'Duplicate' };
  }

  const row = [
    new Date().toISOString(),                      // Date
    leadData.lead_id || '',                        // Lead ID
    leadData.full_name || '',                      // Full Name
    leadData.phone_number || leadData.phone || '', // Phone
    leadData.full_address || '',                   // Full Address
  ];

  return appendRow(sheetName, row, ssId);
};



/**
 * High-level: Fetches a lead by ID, populates it, and appends to Google Sheet.
 * Useful for fire-and-forget sync from services or controllers.
 *
 * @param {string} leadId
 */
const syncLeadById = async (leadId) => {
  try {
    const Lead = mongoose.model('Lead'); // Lazy load to avoid potential circular dependencies
    const lead = await Lead.findById(leadId)
      .populate('campaign_id', 'name')
      .populate('address.state', 'name abbreviation')
      .lean();

    if (!lead) {
      logger.warn(`[GoogleSheets] syncLeadById: Lead not found ${leadId}`);
      return;
    }

    // ── Whitelist Check: Only sync specific campaigns (Requirement: 10/10) ──
    const currentCampaignId = lead.campaign_id?._id?.toString() || lead.campaign_id?.toString();
    if (!ALLOWED_CAMPAIGN_IDS.includes(currentCampaignId)) {
      logger.info(`[GoogleSheets] Sync skipped for Lead ${leadId}: Campaign ${currentCampaignId} not in whitelist.`);
      return { skipped: true, reason: 'Campaign filter' };
    }

    const leadData = {
      lead_id: lead.lead_id,
      full_name: [lead.first_name, lead.last_name].filter(Boolean).join(' '),
      phone_number: lead.phone_number || lead.phone || '',
      full_address: lead.address?.full_address || '',
      campaign_name: lead.campaign_id?.name || 'N/A',
    };


    // ── Sync to Master Sheet ──
    await appendLead(leadData, 'Leads');

    // ── Sync to Campaign Specific Sheet ──
    const campaignTabName = sanitizeSheetName(leadData.campaign_name);
    if (campaignTabName && campaignTabName !== 'Leads') {
      await appendLead(leadData, campaignTabName);
    }

    return { success: true };
  } catch (err) {
    logger.error(`[GoogleSheets] Failed to sync lead ${leadId} to Google Sheets`, err);
    // Don't re-throw if it's fire-and-forget, but logging is essential
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  appendRow,
  appendRows,
  ensureHeaders,
  appendLead,
  syncLeadById,
  LEAD_HEADERS,
};
