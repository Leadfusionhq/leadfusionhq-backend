const { User } = require('../../models/user.model');
const { Transaction } = require('../../models/transaction.model');
// const { Contract } = require('../../models/user.model');
// const { ContractAcceptance } = require('../../models/ContractAcceptance');
const { createCustomerVault, chargeCustomerVault } = require('../nmi/nmi.service');
const { ErrorHandler } = require('../../utils/error-handler');

// Contract management
// const getCurrentContract = async () => {
//   const contract = await Contract.findOne({ isActive: true }).sort({ version: -1 });
//   if (!contract) {
//     throw new ErrorHandler(404, 'No active contract found');
//   }
//   return contract;
// };

// const getUserContractStatus = async (userId) => {
//   const currentContract = await getCurrentContract();
//   const acceptance = await ContractAcceptance.findOne({
//     userId,
//     contractVersion: currentContract.version
//   });

//   return {
//     currentVersion: currentContract.version,
//     hasAcceptedLatest: !!acceptance,
//     acceptedAt: acceptance?.acceptedAt,
//     contract: currentContract
//   };
// };

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

  const payload = {
    first_name: full_name,
    card_number,
    expiration_date: `${expiry_month}${expiry_year}`,
    cvv,
    address1: billing_address || '',
    zip,
  };

  let vaultResponse;

  try {
    vaultResponse = await createCustomerVault(payload);
  } catch (err) {
    console.error('NMI vault creation error:', err.message);
    throw new ErrorHandler(500, 'Failed to save card to payment gateway');
  }
  console.log('vaultResponse',vaultResponse);
  const responseText = vaultResponse?.data;

  if (!responseText || typeof responseText !== 'string') {
    console.error('Unexpected vault response format:', responseText);
    throw new ErrorHandler(500, 'Invalid response from payment gateway');
  }

  const vaultIdMatch = responseText.match(/customer_vault_id=(\d+)/);

  const vaultId = vaultIdMatch ? vaultIdMatch[1] : null;

  if (!vaultId) {
    throw new ErrorHandler(500, 'Failed to retrieve customer vault ID from gateway');
  }

  const user = await User.findById(user_id);
  if (!user) throw new ErrorHandler(404, 'User not found');

  user.customerVaultId = vaultId;
  user.cardLastFour = card_number.slice(-4);
  user.hasStoredCard = true;
  await user.save();

  return {
    customerVaultId: vaultId,
    userId: user._id,
    cardLastFour: user.cardLastFour
  };
};

// Billing operations
const addFunds = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  if (!user.customerVaultId) {
    throw new ErrorHandler(400, 'No payment method on file. Please add a card first.');
  }

  // Charge the user's card
  const chargeResult = await chargeCustomerVault(user.customerVaultId, amount, 'Add funds to account');
  
  if (!chargeResult.success) {
    throw new ErrorHandler(400, 'Payment failed: ' + chargeResult.message);
  }

  // Add to user's balance
  user.balance = (user.balance || 0) + amount;
  await user.save();

  // Create transaction record
  const transaction = new Transaction({
    userId,
    type: 'ADD_FUNDS',
    amount,
    status: 'COMPLETED',
    description: 'Funds added to account',
    paymentMethod: 'CARD',
    transactionId: chargeResult.transactionId,
    balanceAfter: user.balance
  });
  await transaction.save();

  return {
    newBalance: user.balance,
    transactionId: transaction._id,
    paymentTransactionId: chargeResult.transactionId
  };
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

module.exports = {
  // getCurrentContract,
  // getUserContractStatus,
  // acceptContract,
  saveCard,
  addFunds,
  assignLead,
  manualCharge,
  getUserBalance,
  getUserTransactions,
  toggleAutoTopUp,
};