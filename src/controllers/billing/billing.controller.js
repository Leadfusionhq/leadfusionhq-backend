const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const BillingServices = require('../../services/billing/billing.service.js');
const { ErrorHandler } = require('../../utils/error-handler');
const { getPaginationParams, extractFilters } = require('../../utils/pagination');
const { User } = require('../../models/user.model');
const { billingLogger } = require('../../utils/logger');
const dayjs = require('dayjs');


const { getRevenueFromNmi, getRefundsFromNmi } = require('../../services/nmi/nmi.service'); // import

// Contract management
const getCurrentContract = wrapAsync(async (req, res) => {
    billingLogger.info('Getting current contract');
    const contract = await BillingServices.getCurrentContract();
    billingLogger.info('Current contract retrieved successfully');
    return sendResponse(res, { contract }, 'Current contract retrieved successfully');
});

const getContractStatus = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    billingLogger.info('Getting contract status for user', { userId: user_id });
    const status = await BillingServices.getUserContractStatus(user_id);
    billingLogger.info('Contract status retrieved successfully', { userId: user_id, status });
    return sendResponse(res, { status }, 'Contract status retrieved successfully');
});


// ✅ Add this controller
const getRevenueFromGateway = wrapAsync(async (req, res) => {
    const { range = 'mtd', start, end, includeRefunds = '0' } = req.query;
  
    let from = dayjs().startOf('month');
    let to = dayjs().endOf('day');
    if (range === 'today') { from = dayjs().startOf('day'); to = dayjs().endOf('day'); }
    if (range === '7d') { from = dayjs().subtract(6, 'day').startOf('day'); to = dayjs().endOf('day'); }
    if (range === '30d') { from = dayjs().subtract(29, 'day').startOf('day'); to = dayjs().endOf('day'); }
    if (range === 'custom' && start && end) {
      from = dayjs(start).startOf('day');
      to = dayjs(end).endOf('day');
    }
  
    const { totalAmount: sales, count: salesCount } = await getRevenueFromNmi({ start: from, end: to });
  
    let refunds = 0;
    let refundCount = 0;
    if (includeRefunds === '1') {
      const r = await getRefundsFromNmi({ start: from, end: to });
      refunds = r.totalAmount;
      refundCount = r.count;
    }
  
    const totalAmount = sales - refunds;
  
    return sendResponse(res, {
      totalAmount,
      sales,
      refunds,
      salesCount,
      refundCount,
      from: from.toISOString(),
      to: to.toISOString()
    }, 'Revenue fetched successfully');
  });
  

const acceptContract = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { version, ipAddress } = req.body;
    
    billingLogger.info('User attempting to accept contract', { 
        userId: user_id, 
        version, 
        ipAddress 
    });
    
    try {
        const result = await BillingServices.acceptContract(user_id, version, ipAddress);
        billingLogger.info('Contract accepted successfully', { 
            userId: user_id, 
            version, 
            result 
        });
        return sendResponse(res, { result }, 'Contract accepted successfully', 201);
    } catch (err) {
        billingLogger.error('Failed to accept contract', err, { 
            userId: user_id, 
            version, 
            ipAddress 
        });
        throw new ErrorHandler(500, 'Failed to accept contract. Please try again later.');
    }
});

// Card management
const saveCard = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const email = req.user.email;
    
    // const contractStatus = await BillingServices.getUserContractStatus(user_id);
    // if (!contractStatus.hasAcceptedLatest) {
    //     throw new ErrorHandler(400, 'You must accept the latest contract before saving payment information.');
    // }
    
    const cardData = { ...req.body, user_id , email};
    
    billingLogger.info('User attempting to save card', { 
        userId: user_id,
        cardLast4: req.body.ccnumber ? req.body.ccnumber.slice(-4) : 'N/A'
    });

    try {
        const data = await BillingServices.saveCard(cardData);
        billingLogger.info('Card details saved successfully', { 
            userId: user_id,
            vaultId: data.customerVaultId 
        });
        return sendResponse(res, { data }, 'Your card details have been saved', 201);
    } catch (err) {
        billingLogger.error('Failed to save card', err, { userId: user_id });
        throw new ErrorHandler(500, 'Failed to save your card details. Please try again later.');
    }
});

// Get all user cards
const getCards = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    console.log(req);
    const user = await User.findById(user_id);
    if (!user) throw new ErrorHandler(404, 'User not found');
  
    return sendResponse(res, { cards: user.paymentMethods }, 'Cards retrieved successfully');
  });
  
  // Set default card
  const setDefaultCard = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { vaultId } = req.body;
  
    const user = await User.findById(user_id);
    if (!user) throw new ErrorHandler(404, 'User not found');
  
    // Find the card
    const card = user.paymentMethods.find(pm => pm.customerVaultId === vaultId);
    if (!card) throw new ErrorHandler(404, 'Card not found');
  
    // Update all cards to not default
    user.paymentMethods.forEach(pm => {
      pm.isDefault = pm.customerVaultId === vaultId;
    });
  
    // Set the selected card as default
    user.defaultPaymentMethod = vaultId;
  
    await user.save();
  
    return sendResponse(res, { defaultCard: card }, 'Default card updated successfully');
  });
  
  // Delete card


  const deleteCard = wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const { vaultId } = req.params;
  
    const result = await BillingServices.deleteUserCard(userId, vaultId);
  
    return sendResponse(res, { nmiResponse: result.nmiResponse }, result.message);
  });
  
  const testAutoTopUp = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { deductAmount } = req.body;
    
    billingLogger.info('Testing auto top-up for user', { 
        userId: user_id, 
        deductAmount 
    });
    
    try {
      const result = await BillingServices.testLeadDeduction(user_id, deductAmount);
      billingLogger.info('Auto top-up test completed', { 
          userId: user_id, 
          deductAmount, 
          result: result.message 
      });
      return sendResponse(res, { result }, result.message);
    } catch (err) {
      billingLogger.error('Failed to process lead deduction', err, { 
          userId: user_id, 
          deductAmount 
      });
      
      // Pass through the specific error message for insufficient funds
      if (err.statusCode === 400) {
        throw new ErrorHandler(400, err.message);
      }
      
      throw new ErrorHandler(500, 'Failed to process lead deduction. Please try again later.');
    }
  });



// Billing operations
const addFunds = wrapAsync(async (req, res) => {
    console.log(req.body);
    
    const user_id = req.user._id;
    const { amount, vaultId} = req.body;
    
    billingLogger.info('User attempting to add funds', { 
        userId: user_id, 
        amount 
    });
    
    // Check if user has accepted the latest contract
    const contractStatus = await BillingServices.getUserContractStatus(user_id);
    if (!contractStatus.hasAcceptedLatest) {
        billingLogger.warn('User tried to add funds without accepting contract', { 
            userId: user_id, 
            amount 
        });
        throw new ErrorHandler(400, 'You must accept the latest contract before adding funds.');
    }
    
    try {
        const result = await BillingServices.addFunds(user_id, amount , vaultId);
        billingLogger.info('Funds added successfully', { 
            userId: user_id, 
            amount, 
            transactionId: result.transactionId 
        });
        return sendResponse(res, { result }, 'Funds added successfully', 201);
    } catch (err) {
        billingLogger.error('Failed to add funds', err, { 
            userId: user_id, 
            amount 
        });

        console.log(`error received in billing controller is ${err.message}`)
        
        // Check if it's a payment decline (400 error) and pass through the message
        if (err.statusCode === 400) {
            throw new ErrorHandler(400, err.message);
        }
        
        throw new ErrorHandler(500, 'Failed to add funds. Please try again later.');
    }
});

const assignLead = wrapAsync(async (req, res) => {
    const { userId, leadId, leadCost } = req.body;
    const assignedBy = req.user._id;
    
    try {
        const result = await BillingServices.assignLead(userId, leadId, leadCost, assignedBy);
        return sendResponse(res, { result }, 'Lead assigned successfully', 201);
    } catch (err) {
        console.error(`Failed to assign lead:`, err.message);
        throw new ErrorHandler(500, 'Failed to assign lead. Please try again later.');
    }
});

const chargeUser = wrapAsync(async (req, res) => {
    const { userId, amount, note } = req.body;
    const chargedBy = req.user._id;
    
    try {
        const result = await BillingServices.manualCharge(userId, amount, note, chargedBy);
        return sendResponse(res, { result }, 'User charged successfully', 201);
    } catch (err) {
        console.error(`Failed to charge user:`, err.message);
        throw new ErrorHandler(500, 'Failed to charge user. Please try again later.');
    }
});

// Account information
const getBalance = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    
    try {
        const balance = await BillingServices.getUserBalance(user_id);
        return sendResponse(res, { balance }, 'Balance retrieved successfully');
    } catch (err) {
        console.error(`Failed to get balance:`, err.message);
        throw new ErrorHandler(500, 'Failed to retrieve balance. Please try again later.');
    }
});

const getTransactions = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { page, limit } = getPaginationParams(req.query);
    const filters = extractFilters(req.query, ['type', 'status', 'dateFrom', 'dateTo']);
    
    try {
        const transactions = await BillingServices.getUserTransactions(user_id, page, limit, filters);
        return sendResponse(res, { 
            transactions: transactions.transactions,
            pagination: transactions.pagination
        }, 'Transactions retrieved successfully');
    } catch (err) {
        console.error(`Failed to get transactions:`, err.message);
        
        // Check if it's a known error or a database error
        if (err.message.includes('Failed to retrieve transactions')) {
            throw new ErrorHandler(500, 'Failed to retrieve transactions. Please try again later.');
        } else {
            throw new ErrorHandler(400, 'Invalid request parameters.');
        }
    }
});


// Update the toggleAutoTopUp function:
const toggleAutoTopUp = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { paymentMode, enabled } = req.body; // ✅ Accept enabled from request
    
    try {
      const result = await BillingServices.updatePaymentMode(user_id, {
        paymentMode,
        enabled // ✅ Pass enabled to service
      });
      
      const statusText = enabled ? 'enabled' : 'disabled';
      return sendResponse(res, { result }, `Payment mode updated to ${paymentMode} (auto top-up ${statusText})`);
    } catch (err) {
      console.error(`Failed to update payment mode:`, err.message);
      throw new ErrorHandler(500, 'Failed to update payment mode. Please try again later.');
    }
  });

module.exports = {
    getCurrentContract,
    getContractStatus,
    acceptContract,
    saveCard,
    addFunds,
    assignLead,
    chargeUser,
    getBalance,
    getTransactions,
    toggleAutoTopUp,
    getCards,
    setDefaultCard,
    deleteCard,
    testAutoTopUp,
    getRevenueFromGateway,
};
