const fetchWrapper = require('../../utils/fetchWrapper');
const { billingLogger } = require('../../utils/logger');
const NMI_API_URL = process.env.NMI_API_URL;
const SECURITY_KEY = process.env.NMI_SECURITY_KEY;
const dayjs = require('dayjs');
const { XMLParser } = require('fast-xml-parser');
const NMI_QUERY_URL = process.env.NMI_QUERY_URL;
const { User } = require('../../models/user.model');
const formatForNmi = (d) => dayjs(d).format('MM/DD/YYYY');

// ✅ Safe parser for NMI response (JSON | XML | NVP)
const safeParseNmiResponse = (resp) => {
  const raw = typeof resp === 'string' ? resp : (resp?.data ?? '');
  const text = (raw || '').trim();
  if (!text) throw new Error('Empty response from NMI');

  // Try JSON first
  try {
    if (text.startsWith('{') || text.startsWith('[')) {
      return { obj: JSON.parse(text), raw: text };
    }
  } catch {}

  // Try XML
  if (text.startsWith('<')) {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const obj = parser.parse(text);
    return { obj, raw: text };
  }

  // Fallback: name-value pairs (key=value&key2=value2)
  const nvp = {};
  text.split('&').forEach((pair) => {
    const [k, v = ''] = pair.split('=');
    if (k) nvp[k] = decodeURIComponent(v.replace(/\+/g, ' '));
  });
  return { obj: nvp, raw: text };
};

// ✅ Extract records array from NMI response
const extractRecords = (obj) => {
  const recs = obj?.records?.record || obj?.report?.records?.record || obj?.record || [];
  return Array.isArray(recs) ? recs : (recs ? [recs] : []);
};

// ✅ Get revenue from NMI (sales)
const getRevenueFromNmi = async ({ start, end }) => {
  const payload = {
    security_key: SECURITY_KEY,
    report_type: 'transaction',
    start_date: formatForNmi(start),
    end_date: formatForNmi(end),
    action_type: 'sale',
    response: '1',
    output: 'JSON', // uppercase can help
  };

  const resp = await fetchWrapper('POST', NMI_QUERY_URL, payload, null, false, true);
  const { obj, raw } = safeParseNmiResponse(resp);

  // Optional: detect NMI errors
  if (obj?.error || obj?.['error-response'] || obj?.result === 'ERROR') {
    throw new Error(`NMI error: ${JSON.stringify(obj).slice(0, 500)}`);
  }

  const records = extractRecords(obj);
  const totalAmount = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return { totalAmount, count: records.length, raw: obj };
};

// ✅ Get refunds from NMI
const getRefundsFromNmi = async ({ start, end }) => {
  const payload = {
    security_key: SECURITY_KEY,
    report_type: 'transaction',
    start_date: formatForNmi(start),
    end_date: formatForNmi(end),
    action_type: 'refund',
    response: '1',
    output: 'JSON',
  };

  const resp = await fetchWrapper('POST', NMI_QUERY_URL, payload, null, false, true);
  const { obj } = safeParseNmiResponse(resp);

  const records = extractRecords(obj);
  const totalAmount = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return { totalAmount, count: records.length, raw: obj };
};

// ... existing functions (createCustomerVault, chargeCustomerVault, etc.) ...


const createCustomerVault = async (cardInfo) => {
  const payload = {
    security_key: SECURITY_KEY,
    customer_vault: 'add_customer',
    ...cardInfo
  };

  billingLogger.info('Creating NMI customer vault', { 
    cardLast4: cardInfo.ccnumber ? cardInfo.ccnumber.slice(-4) : 'N/A',
    billingName: `${cardInfo.billing_first_name} ${cardInfo.billing_last_name}`
  });

  try {
    // ✅ fetchWrapper already returns plain text or JSON
    const response = await fetchWrapper(
      'POST',
      NMI_API_URL,
      payload,
      null,
      false, // no N8N header
      true   // formEncoded = true
    );

    billingLogger.info('NMI vault creation response received', { 
      responseLength: response ? response.length : 0,
      cardLast4: cardInfo.ccnumber ? cardInfo.ccnumber.slice(-4) : 'N/A'
    });

    return response; // raw text from NMI
  } catch (error) {
    billingLogger.error('NMI vault creation failed', error, { 
      cardLast4: cardInfo.ccnumber ? cardInfo.ccnumber.slice(-4) : 'N/A'
    });
    throw error;
  }
};

// In nmi.service.js - Update chargeCustomerVault function

const chargeCustomerVault = async (customerVaultId, amount, description = '') => {
  billingLogger.info('Starting NMI charge process', { 
    vaultId: customerVaultId,
    amount,
    description
  });

  if (!SECURITY_KEY) {
    billingLogger.error('NMI security key not configured');
    return {
      success: false,
      message: 'Payment configuration error: Missing security key'
    };
  }

  if (!NMI_API_URL || !NMI_API_URL.startsWith('http')) {
    billingLogger.error('NMI API URL not configured properly');
    return {
      success: false,
      message: 'Payment configuration error: Invalid API URL'
    };
  }

  // ✅ Get card details for response
  const result = await User.aggregate([
    { $unwind: "$paymentMethods" },
    { $match: { "paymentMethods.customerVaultId": customerVaultId } },
    { 
      $project: { 
        _id: 0, 
        cvv: "$paymentMethods.cvv",
        cardLastFour: "$paymentMethods.cardLastFour", // ✅ Use consistent field name
        brand: "$paymentMethods.brand" // ✅ Use consistent field name
      } 
    }
  ]);
  
  const cvv = result.length > 0 ? result[0].cvv : null;
  const cardType = result.length > 0 ? result[0].brand : 'Card';
  const last4 = result.length > 0 ? result[0].cardLastFour : '****';

  if (cvv == null) {
    return {
      success: false,
      message: 'Update Your Card Details'
    };
  }
  
  const payload = {
    security_key: SECURITY_KEY,
    type: 'sale',
    customer_vault_id: customerVaultId,
    amount: amount.toFixed(2),
    order_description: description || 'Customer charge',
    cvv: cvv,
  };
  
  billingLogger.info('Sending charge request to NMI', { 
    vaultId: customerVaultId,
    amount: amount.toFixed(2)
  });

  try {
    const response = await fetchWrapper(
      'POST',
      NMI_API_URL,
      payload,
      null,
      false,
      true
    );

    billingLogger.info('NMI charge response received');
    
    let responseText;
    if (typeof response === 'string') {
      responseText = response;
    } else if (response && typeof response === 'object') {
      responseText = response.data || response.text || JSON.stringify(response);
    } else {
      responseText = String(response);
    }

    const responseMatch = responseText.match(/response=(\d+)/);
    const responseCode = responseMatch ? responseMatch[1] : null;
    
    const transactionIdMatch = responseText.match(/transactionid=([^&\s]+)/);
    const transactionId = transactionIdMatch ? transactionIdMatch[1] : null;
    
    const responseTextMatch = responseText.match(/responsetext=([^&\s]+)/);
    const responseMessage = responseTextMatch ? decodeURIComponent(responseTextMatch[1].replace(/\+/g, ' ')) : '';

    const success = responseCode === '1';

    billingLogger.info('NMI charge processed', { 
      success,
      responseCode,
      transactionId,
      message: responseMessage
    });

    // ✅ Return complete data including card details
    return {
      success,
      transactionId,
      responseCode,
      message: responseMessage,
      rawResponse: responseText,
      paymentMethod: `${cardType} •••• ${last4}`, // ✅ Formatted display
      cardType: cardType, // ✅ Card brand
      last4: last4 // ✅ Last 4 digits
    };

  } catch (error) {
    billingLogger.error('NMI charge request failed', error);
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
  billingLogger.info('Deleting NMI customer vault', { 
    vaultId: customerVaultId
  });

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

    const responseMatch = responseText.match(/response=(\d+)/);
    const responseCode = responseMatch ? responseMatch[1] : null;
    
    const responseTextMatch = responseText.match(/responsetext=([^&]+)/);
    const message = responseTextMatch ? decodeURIComponent(responseTextMatch[1]) : '';

    // Handle "invalid vault ID" as a special case - it might already be deleted
    const isInvalidVault = message.includes('Invalid Customer Vault Id');
    const success = responseCode === '1' || isInvalidVault;

    billingLogger.info('NMI vault deletion completed', { 
      vaultId: customerVaultId,
      success,
      responseCode,
      message,
      alreadyDeleted: isInvalidVault
    });

    return {
      success, // Consider success if it's already gone
      responseCode,
      message,
      alreadyDeleted: isInvalidVault,
      rawResponse: responseText
    };

  } catch (error) {
    billingLogger.error('NMI vault deletion failed', error, { 
      vaultId: customerVaultId
    });
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
  getRevenueFromNmi,
  getRefundsFromNmi,
  
};
