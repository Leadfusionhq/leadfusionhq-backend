const express = require('express');
const faqRouter = express.Router();
const FAQController = require('../../controllers/faq/faq.controller');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles');
const CONSTANT_ENUM = require('../../helper/constant-enums');
const FAQSchema = require('../../request-schemas/faq.schema');
const { celebrate } = require('celebrate');

const API = {
    GET_ALL_FAQS: '/',
    CREATE_FAQ: '/',
    GET_FAQ_BY_ID: '/:faqId',
    UPDATE_FAQ: '/:faqId',
    DELETE_FAQ: '/:faqId',
    TOGGLE_FAQ_STATUS: '/:faqId/toggle',

    PUBLIC_FAQS: '/public',
};

faqRouter.get(API.PUBLIC_FAQS, FAQController.getAllFAQs);

faqRouter.use(
    checkAuth,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN])
);

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
    celebrate(FAQSchema.getFAQById),
    FAQController.deleteFAQ
);

faqRouter.patch(
    API.TOGGLE_FAQ_STATUS,
    celebrate(FAQSchema.getFAQById),
    FAQController.toggleFAQStatus
);

module.exports = faqRouter;