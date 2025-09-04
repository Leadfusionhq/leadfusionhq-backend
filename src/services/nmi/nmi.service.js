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

module.exports = {
  createCustomerVault,
};
