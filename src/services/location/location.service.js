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

module.exports = {
  uploadCSVData,
};
