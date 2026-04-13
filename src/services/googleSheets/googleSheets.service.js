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
  'Timestamp',
  'Lead ID',
  'First Name',
  'Last Name',
  'Email',
  'Phone',
  'Source / Campaign',
  'Status',
  'Payment Status',
  'State',
  'City',
  'Zip Code',
  'Lead Cost ($)',
  'Lead URL',
];

const appendLead = async (leadData, sheetName = 'Leads', spreadsheetId) => {
  const ssId = spreadsheetId || process.env.SPREADSHEET_ID;

  // Write headers if the sheet is brand new
  await ensureHeaders(sheetName, LEAD_HEADERS, ssId);

  const fullName = [leadData.first_name, leadData.last_name].filter(Boolean).join(' ');

  const row = [
    new Date().toISOString(),                                    // Timestamp
    leadData.lead_id || '',                                      // Lead ID
    leadData.first_name || '',                                   // First Name
    leadData.last_name || '',                                    // Last Name
    leadData.email || '',                                        // Email
    leadData.phone_number || leadData.phone || '',               // Phone
    leadData.campaign_name || leadData.campaign_id || '',        // Source / Campaign
    leadData.status || '',                                       // Status
    leadData.payment_status || '',                               // Payment Status
    leadData.address?.state || leadData.state || '',             // State
    leadData.address?.city || leadData.city || '',               // City
    leadData.address?.zip_code || leadData.zip_code || '',       // Zip Code
    leadData.lead_cost != null ? String(leadData.lead_cost) : '',// Lead Cost
    leadData.lead_url || '',                                     // Lead URL
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

    const leadData = {
      lead_id: lead.lead_id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || '',
      phone_number: lead.phone_number || lead.phone || '',
      campaign_name: lead.campaign_id?.name || 'N/A',
      status: lead.status,
      payment_status: lead.payment_status,
      state: lead.address?.state?.abbreviation || lead.address?.state?.name || '',
      city: lead.address?.city || '',
      zip_code: lead.address?.zip_code || '',
      lead_cost: lead.lead_cost,
      lead_url: `${process.env.UI_LINK}/dashboard/leads/${lead._id}`,
    };

    return await appendLead(leadData);
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
