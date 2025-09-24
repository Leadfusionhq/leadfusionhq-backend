const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const smsService = require('../../services/sms/sms.service');
const smsTestService = require('../../services/sms/smsTest.service');

/**
 * Send SMS to a single recipient
 */
const sendSMS = wrapAsync(async (req, res) => {
  const { to, message, from } = req.body;

  const result = await smsTestService.sendSMS({ to, message, from });
  
  sendResponse(res, result, "SMS sent successfully", 200);
});

/**
 * Send bulk SMS
 */
const sendBulkSMS = wrapAsync(async (req, res) => {
  const { smsArray } = req.body;

  const result = await smsService.sendBulkSMS(smsArray);
  
  sendResponse(res, result, "Bulk SMS processed", 200);
});

/**
 * Send lead assignment SMS
 */
const sendLeadAssignSMS = wrapAsync(async (req, res) => {
  const leadSmsData = req.body;

  const result = await smsService.sendLeadAssignSMS(leadSmsData);
  
  sendResponse(res, result, "Lead assignment SMS sent successfully", 200);
});

/**
 * Get SMS delivery status
 */
const getSMSStatus = wrapAsync(async (req, res) => {
  const { messageId } = req.params;

  const result = await smsService.getSMSStatus(messageId);
  
  sendResponse(res, result, "SMS status retrieved successfully", 200);
});

module.exports = {
  sendSMS,
  sendBulkSMS,
  sendLeadAssignSMS,
  getSMSStatus
};
