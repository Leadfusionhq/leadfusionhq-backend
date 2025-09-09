const { Joi, Segments } = require('celebrate');

// 🔐 1. Save Card Schema
const saveCard = {
  [Segments.BODY]: Joi.object().keys({
    card_number: Joi.string().required().length(16),
    expiry_month: Joi.string().required().length(2),
    expiry_year: Joi.string().required().length(4),
    cvv: Joi.string().required().length(3),
    billing_address: Joi.string().optional(),
    zip: Joi.string().optional(),
    full_name: Joi.string().required()
  }),
};

// 💰 2. Add Funds Schema
const addFunds = {
  [Segments.BODY]: Joi.object().keys({
    amount: Joi.number().min(1).required(),
  }),
};

// 📄 3. Accept Contract Schema
const acceptContract = {
  [Segments.BODY]: Joi.object().keys({
    version: Joi.string().required(),
    ipAddress: Joi.string().ip().required(),
  }),
};

// 📦 4. Assign Lead Schema
const assignLead = {
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.string().required(), // user receiving the lead
    leadId: Joi.string().required(), // lead being assigned
    leadCost: Joi.number().required(), // cost to deduct or charge
  }),
};

// 💳 5. Manual Charge Schema
const chargeUser = {
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.string().required(),
    amount: Joi.number().required(),
    note: Joi.string().optional()
  }),
};

// ✅ 6. Toggle Auto Top-Up
const toggleAutoTopUp = {
  [Segments.BODY]: Joi.object().keys({
    enabled: Joi.boolean().required()
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
