function getPaginationParams(query, defaults = { page: 1, limit: 50, maxLimit: 100 }) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = defaults.page;
  if (isNaN(limit) || limit < 1) limit = defaults.limit;
  if (limit > defaults.maxLimit) limit = defaults.maxLimit;

  return { page, limit };
}
function getFinalPagination(query, fetchAllOverride = false) {
  if (fetchAllOverride || query.all === 'true') {
    return { page: 1, limit: 0 };
  }
  return getPaginationParams(query);
}
function extractFilters(query, allowedFilters, additionalFilters = {}) {
  const filters = {};

  allowedFilters.forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      filters[key] = value;
    }
  });

  // Merge additional filters like user_id for non-admins
  return Object.assign({}, filters, additionalFilters);
}

module.exports = {
  getPaginationParams,
  getFinalPagination,
  extractFilters,
};
