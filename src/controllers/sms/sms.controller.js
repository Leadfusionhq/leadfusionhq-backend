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
    limit: limit ? parseInt(limit) : 100,
    skip: skip ? parseInt(skip) : 0,
    fromDate: fromDate ? Number(fromDate) : null,
    toDate: toDate ? Number(toDate) : null,
    toNumber,
    fromNumber,
    type,
    sort,
    search
  };

  const result = await smsService.listSentSms(opts);
  sendResponse(res, result, "Sent SMS list fetched successfully", 200);
});

module.exports = {
  sendSMS,
  listSentSms,
};
