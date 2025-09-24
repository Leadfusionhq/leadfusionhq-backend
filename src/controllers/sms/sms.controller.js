const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const smsService = require('../../services/sms/sms.service');
const smsTestService = require('../../services/sms/smsTest.service');


const sendSMS = wrapAsync(async (req, res) => {
  const { to, message, from } = req.body;

  // const result = await smsTestService.sendSMS({ to, message, from });
  const result = await smsService.sendSms({to , message, from}); 
  
  sendResponse(res, result, "SMS sent successfully", 200);
});


module.exports = {
  sendSMS,
};
