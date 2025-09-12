const { User } = require('../../models/user.model');
const { Transaction } = require('../../models/transaction.model');

// const { ContractAcceptance } = require('../../models/ContractAcceptance');
const { createCustomerVault, chargeCustomerVault ,deleteCustomerVault} = require('../nmi/nmi.service');
const { ErrorHandler } = require('../../utils/error-handler');

// Contract management
const getCurrentContract = async () => {
  const contract = await Contract.findOne({ isActive: true }).sort({ version: -1 });
  if (!contract) {
    throw new ErrorHandler(404, 'No active contract found');
  }
  return contract;
};

const getUserContractStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }

  // Simply check if the user has accepted any contract (acceptedAt exists)
  const hasAcceptedLatest = !!user.contractAcceptance?.acceptedAt;

  return {
    hasAcceptedLatest,
    acceptedAt: user.contractAcceptance?.acceptedAt,
    contract: user.contractAcceptance || null
  };
};

// const acceptContract = async (userId, version, ipAddress) => {
//   const contract = await Contract.findOne({ version, isActive: true });
//   if (!contract) {
//     throw new ErrorHandler(404, 'Contract version not found or inactive');
//   }

//   // Check if already accepted
//   const existingAcceptance = await ContractAcceptance.findOne({
//     userId,
//     contractVersion: version
//   });

//   if (existingAcceptance) {
//     throw new ErrorHandler(400, 'Contract already accepted');
//   }

//   const acceptance = new ContractAcceptance({
//     userId,
//     contractVersion: version,
//     contractId: contract._id,
//     acceptedAt: new Date(),
//     ipAddress,
//     userAgent: 'API_CALL' // You might want to pass this from the request
//   });

//   await acceptance.save();

//   return {
//     contractVersion: version,
//     acceptedAt: acceptance.acceptedAt
//   };
// };

// Card management
const saveCard = async (cardData) => {
  const { user_id, card_number, expiry_month, expiry_year, cvv, billing_address, zip, full_name } = cardData;

  const [first_name, ...last_nameParts] = full_name.split(" ");
  const last_name = last_nameParts.join(" ");

  const expYear = expiry_year.toString().slice(-2);

  const payload = {
    billing_first_name: first_name,
    billing_last_name: last_name,
    billing_address1: billing_address || '123 Default St',
    billing_zip: zip || '00000',
    ccnumber: card_number,
    ccexp: `${expiry_month}${expYear}`,
    cvv: cvv
  };

  let vaultResponse;
  try {
    vaultResponse = await createCustomerVault(payload);
  } catch (err) {
    console.error('NMI vault creation error:', err.message);
    throw new ErrorHandler(500, 'Failed to save card to payment gateway');
  }

  const responseText = typeof vaultResponse === 'string' ? vaultResponse : '';
  if (!responseText) {
    throw new ErrorHandler(500, 'Invalid response from payment gateway');
  }

  const params = Object.fromEntries(
    responseText.split('&').map(p => {
      const [k, v] = p.split('=');
      return [k, decodeURIComponent(v || '')];
    })
  );

  if (params.response !== '1') {
    throw new ErrorHandler(400, params.responsetext || 'Failed to save card');
  }

  const vaultId = params.customer_vault_id;
  if (!vaultId) {
    throw new ErrorHandler(500, 'Failed to retrieve customer vault ID from gateway');
  }

  // 🔹 Save to DB as new payment method
  const user = await User.findById(user_id);
  if (!user) throw new ErrorHandler(404, 'User not found');

  // Detect card brand
  const cardBrand = detectCardBrand(card_number);

  const newPaymentMethod = {
    customerVaultId: vaultId,
    cardLastFour: card_number.slice(-4),
    brand: cardBrand,
    expiryMonth: expiry_month,
    expiryYear: expiry_year,
    isDefault: user.paymentMethods.length === 0 // Set as default if first card
  };

  // Add to payment methods array
  user.paymentMethods.push(newPaymentMethod);
  
  // If this is the first card, set it as default
  if (user.paymentMethods.length === 1) {
    user.defaultPaymentMethod = vaultId;
  }

  user.hasStoredCard = true;
  await user.save();

  return {
    customerVaultId: vaultId,
    userId: user._id,
    cardLastFour: newPaymentMethod.cardLastFour,
    brand: cardBrand,
    isDefault: newPaymentMethod.isDefault
  };
};

// Add helper function
const detectCardBrand = (cardNumber) => {
  const card = cardNumber.replace(/\D/g, '');
  if (/^4/.test(card)) return 'Visa';
  if (/^5[1-5]/.test(card)) return 'Mastercard';
  if (/^3[47]/.test(card)) return 'Amex';
  if (/^6(?:011|5)/.test(card)) return 'Discover';
  return 'Unknown';
};



// Billing operations
const addFunds = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  // FIRST: Try to use the new paymentMethods system
  let customerVaultIdToUse;
  let defaultPaymentMethod;
  
  // Check if user has paymentMethods with a default
  if (user.paymentMethods && user.paymentMethods.length > 0) {
    defaultPaymentMethod = user.paymentMethods.find(pm => pm.isDefault);
    if (defaultPaymentMethod && defaultPaymentMethod.customerVaultId) {
      customerVaultIdToUse = defaultPaymentMethod.customerVaultId;
    }
  }
  
  // SECOND: Fallback to old top-level customerVaultId (for backward compatibility)
  if (!customerVaultIdToUse && user.customerVaultId) {
    customerVaultIdToUse = user.customerVaultId;
    // Create a mock payment method object for transaction recording
    defaultPaymentMethod = {
      cardLastFour: 'N/A',
      brand: 'Unknown'
    };
  }
  
  // FINALLY: If still no vault ID, throw error
  if (!customerVaultIdToUse) {
    throw new ErrorHandler(400, 'No payment method found. Please add a card first.');
  }

  // Charge using the found vault ID
  const chargeResult = await chargeCustomerVault(customerVaultIdToUse, amount, 'Add funds to account');
  
  if (!chargeResult.success) {
    // Handle specific decline cases
    if (chargeResult.responseCode === '2') {
      throw new ErrorHandler(400, `Payment declined: ${chargeResult.message}. Please use a different payment method.`);
    } else if (chargeResult.responseCode === '3') {
      throw new ErrorHandler(400, 'Payment error. Please contact your bank or use a different card.');
    }
    
    throw new ErrorHandler(400, 'Payment failed: ' + chargeResult.message);
  }

  // Add to user's balance
  user.balance = (user.balance || 0) + parseFloat(amount);
  await user.save();

  try {
    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'ADD_FUNDS',
      amount: parseFloat(amount),
      status: 'COMPLETED',
      description: 'Funds added to account',
      paymentMethod: 'CARD',
      transactionId: chargeResult.transactionId,
      balanceAfter: user.balance,
      // Store payment method details for reference
      paymentMethodDetails: {
        lastFour: defaultPaymentMethod.cardLastFour,
        brand: defaultPaymentMethod.brand,
        customerVaultId: customerVaultIdToUse
      }
    });
    await transaction.save();

    return {
      success: true,
      newBalance: user.balance,
      customerVaultId: customerVaultIdToUse,
      transactionId: transaction._id,
      paymentTransactionId: chargeResult.transactionId,
      message: 'Funds added successfully'
    };

  } catch (transactionError) {
    console.error('Transaction creation error:', transactionError);
    
    // Even if transaction recording fails, the payment was successful
    return {
      success: true,
      newBalance: user.balance,
      customerVaultId: customerVaultIdToUse,
      paymentTransactionId: chargeResult.transactionId,
      message: 'Funds added successfully (transaction record failed)',
      warning: 'Transaction record could not be created'
    };
  }
};


const assignLead = async (userId, leadId, leadCost, assignedBy) => {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  const currentBalance = user.balance || 0;
  
  // Check if user has sufficient balance
  if (currentBalance >= leadCost) {
    // Deduct from balance
    user.balance = currentBalance - leadCost;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'LEAD_ASSIGNMENT',
      amount: -leadCost,
      status: 'COMPLETED',
      description: `Lead assigned: ${leadId}`,
      paymentMethod: 'BALANCE',
      leadId,
      assignedBy,
      balanceAfter: user.balance
    });
    await transaction.save();

    return {
      paymentMethod: 'BALANCE',
      newBalance: user.balance,
      transactionId: transaction._id,
      leadId
    };
  } else {
    // Insufficient balance - charge card automatically
    if (!user.customerVaultId) {
      throw new ErrorHandler(400, 'Insufficient balance and no payment method on file. Please add funds first.');
    }

    // Charge the user's card for the lead cost
    const chargeResult = await chargeCustomerVault(user.customerVaultId, leadCost, `Lead assignment: ${leadId}`);
    
    if (!chargeResult.success) {
      throw new ErrorHandler(400, 'Payment failed: ' + chargeResult.message);
    }

    // Create transaction record for card charge
    const transaction = new Transaction({
      userId,
      type: 'LEAD_ASSIGNMENT',
      amount: -leadCost,
      status: 'COMPLETED',
      description: `Lead assigned: ${leadId} (Auto-charged)`,
      paymentMethod: 'CARD',
      transactionId: chargeResult.transactionId,
      leadId,
      assignedBy,
      balanceAfter: user.balance
    });
    await transaction.save();

    return {
      paymentMethod: 'CARD',
      currentBalance: user.balance,
      transactionId: transaction._id,
      paymentTransactionId: chargeResult.transactionId,
      leadId
    };
  }
};

const manualCharge = async (userId, amount, note, chargedBy) => {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  if (!user.customerVaultId) {
    throw new ErrorHandler(400, 'No payment method on file for this user.');
  }

  // Charge the user's card
  const chargeResult = await chargeCustomerVault(user.customerVaultId, amount, note || 'Manual charge');
  
  if (!chargeResult.success) {
    throw new ErrorHandler(400, 'Payment failed: ' + chargeResult.message);
  }

  // Create transaction record
  const transaction = new Transaction({
    userId,
    type: 'MANUAL_CHARGE',
    amount: -amount,
    status: 'COMPLETED',
    description: note || 'Manual charge',
    paymentMethod: 'CARD',
    transactionId: chargeResult.transactionId,
    chargedBy,
    balanceAfter: user.balance
  });
  await transaction.save();

  return {
    transactionId: transaction._id,
    paymentTransactionId: chargeResult.transactionId,
    amount
  };
};

// Account information
const getUserBalance = async (userId) => {
  const user = await User.findById(userId).select('balance hasStoredCard cardLastFour autoTopUp');
  if (!user) throw new ErrorHandler(404, 'User not found');

  return {
    balance: user.balance || 0,
    hasStoredCard: user.hasStoredCard || false,
    cardLastFour: user.cardLastFour,
    autoTopUp: user.autoTopUp || { enabled: false }
  };
};

const getUserTransactions = async (userId, page = 1, limit = 20, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = { userId };

  // Apply filters
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments(query);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const toggleAutoTopUp = async (userId, enabled) => {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  if (enabled && !user.customerVaultId) {
    throw new ErrorHandler(400, 'Please add a payment method before enabling auto top-up.');
  }

  user.autoTopUp = {
    enabled,
    updatedAt: new Date()
  };
  await user.save();

  return {
    autoTopUp: user.autoTopUp
  };
};


/**
 * Delete a user card (DB + NMI Vault)
 */
const deleteUserCard = async (userId, vaultId) => {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  const cardIndex = user.paymentMethods.findIndex(pm => pm.customerVaultId === vaultId);
  if (cardIndex === -1) throw new ErrorHandler(404, 'Card not found');

  const cardToDelete = user.paymentMethods[cardIndex];

  // Cannot delete the only card
  if (user.paymentMethods.length === 1) {
    throw new ErrorHandler(400, 'Cannot delete your only payment method');
  }

  // Try deleting from NMI Vault first
  const nmiDelete = await deleteCustomerVault(vaultId);
  if (!nmiDelete.success) {
    throw new ErrorHandler(500, 'Failed to delete card from NMI vault. Please try again.');
  }

  // If deleting default card, assign another as default
  if (cardToDelete.isDefault) {
    const newDefaultCard = user.paymentMethods.find(pm => pm.customerVaultId !== vaultId);
    if (newDefaultCard) {
      newDefaultCard.isDefault = true;
      user.defaultPaymentMethod = newDefaultCard.customerVaultId;
    }
  }

  // Remove the card from DB
  user.paymentMethods.splice(cardIndex, 1);

  // Update hasStoredCard if no cards left
  user.hasStoredCard = user.paymentMethods.length > 0;

  await user.save();

  return {
    success: true,
    message: 'Card deleted successfully',
    nmiResponse: nmiDelete.rawResponse,
  };
};

module.exports = {
  getCurrentContract,
  getUserContractStatus,
  // acceptContract,
  saveCard,
  addFunds,
  assignLead,
  manualCharge,
  getUserBalance,
  getUserTransactions,
  toggleAutoTopUp,
  deleteUserCard,
};