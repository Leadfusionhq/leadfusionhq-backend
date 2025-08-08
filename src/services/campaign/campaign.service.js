const { Campaign } = require('../../models/campaign.model');
const { ErrorHandler } = require('../../utils/error-handler');
const { generateVerificationToken , getTokenExpiration } = require('../../utils/token.utils');
 
const createCampaign = async (data) => {
  try {
    const newCampaign = await Campaign.create(data);
    return newCampaign;
  } catch (error) {
    throw new ErrorHandler(500, error.message || 'Failed to create campaign');
  }
};


module.exports = {
  createCampaign,
};
