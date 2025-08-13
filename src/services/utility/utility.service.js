const Utility = require('../../models/utility.model');
const State = require('../../models/state.model');

const createUtility = async (data) => {
  const existing = await Utility.findOne({ name: data.name, state: data.state });
  if (existing) {
    throw new Error('Utility already exists');
  }
  return Utility.create(data);
};

const getAllUtilities = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const [utilities, totalCount] = await Promise.all([
    Utility.find().sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Utility.countDocuments()
  ]);

  return {
    data: utilities,
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
};

const getUtilityById = async (id) => {
  return Utility.findById(id).lean();
};

const bulkCreateUtilities = async (utilitiesData) => {
  const result = {
    total: utilitiesData.length,
    created: 0,
    existing: 0,
    errors: []
  };

  for (const item of utilitiesData) {
    try {
      const { name, state_abbr } = item;

      if (!name || !state_abbr) {
        result.errors.push({ name, reason: 'Missing name or state_abbr' });
        continue;
      }

      const state = await State.findOne({ abbreviation: state_abbr.toUpperCase() });
      if (!state) {
        result.errors.push({ name, state_abbr, reason: 'State not found' });
        continue;
      }

      const existing = await Utility.findOne({ name, state: state._id });
      if (existing) {
        result.existing++;
        continue;
      }

      await Utility.create({
        name,
        state: state._id
      });

      result.created++;
    } catch (err) {
      result.errors.push({ name: item.name, reason: err.message });
    }
  }

  return result;
};

const getUtilitiesByState = async (stateId, page = 1, limit = 50, fetchAll = false) => {
  if (fetchAll) {
    const utilities = await Utility.find({ state: stateId }).sort({ name: 1 }).lean();
    return {
      data: utilities,
      page: 1,
      limit: utilities.length,
      totalCount: utilities.length,
      totalPages: 1,
    };
  }

  const skip = (page - 1) * limit;

  const [utilities, totalCount] = await Promise.all([
    Utility.find({ state: stateId }).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Utility.countDocuments({ state: stateId })
  ]);

  return {
    data: utilities,
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit)
  };
};


module.exports = {
  createUtility,
  getAllUtilities,
  getUtilityById,
  bulkCreateUtilities,
  getUtilitiesByState,
};
