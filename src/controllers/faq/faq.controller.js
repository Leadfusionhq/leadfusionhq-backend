
const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const FAQServices = require('../../services/faq/faq.service');

const createFAQ = wrapAsync(async (req, res) => {
    const faqData = req.body;
    const userId = req.user.id;
  
    const faq = await FAQServices.createFAQService(faqData, userId);
    
    sendResponse(res, { faq }, 'FAQ created successfully', 201);
  });

  
  const getAllFAQs = wrapAsync(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
      includeInactive: req.query.includeInactive === 'true',
    };
  
    const data = await FAQServices.getAllFAQsService(options);
    
    sendResponse(res, data, 'FAQs fetched successfully', 200);
  });

  const getFAQById = wrapAsync(async (req, res) => {
    const { faqId } = req.params;
    
    const faq = await FAQServices.getFAQByIdService(faqId);
    
    sendResponse(res, { faq }, 'FAQ fetched successfully', 200);
  });

  
  const updateFAQ = wrapAsync(async (req, res) => {
    const { faqId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
  
    const faq = await FAQServices.updateFAQService(faqId, updateData, userId);
    
    sendResponse(res, { faq }, 'FAQ updated successfully', 200);
  });

  const deleteFAQ = wrapAsync(async (req, res) => {
    const { faqId } = req.params;
    const userId = req.user.id;
    const { permanent } = req.query;
  
    if (permanent === 'true') {
      await FAQServices.hardDeleteFAQService(faqId);
      sendResponse(res, null, 'FAQ permanently deleted', 200);
    } else {
      const faq = await FAQServices.softDeleteFAQService(faqId, userId);
      sendResponse(res, { faq }, 'FAQ deactivated successfully', 200);
    }
  });

  const toggleFAQStatus = wrapAsync(async (req, res) => {
    const { faqId } = req.params;
    const userId = req.user.id;
  
    const faq = await FAQServices.toggleFAQStatusService(faqId, userId);
    
    const message = faq.isActive ? 'FAQ activated successfully' : 'FAQ deactivated successfully';
    sendResponse(res, { faq }, message, 200);
  });

  // Public endpoint - no authentication required
    const getPublicFAQs = wrapAsync(async (req, res) => {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search,
    };
  
    const faqs = await FAQServices.getPublicFAQsService(options);
    
    sendResponse(res, { faqs }, 'Public FAQs fetched successfully', 200);
  });
  
  module.exports = {
    createFAQ,
    getAllFAQs,
    getFAQById,
    updateFAQ,
    deleteFAQ,
    toggleFAQStatus,
    getPublicFAQs,
  };

