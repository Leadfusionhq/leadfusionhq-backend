const fetchWrapper = require('../../utils/fetchWrapper');
const { ErrorHandler } = require('../../utils/error-handler');
const BASE_URL = 'https://leadfusionhq.app.n8n.cloud/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY;

// Import models for populating
const { State } = require('../../models/state.model');
const { County } = require('../../models/county.model');

/**
 * Format and send campaign data to n8n
 */
const createCampaign = async (campaignData) => {
  try {
    // STEP 1: Populate state name from state ID
    let stateName = campaignData?.geography?.state;
    if (mongoose.Types.ObjectId.isValid(stateName)) {
      const state = await State.findById(stateName);
      stateName = state?.name || stateName;
    }

    // STEP 2: Populate county names from county IDs (if any)
    let countyNames = [];
    const countyIds = campaignData?.geography?.coverage?.partial?.counties || [];

    if (Array.isArray(countyIds) && countyIds.length > 0) {
      const counties = await County.find({ _id: { $in: countyIds } });
      countyNames = counties.map(c => c.name);
    }

    const payload = {
      resource: 'campaign',
      operation: 'create',
      data: {
        name: campaignData.name,
        lead_type: campaignData.lead_type,
        exclusivity: campaignData.exclusivity,
        bid_price: campaignData.bid_price,
        language: campaignData.language,
        geography: {
          state: stateName,
          counties: countyNames,
          radius: campaignData?.geography?.coverage?.partial?.radius || null,
        },
        delivery: campaignData.delivery,
        note: campaignData.note,
        createdAt: campaignData.createdAt,
      },
    };

    const url = `${BASE_URL}/webhook/campaign-create`; 
    const response = await fetchWrapper('POST', url, payload, N8N_API_KEY, true);
    console.log('📤 Campaign sent to n8n:', response);
    return response;

  } catch (err) {
    console.error('❌ N8N campaign creation failed:', err.message);
    throw new ErrorHandler(500, `Failed to sync campaign with n8n: ${err.message}`);
  }
};

module.exports = {
  createCampaign,
};
