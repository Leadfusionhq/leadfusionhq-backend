const express = require('express');
const smsRouter = express.Router();
const SmsController = require('../../controllers/sms/sms.controller');


const API = {
  INFO: '/',
  SEND_SMS: '/send',
  BULK_SEND: '/bulk-send',
  LEAD_ASSIGN: '/lead-assign',
  STATUS: '/status/:messageId',
  GET_ALL_SMS: '/get-all-sms'
};


smsRouter.post(API.SEND_SMS, SmsController.sendSMS);
// smsRouter.post(API.BULK_SEND, SmsController.sendBulkSMS);
// smsRouter.post(API.LEAD_ASSIGN, SmsController.sendLeadAssignSMS);
// smsRouter.get(API.STATUS, SmsController.getSMSStatus);

smsRouter.get(API.GET_ALL_SMS, SmsController.listSentSms);

smsRouter.get(API.INFO, (req, res) => {
  res.json({
    message: 'LeadFusionHQ SMS API',
    version: '1.0.0',
    siteURL: 'https://api.leadfusionhq.com',
    baseUrl: '/api/sms',
    endpoints: {
      send: 'POST /api/sms/send',
      bulkSend: 'POST /api/sms/bulk-send',
      leadAssign: 'POST /api/sms/lead-assign',
      status: 'GET /api/sms/status/:messageId',
      getAllSms: 'GET /api/sms/get-all-sms'
    },
    security: {
      auth: 'JWT authentication required',
      roles: 'Authorized users only'
    },
    features: [
      'Send individual or bulk SMS',
      'Lead assignment messaging',
      'Track delivery status',
      'JWT-secured routes',
      'Structured API responses'
    ]
  });
});

module.exports = smsRouter;
