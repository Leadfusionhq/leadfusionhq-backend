const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const smsService = require('../../services/sms/sms.service');
const smsTestService = require('../../services/sms/smsTest.service');


const sendSMS = wrapAsync(async (req, res) => {
  const { to, message, from } = req.body;

  // const result = await smsTestService.sendSMS({ to, message, from });
  const result = await smsService.sendSms({ to, message, from });

  sendResponse(res, result, "SMS sent successfully", 200);
});

const listSentSms = wrapAsync(async (req, res) => {
  const {
    limit,
    skip,
    fromDate,
    toDate,
    toNumber,
    fromNumber,
    type,
    sort,
    search
  } = req.query;

  const opts = {
    Limit: limit ? parseInt(limit) : 100,
    Skip: skip ? parseInt(skip) : 0,
    FromDate: fromDate ? Number(fromDate) : null,
    ToDate: toDate ? Number(toDate) : null,
    ToNumber: toNumber,
    FromNumber: fromNumber,
    Type: type,
    Sort: sort || 'desc',
    Search: search
  };

  const result = await smsService.listSentSms(opts);
  sendResponse(res, result, "Sent SMS list fetched successfully", 200);
});

const getSMSStatus = wrapAsync(async (req, res) => {
  const { messageId } = req.params;
  const result = await smsService.getSmsStatus(messageId);
  sendResponse(res, result, "SMS status fetched successfully", 200);
});

module.exports = {
  sendSMS,
  listSentSms,
  getSMSStatus,
};
