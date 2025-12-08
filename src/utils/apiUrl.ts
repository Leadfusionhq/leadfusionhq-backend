const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const BASE_IMPORT_URL = process.env.NEXT_PUBLIC_IMPORT_API_URL;

const  API_BASE = `${BASE_URL}/api`;
const API_IMPORT_BASE = `${BASE_IMPORT_URL}/api`;

// here are base api:::::
const AUTH_API_BASE = `${API_BASE}/auth`;
export const USER_API_BASE = `${API_BASE}/users`;
const ADMIN_API_BASE = `${API_BASE}/admins`;

const TEST_API_BASE = `${API_BASE}/test`;

export const API_URL = {

    // Admin User Management URLs
    GET_ALL_USERS: `${USER_API_BASE}/`,
    

    ADD_USER: `${USER_API_BASE}/`,
    UPDATE_USER: `${USER_API_BASE}/:userId`,
    GET_USER_BY_ID: `${USER_API_BASE}/:userId`,
    DELETE_USER_BY_ID: `${USER_API_BASE}/:userId`,
    TOGGLE_USER_STATUS_BY_ID: `${USER_API_BASE}/:userId/toggle-status`,

    SYNC_BOMBERDO:`${USER_API_BASE}/:userId/boberdoo/resync`,
    SEND_BALANCE_TOPUP_WEBHOOK: `${USER_API_BASE}/:userId/balance/topup-webhook`,

    GET_MY_PROFILE: `${USER_API_BASE}/me/profile`,
    UPDATE_MY_PROFILE: `${USER_API_BASE}/me/profile`,
    CHANGE_MY_PASSWORD: `${USER_API_BASE}/me/change-password`,
    UPLOAD_MY_AVATAR: `${USER_API_BASE}/me/avatar`,
    
    ACCEPT_CONTRACT:`${USER_API_BASE}/:userId/contract/accept`,
    CHECK_CONTRACT:`${USER_API_BASE}/:userId/contract/status`,
    
    GET_ALL_ADMINS: `${ADMIN_API_BASE}/`,
    // add admin accounts :::::::
    ADD_ADMIN: `${ADMIN_API_BASE}/`,
    UPDATE_ADMIN: `${ADMIN_API_BASE}/:adminId`,
    GET_ADMIN_BY_ID: `${ADMIN_API_BASE}/:adminId`,
    DELETE_ADMIN_BY_ID: `${ADMIN_API_BASE}/:adminId`,

    GET_ALL_REGULAR_ADMIN: `${ADMIN_API_BASE}?role=Admin`,
    UPLOAD_AVATAR: `${ADMIN_API_BASE}/:adminId/avatar`,
    
    ADD_BALANCE:`${ADMIN_API_BASE}/:userId/addBalance`,

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

    // Add this new endpoint
    RESEND_VERIFICATION_EMAIL: `${TEST_API_BASE}/resend-verification-email`,
};

/** ::::::::::::::::::FAQ ROUTES :::::::::::::::::: */ 

const FAQ_API_BASE = `${API_BASE}/faqs`;

export const FAQ_API = {
  GET_ALL_FAQS: `${FAQ_API_BASE}/`,
  CREATE_FAQ: `${FAQ_API_BASE}/`,
  GET_FAQ_BY_ID: `${FAQ_API_BASE}/:faqId`,
  UPDATE_FAQ: `${FAQ_API_BASE}/:faqId`,
  DELETE_FAQ: `${FAQ_API_BASE}/:faqId`,
  GET_PUBLIC_FAQS: `${FAQ_API_BASE}/public`,
};

/** ::::::::::::::::::FEEDBACK ROUTES :::::::::::::::::: */
const FEEDBACK_API_BASE = `${API_BASE}/feedback`;

export const FEEDBACK_API = {
  // Public endpoints
  CREATE_FEEDBACK: `${FEEDBACK_API_BASE}/`,
  
  // Admin endpoints (protected)
  GET_ALL_FEEDBACKS: `${FEEDBACK_API_BASE}/`,
  GET_FEEDBACK_BY_ID: `${FEEDBACK_API_BASE}/:feedbackId`,
  UPDATE_FEEDBACK: `${FEEDBACK_API_BASE}/:feedbackId`,
  DELETE_FEEDBACK: `${FEEDBACK_API_BASE}/:feedbackId`,
};



/** ::::::::::::::::::LOCATION ROUTES :::::::::::::::::: */
const LOCATION_API_BASE = `${API_BASE}/locations`;

export const LOCATION_API = {
  GET_ALL_LOCATIONS: `${LOCATION_API_BASE}/`,
  UPLOAD_CSV_DATA: `${LOCATION_API_BASE}/upload-csv-data`,

  GET_STATES: `${LOCATION_API_BASE}/states?limit=100&page=1`,
  GET_COUNTIES_BY_STATE: `${LOCATION_API_BASE}/states/:stateId/counties?limit=100&page=1`,

};

/** ::::::::::::::::::CAMPAIGNS ROUTES :::::::::::::::::: */
const CAMPAIGNS_API_BASE = `${API_BASE}/campaigns`;

export const CAMPAIGNS_API = {
  GET_ALL_CAMPAIGNS: `${CAMPAIGNS_API_BASE}/`,
  CREATE_CAMPAIGN: `${CAMPAIGNS_API_BASE}/`,
  CREATE_CAMPAIGN_BY_ADMIN: `${CAMPAIGNS_API_BASE}/:userId/add`,
  GET_CAMPAIGN: `${CAMPAIGNS_API_BASE}/:campaignId`,
  UPDATE_CAMPAIGN: `${CAMPAIGNS_API_BASE}/:campaignId`,
  QUICK_SEARCH: `${CAMPAIGNS_API_BASE}/quick-search`,
  SEARCH_CAMPAIGNS: `${CAMPAIGNS_API_BASE}/search`,
  UPLOAD_CSV: `${CAMPAIGNS_API_BASE}/upload-csv`,
  DELETE_CAMPAIGN: `${CAMPAIGNS_API_BASE}/:campaignId`, 
};

/** ::::::::::::::::::Supabase CAMPAIGNS ROUTES :::::::::::::::::: */
const Supabase_CAMPAIGNS_API_BASE = `${API_IMPORT_BASE}/supacampaigns`;

export const Supabase_CAMPAIGNS_API = {
  GET_ALL_CAMPAIGNS: `${Supabase_CAMPAIGNS_API_BASE}`,
};


/** ::::::::::::::::::LEADS ROUTES :::::::::::::::::: */

const LEADS_API_BASE = `${API_BASE}/leads`;

export const LEADS_API = {
  GET_ALL_LEADS: `${LEADS_API_BASE}/`,
  UPLOAD_CSV: `${LEADS_API_BASE}/upload-csv`,
  VALIDATE_CSV:`${LEADS_API_BASE}/validate-csv`,
 
  CREATE_LEAD: `${LEADS_API_BASE}/`,
  GET_LEAD: `${LEADS_API_BASE}/:leadId`,
  UPDATE_LEAD: `${LEADS_API_BASE}/:leadId`,
  GET_LEADS_BY_CAMPAIGN:`${LEADS_API_BASE}/`,
  
  GET_LEADS_BY_CLIENT:`${LEADS_API_BASE}/client`,
  DELETE_LEAD: `${LEADS_API_BASE}/:leadId`,  
  RETURN_LEAD:`${LEADS_API_BASE}/return`,
  GET_RETURN_LEADS: `${LEADS_API_BASE}/getReturnLeads`,
  APPROVE_RETURN_LEAD: `${LEADS_API_BASE}/returns/approve`,
  REJECT_RETURN_LEAD: `${LEADS_API_BASE}/returns/reject`,
};

/** ::::::::::::::::::utilities ROUTES :::::::::::::::::: */
const UITILITIES_API_BASE = `${API_BASE}/utilities`;

export const UITILITIES_API = {
  GET_ALL_UITILITIES: `${UITILITIES_API_BASE}/`,
  GET_UITILITIES_BY_STATE: `${UITILITIES_API_BASE}/state/:stateId?all=true`,
};




/** ::::::::::::::::::CSV ROUTES :::::::::::::::::: */
const CSV_API_BASE = `${API_IMPORT_BASE}/contacts`;

export const CSV_API = {
  CREATE_MULTIPART_UPLOAD: `${CSV_API_BASE}/start-multipart`,
  COMPLETE_MULTIPART_UPLOAD: `${CSV_API_BASE}/complete-multipart`,
  IMPORT_MAPPED_CSV: `${CSV_API_BASE}/import-mapped`,
  IMPORT_SHEET_CSV: `${CSV_API_BASE}/csv/google-sheet`,
};

/** ::::::::::::::::::SEARCH ROUTES :::::::::::::::::: */
const SEARCH_API_BASE = `${API_IMPORT_BASE}/filters`;

export const SEARCH_API = {
  FILTER_STATES: `${SEARCH_API_BASE}/states`,
  FILTER_ZIPS: `${SEARCH_API_BASE}/zips`,
  FILTER_COUNTIES: `${SEARCH_API_BASE}/counties`,
  SEARCH_QUERIES: `${SEARCH_API_BASE}/count`,
};


/** ::::::::::::::::::notifications ROUTES :::::::::::::::::: */
const NOTIFICATION_API_BASE = `${API_BASE}/notifications`;

export const NOTIFICATION_API = {
  GET_NOTIFICATIONS: `${NOTIFICATION_API_BASE}/`,
  GET_UNREAD_COUNT: `${NOTIFICATION_API_BASE}/unread-count`,
  MARK_AS_READ: `${NOTIFICATION_API_BASE}/:notificationId/read`,
  MARK_ALL_AS_READ: `${NOTIFICATION_API_BASE}/mark-all-read`,
  DELETE_NOTIFICATION: `${NOTIFICATION_API_BASE}/:notificationId`,
};





/** :::::::::::::::::: CHAT ROUTES :::::::::::::::::: */
const CHAT_API_BASE = `${API_BASE}/chats`;

export const CHAT_API = {
  // Chat management
  GET_CHATS: `${CHAT_API_BASE}/`,
  GET_CHAT_BY_ID: `${CHAT_API_BASE}/:chatId`,
  CREATE_OR_GET_CHAT: `${CHAT_API_BASE}/create-or-get`,
  UPDATE_CHAT_STATUS: `${CHAT_API_BASE}/:chatId/status`,
  ARCHIVE_CHAT: `${CHAT_API_BASE}/:chatId/archive`,
  ASSIGN_CHAT: `${CHAT_API_BASE}/:chatId/assign`,
  
  // Messages
  GET_MESSAGES: `${CHAT_API_BASE}/:chatId/messages`,
  SEND_MESSAGE: `${CHAT_API_BASE}/:chatId/messages`,
  EDIT_MESSAGE: `${CHAT_API_BASE}/:chatId/messages/:messageId`,
  DELETE_MESSAGE: `${CHAT_API_BASE}/:chatId/messages/:messageId`,
  MARK_MESSAGES_READ: `${CHAT_API_BASE}/:chatId/mark-read`,
  
  // File uploads
  UPLOAD_FILE: `${CHAT_API_BASE}/:chatId/upload`,
  
  // Typing indicators
  TYPING_START: `${CHAT_API_BASE}/:chatId/typing/start`,
  TYPING_STOP: `${CHAT_API_BASE}/:chatId/typing/stop`,
  
  // Search and filters
  SEARCH_MESSAGES: `${CHAT_API_BASE}/:chatId/search`,
  GET_UNREAD_COUNT: `${CHAT_API_BASE}/unread-count`
};





/** :::::::::::::::::: BILLING ROUTES :::::::::::::::::: */
const BILLING_API_BASE = `${API_BASE}/billing`;

export const BILLING_API = {
  
  // BILLING: `${BILLING_API_BASE}/`,
  // SAVE_CARD: `${BILLING_API_BASE}/save-card`,
  // ADD_FUNDS: `${BILLING_API_BASE}/add-funds`,
  // ACCEPT_CONTRACT: `${BILLING_API_BASE}/contract/accept`,
  // ASSIGN_LEAD: `${BILLING_API_BASE}/assign-lead`,
  // CARGE_USER: `${BILLING_API_BASE}/charge-user`,

   SAVE_CARD: `${BILLING_API_BASE}/save-card`,
    ADD_FUNDS: `${BILLING_API_BASE}/add-funds`,
    GET_CARDS: `${BILLING_API_BASE}/cards`,
    SET_DEFAULT_CARD: `${BILLING_API_BASE}/cards/default`,
    DELETE_CARD: `${BILLING_API_BASE}/cards`,
    TRANSACTIONS:`${BILLING_API_BASE}/transactions`,
    AUTO_TOPUP: `${BILLING_API_BASE}/auto-topup/toggle`,
    TEST_AUTO_TOPUP: `${BILLING_API_BASE}/test-auto-topup`, 
    GET_BALANCE: `${BILLING_API_BASE}/balance`,
    REVENUE_FROM_NMI: `${BILLING_API_BASE}/revenue-from-nmi`,
};

// constants/api-urls.js
// Add to your existing API_URL object

const GEOCODING_API_BASE = `${API_BASE}/geocoding`;

export const GEOCODING_API = {
    AUTOCOMPLETE: `${GEOCODING_API_BASE}/autocomplete`,
    PLACE_DETAILS: `${GEOCODING_API_BASE}/place-details`,
    VALIDATE_ADDRESS: `${GEOCODING_API_BASE}/validate`,
    REVERSE_GEOCODE: `${GEOCODING_API_BASE}/reverse`,
};

const LOGS_API_Base = `${API_IMPORT_BASE}/logs`;

export const LOGS_API = {

  GET_LOGS: `${LOGS_API_Base}/`,
  GET_ALL_LOGS: `${LOGS_API_Base}/all`,
  GET_LOG_DETAIL: (id: string) => `${LOGS_API_Base}/${id}`,
  GET_STATS: `${LOGS_API_Base}/stats`,
  CLEAR_LOGS: `${LOGS_API_Base}/clear`,
  EXPORT_LOGS: `${LOGS_API_Base}/export`,
};
