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

// create a new workflow for campain in n8n
const createNewWorkflow = async ({ workflowName }) => {
  try {
    
    const newWorkflowData = {
      name: workflowName,
      nodes: [],          
      connections: {}    
    };

    const response = await fetchWrapper(
      'POST',
      `${BASE_URL}/workflows`,
      newWorkflowData,
      N8N_API_KEY,
      true
    );

    console.log('New workflow created in n8n:', response);
    return response;

  } catch (err) {
    if (err instanceof ErrorHandler) throw err;
    throw new ErrorHandler(500, `Failed to create workflow: ${err.message}`);
  }
};

// create a workflow from a old workflow , clone the old one , need workflow_id from N8N form which to clone   
const createWorkflowForCampaign = async ({ workflowName, templateWorkflowId }) => {
  try {
    
    const templateWorkflow = await fetchWrapper(
      'GET',
      `${BASE_URL}/workflows/${templateWorkflowId}`,
      null,
      N8N_API_KEY,
      true
    );

    if (!templateWorkflow) throw new ErrorHandler(404 , 'Template workflow to clone not found');


    const newWorkflowData = {
      name: workflowName,
      nodes: templateWorkflow.nodes,
      connections: templateWorkflow.connections
    };

    const response = await fetchWrapper(
      'POST',
      `${BASE_URL}/workflows`,
      newWorkflowData,
      N8N_API_KEY,
      true
    );

    console.log('Workflow created in n8n:', response);
    return response;

  } catch (err) {

    if (err instanceof ErrorHandler) throw err;

    throw new ErrorHandler(500, `Failed to create workflow: ${err.message}`);
  }
};


module.exports = {
  createSubAccount,
  getSubAccounts,
  deleteSubAccountById,
  getSubAccountById,
};
