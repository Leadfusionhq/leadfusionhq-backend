const axios = require('axios');
const State = require('../../models/state.model');
const User = require('../../models/user.model');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

// Create, Update, and Delete Webhook URLs
const WEBHOOK_CREATE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/ffe20f26-ebb5-42fa-8e2d-8867957396b2';
const WEBHOOK_UPDATE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/update';
const WEBHOOK_DELETE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/delete';

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
    let partnerId = '';
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
        
        // ✅ FIX
        partnerId = u?.integrations?.boberdoo?.external_id || '';
      } else {
        try {
          const userDoc = await User.findById(userVal).select('name fullName username firstName lastName email integrations');
          if (userDoc) {
            userName =
              userDoc.name ||
              userDoc.fullName ||
              userDoc.username ||
              `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() ||
              userDoc.email ||
              '';
                  // ⬇️ Extract Partner ID
            partnerId = userDoc.integrations?.boberdoo?.external_id || '';
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

    // ✅ Get lead_type and mapped boberdoo number
    const leadTypeKey = campaignData.lead_type;
    const boberdooTypeId =  CONSTANT_ENUM.BOBERDOO_LEAD_TYPE_MAP[leadTypeKey] || null;

    // ✅ Payload
    const payload = {
      action: campaignData.action || 'create',
      campaign_id: campaignData.campaign_id || '',
      states: stateAbbrs,
      zip_codes: zipCodes,
      client_name: userName,
      partner_id: partnerId,       
      boberdoo_filter_set_id: campaignData.boberdoo_filter_set_id || null,
      timezone: campaignData.delivery?.schedule?.timezone || 'America/New_York',
      submitted_at: new Date().toISOString(),

      // NEW FIELDS
      lead_type: leadTypeKey,
      boberdoo_lead_type_id: boberdooTypeId
    };


    // ✅ Choose correct webhook
    let webhookUrl = WEBHOOK_CREATE_URL;
    if (campaignData.action === 'update') webhookUrl = WEBHOOK_UPDATE_URL;
    else if (campaignData.action === 'delete') webhookUrl = WEBHOOK_DELETE_URL;

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
