const express = require('express');
const billingRouter = express.Router();
const billingController = require('../../controllers/billing/billing.controller.js');
const checkAuth = require('../../middleware/check-auth.js');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const BillingSchema = require('../../request-schemas/billing.schema.js');
const { celebrate } = require('celebrate');
const { Joi, Segments } = require('celebrate');
const { generateTransactionReceipt } = require('../../services/pdf/receiptGenerator');
const { User } = require('../../models/user.model');
const Transaction = require('../../models/transaction.model');





const API = {
  BILLING_INFO: '/',
  SAVE_CARD: '/save-card',
  ADD_FUNDS: '/add-funds',
  ACCEPT_CONTRACT: '/contract/accept',
  ASSIGN_LEAD: '/assign-lead',
  CHARGE_USER: '/charge-user',
  BALANCE: '/balance',
  TRANSACTIONS: '/transactions',
  USERS_TRANSACTIONS: '/users-transactions',
  AUTO_TOP_UP: '/auto-topup/toggle',
  GET_CONTRACT: '/contract/current',
  CONTRACT_STATUS: '/contract/status',
  GET_CARDS: '/cards', // NEW
  SET_DEFAULT_CARD: '/cards/default', // NEW
  DELETE_CARD: '/cards/:vaultId',
  TEST_AUTO_TOPUP: '/test-auto-topup',
  REVENUE_FROM_NMI: '/revenue-from-nmi',
  RECEIPT: '/receipts/:txnId', // 
  CHARGE_SINGLE_LEAD: '/charge-single-lead/:leadId',
};

// Info endpoint for Billing API
billingRouter.get(API.BILLING_INFO, (req, res) => {
  res.json({
    message: 'LeadFusionHQ Billing API',
    version: '1.0.0',
    siteURL: 'https://api.leadfusionhq.com',
    baseUrl: '/api/billing',
    endpoints: {
      cards: {
        saveCard: 'POST /api/billing/save-card',
        getCards: 'GET /api/billing/cards',
        setDefaultCard: 'POST /api/billing/cards/default',
        deleteCard: 'DELETE /api/billing/cards/:vaultId'
      },
      funds: {
        addFunds: 'POST /api/billing/add-funds',
        testAutoTopUp: 'POST /api/billing/test-auto-topup',
        toggleAutoTopUp: 'POST /api/billing/auto-topup/toggle',
        getBalance: 'GET /api/billing/balance',
        getTransactions: 'GET /api/billing/transactions'
      },
      contracts: {
        acceptContract: 'POST /api/billing/contract/accept [INACTIVE]',
        getCurrentContract: 'GET /api/billing/contract/current [INACTIVE]',
        getContractStatus: 'GET /api/billing/contract/status [INACTIVE]'
      },
      admin: {
        chargeUser: 'POST /api/billing/charge-user [INACTIVE]',
        assignLead: 'POST /api/billing/assign-lead [INACTIVE]'
      }
    },
    security: {
      auth: 'JWT-based authentication required',
      roles: 'Access restricted to users with USER role (some endpoints ADMIN only)'
    }
  });
});



billingRouter.use(
  checkAuth,
  authorizedRoles([
    CONSTANT_ENUM.USER_ROLE.ADMIN,
    CONSTANT_ENUM.USER_ROLE.USER
  ])
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
  API.TEST_AUTO_TOPUP,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      deductAmount: Joi.number().min(0.01).required()
    })
  }),
  billingController.testAutoTopUp
);

billingRouter.post(
  API.SAVE_CARD,
  celebrate(BillingSchema.saveCard),
  billingController.saveCard
);

billingRouter.post(
  API.ADD_FUNDS,
  celebrate(BillingSchema.addFunds),
  billingController.addFunds
);

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

billingRouter.get(
  API.BALANCE,
  billingController.getBalance
);

billingRouter.get(
  API.TRANSACTIONS,
  billingController.getTransactions
);

billingRouter.get(
  API.USERS_TRANSACTIONS,
  billingController.getUsersTransactions
);

billingRouter.post(
  API.AUTO_TOP_UP,
  celebrate(BillingSchema.toggleAutoTopUp),
  billingController.toggleAutoTopUp
);
billingRouter.get(
  API.REVENUE_FROM_NMI,
  // checkAuth,
  // authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
  billingController.getRevenueFromGateway
);

billingRouter.get(
  '/all-sys-transactions',
  billingController.getAllSystemTransactions
);



billingRouter.get(API.GET_CARDS, billingController.getCards);
billingRouter.post(API.SET_DEFAULT_CARD, billingController.setDefaultCard);
billingRouter.delete(API.DELETE_CARD, billingController.deleteCard);


// routes/billing/billing.routes.js

billingRouter.get(
  API.RECEIPT,
  celebrate({
    [Segments.PARAMS]: Joi.object({
      txnId: Joi.string().trim().required(),
    }),
    [Segments.QUERY]: Joi.object({
      mobile: Joi.string().valid('0', '1').optional(),
      download: Joi.string().valid('0', '1').optional()
    }).unknown(true)
  }),
  billingController.getReceipt
);


billingRouter.post(
  API.CHARGE_SINGLE_LEAD,
  // celebrate(BillingSchema.chargeSingleLead),
  billingController.chargeSingleLead
);

billingRouter.post(
  '/retry-pending-payments',
  // checkAuth, // Already applied globally to router
  billingController.retryPendingPayments
);

module.exports = billingRouter;