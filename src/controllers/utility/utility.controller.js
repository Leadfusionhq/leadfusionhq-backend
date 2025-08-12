const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const { ErrorHandler } = require('../../utils/error-handler');
const UtilityService = require('../../services/utility/utility.service');
const { getPaginationParams , getFinalPagination } = require('../../utils/pagination');

// POST /api/utilities
const createUtility = wrapAsync(async (req, res) => {
  const { name, state, type, city, phone, website } = req.body;

  if (!name || !state) {
    throw new ErrorHandler(400, 'Name and state are required');
  }

  const utility = await UtilityService.createUtility({ name, state, type, city, phone, website });

  sendResponse(res, utility, 'Utility created successfully', 201);
});

// GET /api/utilities
const getAllUtilities = wrapAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const result = await UtilityService.getAllUtilities(parseInt(page), parseInt(limit));
  sendResponse(res, result, 'Utilities fetched successfully', 200);
});

// GET /api/utilities/:id
const getUtilityById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const utility = await UtilityService.getUtilityById(id);
  if (!utility) throw new ErrorHandler(404, 'Utility not found');
  sendResponse(res, utility, 'Utility fetched successfully', 200);
});

const bulkCreateUtilities = wrapAsync(async (req, res) => {
    console.log('req.body',req.body)

    const utilities = req.body.utilities;
    if (!utilities || !utilities.length) throw new Error('Invalid or empty utilities array');


    const result = await UtilityService.bulkCreateUtilities(utilities);
    sendResponse(res, result, 'Utilities processed', 201);
});

const getUtilitiesByState = wrapAsync(async (req, res) => {
  const { stateId } = req.params;
  if (!stateId) throw new ErrorHandler(400, 'State ID is required');

  const { page, limit } = getFinalPagination(req.query);

  const utilities = await UtilityService.getUtilitiesByState(stateId, page, limit, limit === 0);
  sendResponse(res, utilities, 'Utilities fetched by state successfully', 200);
});


module.exports = {
  createUtility,
  getAllUtilities,
  getUtilityById,
  bulkCreateUtilities,
  getUtilitiesByState,
};
