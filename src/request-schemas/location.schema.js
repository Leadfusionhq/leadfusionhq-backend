const { Joi, Segments } = require('celebrate');

const uploadCSV = {
  [Segments.BODY]: Joi.object().keys({
      csvData: Joi.string().required()
    }),
};

module.exports = {
  uploadCSV,
  
};
