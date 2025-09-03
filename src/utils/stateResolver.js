const State = require('../models/state.model');

let stateCache = null;

const resolveStateAbbreviation = async (abbreviation) => {
    if (!stateCache) {
        const states = await State.find({}, { abbreviation: 1 }).lean();
        stateCache = new Map(states.map(state => [state.abbreviation.toUpperCase(), state._id]));
    }

    return stateCache.get(abbreviation.toUpperCase()) || null;
};

module.exports = { resolveStateAbbreviation };
