const State = require('../../models/state.model');
const County = require('../../models/county.model');
const ZipCode = require('../../models/zipcode.model');
const { ErrorHandler } = require('../../utils/error-handler');

const uploadCSVData = async (csvData) => {
  const results = {
    totalProcessed: 0,
    states: { created: 0, existing: 0 },
    counties: { created: 0, existing: 0 },
    zipCodes: { created: 0, existing: 0 },
    errors: [],
  };

  const stateCache = new Map();
  const countyCache = new Map();

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    results.totalProcessed++;

    try {
      const stateName = row['State']?.trim();
      const stateAbbr = row['USPS Default State for ZIP']?.trim()?.toUpperCase();
      const countyName = row['County']?.trim();
      const countyCode = row['County Code']?.trim();
      const zipCodeVal = row['ZIP']?.trim();
      const city = row['USPS Default City for ZIP']?.trim();
      const population = parseInt(row['County Population']?.replace(/[^\d]/g, '') || '0');

      if (!stateName || !stateAbbr || !countyName || !zipCodeVal) {
        results.errors.push({ row: i + 1, reason: 'Missing required fields', rowData: row });
        continue;
      }

      // --- State ---
      const stateKey = `${stateName}-${stateAbbr}`;
      let state = stateCache.get(stateKey);
      let stateCreated = false;
      if (!state) {
        state = await State.findOne({ abbreviation: stateAbbr });
        if (!state) {
          state = await State.create({ name: stateName, abbreviation: stateAbbr });
          stateCreated = true;
        }
        stateCache.set(stateKey, state);
      }
      if (stateCreated) results.states.created++;
      else results.states.existing++;

      // --- County ---
      const countyKey = `${countyName}-${state._id}`;
      let county = countyCache.get(countyKey);
      let countyCreated = false;
      if (!county) {
        county = await County.findOne({ name: countyName, state: state._id });
        if (!county) {
          county = await County.create({ name: countyName, state: state._id, fips_code: countyCode });
          countyCreated = true;
        }
        countyCache.set(countyKey, county);
      }
      if (countyCreated) results.counties.created++;
      else results.counties.existing++;

      // --- ZipCode ---
      let zip = await ZipCode.findOne({ zip_code: zipCodeVal, state: state._id });
      if (!zip) {
        await ZipCode.create({
          zip_code: zipCodeVal,
          state: state._id,
          county: county._id,
          default_city: city,
          population: population || null,
        });
        results.zipCodes.created++;
      } else {
        results.zipCodes.existing++;
      }

    } catch (err) {
      results.errors.push({ row: i + 1, reason: err.message, rowData: row });
    }
  }

  return results;
};

const getAllLocationsDetailed = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const results = await ZipCode.aggregate([
    { $lookup: { from: 'counties', localField: 'county', foreignField: '_id', as: 'county' } },
    { $unwind: '$county' },
    { $lookup: { from: 'states', localField: 'county.state', foreignField: '_id', as: 'state' } },
    { $unwind: '$state' },
    { $sort: { 'state.name': 1, 'county.name': 1, 'zip_code': 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      }
    }
  ]);

  const data = results[0].data;
  const totalCount = results[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: data.map(doc => ({
      zip_code: doc.zip_code,
      default_city: doc.default_city,
      population: doc.population,
      county: doc.county.name,
      county_fips: doc.county.fips_code,
      state: doc.state.name,
      state_abbr: doc.state.abbreviation,
    })),
    page,
    limit,
    totalCount,
    totalPages,
  };
};

const getAllStates = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const [states, totalCount] = await Promise.all([
    State.find({}, { name: 1, abbreviation: 1, _id: 1 })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    State.countDocuments()
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: states,
    page,
    limit,
    totalCount,
    totalPages,
  };
};


const getCountiesByState = async (stateId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const [counties, totalCount] = await Promise.all([
    County.find({ state: stateId }) // Assuming `state` is the FK
      .sort({ name: 1 }) // optional sorting
      .skip(skip)
      .limit(limit)
      .lean(),

    County.countDocuments({ state: stateId }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: counties,
    page,
    limit,
    totalCount,
    totalPages,
  };
};


module.exports = {
  uploadCSVData,
  getAllLocationsDetailed,
  getAllStates,
  getCountiesByState,
};
