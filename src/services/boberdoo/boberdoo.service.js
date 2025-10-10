const axios = require('axios');
const crypto = require('crypto');
const { User } = require('../../models/user.model');
const CONSTANT_ENUM = require('../../helper/constant-enums');

// Keep only URL and KEY from env (secrets)
const API_URL = (process.env.BOBERDOO_API_URL || 'https://leadfusionhq.leadportal.com/apiJSON.php').trim();
const API_KEY = (process.env.BOBERDOO_API_KEY || '').trim();
const CREATE_ACTION = 'createNewPartner'; // fixed here

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

    // Optional fields (uncomment if needed)
    // Test: 1,                       // fake-success if inputs are valid (doesn't create real record)
    // Website: 'https://example.com',
    // Comments: 'Created via API'
  };
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

module.exports = { syncUserToBoberdooById };