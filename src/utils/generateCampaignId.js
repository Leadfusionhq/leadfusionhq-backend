const Campaign = require('../models/campaign.model');

const generateRandomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CMP-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateUniqueCampaignId = async () => {
  let unique = false;
  let campaignId = '';

  while (!unique) {
    campaignId = generateRandomId();
    const existing = await Campaign.findOne({ campaign_id: campaignId });
    if (!existing) unique = true;
  }

  return campaignId;
};

module.exports = generateUniqueCampaignId;
