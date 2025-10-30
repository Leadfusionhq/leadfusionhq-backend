const axios = require('axios');
const State = require('../../models/state.model');
const User = require('../../models/user.model');

// Create and Update Webhook URLs
const WEBHOOK_CREATE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/ffe20f26-ebb5-42fa-8e2d-8867957396b2';
const WEBHOOK_UPDATE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/update';

const sendToN8nWebhook = async (campaignData) => {
  try {
    // ✅ Resolve multiple states (abbreviations)
    let stateAbbrs = [];
    const stateVal = campaignData?.geography?.state;

    if (Array.isArray(stateVal)) {
      const stateDocs = await State.find({ _id: { $in: stateVal } }).select('abbreviation');
      stateAbbrs = stateDocs.map((s) => s.abbreviation).filter(Boolean);
    } else if (typeof stateVal === 'object' && stateVal.abbreviation) {
      stateAbbrs = [stateVal.abbreviation];
    } else if (stateVal) {
      try {
        const stateDoc = await State.findById(stateVal).select('abbreviation');
        if (stateDoc) stateAbbrs = [stateDoc.abbreviation];
      } catch (e) {
        console.error('State lookup failed:', e.message);
      }
    }

    // ✅ Resolve user name
    let userName = '';
    const userVal = campaignData?.user_id;
    if (userVal) {
      if (typeof userVal === 'object') {
        const u = userVal;
        userName =
          u.name ||
          u.fullName ||
          u.username ||
          `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
          u.email ||
          '';
      } else {
        try {
          const userDoc = await User.findById(userVal).select('name fullName username firstName lastName email');
          if (userDoc) {
            userName =
              userDoc.name ||
              userDoc.fullName ||
              userDoc.username ||
              `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() ||
              userDoc.email ||
              '';
          }
        } catch (e) {
          console.error('User lookup failed:', e.message);
        }
      }
    }

    // ✅ Zip codes
    const zipCodes = Array.isArray(campaignData?.geography?.coverage?.partial?.zip_codes)
      ? campaignData.geography.coverage.partial.zip_codes
      : [];

    // ✅ Payload
    const payload = {
      action: campaignData.action || 'create',
      campaign_id: campaignData.campaign_id || '',
      states: stateAbbrs, // e.g. ["CA", "TX"]
      zip_codes: zipCodes,
      client_name: userName,
      boberdoo_filter_set_id: campaignData.boberdoo_filter_set_id || null,
      submitted_at: new Date().toISOString(),
    };

    // ✅ Choose correct webhook
    const webhookUrl =
      campaignData.action === 'update' ? WEBHOOK_UPDATE_URL : WEBHOOK_CREATE_URL;

    console.log(`📤 Sending ${campaignData.action} webhook to:`, webhookUrl);
    console.log('Payload:', payload);

    // ✅ Send request
    const resp = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ N8N response:', resp.status, resp.data);
    return { success: true, data: resp.data };
  } catch (error) {
    console.error('❌ Error sending webhook to N8N:', error?.response?.status, error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendToN8nWebhook };
