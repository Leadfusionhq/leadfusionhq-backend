const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const BASE_IMPORT_URL = process.env.NEXT_PUBLIC_IMPORT_API_URL;

const API_BASE = `${BASE_URL}/api`;
const API_IMPORT_BASE = `${BASE_IMPORT_URL}/api`;

// here are base api:::::
const AUTH_API_BASE = `${API_BASE}/auth`;
const USER_API_BASE = `${API_BASE}/users`;
const ADMIN_API_BASE = `${API_BASE}/admins`;

export const API_URL = {

    // Admin User Management URLs
    GET_ALL_USERS: `${USER_API_BASE}/`,
    

    ADD_USER: `${USER_API_BASE}/`,
    UPDATE_USER: `${USER_API_BASE}/:userId`,
    GET_USER_BY_ID: `${USER_API_BASE}/:userId`,
    DELETE_USER_BY_ID: `${USER_API_BASE}/:userId`,
    
    GET_ALL_ADMINS: `${ADMIN_API_BASE}/`,
    // add admin accounts :::::::
    ADD_ADMIN: `${ADMIN_API_BASE}/`,
    UPDATE_ADMIN: `${ADMIN_API_BASE}/:adminId`,
    GET_ADMIN_BY_ID: `${ADMIN_API_BASE}/:adminId`,
    DELETE_ADMIN_BY_ID: `${ADMIN_API_BASE}/:adminId`,

    GET_ALL_REGULAR_ADMIN: `${ADMIN_API_BASE}?role=Admin`,
    UPLOAD_AVATAR: `${ADMIN_API_BASE}/:adminId/avatar`,

    // Auth URLs
    LOGIN_USER: `${AUTH_API_BASE}/login`,
    REGISTER_USER: `${AUTH_API_BASE}/register`, 
    LOGOUT_USER: `${AUTH_API_BASE}/logout`, 

    SEND_RESET_LINK: `${AUTH_API_BASE}/send-reset-link`,
    // RESET_PASSWORD: `${AUTH_API_BASE}/reset-password`,


    SEND_OTP_ON_EMAIL:`${AUTH_API_BASE}/forgot-password`,
    VERIFY_OTP:`${AUTH_API_BASE}/verify-otp`,
    RESET_PASSWORD:`${AUTH_API_BASE}/reset-password`,

    SEND_VERIFICATION_EMAIL:`${AUTH_API_BASE}/send-verification-link`,
    VERIFY_EMAIL:`${AUTH_API_BASE}/verify-email`,

    
};

// ========== LOCATION ROUTES ==========
const LOCATION_API_BASE = `${API_BASE}/locations`;

export const LOCATION_API = {
  GET_ALL_LOCATIONS: `${LOCATION_API_BASE}/`,
  UPLOAD_CSV_DATA: `${LOCATION_API_BASE}/upload-csv-data`,

  GET_STATES: `${LOCATION_API_BASE}/states?limit=100&page=1`,
  GET_COUNTIES_BY_STATE: `${LOCATION_API_BASE}/states/:stateId/counties?limit=100&page=1`,

};

// ========== CAMPAIGNS ROUTES ==========
const CAMPAIGNS_API_BASE = `${API_BASE}/campaigns`;

export const CAMPAIGNS_API = {
  GET_ALL_CAMPAIGNS: `${CAMPAIGNS_API_BASE}/`,
  CREATE_CAMPAIGN: `${CAMPAIGNS_API_BASE}/`,
  GET_CAMPAIGN: `${CAMPAIGNS_API_BASE}/:campaignId`,
  UPDATE_CAMPAIGN: `${CAMPAIGNS_API_BASE}/:campaignId`,
  
};

// ========== LEADS ROUTES ==========

const LEADS_API_BASE = `${API_BASE}/leads`;

export const LEADS_API = {
  GET_ALL_LEADS: `${LEADS_API_BASE}/`,
  CREATE_LEAD: `${LEADS_API_BASE}/`,
  GET_LEAD: `${LEADS_API_BASE}/:leadId`,
  UPDATE_LEAD: `${LEADS_API_BASE}/:leadId`,
  GET_LEADS_BY_CAMPAIGN:`${LEADS_API_BASE}/`,
  
  GET_LEADS_BY_CLIENT:`${LEADS_API_BASE}/client`,
};

// ========== utilities ROUTES ==========
const UITILITIES_API_BASE = `${API_BASE}/utilities`;

export const UITILITIES_API = {
  GET_ALL_UITILITIES: `${UITILITIES_API_BASE}/`,
  GET_UITILITIES_BY_STATE: `${UITILITIES_API_BASE}/state/:stateId?all=true`,
};


// ========== CSV ROUTES ===========
const CSV_API_BASE = `${API_IMPORT_BASE}/contacts`;

export const CSV_API = {
  IMPORT_MAPPED_CSV: `${CSV_API_BASE}/import-mapped`,
  IMPORT_SHEET_CSV: `${CSV_API_BASE}/csv/google-sheet`,
};


// ========== notifications ROUTES ==========
const NOTIFICATION_API_BASE = `${API_BASE}/notifications`;

export const NOTIFICATION_API = {
  GET_NOTIFICATIONS: `${NOTIFICATION_API_BASE}/`,
  GET_UNREAD_COUNT: `${NOTIFICATION_API_BASE}/unread-count`,
  MARK_AS_READ: `${NOTIFICATION_API_BASE}/:notificationId/read`,
  MARK_ALL_AS_READ: `${NOTIFICATION_API_BASE}/mark-all-read`,
  DELETE_NOTIFICATION: `${NOTIFICATION_API_BASE}/:notificationId`,
};

