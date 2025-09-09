const { Feedback } = require('../../models/feedback.model');
const { ErrorHandler } = require('../../utils/error-handler');

const createFeedbackService = async (feedbackData, userId) => {
  const { title, description } = feedbackData;

  const newFeedback = await Feedback.create({
    title,
    description,
    user_id: userId,
  });

  // Populate user data when creating feedback
  return await Feedback.findById(newFeedback._id).populate('user_id', 'name email');
};

const getAllFeedbacksService = async (options = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    search,
  } = options;

  const skip = (page - 1) * limit;
  
  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Get total count for pagination
  const total = await Feedback.countDocuments(query);
  
  // Get feedbacks with pagination and populate user data
  const feedbacks = await Feedback.find(query)
    .populate('user_id', 'name email') // Populate user details
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    feedbacks,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  };
};

const getFeedbackByIdService = async (feedbackId) => {
  const feedback = await Feedback.findById(feedbackId)
    .populate('user_id', 'name email'); // Populate user details
    
  if (!feedback) {
    throw new ErrorHandler(404, 'Feedback not found');
  }
  
  return feedback;
};

const updateFeedbackService = async (feedbackId, updateData) => {
  const feedback = await Feedback.findById(feedbackId);
  
  if (!feedback) {
    throw new ErrorHandler(404, 'Feedback not found');
  }

  const updatedFeedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    updateData,
    { new: true }
  ).populate('user_id', 'name email'); // Populate user details after update

  return updatedFeedback;
};

const deleteFeedbackService = async (feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);
  
  if (!feedback) {
    throw new ErrorHandler(404, 'Feedback not found');
  }

  await Feedback.findByIdAndDelete(feedbackId);
  return { message: 'Feedback deleted successfully' };
};

module.exports = {
  createFeedbackService,
  getAllFeedbacksService,
  getFeedbackByIdService,
  updateFeedbackService,
  deleteFeedbackService,
};