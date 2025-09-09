const fetchWrapper = require('../../utils/fetchWrapper');
const NMI_API_URL = 'https://secure.nmi.com/api/transact.php';
const SECURITY_KEY = process.env.NMI_SECURITY_KEY;

const createCustomerVault = async (cardInfo) => {
  const payload = {
    security_key: SECURITY_KEY,
    customer_vault: 'add_customer',
    ...cardInfo
  };

  const response = await fetchWrapper(
    'POST',
    NMI_API_URL,
    payload,
    null,
    false,  // no N8N header
    true    // formEncoded = true
  );

  return response;
};

const chargeCustomerVault = async (customerVaultId, amount, description = '') => {
  const payload = {
    security_key: SECURITY_KEY,
    type: 'sale',
    customer_vault_id: customerVaultId,
    amount: amount.toFixed(2),
    order_description: description
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
    console.log('NMI charge response:', responseText);

    // Parse the response
    const responseMatch = responseText.match(/response=(\d+)/);
    const responseCode = responseMatch ? responseMatch[1] : null;
    
    const transactionIdMatch = responseText.match(/transactionid=([^&\s]+)/);
    const transactionId = transactionIdMatch ? transactionIdMatch[1] : null;
    
    const responseTextMatch = responseText.match(/responsetext=([^&\s]+)/);
    const responseMessage = responseTextMatch ? decodeURIComponent(responseTextMatch[1].replace(/\+/g, ' ')) : '';

    // Response code 1 = Approved
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
      false,  // no N8N header
      true    // formEncoded = true
    );

    const responseText = response.data;
    const responseMatch = responseText.match(/response=(\d+)/);
    const responseCode = responseMatch ? responseMatch[1] : null;

    return {
      success: responseCode === '1',
      responseCode,
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