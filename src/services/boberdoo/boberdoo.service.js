const axios = require('axios');
const crypto = require('crypto');
const { User } = require('../../models/user.model');
const CONSTANT_ENUM = require('../../helper/constant-enums');
const mongoose = require('mongoose');
const Campaign = require('../../models/campaign.model');
const { ErrorHandler } = require('../../utils/error-handler');
const generateUniqueLeadId = require('../../utils/idGenerator');
const  State  = require('../../models/state.model');
const Lead = require('../../models/lead.model');
const BillingServices = require('../billing/billing.service');
const MAIL_HANDLER = require('../../mail/mails');
const SmsServices = require('../../services/sms/sms.service');
const { leadLogger } = require('../../utils/logger');
// Keep only URL and KEY from env (secrets)
const API_URL = (process.env.BOBERDOO_API_URL || 'https://leadfusionhq.leadportal.com/apiJSON.php').trim();
const API_KEY = (process.env.BOBERDOO_API_KEY || '').trim();
const API_UPDATE_KEY =(process.env.BOBERDOO_UPDATE_API_KEY || '').trim(); 

const CREATE_ACTION = 'createNewPartner'; // fixed here

const CAMPAIGN_API_URL = process.env.BOBERDOO_CAMPAIGN_API_URL;
const CAMPAIGN_API_KEY = process.env.BOBERDOO_CAMPAIGN_API_KEY;
const CREATE_CAMPAIGN_ACTION = 'insertUpdateFilterSet';


const TIMEOUT_MS = Number(process.env.BOBERDOO_TIMEOUT_MS || 15000);

// Hardcoded valid defaults (no env needed for these)
const DEFAULTS = {
  address: '123 Main St.',
  city: 'Albany',
  state: 'NY',                  // 2-letter
  country: 'United States',     // full name, per spec
  zip: '12401',
  companyName: 'Test Company',
  firstName: 'Test',
  lastName: 'User',
  loginEmail: 'test.user@example.com',
  leadEmail: 'lead@example.com',
  phone: '5551234567',          // digits only
  deliveryOption: 0,            // 0..4 (0 = HTML email)
  status: 2,                    // 0..2 (2 = Active)
  sendCreatePassword: 0,        // 0 = we provide Password
  temporaryPassword: 0          // 0 = no forced change
};

function assertConfig() {
  if (!/^https?:\/\//.test(API_URL)) {
    throw new Error('BOBERDOO_API_URL must be a full URL like https://leadfusionhq.leadportal.com/apiJSON.php');
  }
  if (!API_KEY) {
    throw new Error('BOBERDOO_API_KEY is required');
  }
  console.log('[boberdoo] Config:', { url: API_URL, key: mask(API_KEY), timeout: TIMEOUT_MS });
}
assertConfig();

function mask(str = '', visible = 4) {
  if (!str) return '';
  const s = String(str);
  return s.length <= visible ? '*'.repeat(s.length) : `${s.slice(0, visible)}***`;
}

function isJsonEndpoint(url) { return /\/apiJSON\.php$/i.test(url); }

function strongPassword(len = 12) {
  return crypto.randomBytes(Math.ceil(len / 2))
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, 'A') 
    .slice(0, len);
}

function digitsOnly(str='') { return String(str).replace(/\D+/g,''); }

function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/);
  const first = parts.shift() || DEFAULTS.firstName;
  const last  = parts.join(' ') || DEFAULTS.lastName;
  return { first, last };
}

function ensureExecUrl() {
  const u = new URL(API_URL);
  if (u.pathname.endsWith('/new_api/index.php')) { u.pathname = '/new_api/api.php'; u.search = ''; }
  return u.toString();
}

function preview(data) { return typeof data === 'string' ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300); }
function safeJson(str){ try{ return JSON.parse(str);}catch{ return { raw: str }; } }

function extractExternalId(data) {
  if (!data || typeof data !== 'object') return null;
  const c = [
    data.partner_id, data.client_id, data.vendor_id, data.buyer_id, data.id,
    data.Result?.partner_id, data.Result?.client_id, data.Result?.vendor_id, data.Result?.buyer_id, data.Result?.id,
    data.response?.partner_id, data.response?.client_id, data.response?.id
  ];
  return c.find(Boolean) || null;
}

function toErrorList(respData) {
  try {
    const d = typeof respData === 'string' ? JSON.parse(respData) : respData;
    const errs = d?.response?.errors?.error;
    if (Array.isArray(errs)) return errs.map(e => String(e));
    if (typeof errs === 'string') return [errs];
    return [];
  } catch { return []; }
}

// Build ALL required fields with hardcoded safe defaults
function buildCreateFields(user) {
  const { first, last } = splitName(user.name || '');

  // Country normalization per spec
  let country = user.country || DEFAULTS.country;
  if (/^\s*US\s*$/i.test(country) || /^\s*U\.?S\.?A\.?$/i.test(country)) country = 'United States';
  if (/^\s*CA\s*$/i.test(country)) country = 'Canada';

  // State must be 2-letter
  const state = String(user.region || user.state || DEFAULTS.state).slice(0,2).toUpperCase() || DEFAULTS.state;

  // Numeric codes
  const deliveryOption = Number.isFinite(Number(user.deliveryOption))
    ? Number(user.deliveryOption)
    : DEFAULTS.deliveryOption; // 0..4

  const statusCode = Number.isFinite(Number(user.statusCode))
    ? Number(user.statusCode)
    : DEFAULTS.status; // 0..2

  const login = user.email || DEFAULTS.loginEmail;
  const companyName = user.companyName || user.name || DEFAULTS.companyName;

  // Final payload according to API_Action spec (for apiJSON.php we’ll wrap it into { Request: ... })
  return {
    // Required API fields
    Key: API_KEY,
    API_Action: CREATE_ACTION,
    Format: 'json',

    // Auth/Login requirements
    Login: login,
    Send_Create_Password: DEFAULTS.sendCreatePassword, // 0 -> must include Password
    Temporary_Password: DEFAULTS.temporaryPassword,    // 0/1

    // Provide a strong password if not sending create password email
    Password: strongPassword(12),

    // Required personal/company info
    Company_Name: companyName,
    First_Name: first,
    Last_Name: last,

    // Required address info
    Address: user.address || DEFAULTS.address,
    City: user.city || DEFAULTS.city,
    State: state,                      // 2-letter abbrev
    Country: country,                  // "United States" or "Canada" or full string
    Zip: user.zipCode || DEFAULTS.zip,

    // Required contact info
    Phone: digitsOnly(user.phoneNumber || DEFAULTS.phone),

    // Lead delivery
    Lead_Email: user.leadEmail || user.company_contact_email || user.email || DEFAULTS.leadEmail,
    Delivery_Option: deliveryOption,   // 0..4 numeric

    // Status numeric 0..2
    Status: statusCode,

    Credit_Limit: 'Unlimited',

    // Optional fields (uncomment if needed)
    // Test: 1,                       // fake-success if inputs are valid (doesn't create real record)
    // Website: 'https://example.com',
    // Comments: 'Created via API'
  };
}

async function updatePartnerStatusInBoberdoo(partnerId, status = 0) {
  if (!partnerId) {
    console.error("❌ Missing partner ID for status update");
    return { success: false, error: "Missing partner ID" };
  }

  try {
    // ✅ Build payload for status update
    const params = {
      Key: API_UPDATE_KEY, // ✅ Use the update API key
      API_Action: "updatePartnerSettings",
      Format: "JSON", // ✅ Request JSON response
      Partner_ID: partnerId,
      Status: status, // 0 = Not Active, 1 = Temp Stop, 2 = Active
    };

    console.log("🟠 [boberdoo] Updating Partner Status:", partnerId);
    console.log("➡️ Status:", status === 0 ? 'Not Active' : status === 1 ? 'Temporarily Stopped' : 'Active');
    console.log("➡️ Params:", params);
    console.log("➡️ Using API_UPDATE_KEY:", mask(API_UPDATE_KEY));

    // ✅ Use new_api/api.php endpoint with GET request
    const updateUrl = "https://leadfusionhq.leadportal.com/new_api/api.php";
    
    const response = await axios.get(updateUrl, {
      params: params,
      timeout: TIMEOUT_MS,
      headers: {
        "Accept": "application/json"
      },
      validateStatus: () => true
    });

    console.log('[boberdoo] <- Status Update Response:', response.status);
    console.log('[boberdoo] <- Response Headers:', response.headers['content-type']);
    console.log('[boberdoo] <- Response Data:', preview(response.data));

    // ✅ Handle both XML and JSON responses
    let data;
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('xml')) {
      console.warn('⚠️ Received XML response instead of JSON - parsing error from XML');
      // Extract error from XML
      const errorMatch = response.data.match(/<error>(.*?)<\/error>/);
      const errorMsg = errorMatch ? errorMatch[1] : 'Unknown error';
      
      console.error(`❌ Failed to update Partner ${partnerId} status:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
        data: { raw: response.data }
      };
    }
    
    data = typeof response.data === "string" ? safeJson(response.data) : response.data;

    // ✅ Check for success in response
    if (data?.response?.result?.includes("successfully updated")) {
      console.log(`✅ Partner ${partnerId} status updated to ${status} in Boberdoo`);
      return { success: true, data };
    }

    // ✅ Handle errors
    const errors = toErrorList(data);
    const errorMsg = errors.join("; ") || "Unknown error";
    
    console.error(`❌ Failed to update Partner ${partnerId} status:`, errorMsg);
    return { success: false, error: errorMsg, data };

  } catch (error) {
    console.error("[boberdoo] updatePartnerStatusInBoberdoo error:", error.message);
    return { success: false, error: error.message || "API request failed" };
  }
}

// Basic validation to avoid trivial failures (but we fill defaults first)
function validateFields(fields) {
  const missing = [];
  const req = [
    'Key','API_Action','Login','Company_Name','First_Name','Last_Name',
    'Address','City','Country','Zip','Phone','Lead_Email','Delivery_Option'
  ];
  const needsState = /^(United States|Canada)$/i.test(String(fields.Country).trim());

  // Required elements present
  req.forEach(k => { if (!String(fields[k] ?? '').trim()) missing.push(k); });
  if (needsState && !String(fields.State || '').trim()) missing.push('State');

  // Password required when Send_Create_Password = 0
  if (Number(fields.Send_Create_Password) !== 1) {
    if (!fields.Password || String(fields.Password).length < 6) missing.push('Password (>=6)');
  }

  // Codes validity
  if (!/^[0-4]$/.test(String(fields.Delivery_Option))) missing.push('Delivery_Option (0..4)');
  if (!/^[0-2]$/.test(String(fields.Status))) missing.push('Status (0..2)');

  // Email format
  const emailRe = /.+@.+\..+/;
  if (fields.Login && !emailRe.test(fields.Login)) missing.push('Login (invalid email)');
  if (fields.Lead_Email && !emailRe.test(fields.Lead_Email)) missing.push('Lead_Email (invalid email)');

  // Country exact names
  if (/^\s*US\s*$/i.test(fields.Country)) missing.push('Country must be "United States" (exactly)');
  if (/^\s*CA\s*$/i.test(fields.Country)) missing.push('Country must be "Canada" (exactly)');

  // State length
  if (fields.State && String(fields.State).length !== 2) missing.push('State must be 2-letter code');

  return missing;
}

async function postApiAction(payload, execUrl) {
  const headers = {};
  const useJson = isJsonEndpoint(execUrl);
  let body;

  if (useJson) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
    body = JSON.stringify({ Request: payload });
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['Accept'] = 'application/json';
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k,v]) => form.append(k, String(v)));
    body = form.toString();
  }

  console.log('[boberdoo] -> POST', execUrl);
  console.log('[boberdoo] -> BODY preview:', preview(useJson ? { Request: payload } : payload));

  const resp = await axios.post(execUrl, body, { headers, timeout: TIMEOUT_MS, validateStatus: () => true });

  const ct = String(resp.headers['content-type'] || '').toLowerCase();
  console.log('[boberdoo] <- RESP', resp.status, ct, preview(resp.data));
  return resp;
}

async function createPartner(user) {
  const execUrl = ensureExecUrl();
  const fields = buildCreateFields(user);

  // Validate (with defaults already applied)
  const missing = validateFields(fields);
  if (missing.length) {
    return {
      externalId: null,
      isJson: true,
      raw: { response:{ errors:{ error: missing.map(m=>`${m} is required/invalid`) } } },
      normalizedError: `Missing/invalid: ${missing.join(', ')}`
    };
  }

  // Try with the default status 2. If the portal still says "Status value invalid",
  // try fallback numeric statuses 1 then 0.
  const statuses = [fields.Status, 1, 0].filter((v,i,a)=> a.indexOf(v)===i);
  let last = null;

  for (const st of statuses) {
    const attempt = { ...fields, Status: st };
    console.log('[boberdoo] Trying Status:', st);

    const resp = await postApiAction(attempt, execUrl);
    const ct = String(resp.headers['content-type'] || '').toLowerCase();
    if (!ct.includes('application/json')) {
      last = { externalId: null, isJson: false, raw: resp.data, normalizedError: 'Non-JSON response' };
      continue;
    }

    const data = typeof resp.data === 'string' ? safeJson(resp.data) : resp.data;
    const externalId = extractExternalId(data);
    const errors = toErrorList(data).join('; ');

    if (externalId) {
      return { externalId, isJson: true, raw: data, normalizedError: '' };
    }

    last = { externalId: null, isJson: true, raw: data, normalizedError: errors };
    // if error isn’t specifically about status, don’t keep trying statuses
    if (!String(errors).toLowerCase().includes('status value invalid')) break;
  }
  return last;
}


async function updatePartnerInBoberdoo(user) {
  try {
    if (!user?.integrations?.boberdoo?.external_id) {
      throw new Error("Missing Partner_ID for update");
    }

    const partnerId = user.integrations.boberdoo.external_id;
    const { first, last } = splitName(user.name || "");
    
    let state = (user.address?.state || user.region || user.state || "IL").toUpperCase();
    if (state.length > 2) state = state.slice(0, 2);
    
    let country = user.country || "United States";
    if (/^\s*US\s*$/i.test(country) || /^\s*U\.?S\.?A\.?$/i.test(country)) {
      country = "United States";
    }
    if (/^\s*CA\s*$/i.test(country)) {
      country = "Canada";
    }

    const params = {
      Key: API_UPDATE_KEY,
      API_Action: "updatePartnerSettings",
      Format: "JSON",
      Partner_ID: partnerId,
      Company_Name: user.companyName || user.name || "My Company",
      First_Name: first,
      Last_Name: last,
      Address: user.address?.street || "132 Main St.",
      City: user.address?.city || "Chicago",
      State: state,
      Country: country,
      Zip: user.address?.zip_code || user.zipCode || "60610",
      Phone: digitsOnly(user.phoneNumber || "5551234567"),
      Contact_Email: user.email,
      Lead_Email: user.leadEmail || user.company_contact_email || user.email,
      Delivery_Option: Number(user.deliveryOption) || 0,
      Status: Number(user.statusCode) || 2,
      Credit_Limit: "Unlimited",
      Ability_To_Add_Funds: 1,
      Can_Request_Lead_Refunds: 1,
      Can_Partner_Change_Status: 1,
      Partner_Label: 0,
      Partner_Group: 0,
    };

    console.log("🟡 [boberdoo] Updating Partner:", partnerId);
    console.log("➡️ Params:", params);
    console.log("➡️ Using API_UPDATE_KEY:", mask(API_UPDATE_KEY));

    const updateUrl = "https://leadfusionhq.leadportal.com/new_api/api.php";
    
    const response = await axios.get(updateUrl, {
      params: params,
      timeout: TIMEOUT_MS,
      headers: {
        "Accept": "application/json"
      },
      validateStatus: () => true
    });

    console.log('[boberdoo] <- Update Response:', response.status);
    console.log('[boberdoo] <- Response Headers:', response.headers['content-type']);
    console.log('[boberdoo] <- Response Data:', preview(response.data));

    let data;
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('xml')) {
      console.warn('⚠️ Received XML response instead of JSON - parsing error from XML');
      const errorMatch = response.data.match(/<error>(.*?)<\/error>/);
      const errorMsg = errorMatch ? errorMatch[1] : 'Unknown error';
      
      // ✅ Update DB with error
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'integrations.boberdoo.last_sync_at': new Date(),
          'integrations.boberdoo.sync_status': 'FAILED',
          'integrations.boberdoo.last_error': errorMsg
        }
      });
      
      return {
        success: false,
        error: errorMsg,
        data: { raw: response.data }
      };
    }
    
    data = typeof response.data === "string" ? safeJson(response.data) : response.data;

    // ✅ Check for success in response
    if (data?.response?.result?.includes("successfully updated")) {
      console.log(`✅ Partner ${partnerId} updated successfully in Boberdoo`);
      
      // ✅ IMPORTANT: Use 'new: true' to return updated document
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            'integrations.boberdoo.last_sync_at': new Date(),
            'integrations.boberdoo.sync_status': 'SUCCESS',
            'integrations.boberdoo.last_error': null
          }
        },
        { new: true } // ✅ This returns the updated document!
      );
      
      return { 
        success: true, 
        data,
        updatedUser // ✅ Return the fresh user data
      };
    }

    // ✅ Handle errors
    const errors = toErrorList(data);
    const errorMsg = errors.join("; ") || "Unknown error";
    
    console.error("❌ Boberdoo update error:", errorMsg);
    
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'integrations.boberdoo.last_sync_at': new Date(),
        'integrations.boberdoo.sync_status': 'FAILED',
        'integrations.boberdoo.last_error': errorMsg
      }
    });
    
    return { success: false, error: errorMsg, data };

  } catch (err) {
    console.error("❌ updatePartnerInBoberdoo failed:", err.message);
    
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'integrations.boberdoo.last_sync_at': new Date(),
        'integrations.boberdoo.sync_status': 'FAILED',
        'integrations.boberdoo.last_error': err.message
      }
    });
    
    return { success: false, error: err.message };
  }
}




async function syncUserToBoberdooById(userId) {
  console.log('=== [boberdoo] SYNC TRIGGERED ===', { userId });

  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');
  if (user.role !== CONSTANT_ENUM.USER_ROLE.USER) return { skipped: true, reason: 'Not a regular user' };
  console.log('[boberdoo] User:', { email: user.email, name: user.name });

  await User.findByIdAndUpdate(userId, {
    $set: {
      'integrations.boberdoo.sync_status': 'PENDING',
      'integrations.boberdoo.last_sync_at': new Date(),
      'integrations.boberdoo.last_error': null
    }
  });

  try {
    const result = await createPartner(user);
    console.log('[boberdoo] result:', { isJson: result.isJson, hasExternalId: Boolean(result.externalId), err: result.normalizedError });

    if (result.externalId) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          'integrations.boberdoo.external_id': result.externalId,
          'integrations.boberdoo.sync_status': 'SUCCESS',
          'integrations.boberdoo.last_sync_at': new Date(),
          'integrations.boberdoo.last_error': null
        }
      });
      return { success: true, externalId: result.externalId, data: result.raw };
    }

    const errMsg = result.normalizedError || 'No external_id in JSON response';
    await User.findByIdAndUpdate(userId, {
      $set: {
        'integrations.boberdoo.sync_status': 'FAILED',
        'integrations.boberdoo.last_sync_at': new Date(),
        'integrations.boberdoo.last_error': errMsg
      }
    });
    return { success: false, error: errMsg, data: result.raw };
  } catch (err) {
    const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
    await User.findByIdAndUpdate(userId, {
      $set: {
        'integrations.boberdoo.sync_status': 'FAILED',
        'integrations.boberdoo.last_sync_at': new Date(),
        'integrations.boberdoo.last_error': msg
      }
    });
    return { success: false, error: msg };
  }
}


// Create or insert a campaign in Boberdoo

// 🗓️ Day mapping between API and DB
const DAY_MAPPING = {
  Sunday: "SUNDAY",
  Monday: "MONDAY",
  Tuesday: "TUESDAY",
  Wednesday: "WEDNESDAY",
  Thursday: "THURSDAY",
  Friday: "FRIDAY",
  Saturday: "SATURDAY",
};

// 🔁 Convert DB-style → API-style (e.g., MONDAY → Monday)
function convertDbDaysToApi(daysFromDb = []) {
  const reverseMap = Object.fromEntries(
    Object.entries(DAY_MAPPING).map(([api, db]) => [db, api])
  );
  return daysFromDb.map(day => reverseMap[day] || day);
}

// 🗺️ Get state abbreviation or fallback
function getStateAbbreviation(state) {
  if (!state) return "";
  if (typeof state === "string") return state;
  return state.abbreviation || state.value || state.code || state.name || "";
}


async function createCampaignInBoberdoo(campaignData, partnerId) {
  try {
    const leadTypeId = CONSTANT_ENUM.BOBERDOO_LEAD_TYPE_MAP[campaignData.lead_type];
    if (!leadTypeId)
      return { success: false, error: `Invalid lead type: ${campaignData.lead_type}` };

        // NEW: Delivery type logic
    const deliveryType =
      campaignData.lead_type === "ROOFING"
        ? "100281 - N8N to CRM DelieveryRoof"
        : "100275 - LeadFusion HQ - boberdoo Lead API";

    const stateList = Array.isArray(campaignData.geography?.state)
      ? campaignData.geography.state.map(getStateAbbreviation).filter(Boolean).join(",")
      : getStateAbbreviation(campaignData.geography?.state);

    const coverageType = campaignData.geography.coverage?.type || "FULL_STATE";
    const zipMode = coverageType === "FULL_STATE" ? 0 : 1;

    // 🕒 Day conversion
    const activeDaysArray = campaignData.delivery?.schedule?.days
      ?.filter(d => d.active)
      ?.map(d => d.day.toUpperCase()) || [];
    const activeDays = convertDbDaysToApi(activeDaysArray).join(",");

    // ⏰ Time range

  
    const schedule = campaignData.delivery?.schedule || {};
    const scheduleStart = schedule.start_time || "09:00";
    const scheduleEnd = schedule.end_time || "17:00";
    const timezone = schedule.timezone || "America/New_York";
    const timeRange = `${scheduleStart}-${scheduleEnd}`; // ✅ fixed syntax
    

    // 📦 Handle ZIP codes (only for PARTIAL)
    const zipCodes =
      coverageType === "PARTIAL"
        ? (campaignData.geography?.coverage?.partial?.zip_codes || []).join(",")
        : "";

        let roofingFields = {};

    if (campaignData.lead_type === "ROOFING") {
      roofingFields = {
        Project_Type: "0",
        Homeowner: "0",
        Roof_Material: "0",
      };
    }


    const payload = {
      Key: CAMPAIGN_API_KEY,
      API_Action: CREATE_CAMPAIGN_ACTION,
      Format: "json",
      Mode: "insert",
      Partner_ID: partnerId,
      TYPE: leadTypeId,
      Filter_Set_Name: campaignData.name,
      Filter_Set_Price: campaignData.bid_price || 0,
      // Accepted_Sources: campaignData.accepted_sources?.join(",") || "properbusiness_solar,solarClosingSystem_solar",
      Accepted_Sources:'',
      Match_Priority: campaignData.match_priority || 5,
      Hourly_Limit: campaignData.hourly_limit ?? 0,
      Daily_Limit: campaignData.daily_limit ?? 0,
      Weekly_Limit: campaignData.weekly_limit ?? 0,
      Monthly_Limit: campaignData.monthly_limit ?? 0,
      Accept_Only_Reprocessed_Leads: "Yes",
      Filter_Set_Status: campaignData.status === "ACTIVE" ? 1 : 0,
      Delivery_Type: deliveryType,
      State: stateList,
      Zip_Mode: zipMode,
      Zip: zipCodes, // ✅ Added
      Day_Of_Week_Accept_Leads: activeDays,
      // Time_Of_Day_Accept_Leads: timeRange, // ✅ global range
      Timezone: timezone, // ✅ NEW
    ...roofingFields,
    };

    console.log("🟢 Payload sent to Boberdoo (Create):", payload);

    const response = await axios.post(CAMPAIGN_API_URL, null, {
      params: payload,
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
    });

    const data = typeof response.data === "string" ? safeJson(response.data) : response.data;
    if (data?.response?.status === "Success" && data?.response?.filter_set_ID) {
      return { success: true, filterSetId: data.response.filter_set_ID, data };
    }

    const errors = toErrorList(data).join("; ");
    return { success: false, error: errors || "Failed to create campaign in Boberdoo", data };

  } catch (error) {
    console.error("[boberdoo] Campaign creation error:", error.message);
    return { success: false, error: error.message || "Failed to create campaign in Boberdoo" };
  }
}


async function updateCampaignInBoberdoo(campaignData, filterSetId, partnerId) {
  try {
    const leadTypeId = CONSTANT_ENUM.BOBERDOO_LEAD_TYPE_MAP[campaignData.lead_type];
    if (!leadTypeId) return { success: false, error: `Invalid lead type: ${campaignData.lead_type}` };
    if (!filterSetId) return { success: false, error: "Filter_Set_ID is required for update" };

    // NEW: Delivery type logic
    const deliveryType =
      campaignData.lead_type === "ROOFING"
        ? "100281 - N8N to CRM DelieveryRoof"
        : "100275 - LeadFusion HQ - boberdoo Lead API";

    const stateList = Array.isArray(campaignData.geography?.state)
      ? campaignData.geography.state.map(getStateAbbreviation).filter(Boolean).join(",")
      : getStateAbbreviation(campaignData.geography?.state);

    const coverageType = campaignData.geography.coverage?.type || "FULL_STATE";
    const zipMode = coverageType === "FULL_STATE" ? 0 : 1;

    const activeDaysArray = campaignData.delivery?.schedule?.days
      ?.filter(d => d.active)
      ?.map(d => d.day.toUpperCase()) || [];
    const activeDays = convertDbDaysToApi(activeDaysArray).join(",");

    const schedule = campaignData.delivery?.schedule || {};
    const scheduleStart = schedule.start_time || "09:00";
    const scheduleEnd = schedule.end_time || "17:00";
    const timezone = schedule.timezone || "America/New_York";
    const timeRange = `${scheduleStart}-${scheduleEnd}`; // ✅ fixed syntax
    

    const zipCodes =
      coverageType === "PARTIAL"
        ? (campaignData.geography?.coverage?.partial?.zip_codes || []).join(",")
        : "";

        let roofingFields = {};
    if (campaignData.lead_type === "ROOFING") {
      roofingFields = {
        Project_Type: "0",
        Homeowner: "0",
        Roof_Material: "0",
      };
    }

    const payload = {
      Key: CAMPAIGN_API_KEY,
      API_Action: CREATE_CAMPAIGN_ACTION,
      Format: "json",
      Mode: "update",
      TYPE: leadTypeId,
      Filter_Set_ID: filterSetId,
      Partner_ID: partnerId,
      Filter_Set_Name: campaignData.name,
      Filter_Set_Price: campaignData.bid_price || 0,
      // Accepted_Sources: campaignData.accepted_sources?.join(",") || "properbusiness_solar,solarClosingSystem_solar",
      // Accepted_Sources:'',
      Match_Priority: campaignData.match_priority || 5,
      Hourly_Limit: campaignData.hourly_limit ?? 0,
      Daily_Limit: campaignData.daily_limit ?? 0,
      Weekly_Limit: campaignData.weekly_limit ?? 0,
      Monthly_Limit: campaignData.monthly_limit ?? 0,
      Accept_Only_Reprocessed_Leads: "Yes",
      Filter_Set_Status: campaignData.status === "ACTIVE" ? 1 : 0,
      Delivery_Type: deliveryType,
      State: stateList,
      Zip_Mode: zipMode,
      Zip: zipCodes, // ✅ Added for update too
      Day_Of_Week_Accept_Leads: activeDays,
      // Time_Of_Day_Accept_Leads: timeRange, // ✅ global range
      Timezone: timezone, // ✅ NEW
        // ✅ Merge roofing fields conditionally
      ...roofingFields,
    };

    console.log("🟡 Payload sent to Boberdoo (Update):", payload);

    const response = await axios.post(CAMPAIGN_API_URL, null, {
      params: payload,
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
    });

    const data = typeof response.data === "string" ? safeJson(response.data) : response.data;

    if (data?.response?.status === "Success") {
      console.log(`✅ Campaign ${campaignData._id || campaignData.campaign_id} updated successfully in Boberdoo`);
      return { success: true, filterSetId, data };
    }

    const errors = toErrorList(data).join("; ");
    return { success: false, error: errors || "Failed to update campaign in Boberdoo", data };

  } catch (error) {
    console.error("[boberdoo] Campaign update error:", error.message);
    return { success: false, error: error.message || "Failed to update campaign in Boberdoo" };
  }
}



/**
 * Disable campaign (Filter Set) in Boberdoo by setting Filter_Set_Status = 0
 */
const deleteCampaignFromBoberdoo = async ({ filterSetId, leadTypeId }) => {


if (!leadTypeId) {
  console.error(`❌ Invalid lead type: ${campaignData.lead_type}`);
  return { success: false, error: `Invalid lead type: ${campaignData.lead_type}` };
}
  try {
    if (!filterSetId) {
      console.warn("⚠️ Missing filterSetId in deleteCampaignFromBoberdoo()");
      return { success: false, message: "Filter_Set_ID missing" };
    }

    const payload = {
      Key: CAMPAIGN_API_KEY,
      API_Action: CREATE_CAMPAIGN_ACTION, // same as updateCampaignInBoberdoo
      Format: "json",
      Mode: "update",
      TYPE: leadTypeId || 33,
      Filter_Set_ID: filterSetId,
      Filter_Set_Status: 0, // ✅ Disable campaign (mark inactive)
    };

    console.log("🧾 Sending Disable Campaign Payload to Boberdoo:", payload);

    const response = await axios.post(CAMPAIGN_API_URL, null, {
      params: payload, // ✅ matches your updateCampaignInBoberdoo pattern
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
    });

    const data = typeof response.data === "string" ? safeJson(response.data) : response.data;

    if (data?.response?.status === "Success") {
      console.log(`✅ Boberdoo campaign disabled successfully (Filter_Set_ID: ${filterSetId})`);
      return { success: true, message: "Campaign disabled in Boberdoo", data };
    }

    console.error("❌ Failed to disable campaign in Boberdoo:", data);
    return { success: false, message: "Boberdoo disable failed", data };

  } catch (error) {
    console.error("❌ Error disabling campaign in Boberdoo:", error);
    return { success: false, message: error.message };
  }
};




const processBoberdoLead = async (leadData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // ✅ 1. Find campaign by Boberdoo filter_set_id
        const campaign = await Campaign.findOne({ 
            boberdoo_filter_set_id: leadData.filter_set_id 
        });
        
        if (!campaign) {
            throw new ErrorHandler(404, `Campaign not found for filter_set_id: ${leadData.filter_set_id}`);
        }

        console.log('✅ Campaign found:', {
            internal_id: campaign._id,
            name: campaign.name,
            filter_set_id: campaign.boberdoo_filter_set_id
        });

        // ✅ 2. Check if campaign is active (case-insensitive)
        const isActive = String(campaign.status).toUpperCase() === 'ACTIVE';
        if (!isActive) {
            throw new ErrorHandler(400, `Campaign "${campaign.name}" is not active. Status: ${campaign.status}`);
        }

        // ✅ 3. Convert state code to ObjectId
        const state = await State.findOne({ 
            abbreviation: leadData.address.state_code.toUpperCase() 
        });
        
        if (!state) {
            throw new ErrorHandler(400, `Invalid state code: ${leadData.address.state_code}`);
        }

        // ✅ 4. Check prepaid balance
        const leadCost = campaign.bid_price || 0;
        if (campaign.payment_type === 'prepaid') {
            const campaignUser = await User.findById(campaign.user_id);
            if (!campaignUser) {
                throw new ErrorHandler(404, 'Campaign user not found');
            }

            const totalAvailable = (campaignUser.balance || 0) + (campaignUser.refundMoney || 0);
            if (totalAvailable < leadCost) {
                throw new ErrorHandler(400, `Insufficient funds for campaign "${campaign.name}". Required: $${leadCost}, Available: $${totalAvailable}`);
            }
        }

        // ✅ 5. Generate unique lead ID
        const lead_id = await generateUniqueLeadId();

        // ✅ 6. Prepare lead data
        const preparedLead = {
            lead_id,
            user_id: campaign.user_id,
            campaign_id: campaign._id,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            middle_name: leadData.middle_name,
            suffix: leadData.suffix,
            phone_number: leadData.phone_number,
            email: leadData.email,
            age: leadData.age,
            gender: leadData.gender,
            address: {
                street: leadData.address.street,
                city: leadData.address.city,
                state: state._id,
                zip_code: leadData.address.zip_code,
                full_address: leadData.address.full_address || 
                    `${leadData.address.street}, ${leadData.address.city}, ${state.abbreviation} ${leadData.address.zip_code}`,
                coordinates: leadData.address.coordinates,
                place_id: leadData.address.place_id
            },
            note: leadData.note,
            source: 'boberdo',
            status: 'active',
            boberdo_metadata: {
                external_id: leadData.external_lead_id,
                filter_set_id: leadData.filter_set_id,
                source_campaign: leadData.source_info,
                received_at: new Date()
            }
        };

        // ✅ 7. Create lead
        const newLead = await Lead.create([preparedLead], { session });
        const createdLead = newLead[0];

        console.log('✅ Lead created:', {
            lead_id: createdLead.lead_id,
            internal_id: createdLead._id
        });

        // ✅ 8. Process billing if prepaid
        // let billingResult = null;
        // if (campaign.payment_type === 'prepaid' && leadCost > 0) {
        //     billingResult = await BillingServices.assignLeadNew(
        //         campaign.user_id,
        //         createdLead._id,
        //         leadCost,
        //         campaign.user_id,
        //         session
        //     );
        //     console.log('✅ Billing processed:', billingResult);
        // }
        let billingResult;
        
        if (campaign.payment_type === "prepaid" && leadCost > 0) {
        billingResult = await BillingServices.assignLeadPrepaid(
            campaign.user_id,
            createdLead._id,
            leadCost,
            campaign.user_id,
            session
        );
        } else if (campaign.payment_type === "payasyougo") {
        billingResult = await BillingServices.assignLeadPayAsYouGo(
            campaign.user_id,
            createdLead._id,
            leadCost,
            campaign.user_id,
            session
        );
        } else {
        throw new ErrorHandler(400, "Invalid campaign payment type.");
        }

        // ✅ 9. Commit transaction
        await session.commitTransaction();
        session.endSession();

        // ✅ 10. Populate lead for response
        const populatedLead = await Lead.findById(createdLead._id)
            .populate('campaign_id', 'name campaign_id')
            .populate('address.state', 'name abbreviation');

        // ✅ 11. Send notifications (deferred async to avoid session conflict)
        process.nextTick(() => {
          sendBoberdoLeadNotifications(populatedLead, campaign, billingResult)
            .then(() => console.log('✅ Boberdo notifications sent successfully'))
            .catch(err => console.error('❌ Failed to send Boberdo lead notifications:', err));
        });

        return populatedLead;

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const sendBoberdoLeadNotifications = async (lead, campaign, billingResult) => {
  const logMeta = {
    campaign_id: campaign?._id,
    campaign_name: campaign?.name,
    lead_id: lead?.lead_id,
    lead_internal_id: lead?._id,
    action: 'Send Boberdo Lead Notifications',
  };

  try {
    const campaignOwner = await User.findById(campaign.user_id);
    if (!campaignOwner) {
      leadLogger.warn('Campaign owner not found while sending notifications', logMeta);
      return;
    }

    // ✅ Email delivery
    if (campaign?.delivery?.method?.includes('email') && campaign?.delivery?.email?.addresses) {
      try {
        await MAIL_HANDLER.sendLeadAssignEmail({
          to: campaign.delivery.email.addresses,
          name: campaignOwner.name || 'Campaign User',
          leadName: lead.lead_id,
          assignedBy: 'Boberdo Integration',
          leadDetailsUrl: `${process.env.UI_LINK}/dashboard/leads/${lead._id}`,
          campaignName: campaign.name,
          leadData: lead,
          realleadId: lead._id,
          subject: `Lead Fusion - New Lead`,
        });

        leadLogger.info('Boberdo lead assignment email sent successfully', {
          ...logMeta,
          email_to: campaign.delivery.email.addresses,
        });
      } catch (emailErr) {
        leadLogger.error('Failed to send Boberdo lead assignment email', emailErr, {
          ...logMeta,
          error: emailErr.message,
        });
      }
    }

    // ✅ SMS delivery
    if (campaign?.delivery?.method?.includes('phone') && campaign?.delivery?.phone?.numbers) {
      try {
        const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
        const phoneNumber = lead.phone_number || lead.phone || '';
        const email = lead.email || '';
        const address = [
          lead?.address?.full_address || '',
          lead?.address?.city || '',
          lead?.address?.zip_code || '',
        ].filter(Boolean).join(', ');
        const campaignName = campaign?.name || 'N/A';

        const MAX_NOTE_LENGTH = 100;
        let notes = lead.note || 'No notes provided';
        if (notes.length > MAX_NOTE_LENGTH) notes = notes.substring(0, MAX_NOTE_LENGTH) + '...';

        const smsMessage = `New Lead Assigned

Name: ${fullName}
Phone: ${phoneNumber}
Email: ${email}
Address: ${address}
Lead ID: ${lead.lead_id}
Campaign: ${campaignName}
Notes: ${notes}

View Lead: ${process.env.UI_LINK}/dashboard/leads/${lead._id}`;

        leadLogger.info('Attempting to send Boberdo lead assignment SMS', {
          ...logMeta,
          to_numbers: campaign.delivery.phone.numbers,
        });

        const smsResult = await SmsServices.sendSms({
          to: campaign.delivery.phone.numbers,
          message: smsMessage,
          from: process.env.SMS_SENDER_ID || '+18563908470',
        });

        if (smsResult.success) {
          leadLogger.info('Boberdo lead assignment SMS sent successfully', {
            ...logMeta,
            sent_to: smsResult.sentTo.join(', '),
            total_sent: smsResult.successful,
          });
        } else {
          leadLogger.warn('Boberdo SMS failed', {
            ...logMeta,
            failed_count: smsResult.failed,
            error: smsResult.results?.map(r => r.error?.message).join('; '),
          });
        }
      } catch (err) {
        leadLogger.error('Fatal error during Boberdo SMS sending', err, {
          ...logMeta,
          error: err.message,
        });
      }
    }

    leadLogger.info('Completed sending Boberdo notifications', logMeta);

  } catch (error) {
    leadLogger.error('Error in sendBoberdoLeadNotifications', error, {
      ...logMeta,
      error: error.message,
      stack: error.stack,
    });
  }
};


module.exports = { 
  syncUserToBoberdooById,
  updatePartnerStatusInBoberdoo,
  updatePartnerInBoberdoo,

  createCampaignInBoberdoo,
  updateCampaignInBoberdoo,
  deleteCampaignFromBoberdoo,

  processBoberdoLead,
 };