const axios = require('axios');
const State = require('../../models/state.model'); // adjust path if needed
const User = require('../../models/user.model');   // adjust path if needed

const WEBHOOK_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/ffe20f26-ebb5-42fa-8e2d-8867957396b2';


const sendToN8nWebhook = async (campaignData) => {
  try {
    // Resolve state name
    let stateName = '';
    const stateVal = campaignData?.geography?.state;
    if (stateVal) {
      if (typeof stateVal === 'object' && stateVal.name) {
        stateName = stateVal.name;
      } else {
        try {
          const stateDoc = await State.findById(stateVal).select('name');
          stateName = stateDoc?.name || '';
        } catch (e) {
          console.error('State lookup failed:', e.message);
        }
      }
    }

    // Resolve user name (client_name)
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

    // Zip codes
    const zipCodes = Array.isArray(campaignData?.geography?.coverage?.partial?.zip_codes)
      ? campaignData.geography.coverage.partial.zip_codes
      : [];

    // Payload (always mark as update)
    const payload = {
      action: 'update', // 👈 always send "update"
      campaign_id: campaignData.campaign_id || '',
      state: stateName,
      zip_codes: zipCodes,
      client_name: userName,
      boberdoo_filter_set_id: campaignData.boberdoo_filter_set_id || null,
      submitted_at: new Date().toISOString(),
    };

    console.log('Sending to n8n (axios POST):', payload);

    const resp = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    console.log('n8n response:', resp.status, resp.data);

    return { success: true, data: resp.data };
  } catch (error) {
    console.error('Error sending webhook to n8n:', error?.response?.status, error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendToN8nWebhook };