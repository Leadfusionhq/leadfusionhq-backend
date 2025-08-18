const fetchWrapper = require('../utils/fetchWrapper');
const { ErrorHandler } = require('../utils/error-handler');
const N8N_API_KEY = process.env.N8N_API_KEY;
const { User } = require('../models/user.model');
const BASE_URL = 'https://leadfusionhq.app.n8n.cloud/api/v1';
const { mapUserRoleToN8nRole } = require('../utils/n8n.utils');

const createSubAccount = async ({ email, role }) => {
  const n8nRole = mapUserRoleToN8nRole(role);

  const url = `${BASE_URL}/users`;
  const data = [{ email, role: n8nRole }];

  try {
    const response = await fetchWrapper('POST', url, data, N8N_API_KEY, true);
    console.log('response:n8n', response);
    return response?.[0];
  } catch (err) {
    throw new ErrorHandler(500, `Failed to create sub account: ${err.message}`);
  }
};


// Get user by ID
const getSubAccountById = async (userId) => {
  if (!userId) {
    throw new ErrorHandler(400, 'User ID is required');
  }
  const url = `${BASE_URL}/users/${userId}`;

  try {
    const response = await fetchWrapper('GET', url, null, N8N_API_KEY, true);
    return response;
  } catch (err) {
    throw new ErrorHandler(500, `Failed to get sub account: ${err.message}`);
  }
};

// Delete user by ID
const deleteSubAccountById = async (userId) => {
  if (!userId) {
    throw new ErrorHandler(400, 'User ID is required');
  }
  const url = `${BASE_URL}/users/${userId}`;

  try {
    const response = await fetchWrapper('DELETE', url, null, N8N_API_KEY, true);
    return response;
  } catch (err) {
    throw new ErrorHandler(500, `Failed to delete sub account: ${err.message}`);
  }
};




const getSubAccounts = async () => {
  const url = `${BASE_URL}/users/`;
  return await fetchWrapper('GET', url, null, N8N_API_KEY, true);
};
module.exports = {
  createSubAccount,
  getSubAccounts,
  deleteSubAccountById,
  getSubAccountById,
};
