const fetch = require('node-fetch');

const fetchWrapper = async (method = 'GET', url, data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);

    const contentType = res.headers.get('content-type');

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Request failed: ${res.status} ${res.statusText} - ${errorBody}`);
    }

    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      return await res.text(); // fallback for plain text responses
    }
  } catch (error) {
    console.error('fetchWrapper error:', error.message);
    throw error;
  }
};

module.exports = fetchWrapper;
