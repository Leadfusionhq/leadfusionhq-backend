const express = require('express');
const googleSheetsRouter = express.Router();
const GoogleSheetsController = require('../../controllers/googleSheets/googleSheets.controller');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles');
const CONSTANT_ENUM = require('../../helper/constant-enums');

// All Google Sheets routes are protected and restricted to ADMIN by default
googleSheetsRouter.use(
  checkAuth,
  authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN])
);

/**
 * @route   POST /api/sheets/row
 * @desc    Append a raw row to any sheet
 */
googleSheetsRouter.post('/row', GoogleSheetsController.appendSheetRow);

/**
 * @route   POST /api/sheets/rows
 * @desc    Append multiple rows to any sheet (batch)
 */
googleSheetsRouter.post('/rows', GoogleSheetsController.appendSheetRows);

/**
 * @route   POST /api/sheets/lead
 * @desc    Append a structured lead to the Leads sheet
 */
googleSheetsRouter.post('/lead', GoogleSheetsController.appendLeadToSheet);

module.exports = googleSheetsRouter;
