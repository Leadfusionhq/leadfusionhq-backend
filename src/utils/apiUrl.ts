const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const API_BASE = `/api`;

// here are base api:::::
const AUTH_API_BASE = `${API_BASE}/auth`;
const USER_API_BASE = `${API_BASE}/admin/users`;

export const API_URL = {

    // Admin User Management URLs
    GET_ALL_USERS: `${USER_API_BASE}/`,
    GET_ALL_REGULAR_USERS: `${USER_API_BASE}?role=User`,
    GET_ALL_ADMINS: `${USER_API_BASE}?role=Admin`,

    ADD_USER: `${USER_API_BASE}/add`,

    UPDATE_USER: `${USER_API_BASE}/:userId`,

    GET_USER_BY_ID: `${USER_API_BASE}/:userId`,

    

    // Auth URLs
    LOGIN_USER: `${AUTH_API_BASE}/login`,
    REGISTER_USER: `${AUTH_API_BASE}/register`, 
    LOGOUT_USER: `${AUTH_API_BASE}/logout`, 

};
