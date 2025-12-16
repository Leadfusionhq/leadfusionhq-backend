const { Joi, Segments } = require('celebrate');

// 1. Save Card Schema
const saveCard = {
  [Segments.BODY]: Joi.object().keys({
    card_number: Joi.string()
      .pattern(/^\d+$/)
      .min(13)
      .max(19) // most networks fall between 13–19 digits
      .required(),
    expiry_month: Joi.string()
      .pattern(/^(0[1-9]|1[0-2])$/) // 01–12
      .required(),
    expiry_year: Joi.string()
      .pattern(/^\d{4}$/) // e.g. 2028
      .required(),
    cvv: Joi.string()
      .pattern(/^\d{3,4}$/) // 3 for Visa/Mastercard, 4 for Amex
      .required(),
    billing_address: Joi.string().optional(),
    zip: Joi.string().optional(),
    full_name: Joi.string().required()
  }),
};


// 2. Add Funds Schema
const addFunds = {
  [Segments.BODY]: Joi.object().keys({
    amount: Joi.number().min(1).required(),
    vaultId: Joi.string().optional(), // ✅ add vaultId validation
  }),
};

// 3. Accept Contract Schema
const acceptContract = {
  [Segments.BODY]: Joi.object().keys({
    version: Joi.string().optional(),
    ipAddress: Joi.string().ip().optional(),
  }),
};

// 4. Assign Lead Schema
const assignLead = {
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.string().required(), // user receiving the lead
    leadId: Joi.string().required(), // lead being assigned
    leadCost: Joi.number().required(), // cost to deduct or charge
  }),
};

// 5. Manual Charge Schema
const chargeUser = {
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.string().required(),
    amount: Joi.number().required(),
    note: Joi.string().optional()
  }),
};

const toggleAutoTopUp = {
  [Segments.BODY]: Joi.object().keys({
    enabled: Joi.boolean().required(),
    threshold: Joi.number().min(0).optional(),
    topUpAmount: Joi.number().min(1).optional(),
    paymentMode: Joi.string().valid('prepaid', 'payAsYouGo').required()
  }),
};


module.exports = {
  saveCard,
  addFunds,
  acceptContract,
  assignLead,
  chargeUser,
  toggleAutoTopUp
};
