const { NotifyreAPI, RecipientType } = require('notifyre-nodejs-sdk');

const notifyreAPI = new NotifyreAPI(process.env.NOTIFYRE_API_KEY); 
const smsService = notifyreAPI.getSmsService();


const sendSMS = async () => {
  try {
    const response = await smsService.submitSms({
      body: 'Hello Test!',
      from: '', 
      recipients: [
        { type: RecipientType.SmsNumber, value: '+918894548063' }  
      ],
      scheduledDate: null,
      addUnsubscribeLink: false,
      callbackUrl: 'https://mycallback.com/callback', 
      metadata: {
        Key: 'Value'
      },
      campaignName: 'sms-reference'
    });

    console.log('SMS sent successfully:', response);
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}


const getSentMessagesHistory = async () => {
  try {
    const response = await smsService.listSentSms({
    });

    console.log('Sent SMS History:', response);
    return response.payload.smsMessages;
  } catch (error) {
    console.error('Failed to retrieve sent messages:', error);
  }
};
module.exports = {
  sendSMS,
  getSentMessagesHistory,
 };