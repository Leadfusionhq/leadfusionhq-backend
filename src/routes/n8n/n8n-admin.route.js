// src/routes/n8n/n8n-admin.route.js
const express = require('express');
const n8nAdminRouter = express.Router();
const n8nAdminController = require('../../controllers/n8n/n8n-admin.controller');
const { celebrate, Joi, Segments } = require('celebrate');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles');
const CONSTANT_ENUM = require('../../helper/constant-enums');

// Admin only access
n8nAdminRouter.use(
    checkAuth,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN])
);

// Create or get API key
n8nAdminRouter.post( 
    '/api-key',
    celebrate({
        [Segments.BODY]: Joi.object({
            name: Joi.string().max(100).optional()
        })
    }),
    n8nAdminController.createApiKey
);

// Get current active API key
n8nAdminRouter.get(
    '/api-key',
    n8nAdminController.getApiKey
);

// Revoke current API key
n8nAdminRouter.delete(
    '/api-key',
    n8nAdminController.revokeApiKey
);

// Get API key statistics
n8nAdminRouter.get(
    '/api-key/stats',
    n8nAdminController.getApiKeyStats
);

module.exports = n8nAdminRouter;
