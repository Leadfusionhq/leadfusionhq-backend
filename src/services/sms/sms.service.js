// services/sms/SmsServices.js
const { NotifyreAPI, RecipientType } = require('notifyre-nodejs-sdk');
const { ErrorHandler } = require('../../utils/error-handler');

const rawKey = process.env.NOTIFYRE_API_KEY || '';
const API_KEY = rawKey.trim().replace(/^Bearer\s+/i, ''); // avoid "Bearer Bearer ..." issues

if (!API_KEY) {
  console.error('[Notifyre] NOTIFYRE_API_KEY is missing or empty');
} else {
  console.log(`[Notifyre] API key loaded: ****${API_KEY.slice(-6)} (len=${API_KEY.length})`);
}

let notifyreAPI;
try {
  // If their SDK supports baseUrl options you can pass them here; otherwise token only.
  notifyreAPI = new NotifyreAPI(API_KEY);
} catch (e) {
  console.error('[Notifyre] SDK initialization failed:', e?.message);
}

const smsService = notifyreAPI?.getSmsService?.();

const toE164US = (n) => {
  // normalize to +1XXXXXXXXXX
  const digits = String(n).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(n).startsWith('+')) return String(n);
  throw new Error(`Invalid US number: ${n}`);
};

const sendSms = async (smsData) => {
  const { to, message, from } = smsData || {};
  if (!smsService) {
    throw new ErrorHandler('Notifyre SMS service not initialized. Check API key.', 500);
  }
  if (!to || !message) {
    throw new ErrorHandler('Phone number(s) and message are required', 400);
  }

  // Accept array or comma-separated string
  const inputList = Array.isArray(to)
    ? to
    : String(to)
      .split(',')
      .map((num) => num.replace(/-/g, '').trim())
      .filter(Boolean);

  if (!inputList.length) {
    throw new ErrorHandler('No valid phone numbers provided', 400);
  }

  const results = [];

  for (const raw of inputList) {
    let toE164 = null;
    try {
      toE164 = toE164US(raw);
      const reqPayload = {
        body: String(message).trim(),
        from: from || '', // must be your purchased SMS-enabled number in Notifyre
        recipients: [{ type: RecipientType.SmsNumber, value: toE164 }],
        scheduledDate: null,
        addUnsubscribeLink: false,
        callbackUrl: process.env.SMS_CALLBACK_URL || '',
        metadata: { source: 'leadfusion-backend' },
        campaignName: 'leadfusion-sms',
      };

      console.log('[Notifyre] Sending SMS request:', {
        from: reqPayload.from,
        to: toE164,
        bodyPreview: reqPayload.body.slice(0, 160),
      });

      const response = await smsService.submitSms(reqPayload);

      // Heuristic success check; adjust if your SDK returns a different shape
      const messageId = response?.id || response?.messageId || response?.payload?.id;
      if (!messageId && response?.success === false) {
        throw new Error(response?.message || 'Notifyre send returned unsuccessful');
      }

      console.log('[Notifyre] SMS send response:', response);
      results.push({ phone: raw, toE164, success: true, messageId, response });
    } catch (err) {
      const info = {
        to: raw,
        toE164,
        statusCode: err?.statusCode || err?.response?.status,
        message: err?.message,
        payload: err?.payload,
        errors: err?.errors,
        responseData: err?.response?.data,
      };
      console.error('[Notifyre SMS Error]', JSON.stringify(info, null, 2));
      results.push({ phone: raw, toE164, success: false, error: info });
    }
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    success: failed.length === 0,
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    results,
    sentTo: successful.map((r) => r.toE164 || r.phone),
  };
};


const listSentSms = async (opts = {}) => {
  if (!smsService) {
    throw new Error('Notifyre SMS service not initialized');
  }

  try {
    // Clean up undefined/null values from opts
    const cleanOpts = Object.fromEntries(
      Object.entries(opts).filter(([_, v]) => v != null && v !== '')
    );

    console.log('[Notifyre] Listing sent SMS with opts:', cleanOpts);
    const response = await smsService.listSentSms(cleanOpts);
    return { success: true, data: response.payload || response };
  } catch (err) {
    console.error('[Notifyre] listSentSms error', err);
    return {
      success: false,
      error: err?.message || 'Failed to list sent SMS',
      details: err,
    };
  }
};

module.exports = { sendSms, listSentSms };