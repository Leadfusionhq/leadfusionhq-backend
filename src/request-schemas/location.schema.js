const { Joi, Segments } = require('celebrate');

const uploadCSV = {
  [Segments.BODY]: Joi.object().keys({
      csvData: Joi.string().required()
    }),
};
const getCountiesByState = {
  [Segments.PARAMS]: Joi.object().keys({
    stateId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).message('Invalid stateId format'),
  }),
};
module.exports = {
  uploadCSV,
  getCountiesByState,
};
