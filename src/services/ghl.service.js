const fetchWrapper = require('../utils/fetchWrapper');
const { ErrorHandler } = require('../utils/error-handler');
const GHL_API_KEY = process.env.GHL_AGENCY_API_KEY;
const BASE_URL = 'https://rest.gohighlevel.com/v1';

const createSubAccount = async ({
  firstName,
  lastName,
  email,
  phone,
  businessName,
  address,
  city,
  state,
  postalCode,
  country = 'US',
  timezone = 'America/New_York',
}) => {
  const payload = {
    firstName,
    lastName,
    email,
    phone,
    business: {
      name: businessName,
      address,
      city,
      state,
      postalCode,
      country,
      timezone,
      website: 'ghl-leadfustion', // Verify if this is required
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/locations/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GHL_AGENCY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      // Log the raw response text for debugging
      const text = await response.text();
      console.error('GHL API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: text,
      });
      throw new ErrorHandler(
        response.status,
        `Failed to create GHL sub-account: ${text}`
      );
    }

    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new ErrorHandler(500, `Unexpected response format: ${text}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in createSubAccount:', error);
    throw new ErrorHandler(500, error.message || 'Failed to create GHL sub-account');
  }
};

const getSubAccounts = async () => {
  const url = `${BASE_URL}/locations/`;
  return await fetchWrapper('GET', url, null, GHL_API_KEY);
};
module.exports = {
  createSubAccount,
  getSubAccounts,
};
