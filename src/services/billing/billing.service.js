const { User } = require('../../models/user.model');
const  Transaction  = require('../../models/transaction.model');
const mongoose = require('mongoose');
// const { ContractAcceptance } = require('../../models/ContractAcceptance');
const { createCustomerVault, chargeCustomerVault ,deleteCustomerVault} = require('../nmi/nmi.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { RegularUser } = require('../../models/user.model');
const { billingLogger } = require('../../utils/logger');
const NMI_QUERY_URL = process.env.NMI_QUERY_URL;
const SECURITY_KEY = process.env.NMI_SECURITY_KEY;
const dayjs = require('dayjs');
const fetchWrapper = require('../../utils/fetchWrapper');
const {sendBalanceTopUpAlert} = require('../../services/n8n/webhookService.js');
const MAIL_HANDLER = require('../../mail/mails');
const formatForNmi = (d) => dayjs(d).format('MM/DD/YYYY');

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
  const { user_id, card_number, expiry_month, expiry_year, cvv, billing_address, zip, full_name , email } = cardData;

  billingLogger.info('Starting card save process', { 
    userId: user_id, 
    cardLast4: card_number.slice(-4),
    fullName: full_name 
  });

  const [first_name, ...last_nameParts] = full_name.split(" ");
  const last_name = last_nameParts.join(" ");

  const expYear = expiry_year.toString().slice(-2);

  const payload = {
    first_name: first_name,
    last_name: last_name,
    email: email,
    billing_first_name: first_name,
    billing_last_name: last_name,
    billing_address1: billing_address || '123 Default St',
    billing_address2:'',
    billing_city:'CityName',
    billing_state:'StateCode',
    billing_zip: zip || '00000',
    billing_country:'US',
    ccnumber: card_number,
    ccexp: `${expiry_month}${expYear}`,
    cvv: cvv
  };

  billingLogger.info('Sending card data to NMI vault', { 
    userId: user_id,
    cardLast4: card_number.slice(-4)
  });

  let vaultResponse;
  try {
    vaultResponse = await createCustomerVault(payload);
  } catch (err) {
    billingLogger.error('NMI vault creation failed', err, { 
      userId: user_id,
      cardLast4: card_number.slice(-4)
    });
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
    billingLogger.error('Failed to retrieve vault ID from NMI response', null, { 
      userId: user_id,
      responseParams: params
    });
    throw new ErrorHandler(500, 'Failed to retrieve customer vault ID from gateway');
  }

  billingLogger.info('NMI vault created successfully', { 
    userId: user_id,
    vaultId,
    cardLast4: card_number.slice(-4)
  });

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
    isDefault: user.paymentMethods.length === 0, // Set as default if first card
    cvv:cvv,
  };

  // Add to payment methods array
  user.paymentMethods.push(newPaymentMethod);
  
  // If this is the first card, set it as default
  if (user.paymentMethods.length === 1) {
    user.defaultPaymentMethod = vaultId;
  }

  user.hasStoredCard = true;
  await user.save();

  billingLogger.info('Card saved to database successfully', { 
    userId: user_id,
    vaultId,
    cardBrand,
    isDefault: newPaymentMethod.isDefault,
    totalCards: user.paymentMethods.length
  });

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
const addFunds = async (userId, amount, vaultId = null) => {
  billingLogger.info('Starting add funds process', { 
    userId, 
    amount,
    vaultId 
  });

  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  // FIRST: Try to use the new paymentMethods system
  let customerVaultIdToUse;
  let defaultPaymentMethod;
  let paymentMethodDisplay = 'Card';

  if (vaultId) {
    // Use the provided vaultId
    customerVaultIdToUse = vaultId;
    
    // Find the payment method details
    const selectedPaymentMethod = user.paymentMethods.find(pm => pm.customerVaultId === vaultId);
    if (selectedPaymentMethod) {
      defaultPaymentMethod = selectedPaymentMethod;
      paymentMethodDisplay = `${selectedPaymentMethod.brand || 'Card'} •••• ${selectedPaymentMethod.cardLastFour}`;
    } else {
      defaultPaymentMethod = {
        cardLastFour: 'N/A',
        brand: 'Card'
      };
    }
  } else if (user.paymentMethods && user.paymentMethods.length > 0) {
    // Check if user has paymentMethods with a default
    defaultPaymentMethod = user.paymentMethods.find(pm => pm.isDefault);
    if (defaultPaymentMethod && defaultPaymentMethod.customerVaultId) {
      customerVaultIdToUse = defaultPaymentMethod.customerVaultId;
      paymentMethodDisplay = `${defaultPaymentMethod.brand || 'Card'} •••• ${defaultPaymentMethod.cardLastFour}`;
    }
  } else if (!customerVaultIdToUse && user.customerVaultId) {
    // SECOND: Fallback to old top-level customerVaultId (for backward compatibility)
    customerVaultIdToUse = user.customerVaultId;
    defaultPaymentMethod = {
      cardLastFour: 'N/A',
      brand: 'Card'
    };
  }
  
  // FINALLY: If still no vault ID, throw error
  if (!customerVaultIdToUse) {
    billingLogger.error('No payment method found for user', null, { 
      userId,
      amount,
      hasPaymentMethods: user.paymentMethods?.length > 0,
      hasLegacyVaultId: !!user.customerVaultId
    });
    throw new ErrorHandler(400, 'No payment method found. Please add a card first.');
  }

  billingLogger.info('Charging payment method for funds', { 
    userId,
    amount,
    vaultId: customerVaultIdToUse,
    cardLast4: defaultPaymentMethod.cardLastFour,
    paymentMethod: paymentMethodDisplay
  });

  // ✅ Charge using the found vault ID
  const chargeResult = await chargeCustomerVault(
    customerVaultIdToUse, 
    amount, 
    `Add funds to account - ${user.email}`
  );

  console.log('Charge result:', chargeResult);

  if (!chargeResult.success) {
    billingLogger.error('Payment charge failed', null, { 
      userId,
      amount,
      vaultId: customerVaultIdToUse,
      responseCode: chargeResult.responseCode,
      message: chargeResult.message
    });

    console.log(`Error received in billing service: ${chargeResult.message}`);

    // Handle specific decline cases
    if (chargeResult.responseCode === '2') {
      throw new ErrorHandler(400, `Payment declined: ${chargeResult.message}. Please use a different payment method.`);
    } else if (chargeResult.responseCode === '3') {
      throw new ErrorHandler(400, 'Payment error. Please contact your bank or use a different card.');
    }
    
    throw new ErrorHandler(400, 'Payment failed: ' + chargeResult.message);
  }

  const oldBalance = user.balance || 0;
  const newBalance = oldBalance + parseFloat(amount);
  
  // ✅ Add to user's balance
  user.balance = newBalance;
  await user.save();

try {
    // ---------------------------------------
    // 🔹 Send Balance Top-Up Webhook
    // ---------------------------------------
    await sendBalanceTopUpAlert({
        partner_id: user.integrations?.boberdoo?.external_id || "",
        email: user.email,
        amount: amount
    });

    billingLogger.info('Balance top-up webhook sent', { userId, amount });



    // ---------------------------------------
    // 🔹 Prepare Admin Emails (Exclude Specific Admins)
    // ---------------------------------------
    const EXCLUDED = new Set([
        'admin@gmail.com',
        'admin123@gmail.com',
        'admin1234@gmail.com',
    ]);

    const adminUsers = await User.find({
        role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: { $ne: false },
    }).select('email name');

    const adminEmails = (adminUsers || [])
        .map(a => a.email?.trim().toLowerCase())
        .filter(e => e && !EXCLUDED.has(e));
        

    // ---------------------------------------
    // 🔹 Send USER Email (Lead Service Resumed)
    // ---------------------------------------
    await MAIL_HANDLER.sendCampaignResumedEmail({
        to: user.email,
        userName: user.name,
        email: user.email,
        partnerId: user.integrations?.boberdoo?.external_id || ""
    });

    // ---------------------------------------
    // 🔹 Send ADMIN Email (Lead Service Resumed)
    // ---------------------------------------
    await MAIL_HANDLER.sendCampaignResumedAdminEmail({
        to: adminEmails,
        userName: user.name,
        userEmail: user.email,
        partnerId: user.integrations?.boberdoo?.external_id || ""
    });


} catch (webhookErr) {
    billingLogger.error('Failed to send balance top-up webhook or emails', webhookErr);
}



  billingLogger.info('Funds added successfully', { 
    userId,
    amount,
    oldBalance,
    newBalance,
    transactionId: chargeResult.transactionId
  });

  try {
    // ✅ Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'ADD_FUNDS',
      amount: parseFloat(amount),
      status: 'COMPLETED',
      description: `Funds added via ${paymentMethodDisplay}`,
      paymentMethod: 'CARD',
      transactionId: chargeResult.transactionId,
      balanceAfter: newBalance,
      // Store payment method details for reference
      paymentMethodDetails: {
        lastFour: defaultPaymentMethod.cardLastFour,
        brand: defaultPaymentMethod.brand,
        customerVaultId: customerVaultIdToUse
      }
    });
    await transaction.save();

    // ✅ Return complete data for email
    return {
      success: true,
      transactionId: transaction._id.toString(), // MongoDB transaction ID
      nmiTransactionId: chargeResult.transactionId, // NMI gateway transaction ID
      newBalance: newBalance,
      oldBalance: oldBalance,
      amount: parseFloat(amount),
      paymentMethod: chargeResult.paymentMethod || paymentMethodDisplay, // ✅ Use NMI response if available
      cardType: chargeResult.cardType || defaultPaymentMethod.brand,
      last4: chargeResult.last4 || defaultPaymentMethod.cardLastFour,
      customerVaultId: customerVaultIdToUse,
      message: 'Funds added successfully'
    };

  } catch (transactionError) {
    billingLogger.error('Transaction creation error', transactionError, { userId, amount });
    
    // Even if transaction recording fails, the payment was successful
    // Generate a fallback transaction ID
    const fallbackTxnId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return {
      success: true,
      transactionId: fallbackTxnId,
      nmiTransactionId: chargeResult.transactionId,
      newBalance: newBalance,
      oldBalance: oldBalance,
      amount: parseFloat(amount),
      paymentMethod: chargeResult.paymentMethod || paymentMethodDisplay,
      cardType: chargeResult.cardType || defaultPaymentMethod.brand,
      last4: chargeResult.last4 || defaultPaymentMethod.cardLastFour,
      customerVaultId: customerVaultIdToUse,
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

// only check balance (no card deduction)
const assignLeadNew = async (userId, leadId, leadCost, assignedBy, session) => {
  const user = await User.findById(userId).session(session);
  if (!user) throw new ErrorHandler(404, 'User not found');

  // const currentBalance = user.balance || 0;
  // if (currentBalance < leadCost) {
  //   throw new ErrorHandler(400, 'Insufficient balance to assign lead');
  // }

  // user.balance = currentBalance - leadCost;
  // await user.save({ session });

  const currentBalance = user.balance || 0;
  let currentRefund = user.refundMoney || 0;

  if (currentRefund >= leadCost) {
    user.refundMoney = currentRefund - leadCost;
  } else {
    const remainingCost = leadCost - currentRefund;

    user.refundMoney = 0;

    if (currentBalance < remainingCost) {
      throw new ErrorHandler(400, 'Insufficient balance to assign lead');
    }
    user.balance = currentBalance - remainingCost;
  }

  await user.save({ session });

  const transaction = new Transaction({
    userId,
    type: 'MANUAL',
    amount: -leadCost,
    status: 'COMPLETED',
    description: `Lead assigned: ${leadId}`,
    paymentMethod: 'BALANCE',
    leadId,
    assignedBy,
    balanceAfter: user.balance
  });
  await transaction.save({ session });

  return {
    paymentMethod: 'BALANCE',
    newBalance: user.balance,
    transactionId: transaction._id,
    leadId
  };
};



const assignLeadPrepaid = async (userId, leadId, leadCost, assignedBy, session) => {
  const user = await User.findById(userId).session(session);
  if (!user) throw new ErrorHandler(404, 'User not found');

  const currentBalance = user.balance || 0;

  if (currentBalance < leadCost) {
    throw new ErrorHandler(400, 'Insufficient balance to assign lead');
  }

  user.balance = currentBalance - leadCost;
  await user.save({ session });

  const transaction = new Transaction({
    userId,
    type: "LEAD_ASSIGNMENT",
    amount: -leadCost,
    status: "COMPLETED",
    description: `Lead assigned (Prepaid): ${leadId}`,
    paymentMethod: "BALANCE",
    leadId,
    assignedBy,
    balanceAfter: user.balance
  });

  await transaction.save({ session });

  return {
    paymentMethod: "BALANCE",
    newBalance: user.balance,
    leadId,
    transactionId: transaction._id
  };
};



const assignLeadPayAsYouGo = async (userId, leadId, leadCost, assignedBy, session) => {
  const user = await User.findById(userId).session(session);
  if (!user) throw new ErrorHandler(404, 'User not found');

  const currentBalance = user.balance || 0;

  // 1️⃣ FIRST TRY: Deduct from user balance (same as prepaid)
  if (currentBalance >= leadCost) {
    user.balance = currentBalance - leadCost;
    await user.save({ session });

    const transaction = new Transaction({
      userId,
      type: "LEAD_ASSIGNMENT",
      amount: -leadCost,
      status: "COMPLETED",
      description: `Lead assigned (Pay-As-You-Go from Balance): ${leadId}`,
      paymentMethod: "BALANCE",
      leadId,
      assignedBy,
      balanceAfter: user.balance
    });

    await transaction.save({ session });

    return {
      paymentMethod: "BALANCE",
      transactionId: transaction._id,
      leadId,
      newBalance: user.balance
    };
  }

  // 2️⃣ SECOND: If balance NOT enough → fallback to NMI card
  const defaultPaymentMethod = user.paymentMethods?.find(pm => pm.isDefault === true);

  if (!defaultPaymentMethod) {
    throw new ErrorHandler(
      400,
      "No default payment method found. Please add or set a default card."
    );
  }
    // Prepare card details for logs/emails
  const brand = defaultPaymentMethod.brand || "Card";
  const last4 = defaultPaymentMethod.cardLastFour || "N/A";

  const paymentMethodDisplay = `${brand} •••• ${last4}`;


  const vaultId = defaultPaymentMethod.customerVaultId;

  if (!vaultId) {
    throw new ErrorHandler(
      400,
      "Default payment method does not have a valid customerVaultId."
    );
  }

  // Charge the card (same as before)
  const chargeResult = await chargeCustomerVault(
    vaultId,
    leadCost,
    `Lead assignment: ${leadId}`
  );


  // ❌ PAYMENT FAILED → send email to user + admin
  if (!chargeResult.success) {

    // --------------------------
    // 1️⃣ SEND USER FAILURE MAIL
    // --------------------------
    try {
      await MAIL_HANDLER.sendFailedLeadPaymentEmail({
        to: user.email,
        userName: user.name || user.fullName || user.email,
        leadId,
        amount: leadCost,
        cardLast4: last4,
        errorMessage: chargeResult.message
      });
    } catch (emailErr) {
      console.log("User failed payment email error:", emailErr.message);
      
      // ❗ Throw errorHandler inside catch as requested
      throw new ErrorHandler(
        500,
        "Failed to send user failed-payment email: " + emailErr.message
      );
    }

    // ---------------------------
    // 2️⃣ SEND ADMIN FAILURE MAIL
    // ---------------------------
    try {
      const EXCLUDED = new Set([
        "admin@gmail.com",
        "admin123@gmail.com",
        "admin1234@gmail.com"
      ]);

      const adminUsers = await User.find({
        role: { $in: ["ADMIN", "SUPER_ADMIN"] },
        isActive: { $ne: false }
      }).select("email");

      let adminEmails = (adminUsers || [])
        .map(a => a.email)
        .filter(Boolean)
        .map(e => e.trim().toLowerCase())
        .filter(e => !EXCLUDED.has(e)); // exclude unwanted emails

      await MAIL_HANDLER.sendFailedLeadPaymentAdminEmail({
        to: adminEmails,
        userEmail: user.email,
        userName: user.name || user.fullName || "",
        leadId,
        amount: leadCost,
        cardLast4: last4,
        errorMessage: chargeResult.message
      });

    } catch (emailErr) {
      console.log("Admin failed payment email error:", emailErr.message);

      // ❗ Throw errorHandler inside catch as requested
      throw new ErrorHandler(
        500,
        "Failed to send admin failed-payment email: " + emailErr.message
      );
    }

    // --------------------------------------------------
    // 3️⃣ FINALLY throw the actual payment failure error
    // --------------------------------------------------
    throw new ErrorHandler(400, "Card payment failed: " + chargeResult.message);
  }

  const transaction = new Transaction({
    userId,
    type: "LEAD_ASSIGNMENT",
    amount: -leadCost,
    status: "COMPLETED",
    description: `Lead assigned (Pay-As-You-Go - Card Charge): ${leadId}`,
    paymentMethod: "CARD",
    transactionId: chargeResult.transactionId,
    leadId,
    assignedBy,
    balanceAfter: user.balance
  });

  await transaction.save({ session });

  return {
    paymentMethod: "CARD",
    transactionId: transaction._id,
    gatewayTransactionId: chargeResult.transactionId,
    leadId,
    newBalance: user.balance
  };
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
  const user = await RegularUser.findById(userId)
    .select('balance hasStoredCard autoTopUp paymentMethods defaultPaymentMethod');
  if (!user) throw new ErrorHandler(404, 'User not found');

  let cardLastFour = null;
  if (user.hasStoredCard && user.paymentMethods.length > 0) {
    const defaultCard = user.paymentMethods.find(
      pm => pm.customerVaultId === user.defaultPaymentMethod
    );
    cardLastFour = defaultCard ? defaultCard.cardLastFour : null;
  }

  return {
    balance: user.balance || 0,
    hasStoredCard: user.hasStoredCard || false,
    cardLastFour,
    autoTopUp: user.autoTopUp || { enabled: false }
  };
};


const getUserTransactions = async (userId, page = 1, limit = 20, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = { userId: new mongoose.Types.ObjectId(userId) }; // Ensure proper ObjectId

  // Apply filters
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  
  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) {
      query.createdAt.$gte = new Date(filters.dateFrom);
      // If only dateFrom is provided, set time to start of day
      if (!filters.dateTo) {
        query.createdAt.$lte = new Date(new Date(filters.dateFrom).setHours(23, 59, 59, 999));
      }
    }
    if (filters.dateTo) {
      query.createdAt.$lte = new Date(new Date(filters.dateTo).setHours(23, 59, 59, 999));
      // If only dateTo is provided, set time to start of day for lower bound
      if (!filters.dateFrom) {
        query.createdAt.$gte = new Date(new Date(filters.dateTo).setHours(0, 0, 0, 0));
      }
    }
  }

  try {
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Transaction.countDocuments(query);

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to retrieve transactions');
  }
};

// Rename toggleAutoTopUp to updatePaymentMode:
const updatePaymentMode = async (userId, paymentModeData) => {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  const { paymentMode, enabled } = paymentModeData;

  // Ensure user has payment methods for both modes
  if ((!user.paymentMethods || user.paymentMethods.length === 0)) {
    throw new ErrorHandler(400, 'Please add a payment method first.');
  }

  user.autoTopUp = {
    enabled: enabled, // ✅ Use the enabled value from frontend
    threshold: user.autoTopUp?.threshold || 10,
    topUpAmount: user.autoTopUp?.topUpAmount || 50,
    paymentMode: paymentMode,
    updatedAt: new Date()
  };
  
  await user.save();

  return {
    autoTopUp: user.autoTopUp,
    paymentMode: paymentMode
  };
};


// New function to check and perform auto top-up
const checkAndPerformAutoTopUp = async (userId, currentBalance) => {
  const user = await User.findById(userId);
  if (!user) return { performed: false, reason: 'User not found' };

  // Check if auto top-up is enabled
  if (!user.autoTopUp?.enabled) {
    return { performed: false, reason: 'Auto top-up disabled' };
  }

  // Check if balance is below threshold
  const threshold = user.autoTopUp.threshold || 10;
  if (currentBalance >= threshold) {
    return { performed: false, reason: 'Balance above threshold' };
  }

  // Get default payment method
  let customerVaultIdToUse;
  let defaultPaymentMethod;
  
  if (user.paymentMethods && user.paymentMethods.length > 0) {
    defaultPaymentMethod = user.paymentMethods.find(pm => pm.isDefault);
    if (defaultPaymentMethod?.customerVaultId) {
      customerVaultIdToUse = defaultPaymentMethod.customerVaultId;
    }
  }

  if (!customerVaultIdToUse) {
    return { performed: false, reason: 'No payment method available' };
  }

  try {
    const topUpAmount = user.autoTopUp.topUpAmount || 50;
    
    // Charge using the found vault ID
    const chargeResult = await chargeCustomerVault(
      customerVaultIdToUse, 
      topUpAmount, 
      'Auto top-up'
    );

    if (!chargeResult.success) {
      return { 
        performed: false, 
        reason: `Payment failed: ${chargeResult.message}`,
        error: chargeResult
      };
    }

    // Add to user's balance
    user.balance = (user.balance || 0) + parseFloat(topUpAmount);
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'AUTO',
      amount: parseFloat(topUpAmount),
      status: 'COMPLETED',
      description: 'Auto top-up performed',
      paymentMethod: 'CARD',
      transactionId: chargeResult.transactionId,
      balanceAfter: user.balance,
      paymentMethodDetails: {
        lastFour: defaultPaymentMethod.cardLastFour,
        brand: defaultPaymentMethod.brand,
        customerVaultId: customerVaultIdToUse
      }
    });
    await transaction.save();

    return {
      performed: true,
      newBalance: user.balance,
      topUpAmount,
      transactionId: transaction._id,
      paymentTransactionId: chargeResult.transactionId
    };

  } catch (error) {
    console.error('Auto top-up error:', error);
    return { 
      performed: false, 
      reason: 'Auto top-up processing failed',
      error: error.message 
    };
  }
};

const testLeadDeduction = async (userId, deductAmount) => {
  billingLogger.info('Starting test lead deduction', { 
    userId, 
    deductAmount 
  });

  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  const originalBalance = user.balance || 0;
  billingLogger.info('User balance and deduction details', { 
    userId,
    originalBalance,
    deductAmount,
    balanceSufficient: originalBalance >= deductAmount
  });
  
  // Check payment mode
  const paymentMode = user.autoTopUp?.paymentMode || 'prepaid';
  const autoPayEnabled = user.autoTopUp?.enabled || false;
  
  billingLogger.info('User payment configuration', { 
    userId,
    paymentMode,
    autoPayEnabled,
    hasPaymentMethods: user.paymentMethods?.length > 0
  });

  // Step 1: Check if wallet balance is sufficient
  if (originalBalance >= deductAmount) {
    // Sufficient balance - deduct from wallet
    user.balance = originalBalance - deductAmount;
    await user.save();

    // Create deduction transaction
    const transaction = new Transaction({
      userId,
      type: 'LEAD_DEDUCTION',
      amount: -deductAmount,
      status: 'COMPLETED',
      description: `Lead cost deduction - Paid from wallet balance`,
      paymentMethod: 'WALLET',
      balanceAfter: user.balance
    });
    await transaction.save();

    return {
      success: true,
      paymentMethod: 'WALLET',
      originalBalance,
      deductAmount,
      finalBalance: user.balance,
      transactionId: transaction._id,
      message: 'Payment successful - Deducted from wallet balance'
    };
  }

  // Step 2: Insufficient wallet balance - check payment mode
  console.log('Insufficient wallet balance, checking payment mode...');

  if (paymentMode === 'payAsYouGo' && autoPayEnabled) {
    // Pay as you go with auto-pay enabled - charge card directly
    return await handleDirectCardCharge(user, deductAmount, originalBalance);
  } else {
    // Prepaid mode or auto-pay disabled - require manual top-up
    throw new ErrorHandler(400, 
      `Insufficient wallet balance ($${originalBalance.toFixed(2)}). ` +
      `You need $${deductAmount.toFixed(2)} to complete this transaction. ` +
      `Please add funds to your wallet to continue.`
    );
  }
};

const handleDirectCardCharge = async (user, deductAmount, originalBalance) => {
  billingLogger.info('Attempting direct card charge', { 
    userId: user._id,
    deductAmount,
    originalBalance
  });
  
  // Get default payment method
  let defaultPaymentMethod;
  if (user.paymentMethods && user.paymentMethods.length > 0) {
    defaultPaymentMethod = user.paymentMethods.find(pm => pm.isDefault);
  }

  if (!defaultPaymentMethod?.customerVaultId) {
    billingLogger.error('No default payment method for direct charge', null, { 
      userId: user._id,
      hasPaymentMethods: user.paymentMethods?.length > 0
    });
    throw new ErrorHandler(400, 
      'No default payment method available for direct charging. ' +
      'Please add a payment method or add funds to your wallet.'
    );
  }

  try {
    // Charge the card directly for the lead amount
    const chargeResult = await chargeCustomerVault(
      defaultPaymentMethod.customerVaultId, 
      deductAmount, 
      'Direct lead payment'
    );

    if (!chargeResult.success) {
      throw new ErrorHandler(400, 
        `Payment failed: ${chargeResult.message}. ` +
        'Please use a different payment method or add funds to your wallet.'
      );
    }

    // Create transaction record for direct charge
    const transaction = new Transaction({
      userId: user._id,
      type: 'TEST_DEDUCTION',
      amount: -deductAmount,
      status: 'COMPLETED',
      description: 'Lead cost - Direct card charge',
      paymentMethod: 'CARD',
      transactionId: chargeResult.transactionId,
      balanceAfter: originalBalance, // Balance unchanged since charged directly
      paymentMethodDetails: {
        lastFour: defaultPaymentMethod.cardLastFour,
        brand: defaultPaymentMethod.brand,
        customerVaultId: defaultPaymentMethod.customerVaultId
      }
    });
    await transaction.save();

    return {
      success: true,
      paymentMethod: 'CARD',
      originalBalance,
      deductAmount,
      finalBalance: originalBalance, // Balance unchanged
      transactionId: transaction._id,
      paymentTransactionId: chargeResult.transactionId,
      cardUsed: `****${defaultPaymentMethod.cardLastFour}`,
      message: 'Payment successful - Charged directly to card'
    };

  } catch (error) {
    console.error('Direct card charge error:', error);
    throw new ErrorHandler(400, 
      `Direct card payment failed: ${error.message}. ` +
      'Please add funds to your wallet or update your payment method.'
    );
  }
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

const addBalanceByAdmin = async (userId, amount, adminId) => {
  billingLogger.info('Starting admin add balance process', { userId, amount, adminId });

  if (!userId) throw new ErrorHandler(400, 'User ID is required');
  if (!amount || amount <= 0) throw new ErrorHandler(400, 'Amount must be greater than 0');

  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');

  const oldBalance = user.balance || 0;
  user.balance = oldBalance + parseFloat(amount.toString());
  await user.save();

  billingLogger.info('Balance updated successfully', { userId, amount, oldBalance, newBalance: user.balance });

  try {
    const transaction = new Transaction({
      userId,
      adminId,
      type: 'ADMIN_ADD_FUNDS',
      amount: parseFloat(amount.toString()),
      status: 'COMPLETED',
      description: 'Balance added by admin',
      balanceAfter: user.balance
    });
    await transaction.save();

    return {
      success: true,
      newBalance: user.balance,
      transactionId: transaction._id,
      message: 'Balance added successfully'
    };
  } catch (transactionError) {
    billingLogger.error('Transaction creation failed', transactionError, { userId, amount, adminId });
    return {
      success: true,
      newBalance: user.balance,
      message: 'Balance added successfully (transaction record failed)',
      warning: 'Transaction record could not be created'
    };
  }
};

const getRevenueFromNmi = async ({ start, end }) => {
  const payload = {
  security_key: SECURITY_KEY,
  report_type: 'transaction',
  start_date: formatForNmi(start),
  end_date: formatForNmi(end),
  action_type: 'sale',
  response: '1',
  output: 'json',
  };
  
  const resp = await fetchWrapper('POST', NMI_QUERY_URL, payload, null, false, true);
  const data = typeof resp === 'string' ? JSON.parse(resp) : resp;
  
  const records = data?.records?.record || data?.record || [];
  const totalAmount = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  
  return { totalAmount, count: records.length, raw: data };
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
  updatePaymentMode,
  deleteUserCard,
  testLeadDeduction,
  checkAndPerformAutoTopUp, 
  assignLeadNew,
  addBalanceByAdmin,
  getRevenueFromNmi,


  assignLeadPrepaid,
  assignLeadPayAsYouGo,
};
