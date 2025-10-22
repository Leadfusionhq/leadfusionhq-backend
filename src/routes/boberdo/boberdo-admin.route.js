// src/routes/admin/boberdo-admin.route.js
const express = require('express');
const boberdoAdminRouter = express.Router();
const boberdoAdminController = require('../../controllers/boberdo/boberdo-admin.controller');
const { celebrate, Joi, Segments } = require('celebrate');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles');
const CONSTANT_ENUM = require('../../helper/constant-enums');

// Admin only access
boberdoAdminRouter.use(
    checkAuth,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN])
);

// Create or get API key
boberdoAdminRouter.post(
    '/api-key',
    celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().max(100).optional()
        })
    }),
    boberdoAdminController.createApiKey
);

// Get current active API key
boberdoAdminRouter.get(
    '/api-key',
    boberdoAdminController.getApiKey
);

// Revoke current API key
boberdoAdminRouter.delete(
    '/api-key',
    boberdoAdminController.revokeApiKey
);

// Get API key statistics
boberdoAdminRouter.get(
    '/api-key/stats',
    boberdoAdminController.getApiKeyStats
);

module.exports = boberdoAdminRouter;