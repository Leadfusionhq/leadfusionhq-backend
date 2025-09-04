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
  CARGE_USER: '/charge-user',

  BALANCE: '/balance',
  TRANSACTIONS: '/transactions',
  AUTO_TOP_UP: '/auto-topup/toggle',


};
billingRouter.use(
    checkAuth,
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN], [CONSTANT_ENUM.USER_ROLE.USER])
);



billingRouter.post(
    API.SAVE_CARD, 
    celebrate(BillingSchema.saveCard),
    billingController.saveCard
);


module.exports = billingRouter;
