const { NotifyreAPI, RecipientType } = require('notifyre-nodejs-sdk');
const { ErrorHandler } = require('../../utils/error-handler');
const { wrapAsync } = require('../../utils/wrap-async');
const notifyreAPI = new NotifyreAPI(process.env.NOTIFYRE_API_KEY); 
const smsService = notifyreAPI.getSmsService();

  const sendSms = async(smsData) => {
    try {
      const { to, message, from } = smsData;

      if (!to || !message) {
        throw new ErrorHandler('Phone number(s) and message are required', 400);
      }

      // const phoneNumbers = Array.isArray(to) ? to : [to];
      const phoneNumbers = Array.isArray(to)
      ? to
      : to.split(',').map(num => num.replace(/-/g, '').trim()).filter(num => num.length > 0);
      
      const validPhoneNumbers = phoneNumbers.filter(phone => 
        phone && typeof phone === 'string' && phone.trim().length > 0
      );

      if (validPhoneNumbers.length === 0) {
        throw new ErrorHandler('No valid phone numbers provided', 400);
      }

      const results = [];
      
      for (const phoneNumber of validPhoneNumbers) {
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
        try {
          const response = await smsService.submitSms({
            body: message.trim(),
            from: from || '',
            recipients: [
              { type: RecipientType.SmsNumber, value: formattedNumber }
            ],
            scheduledDate: null,
            addUnsubscribeLink: false,
            callbackUrl: process.env.SMS_CALLBACK_URL || '',
            metadata: {
              source: 'leadfusion-backend'
            },
            campaignName: 'leadfusion-sms'
          });

          console.log('SMS sent successfully:', response);
          results.push({
            phone: phoneNumber,
            success: true,
            messageId: response.id || response.messageId,
            response: response
          });
        } catch (error) {
          console.error('Failed to send SMS to', phoneNumber, ':', error);
          results.push({
            phone: phoneNumber,
            success: false,
            error: error.message
          });
        }
      }

      const successfulSends = results.filter(r => r.success);
      const failedSends = results.filter(r => !r.success);

      return {
        success: failedSends.length === 0,
        total: validPhoneNumbers.length,
        successful: successfulSends.length,
        failed: failedSends.length,
        results: results,
        sentTo: successfulSends.map(r => r.phone),
        count: successfulSends.length
      };

    } catch (error) {
        console.error('SMS sending failed:', error.message);
      throw new ErrorHandler(`Failed to send SMS: ${error.message}`, 500);
    }
  };

module.exports = {
  sendSms
}

