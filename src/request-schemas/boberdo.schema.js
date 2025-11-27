// src/request-schemas/boberdo.schema.js
const { Joi, Segments } = require('celebrate');

const postLead = {
    [Segments.BODY]: Joi.object({
        // ✅ Required: Boberdoo's filter_set_id (campaign identifier)
        filter_set_id: Joi.string().required(),
        
        // Lead details
        first_name: Joi.string().min(1).max(50).required(),
        last_name: Joi.string().min(1).max(50).required(),
        middle_name: Joi.string().max(50).allow('').optional(),
        suffix: Joi.string().max(10).allow('').optional(),
        
        // Contact
        phone_number: Joi.string().required(),
        email: Joi.string().allow('').optional(),

        
        // Address
        address: Joi.object({
            street: Joi.string().min(1).max(200).required(),
            city: Joi.string().min(1).max(100).required(),
            state_code: Joi.string().length(2).required(),
            zip_code: Joi.string().min(5).max(10).required(),
            full_address: Joi.string().max(500).optional(),
            coordinates: Joi.object({
                lat: Joi.number().min(-90).max(90).optional(),
                lng: Joi.number().min(-180).max(180).optional(),
            }).optional().allow(null),
            place_id: Joi.string().allow('', null).optional(),
        }).required(),
        
        // Optional fields
        age: Joi.number().min(0).max(150).allow(null).optional(),
        gender: Joi.string().valid('M', 'F', 'Male', 'Female', 'Other').allow('').optional(),
        note: Joi.string().max(1000).allow('').optional(),
        
        // Boberdoo metadata
        external_lead_id: Joi.string().max(100).optional(),
        source_info: Joi.string().max(200).optional(),
    }),
};

module.exports = {
    postLead
};