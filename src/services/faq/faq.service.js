const { FAQ } = require('../../models/faq.model');
const { ErrorHandler } = require('../../utils/error-handler');

const createFAQService = async (faqData, userId) => {
  const { question, answer } = faqData;

  // Check if FAQ with same question already exists
  const existingFAQ = await FAQ.findOne({ 
    question: { $regex: new RegExp(`^${question}$`, 'i') }, 
    isActive: true 
  });
  
  if (existingFAQ) {
    throw new ErrorHandler(409, 'FAQ with this question already exists');
  }

  const newFAQ = await FAQ.create({
    question,
    answer,
    createdBy: userId,
  });

  return await FAQ.findById(newFAQ._id).populate('createdBy', 'name email');
};

const getAllFAQsService = async (options = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    isActive = true,
    includeInactive = false 
  } = options;

  const skip = (page - 1) * limit;
  
  // Build query
  const query = {};
  
  if (!includeInactive) {
    query.isActive = isActive;
  }

  if (search) {
    query.$or = [
      { question: { $regex: search, $options: 'i' } },
      { answer: { $regex: search, $options: 'i' } }
    ];
  }

  // Get total count for pagination
  const total = await FAQ.countDocuments(query);
  
  // Get FAQs with pagination
  const faqs = await FAQ.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    faqs,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  };
};

const getFAQByIdService = async (faqId) => {
  const faq = await FAQ.findById(faqId)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
    
  if (!faq) {
    throw new ErrorHandler(404, 'FAQ not found');
  }
  
  return faq;
};

const updateFAQService = async (faqId, updateData, userId) => {
  const faq = await FAQ.findById(faqId);
  
  if (!faq) {
    throw new ErrorHandler(404, 'FAQ not found');
  }

  // If updating question, check for duplicates
  if (updateData.question && updateData.question !== faq.question) {
    const existingFAQ = await FAQ.findOne({
      _id: { $ne: faqId },
      question: { $regex: new RegExp(`^${updateData.question}$`, 'i') },
      isActive: true
    });
    
    if (existingFAQ) {
      throw new ErrorHandler(409, 'FAQ with this question already exists');
    }
  }

  const updatedFAQ = await FAQ.findByIdAndUpdate(
    faqId,
    { ...updateData, updatedBy: userId },
    { new: true }
  ).populate('createdBy', 'name email')
   .populate('updatedBy', 'name email');

  return updatedFAQ;
};

const softDeleteFAQService = async (faqId, userId) => {
  const faq = await FAQ.findById(faqId);
  
  if (!faq) {
    throw new ErrorHandler(404, 'FAQ not found');
  }

  const updatedFAQ = await FAQ.findByIdAndUpdate(
    faqId,
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  return updatedFAQ;
};

const hardDeleteFAQService = async (faqId) => {
  const faq = await FAQ.findById(faqId);
  
  if (!faq) {
    throw new ErrorHandler(404, 'FAQ not found');
  }

  await FAQ.findByIdAndDelete(faqId);
  return { message: 'FAQ permanently deleted' };
};

const toggleFAQStatusService = async (faqId, userId) => {
  const faq = await FAQ.findById(faqId);
  
  if (!faq) {
    throw new ErrorHandler(404, 'FAQ not found');
  }

  const updatedFAQ = await FAQ.findByIdAndUpdate(
    faqId,
    { isActive: !faq.isActive, updatedBy: userId },
    { new: true }
  ).populate('createdBy', 'name email')
   .populate('updatedBy', 'name email');

  return updatedFAQ;
};

// Public service - get only active FAQs without admin details
const getPublicFAQsService = async (options = {}) => {
  const { limit = 50, search } = options;
  
  const query = { isActive: true };
  
  if (search) {
    query.$or = [
      { question: { $regex: search, $options: 'i' } },
      { answer: { $regex: search, $options: 'i' } }
    ];
  }

  const faqs = await FAQ.find(query, { question: 1, answer: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .limit(limit);

  return faqs;
};

module.exports = {
  createFAQService,
  getAllFAQsService,
  getFAQByIdService,
  updateFAQService,
  softDeleteFAQService,
  hardDeleteFAQService,
  toggleFAQStatusService,
  getPublicFAQsService,
};