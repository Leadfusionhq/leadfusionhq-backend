// request-schemas/geocoding.schema.js
const { Joi } = require('celebrate');

const GeocodingSchema = {
    autocomplete: {
        query: Joi.object({
            input: Joi.string().min(3).required(),
            country: Joi.string().length(2).optional(),
            bounds: Joi.string().optional(),
            limit: Joi.number().min(1).max(10).default(5)
        })
    },

    placeDetails: {
        query: Joi.object({
            lat: Joi.number().required(),
            lng: Joi.number().required()
        })
    },

    validateAddress: {
        body: Joi.object({
            address: Joi.string().required()
        })
    },

    reverseGeocode: {
        query: Joi.object({
            lat: Joi.number().required(),
            lng: Joi.number().required()
        })
    }
};

module.exports = GeocodingSchema;