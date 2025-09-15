const fetchWrapper = require('../../utils/fetchWrapper');
const NMI_API_URL = process.env.NMI_API_URL;
const SECURITY_KEY = process.env.NMI_SECURITY_KEY;

const createCustomerVault = async (cardInfo) => {
  const payload = {
    security_key: SECURITY_KEY,
    customer_vault: 'add_customer',
    ...cardInfo
  };

  console.log('Sending to NMI:', payload);

  // ✅ fetchWrapper already returns plain text or JSON
  const response = await fetchWrapper(
    'POST',
    NMI_API_URL,
    payload,
    null,
    false, // no N8N header
    true   // formEncoded = true
  );

  return response; // raw text from NMI
};

const chargeCustomerVault = async (customerVaultId, amount, description = '') => {

  if (!SECURITY_KEY) {
    console.error('NMI_SECURITY_KEY is not set in environment variables');
    return {
      success: false,
      message: 'Payment configuration error: Missing security key'
    };
  }

  if (!NMI_API_URL || !NMI_API_URL.startsWith('http')) {
    console.error('NMI_API_URL is not a valid absolute URL:', NMI_API_URL);
    return {
      success: false,
      message: 'Payment configuration error: Invalid API URL'
    };
  }
  
  const payload = {
    security_key: SECURITY_KEY,
    type: 'sale',
    customer_vault_id: customerVaultId,
    amount: amount.toFixed(2),
    order_description: description
  };
  console.log('NMI Request Payload:', payload);

  try {
    const response = await fetchWrapper(
      'POST',
      NMI_API_URL,
      payload,
      null,
      false,  // no N8N header
      true    // formEncoded = true
    );

    console.log('NMI Raw Response:', response);
    
    // Handle the response correctly - it's a string, not an object with .data
    let responseText;
    if (typeof response === 'string') {
      responseText = response;
    } else if (response && typeof response === 'object') {
      // If it's an object, try to get the text content
      responseText = response.data || response.text || JSON.stringify(response);
    } else {
      responseText = String(response);
    }

    console.log('NMI charge response text:', responseText);

    // Parse the response
    const responseMatch = responseText.match(/response=(\d+)/);
    const responseCode = responseMatch ? responseMatch[1] : null;
    
    const transactionIdMatch = responseText.match(/transactionid=([^&\s]+)/);
    const transactionId = transactionIdMatch ? transactionIdMatch[1] : null;
    
    const responseTextMatch = responseText.match(/responsetext=([^&\s]+)/);
    const responseMessage = responseTextMatch ? decodeURIComponent(responseTextMatch[1].replace(/\+/g, ' ')) : '';

    console.log('Parsed response:', { responseCode, transactionId, responseMessage });

    // Response code 1 = Approved, 2 = Declined, 3 = Error
    const success = responseCode === '1';

    return {
      success,
      transactionId,
      responseCode,
      message: responseMessage,
      rawResponse: responseText
    };

  } catch (error) {
    console.error('NMI charge error:', error);
    return {
      success: false,
      message: 'Payment processing failed',
      error: error.message
    };
  }
};

const getCustomerVault = async (customerVaultId) => {
  const payload = {
    security_key: SECURITY_KEY,
    customer_vault: 'get_customer',
    customer_vault_id: customerVaultId
  };

  try {
    const response = await fetchWrapper(
      'POST',
      NMI_API_URL,
      payload,
      null,
      false,  // no N8N header
      true    // formEncoded = true
    );

    return response;
  } catch (error) {
    console.error('NMI get customer vault error:', error);
    throw error;
  }
};

const deleteCustomerVault = async (customerVaultId) => {
  const payload = {
    security_key: SECURITY_KEY,
    customer_vault: 'delete_customer',
    customer_vault_id: customerVaultId
  };

  try {
    const response = await fetchWrapper(
      'POST',
      NMI_API_URL,
      payload,
      null,
      false,
      true
    );

    let responseText;
    if (typeof response === 'string') {
      responseText = response;
    } else {
      responseText = response.data || JSON.stringify(response);
    }

    console.log('NMI Delete Raw Response:', responseText);

    const responseMatch = responseText.match(/response=(\d+)/);
    const responseCode = responseMatch ? responseMatch[1] : null;
    
    const responseTextMatch = responseText.match(/responsetext=([^&]+)/);
    const message = responseTextMatch ? decodeURIComponent(responseTextMatch[1]) : '';

    // Handle "invalid vault ID" as a special case - it might already be deleted
    const isInvalidVault = message.includes('Invalid Customer Vault Id');

    return {
      success: responseCode === '1' || isInvalidVault, // Consider success if it's already gone
      responseCode,
      message,
      alreadyDeleted: isInvalidVault,
      rawResponse: responseText
    };

  } catch (error) {
    console.error('NMI delete customer vault error:', error);
    throw error;
  }
};

const refundTransaction = async (transactionId, amount) => {
  const payload = {
    security_key: SECURITY_KEY,
    type: 'refund',
    transactionid: transactionId,
    amount: amount ? amount.toFixed(2) : undefined
  };

  try {
    const response = await fetchWrapper(
      'POST',
      NMI_API_URL,
      payload,
      null,
      false,  // no N8N header
      true    // formEncoded = true
    );

    const responseText = response.data;
    const responseMatch = responseText.match(/response=(\d+)/);
    const responseCode = responseMatch ? responseMatch[1] : null;
    
    const refundTransactionIdMatch = responseText.match(/transactionid=([^&\s]+)/);
    const refundTransactionId = refundTransactionIdMatch ? refundTransactionIdMatch[1] : null;

    return {
      success: responseCode === '1',
      transactionId: refundTransactionId,
      responseCode,
      rawResponse: responseText
    };
  } catch (error) {
    console.error('NMI refund error:', error);
    throw error;
  }
};

module.exports = {
  createCustomerVault,
  chargeCustomerVault,
  getCustomerVault,
  deleteCustomerVault,
  refundTransaction,
};