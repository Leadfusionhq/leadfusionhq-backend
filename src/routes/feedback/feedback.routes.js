const express = require('express');
const feedbackRouter = express.Router();
const FeedbackController = require('../../controllers/feedback/feedback.controller');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles');
const CONSTANT_ENUM = require('../../helper/constant-enums');
const FeedbackSchema = require('../../request-schemas/feedback.schema');
const { celebrate } = require('celebrate');

const API = {
    // Admin routes
    GET_ALL_FEEDBACKS: '/',
    CREATE_FEEDBACK: '/',
    GET_FEEDBACK_BY_ID: '/:feedbackId',
    UPDATE_FEEDBACK: '/:feedbackId',
    DELETE_FEEDBACK: '/:feedbackId',
};

// Apply auth and role middleware to all protected feedback routes
feedbackRouter.use(
    checkAuth
);



// Public route - no authentication required
feedbackRouter.post(
    API.CREATE_FEEDBACK, 
    celebrate(FeedbackSchema.createFeedback),
    FeedbackController.createFeedback
);



// Admin routes
feedbackRouter.get(
    API.GET_ALL_FEEDBACKS, 
    celebrate(FeedbackSchema.getAllFeedbacks),
    FeedbackController.getAllFeedbacks
);

feedbackRouter.get(
    API.GET_FEEDBACK_BY_ID, 
    celebrate(FeedbackSchema.getFeedbackById),
    FeedbackController.getFeedbackById
);

feedbackRouter.put(
    API.UPDATE_FEEDBACK, 
    celebrate(FeedbackSchema.updateFeedback),
    FeedbackController.updateFeedback
);

feedbackRouter.delete(
    API.DELETE_FEEDBACK, 
    celebrate(FeedbackSchema.getFeedbackById),
    FeedbackController.deleteFeedback
);

module.exports = feedbackRouter;