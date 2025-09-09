const fetch = require('node-fetch');

const fetchWrapper = async (
  method = 'GET',
  url,
  data = null,
  token = null,
  useN8NHeader = false,
  formEncoded = false
) => {
  const headers = {
    Accept: 'application/json',
  };

  if (formEncoded === true) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    if (useN8NHeader) {
      headers['X-N8N-API-KEY'] = token;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const options = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    if (formEncoded) {
      options.body = new URLSearchParams(data).toString();
    } else {
      options.body = JSON.stringify(data);
    }
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
      return await res.text();
    }
  } catch (error) {
    console.error('fetchWrapper error:', error.message);
    throw error;
  }
};

module.exports = fetchWrapper;
