// controllers/googleSheets/googleSheets.controller.js
// ─────────────────────────────────────────────────────────────────────────────
// Controller exposing Google Sheets endpoints (admin / utility).
// Routes can be mounted under /api/sheets for manual testing or admin tools.
// ─────────────────────────────────────────────────────────────────────────────

const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const { ErrorHandler } = require('../../utils/error-handler');
const GoogleSheetsService = require('../../services/googleSheets/googleSheets.service');
const { logger } = require('../../utils/logger');

// ─── Append a raw row (generic / admin utility) ───────────────────────────────
/**
 * POST /api/sheets/row
 * Body: { sheetName: "Leads", values: ["col1", "col2", ...] }
 */
const appendSheetRow = wrapAsync(async (req, res) => {
  const { sheetName, values, spreadsheetId } = req.body;

  if (!sheetName || !Array.isArray(values) || values.length === 0) {
    throw new ErrorHandler(400, 'sheetName and a non-empty values[] array are required');
  }

  logger.info('[GoogleSheets Controller] appendSheetRow called', {
    sheetName,
    colCount: values.length,
    spreadsheetId: spreadsheetId || process.env.SPREADSHEET_ID,
  });

  const result = await GoogleSheetsService.appendRow(sheetName, values, spreadsheetId);

  sendResponse(res, { result }, 'Row appended to Google Sheet successfully', 200);
});

// ─── Append multiple rows (batch) ─────────────────────────────────────────────
/**
 * POST /api/sheets/rows
 * Body: { sheetName: "Leads", rows: [["a","b"],["c","d"]], spreadsheetId?: "..." }
 */
const appendSheetRows = wrapAsync(async (req, res) => {
  const { sheetName, rows, spreadsheetId } = req.body;

  if (!sheetName || !Array.isArray(rows) || rows.length === 0) {
    throw new ErrorHandler(400, 'sheetName and a non-empty rows[][] array are required');
  }

  logger.info('[GoogleSheets Controller] appendSheetRows called', {
    sheetName,
    rowCount: rows.length,
  });

  const result = await GoogleSheetsService.appendRows(sheetName, rows, spreadsheetId);

  sendResponse(res, { result }, `${rows.length} row(s) appended successfully`, 200);
});

// ─── Append a structured lead row ─────────────────────────────────────────────
/**
 * POST /api/sheets/lead
 * Body: { leadData: {...}, sheetName?: "Leads", spreadsheetId?: "..." }
 */
const appendLeadToSheet = wrapAsync(async (req, res) => {
  const { leadData, sheetName, spreadsheetId } = req.body;

  if (!leadData || typeof leadData !== 'object') {
    throw new ErrorHandler(400, 'leadData object is required');
  }

  logger.info('[GoogleSheets Controller] appendLeadToSheet called', {
    lead_id: leadData.lead_id,
    sheetName: sheetName || 'Leads',
  });

  const result = await GoogleSheetsService.appendLead(leadData, sheetName, spreadsheetId);

  sendResponse(res, { result }, 'Lead appended to Google Sheet successfully', 200);
});

module.exports = {
  appendSheetRow,
  appendSheetRows,
  appendLeadToSheet,
};
