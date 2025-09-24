const { NotifyreAPI, RecipientType } = require('notifyre-nodejs-sdk');
const { ErrorHandler } = require('../../utils/error-handler');
const fetchWrapper = require('../../utils/fetchWrapper');

class SmsServices {
  constructor() {
    this.apiKey = process.env.NOTIFYRE_API_KEY;
    this.baseUrl = process.env.NOTIFYRE_BASE_URL || 'https://api.notifyre.com/v2';
    
    if (!this.apiKey) {
      throw new ErrorHandler('NOTIFYRE_API_KEY is not configured', 500);
    }

    this.notifyreAPI = new NotifyreAPI(this.apiKey);
    this.smsService = this.notifyreAPI.getSmsService();
  }

  async sendSMS(smsData) {
    try {
      const { to, message, from } = smsData;

      if (!to || !message) {
        throw new ErrorHandler('Phone number(s) and message are required', 400);
      }

      const phoneNumbers = Array.isArray(to) ? to : [to];
      
      const validPhoneNumbers = phoneNumbers.filter(phone => 
        phone && typeof phone === 'string' && phone.trim().length > 0
      );

      if (validPhoneNumbers.length === 0) {
        throw new ErrorHandler('No valid phone numbers provided', 400);
      }

      const results = [];
      
      for (const phoneNumber of validPhoneNumbers) {
        try {
          const response = await this.smsService.submitSms({
            body: message.trim(),
            from: from || '',
            recipients: [
              { type: RecipientType.SmsNumber, value: phoneNumber }
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
  }

  async sendBulkSMS(smsArray) {
    try {
      if (!Array.isArray(smsArray) || smsArray.length === 0) {
        throw new ErrorHandler('SMS array is required and cannot be empty', 400);
      }

      const results = await Promise.allSettled(
        smsArray.map(smsData => this.sendSMS(smsData))
      );

      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      return {
        success: failed.length === 0,
        total: smsArray.length,
        successful: successful.length,
        failed: failed.length,
        results: results
      };

    } catch (error) {
      console.error('Bulk SMS sending failed:', error.message);
      throw new ErrorHandler(`Failed to send bulk SMS: ${error.message}`, 500);
    }
  }

  async sendLeadAssignSMS(leadSmsData) {
    try {
      const {
        to,
        name,
        leadName,
        assignedBy,
        leadDetailsUrl,
        campaignName
      } = leadSmsData;

      const message = `Hi ${name}, a new lead "${leadName}" has been assigned to your campaign "${campaignName}" by ${assignedBy}. View details: ${leadDetailsUrl}`;

      return await this.sendSMS({
        to,
        message,
        from: process.env.SMS_SENDER_ID || 'LeadSystem'
      });

    } catch (error) {
      console.error('Lead assignment SMS failed:', error.message);
      throw error;
    }
  }

  async getSentMessagesHistory() {
    try {
      const response = await this.smsService.listSentSms({
      });

      console.log('Sent SMS History:', response);
      return response.payload.smsMessages;
    } catch (error) {
      console.error('Failed to retrieve sent messages:', error);
      throw new ErrorHandler(`Failed to retrieve sent messages: ${error.message}`, 500);
    }
  }

  async getSMSStatus(messageId) {
    try {
      if (!messageId) {
        throw new ErrorHandler('Message ID is required', 400);
      }

      const response = await this.smsService.listSentSms({
        messageId: messageId
      });

      return response;

    } catch (error) {
      console.error('Failed to get SMS status:', error.message);
      throw new ErrorHandler(`Failed to get SMS status: ${error.message}`, 500);
    }
  }

  async getBalance() {
    try {
      const response = await fetchWrapper(
        'GET',
        `${this.baseUrl}/account/balance`,
        null,
        this.apiKey
      );

      return response;

    } catch (error) {
      console.error('Failed to get account balance:', error.message);
      throw new ErrorHandler(`Failed to get account balance: ${error.message}`, 500);
    }
  }

  async getSenderIds() {
    try {
      const response = await fetchWrapper(
        'GET',
        `${this.baseUrl}/account/senders`,
        null,
        this.apiKey
      );

      return response;

    } catch (error) {
      console.error('Failed to get sender IDs:', error.message);
      throw new ErrorHandler(`Failed to get sender IDs: ${error.message}`, 500);
    }
  }
}

module.exports = new SmsServices();
