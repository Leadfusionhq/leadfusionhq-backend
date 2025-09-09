const express = require('express');
const faqRouter = express.Router();
const FAQController = require('../../controllers/faq/faq.controller');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles');
const CONSTANT_ENUM = require('../../helper/constant-enums');
const FAQSchema = require('../../request-schemas/faq.schema');
const { celebrate } = require('celebrate');

const API = {
    // Admin routes
    GET_ALL_FAQS: '/',
    CREATE_FAQ: '/',
    GET_FAQ_BY_ID: '/:faqId',
    UPDATE_FAQ: '/:faqId',
    DELETE_FAQ: '/:faqId',
    TOGGLE_FAQ_STATUS: '/:faqId/toggle',
    
    // Public routes
    PUBLIC_FAQS: '/public',
};

// Public route - no authentication required
faqRouter.get(API.PUBLIC_FAQS, FAQController.getAllFAQs);

// Apply auth and role middleware to all protected FAQ routes
faqRouter.use(
    checkAuth,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN])
);

// Admin routes
faqRouter.get(
    API.GET_ALL_FAQS, 
    celebrate(FAQSchema.getAllFAQs),
    FAQController.getAllFAQs
);

faqRouter.post(
    API.CREATE_FAQ, 
    celebrate(FAQSchema.createFAQ),
    FAQController.createFAQ
);

faqRouter.get(
    API.GET_FAQ_BY_ID, 
    celebrate(FAQSchema.getFAQById),
    FAQController.getFAQById
);

faqRouter.put(
    API.UPDATE_FAQ, 
    celebrate(FAQSchema.updateFAQ),
    FAQController.updateFAQ
);

faqRouter.delete(
    API.DELETE_FAQ, 
    celebrate(FAQSchema.getFAQById), // Same validation as get by ID
    FAQController.deleteFAQ
);

faqRouter.patch(
    API.TOGGLE_FAQ_STATUS, 
    celebrate(FAQSchema.getFAQById), // Same validation as get by ID
    FAQController.toggleFAQStatus
);

module.exports = faqRouter;