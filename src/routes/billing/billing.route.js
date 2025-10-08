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
  BILLING_INFO:'/',
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
  GET_CARDS: '/cards', // NEW
  SET_DEFAULT_CARD: '/cards/default', // NEW
  DELETE_CARD: '/cards/:vaultId' ,
  TEST_AUTO_TOPUP: '/test-auto-topup',
  REVENUE_FROM_NMI: '/revenue-from-nmi',
  RECEIPT: '/receipts/:txnId', // 
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



billingRouter.get(API.GET_CARDS, billingController.getCards);
billingRouter.post(API.SET_DEFAULT_CARD, billingController.setDefaultCard);
billingRouter.delete(API.DELETE_CARD, billingController.deleteCard);


billingRouter.get('/receipts/:txnId', async (req, res) => {
  try {
    const { txnId } = req.params;
    const mobile = req.query.mobile === '1'; // <-- NEW

    let txn = await Transaction.findOne({ transaction_id: txnId }).lean();
    if (!txn) txn = await Transaction.findById(txnId).lean();
    if (!txn) return res.status(404).send('Receipt not found');

    const user = await User.findById(txn.userId || txn.user_id).lean();

    const pdf = await generateTransactionReceipt({
      transactionId: txn.transaction_id || String(txn._id),
      userName: user?.name || 'Customer',
      userEmail: user?.email || '',
      transactionType: txn.description || txn.type || 'Transaction',
      amount: Number(txn.amount),
      date: new Date(txn.createdAt).toLocaleString(),
      newBalance: txn.balance_after ?? txn.balanceAfter ?? 0,
      oldBalance: txn.balance_before ?? undefined,
      description: txn.description || '',
      paymentMethod: txn.paymentMethodDetails
        ? `${txn.paymentMethodDetails.brand || 'Card'} •••• ${txn.paymentMethodDetails.lastFour || ''}`
        : (txn.paymentMethod || ''),
      // pass logo optionally; default loader tries public/images/logo.png
      // logoPath: path.join(process.cwd(), 'public/images/logo.png'),
      mobile // <-- activate mobile layout when ?mobile=1
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${txnId}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    console.error('Receipt route error:', err);
    res.status(500).send('Failed to generate receipt');
  }
});



module.exports = billingRouter;