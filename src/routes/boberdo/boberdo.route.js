// src/routes/boberdo/boberdo.route.js
const express = require('express');
const boberDoRouter = express.Router();
const boberDoController = require('../../controllers/boberdo/boberdo.controller.js');
const BoberDoSchema = require('../../request-schemas/boberdo.schema.js');
const { celebrate } = require('celebrate');
const checkBoberdoApiKey = require('../../middleware/check-boberdo-api-key');

// Apply global API key check to all routes
boberDoRouter.use(checkBoberdoApiKey);

// Health check
boberDoRouter.get('/health', boberDoController.healthCheck);

// Post lead (main endpoint)
boberDoRouter.post(
    '/leads',
    celebrate(BoberDoSchema.postLead),
    boberDoController.postLead
);

module.exports = boberDoRouter;