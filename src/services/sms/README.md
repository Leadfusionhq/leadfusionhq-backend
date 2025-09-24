# SMS Service Documentation

This SMS service provides a reusable interface for sending SMS notifications using Notifyre API.

## Setup

### Environment Variables

Add the following environment variables to your `.env` file:

```env
NOTIFYRE_API_KEY=your_notifyre_api_key_here
NOTIFYRE_BASE_URL=https://api.notifyre.com
NOTIFYRE_SENDER_ID=LEADFUSION
```

### Required Dependencies

The service uses the following dependencies (already included in package.json):
- `axios` - For HTTP requests
- Custom `ErrorHandler` utility for error management

## Usage Examples

### 1. Basic SMS Sending

```javascript
const smsService = require('../services/sms/sms.service');

// Send a simple SMS
try {
  const result = await smsService.sendSMS({
    to: '+1234567890',
    message: 'Hello! This is a test message from LeadFusion.',
    from: 'LEADFUSION'
  });
  console.log('SMS sent:', result);
} catch (error) {
  console.error('SMS failed:', error.message);
}
```

### 2. Send SMS to Multiple Recipients

```javascript
const smsService = require('../services/sms/sms.service');

// Send SMS to multiple numbers
try {
  const result = await smsService.sendSMS({
    to: ['+1234567890', '+0987654321'],
    message: 'Hello! This is a test message from LeadFusion.',
    from: 'LEADFUSION'
  });
  console.log('SMS sent:', result);
} catch (error) {
  console.error('SMS failed:', error.message);
}
```

### 3. Bulk SMS (Multiple Different Messages)

```javascript
const smsService = require('../services/sms/sms.service');

// Send bulk SMS with different messages
try {
  const smsArray = [
    {
      to: '+1234567890',
      message: 'Hello John! Your lead has been processed.',
      from: 'LEADFUSION'
    },
    {
      to: '+0987654321',
      message: 'Hello Jane! Your campaign is ready.',
      from: 'LEADFUSION'
    }
  ];
  
  const result = await smsService.sendBulkSMS(smsArray);
  console.log('Bulk SMS results:', result);
  console.log(`Success: ${result.successful}, Failed: ${result.failed}`);
} catch (error) {
  console.error('Bulk SMS failed:', error.message);
}
```

### 4. Lead Assignment SMS

```javascript
const smsService = require('../services/sms/sms.service');

// Send lead assignment notification
try {
  const result = await smsService.sendLeadAssignSMS({
    to: '+1234567890',
    name: 'John Doe',
    leadName: 'Jane Smith',
    assignedBy: 'Admin',
    leadDetailsUrl: 'https://app.leadfusion.com/leads/123',
    campaignName: 'Real Estate Q4'
  });
  console.log('Lead assignment SMS sent:', result);
} catch (error) {
  console.error('Lead assignment SMS failed:', error.message);
}
```

### 5. Check SMS Status

```javascript
const smsService = require('../services/sms/sms.service');

// Check SMS delivery status
try {
  const messageId = 'msg_123456789';
  const status = await smsService.getSMSStatus(messageId);
  console.log('SMS Status:', status);
} catch (error) {
  console.error('Status check failed:', error.message);
}
```

## Integration Examples

### In User Registration

```javascript
const { sendOTPInternal } = require('../controllers/sms/sms.controller');

const registerUser = async (userData) => {
  try {
    // Create user logic here...
    
    // Send welcome SMS with OTP
    const otp = generateOTP(); // Your OTP generation function
    await sendOTPInternal(
      userData.phoneNumber,
      otp,
      {
        template: `Welcome to LeadFusion! Your verification code is: ${otp}. Please verify your account within 10 minutes.`,
        expiryMinutes: 10
      }
    );
    
    // Store OTP in database for verification
    // ...
    
  } catch (error) {
    console.error('Registration SMS failed:', error);
    // Handle error appropriately
  }
};
```

### In Campaign Notifications

```javascript
const { sendNotificationSMSInternal } = require('../controllers/sms/sms.controller');

const notifyNewLead = async (userId, leadData) => {
  try {
    // Get user phone number from database
    const user = await User.findById(userId);
    
    if (user.smsNotifications && user.phoneNumber) {
      await sendNotificationSMSInternal(
        user.phoneNumber,
        'New Lead Alert',
        `New lead: ${leadData.name} (${leadData.email}) from campaign "${leadData.campaignName}".`,
        {
          type: 'lead_notification'
        }
      );
    }
  } catch (error) {
    console.error('Lead notification SMS failed:', error);
    // Don't throw error to avoid breaking main flow
  }
};
```

### In Password Reset

```javascript
const { sendSMSInternal } = require('../controllers/sms/sms.controller');

const sendPasswordResetSMS = async (phoneNumber, resetToken) => {
  try {
    const resetLink = `https://app.leadfusion.com/reset-password?token=${resetToken}`;
    const message = `Reset your LeadFusion password: ${resetLink}. This link expires in 1 hour.`;
    
    await sendSMSInternal(phoneNumber, message, {
      type: 'password_reset'
    });
  } catch (error) {
    console.error('Password reset SMS failed:', error);
    throw error; // Re-throw to handle in calling function
  }
};
```

## Error Handling

The SMS service includes comprehensive error handling:

```javascript
const { sendSMSInternal } = require('../controllers/sms/sms.controller');

try {
  const result = await sendSMSInternal(phoneNumber, message);
  // Handle success
} catch (error) {
  if (error.statusCode === 400) {
    // Bad request - invalid phone number or message
    console.error('Invalid SMS data:', error.message);
  } else if (error.statusCode === 401) {
    // Unauthorized - check API key
    console.error('SMS API authentication failed:', error.message);
  } else if (error.statusCode === 503) {
    // Service unavailable - retry later
    console.error('SMS service temporarily unavailable:', error.message);
  } else {
    // Other errors
    console.error('SMS sending failed:', error.message);
  }
}
```

## Response Format

All SMS functions return a consistent response format:

```javascript
{
  success: true,
  messageId: "msg_123456789",
  status: "sent",
  phoneNumber: "+1234567890",
  message: "Your message content",
  cost: 0.05,
  timestamp: "2024-01-15T10:30:00.000Z",
  provider: "Notifyre"
}
```

## Best Practices

1. **Phone Number Format**: Always include country code (e.g., +1234567890)
2. **Message Length**: Keep messages under 160 characters for single SMS
3. **Error Handling**: Always wrap SMS calls in try-catch blocks
4. **Rate Limiting**: Be mindful of API rate limits for bulk operations
5. **User Preferences**: Check user SMS notification preferences before sending
6. **Logging**: Log SMS activities for debugging and audit purposes

## Testing

For testing purposes, you can use the service without actual SMS sending by setting a test environment variable:

```env
NODE_ENV=test
NOTIFYRE_TEST_MODE=true
```

## Security Notes

- Never expose API keys in client-side code
- Validate phone numbers before sending SMS
- Implement rate limiting to prevent SMS spam
- Store sensitive data (like OTPs) securely with expiration
