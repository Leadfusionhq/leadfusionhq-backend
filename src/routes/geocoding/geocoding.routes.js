// routes/geocoding/geocoding.routes.js
const express = require('express');
const geocodingRouter = express.Router();
const geocodingController = require('../../controllers/geocoding/geocoding.controller');
const GeocodingSchema = require('../../request-schemas/geocoding.schema');
const { celebrate } = require('celebrate');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');

const API = {
    AUTOCOMPLETE: '/autocomplete',
    PLACE_DETAILS: '/place-details',
    VALIDATE_ADDRESS: '/validate',
    REVERSE_GEOCODE: '/reverse',
};

// Public endpoints - no auth required for autocomplete
geocodingRouter.get(
    API.AUTOCOMPLETE,
    celebrate(GeocodingSchema.autocomplete),
    geocodingController.getAddressAutocomplete
);

geocodingRouter.get(
    API.PLACE_DETAILS,
    celebrate(GeocodingSchema.placeDetails),
    geocodingController.getPlaceDetails
);

// Protected endpoints
geocodingRouter.use(
    checkAuth,
    authorizedRoles([
        CONSTANT_ENUM.USER_ROLE.ADMIN,
        CONSTANT_ENUM.USER_ROLE.USER
    ])
);

geocodingRouter.post(
    API.VALIDATE_ADDRESS,
    celebrate(GeocodingSchema.validateAddress),
    geocodingController.validateAddress
);

geocodingRouter.get(
    API.REVERSE_GEOCODE,
    celebrate(GeocodingSchema.reverseGeocode),
    geocodingController.reverseGeocode
);

module.exports = geocodingRouter;