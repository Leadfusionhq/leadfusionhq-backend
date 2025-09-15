const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const BillingServices = require('../../services/billing/billing.service.js');
const { ErrorHandler } = require('../../utils/error-handler');
const { getPaginationParams, extractFilters } = require('../../utils/pagination');
const { User } = require('../../models/user.model');

// Contract management
const getCurrentContract = wrapAsync(async (req, res) => {
    const contract = await BillingServices.getCurrentContract();
    return sendResponse(res, { contract }, 'Current contract retrieved successfully');
});

const getContractStatus = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const status = await BillingServices.getUserContractStatus(user_id);
    return sendResponse(res, { status }, 'Contract status retrieved successfully');
});

const acceptContract = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { version, ipAddress } = req.body;
    
    try {
        const result = await BillingServices.acceptContract(user_id, version, ipAddress);
        return sendResponse(res, { result }, 'Contract accepted successfully', 201);
    } catch (err) {
        console.error(`Failed to accept contract:`, err.message);
        throw new ErrorHandler(500, 'Failed to accept contract. Please try again later.');
    }
});

// Card management
const saveCard = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    
    // const contractStatus = await BillingServices.getUserContractStatus(user_id);
    // if (!contractStatus.hasAcceptedLatest) {
    //     throw new ErrorHandler(400, 'You must accept the latest contract before saving payment information.');
    // }
    
    const cardData = { ...req.body, user_id };

    try {
        const data = await BillingServices.saveCard(cardData);
        return sendResponse(res, { data }, 'Your card details have been saved', 201);
    } catch (err) {
        console.error(`Failed to save card:`, err.message);
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
    
    try {
        const result = await BillingServices.testAutoTopUpFunctionality(user_id, deductAmount);
        return sendResponse(res, { result }, 'Auto top-up test completed');
    } catch (err) {
        console.error(`Failed to test auto top-up:`, err.message);
        throw new ErrorHandler(500, 'Failed to test auto top-up functionality.');
    }
});
  



// Billing operations
const addFunds = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { amount } = req.body;
    
    // Check if user has accepted the latest contract
    const contractStatus = await BillingServices.getUserContractStatus(user_id);
    if (!contractStatus.hasAcceptedLatest) {
        throw new ErrorHandler(400, 'You must accept the latest contract before adding funds.');
    }
    
    try {
        const result = await BillingServices.addFunds(user_id, amount);
        return sendResponse(res, { result }, 'Funds added successfully', 201);
    } catch (err) {
        console.error(`Failed to add funds:`, err.message);
        
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


const toggleAutoTopUp = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const autoTopUpData = req.body;
   
    try {
      const result = await BillingServices.toggleAutoTopUp(user_id, autoTopUpData);
      const action = autoTopUpData.enabled ? 'enabled' : 'disabled';
      return sendResponse(res, { result }, `Auto top-up ${action} successfully`);
    } catch (err) {
      console.error(`Failed to toggle auto top-up:`, err.message);
      throw new ErrorHandler(500, 'Failed to update auto top-up settings. Please try again later.');
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
};