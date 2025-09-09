const express = require('express');
const billingRouter = express.Router();
const billingController = require('../../controllers/billing/billing.controller.js');
const checkAuth = require('../../middleware/check-auth.js');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const BillingSchema = require('../../request-schemas/billing.schema.js');
const { celebrate } = require('celebrate');

const API = {
  SAVE_CARD: '/save-card',
  ADD_FUNDS: '/add-funds',
  ACCEPT_CONTRACT: '/contract/accept',
  ASSIGN_LEAD: '/assign-lead',
  CHARGE_USER: '/charge-user',
  BALANCE: '/balance',
  TRANSACTIONS: '/transactions',
  AUTO_TOP_UP: '/auto-topup/toggle',
  GET_CONTRACT: '/contract/current',
  CONTRACT_STATUS: '/contract/status',
};

billingRouter.use(
    checkAuth,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.USER])
);

// billingRouter.get(
//     API.GET_CONTRACT,
//     billingController.getCurrentContract
// );

// billingRouter.get(
//     API.CONTRACT_STATUS,
//     billingController.getContractStatus
// );

// billingRouter.post(
//     API.ACCEPT_CONTRACT, 
//     celebrate(BillingSchema.acceptContract),
//     billingController.acceptContract
// );

billingRouter.post(
    API.SAVE_CARD, 
    celebrate(BillingSchema.saveCard),
    billingController.saveCard
);

// billingRouter.post(
//     API.ADD_FUNDS, 
//     celebrate(BillingSchema.addFunds),
//     billingController.addFunds
// );

// billingRouter.post(
//     API.ASSIGN_LEAD, 
//     celebrate(BillingSchema.assignLead),
//     billingController.assignLead
// );

// billingRouter.post(
//     API.CHARGE_USER,
//     authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
//     celebrate(BillingSchema.chargeUser),
//     billingController.chargeUser
// );

// billingRouter.get(
//     API.BALANCE,
//     billingController.getBalance
// );

// billingRouter.get(
//     API.TRANSACTIONS,
//     billingController.getTransactions
// );

// billingRouter.post(
//     API.AUTO_TOP_UP,
//     celebrate(BillingSchema.toggleAutoTopUp),
//     billingController.toggleAutoTopUp
// );

module.exports = billingRouter;