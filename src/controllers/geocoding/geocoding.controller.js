// controllers/geocoding/geocoding.controller.js
const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const GeocodingServices = require('../../services/geocoding/geocoding.service');
const { ErrorHandler } = require('../../utils/error-handler');

const getAddressAutocomplete = wrapAsync(async (req, res) => {
    const { input, country, bounds, limit } = req.query;
    
    const result = await GeocodingServices.getAddressAutocomplete({
        input,
        country,
        bounds,
        limit: parseInt(limit) || 5
    });
    
    sendResponse(res, result, 'Address suggestions fetched successfully', 200);
});

const getPlaceDetails = wrapAsync(async (req, res) => {
    const { lat, lng } = req.query;
    
    const result = await GeocodingServices.getPlaceDetails(
        parseFloat(lat),
        parseFloat(lng)
    );
    
    sendResponse(res, result, 'Place details fetched successfully', 200);
});

const validateAddress = wrapAsync(async (req, res) => {
    const { address } = req.body;
    
    const result = await GeocodingServices.validateAddress(address);
    
    sendResponse(res, result, 'Address validation completed', 200);
});

const reverseGeocode = wrapAsync(async (req, res) => {
    const { lat, lng } = req.query;
    
    const result = await GeocodingServices.reverseGeocode(
        parseFloat(lat),
        parseFloat(lng)
    );
    
    sendResponse(res, result, 'Reverse geocoding completed successfully', 200);
});

module.exports = {
    getAddressAutocomplete,
    getPlaceDetails,
    validateAddress,
    reverseGeocode
};