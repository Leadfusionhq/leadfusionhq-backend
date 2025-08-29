const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const FeedbackServices = require('../../services/feedback/feedback.service');

const createFeedback = wrapAsync(async (req, res) => {
    const feedbackData = req.body;
    // Get userId from authenticated user or from request body for anonymous feedback
    // For reference, we need a valid ObjectId, so anonymous feedback might need special handling
    const userId = req.user?.id || req.body.user_id;
    
    if (!userId) {
        return sendResponse(res, null, 'User ID is required', 400);
    }
    
    const feedback = await FeedbackServices.createFeedbackService(feedbackData, userId);
    
    sendResponse(res, { feedback }, 'Feedback created successfully', 201);
});

const getAllFeedbacks = wrapAsync(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
    };
  
    const data = await FeedbackServices.getAllFeedbacksService(options);
    
    sendResponse(res, data, 'Feedbacks fetched successfully', 200);
});

const getFeedbackById = wrapAsync(async (req, res) => {
    const { feedbackId } = req.params;
    
    const feedback = await FeedbackServices.getFeedbackByIdService(feedbackId);
    
    sendResponse(res, { feedback }, 'Feedback fetched successfully', 200);
});

const updateFeedback = wrapAsync(async (req, res) => {
    const { feedbackId } = req.params;
    const updateData = req.body;
  
    const feedback = await FeedbackServices.updateFeedbackService(feedbackId, updateData);
    
    sendResponse(res, { feedback }, 'Feedback updated successfully', 200);
});

const deleteFeedback = wrapAsync(async (req, res) => {
    const { feedbackId } = req.params;
  
    await FeedbackServices.deleteFeedbackService(feedbackId);
    sendResponse(res, null, 'Feedback deleted successfully', 200);
});

module.exports = {
    createFeedback,
    getAllFeedbacks,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
};