const Lead = require('../models/lead.model');

const generateRandomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'LED-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateUniqueLeadId = async () => {
  let unique = false;
  let leadId = '';

  while (!unique) {
    leadId = generateRandomId();
    const existing = await Lead.findOne({ lead_id: leadId });
    if (!existing) unique = true;
  }

  return leadId;
};

module.exports = generateUniqueLeadId;
