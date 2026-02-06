const { User } = require('../../models/user.model');
const Lead = require('../../models/lead.model');
const Transaction = require('../../models/transaction.model');
const mongoose = require('mongoose');
// const { ContractAcceptance } = require('../../models/ContractAcceptance');
const { createCustomerVault, chargeCustomerVault, deleteCustomerVault } = require('../nmi/nmi.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { RegularUser } = require('../../models/user.model');
const { billingLogger } = require('../../utils/logger');
const NMI_QUERY_URL = process.env.NMI_QUERY_URL;
const SECURITY_KEY = process.env.NMI_SECURITY_KEY;
const dayjs = require('dayjs');
const fetchWrapper = require('../../utils/fetchWrapper');
const { sendBalanceTopUpAlert } = require('../../services/n8n/webhookService.js');
const MAIL_HANDLER = require('../../mail/mails');
const formatForNmi = (d) => dayjs(d).format('MM/DD/YYYY');
const { sendToN8nWebhook, sendLowBalanceAlert } = require('../../services/n8n/webhookService.js');
const { sendSms } = require('../../services/sms/sms.service');
const ReceiptService = require('./receipt.service');

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
const saveCard = async (cardData, makeDefault = false) => {
  const { user_id, card_number, expiry_month, expiry_year, cvv, billing_address, zip, full_name, email } = cardData;

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
    billing_address2: '',
    billing_city: 'CityName',
    billing_state: 'StateCode',
    billing_zip: zip || '00000',
    billing_country: 'US',
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
    if (err.message && err.message.includes('Invalid Credit Card')) {
      throw new ErrorHandler(400, err.message);
    }
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
    isDefault: user.paymentMethods.length === 0 || makeDefault, // Set as default if first card OR explicitly requested
    cvv: cvv,
    // ✅ Store new optional details
    cardHolderName: full_name,
    email: email,
    mobile: cardData.mobile || cardData.phone || cardData.billing_phone,
    billingAddress: billing_address || cardData.address1 || "123 Default St",
    billingZip: zip || cardData.zip || "00000"
  };

  // Add to payment methods array
  user.paymentMethods.push(newPaymentMethod);

  // If this is the first card, OR user requested to make it default
  if (user.paymentMethods.length === 1 || makeDefault) {
    // If makeDefault is true, unset other defaults first (although finding by vaultId is cleaner, loop is safe)
    if (makeDefault) {
      user.paymentMethods.forEach(pm => pm.isDefault = false);
      // The new one we just pushed is NOT yet marked isDefault in the array object we pushed?
      // Wait, we pushed `newPaymentMethod` which had `isDefault: user.paymentMethods.length === 0`.
      // Let's fix that interaction.
    }

    // Set the one we just pushed as default
    // The one we pushed is the last one
    const newCard = user.paymentMethods[user.paymentMethods.length - 1];
    newCard.isDefault = true;
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

  // ✅ AUTO-CHARGE RECOVERY: Check for pending payments
  if (user.pending_payment && user.pending_payment.amount > 0) {
    // NOTE: We used to check amount here, but now we calculate dynamic amount inside.
    // We pass the user and vaultId, and let the function figure out if there are PayAsYouGo leads.
    try {
      // Pass user (with updated pending_payment if accessible, otherwise verify inside)
      await processPendingPaymentRecovery(user, vaultId, { includeAll: true });
      // Removed 'amount' arg because we calculate it accurately now.
    } catch (err) {
      billingLogger.error('Recovery process failed', err);
    }
  }

  return {
    customerVaultId: vaultId,
    userId: user._id,
    cardLastFour: newPaymentMethod.cardLastFour,
    brand: cardBrand,
    isDefault: newPaymentMethod.isDefault
  };
};

const processPendingPaymentRecovery = async (userParam, vaultId, options = {}) => {
  // 0. Fetch fresh user to ensure balance/debt are up to date
  const user = await User.findById(userParam._id);
  if (!user) return { success: false, message: 'User not found for recovery' };

  // 1. Find all pending leads
  const pendingLeads = await Lead.find({
    user_id: user._id,
    payment_status: 'pending'
  }).populate('campaign_id');

  if (!pendingLeads || pendingLeads.length === 0) {
    return { success: true, message: 'No pending leads found' };
  }

  // 2. Filter Eligible Leads (Default: PayAsYouGo, Option: IncludeAll)
  const leadsToRecover = pendingLeads.filter(lead => {
    if (options.includeAll) return true;
    return lead.campaign_id && lead.campaign_id.payment_type === 'payasyougo';
  });

  if (leadsToRecover.length === 0) {
    billingLogger.info('No eligible pending leads found', { userId: user._id });
    return { success: true, message: 'No eligible leads' };
  }

  const totalAmountToRecover = leadsToRecover.reduce((sum, lead) => sum + (lead.lead_cost || 0), 0);
  if (totalAmountToRecover <= 0) {
    return { success: true, message: 'Recoverable amount is 0' };
  }

  billingLogger.info(`Recovering ${totalAmountToRecover} for ${leadsToRecover.length} leads`, { userId: user._id });

  // 3. Calculate Split (Balance vs Card)
  const currentBalance = user.balance || 0;
  const usableBalance = Math.max(0, currentBalance);

  let amountFromBalance = 0;
  let amountFromCard = 0;

  if (usableBalance >= totalAmountToRecover) {
    amountFromBalance = totalAmountToRecover;
  } else {
    amountFromBalance = usableBalance;
    amountFromCard = totalAmountToRecover - usableBalance;
  }

  // 4. Charge Card (If needed)
  let chargeResult = null;
  if (amountFromCard > 0) {
    chargeResult = await chargeCustomerVault(vaultId, amountFromCard, `Recovery: ${leadsToRecover.length} leads`);
    if (!chargeResult.success) {
      billingLogger.warn('Recovery charge failed', { userId: user._id, message: chargeResult.message });
      return { success: false, message: chargeResult.message };
    }
  }

  // 5. Update User Balance & Debt (Atomic & Calculated)
  // 5. Update User Balance & Debt (Atomic & Calculated)
  // We calculate the *final* balance here to avoid any $inc ambiguity
  const finalBalance = Math.max(0, currentBalance - amountFromBalance);

  // Calculate new pending debt statistics from ACTUAL data (fix desyncs)
  // leadsToRecover are the ones we just paid.
  // We subtract them from the original 'pendingLeads' list to see what's left.
  const remainingLeads = pendingLeads.filter(pl => !leadsToRecover.some(lr => lr._id.equals(pl._id)));
  const newPending = remainingLeads.reduce((sum, l) => sum + (l.lead_cost || 0), 0);
  const newPendingCount = remainingLeads.length;

  // Update user object directly for reliable persistence
  user.balance = finalBalance;

  if (!user.pending_payment) user.pending_payment = {};
  user.pending_payment.amount = newPending;
  user.pending_payment.count = newPendingCount;

  // Clear error flags if debt is gone
  if (newPending === 0) {
    user.payment_error = false;
    user.last_payment_error_message = null;
  }

  await user.save();

  // 6. Record Transactions
  await recordRecoveryTransactions(user._id, amountFromBalance, amountFromCard, vaultId, chargeResult, finalBalance, leadsToRecover.length);

  // 7. Update Leads
  const leadIds = leadsToRecover.map(l => l._id);
  await Lead.updateMany(
    { _id: { $in: leadIds } },
    { $set: { payment_status: 'paid', status: 'active', payment_error_message: null } }
  );

  // 8. Notifications & Webhooks
  await handleRecoveryNotifications(user, amountFromCard, amountFromBalance, totalAmountToRecover, leadsToRecover, chargeResult, finalBalance, newPending === 0);

  return { success: true };
};

// --------------------------------------------------------------------------
// Helper: Record Transactions
// --------------------------------------------------------------------------
const recordRecoveryTransactions = async (userId, fromBalance, fromCard, vaultId, chargeResult, finalBalance, count) => {
  if (fromBalance > 0) {
    await new Transaction({
      userId,
      type: 'PAYMENT_RECOVERY',
      amount: -fromBalance,
      status: 'COMPLETED',
      description: `Auto-recovery: ${count} leads (Balance)`,
      paymentMethod: 'BALANCE',
      balanceAfter: finalBalance
    }).save();
  }

  if (fromCard > 0 && chargeResult) {
    await new Transaction({
      userId,
      type: 'PAYMENT_RECOVERY',
      amount: -fromCard,
      status: 'COMPLETED',
      description: `Auto-recovery: ${count} leads (Card)`,
      paymentMethod: 'CARD',
      transactionId: chargeResult.transactionId,
      paymentMethodDetails: { customerVaultId: vaultId },
      balanceAfter: finalBalance
    }).save();
  }
};

// --------------------------------------------------------------------------
// Helper: Notifications
// --------------------------------------------------------------------------
const handleRecoveryNotifications = async (user, fromCard, fromBalance, totalAmount, leads, chargeResult, finalBalance, isFullClear) => {
  console.log('handleRecoveryNotifications', { user, fromCard, fromBalance, totalAmount, leads, chargeResult, finalBalance, isFullClear });
  // ✅ UPDATED: Trigger webhook if Card charged OR if Full Clear via Balance
  if (fromCard > 0 || (isFullClear && fromBalance > 0)) {
    try {
      await sendBalanceTopUpAlert({
        partner_id: user.integrations?.boberdoo?.external_id || "",
        email: user.email,
        amount: totalAmount, // ✅ Send TOTAL amount (Card + Balance)
        user_id: user._id
      });
    } catch (e) { billingLogger.error('Webhook failed', e); }
  }

  if (isFullClear) {
    try {
      const paymentMethodStr = (fromCard > 0 && fromBalance > 0) ? 'SPLIT (Balance + Card)' : (fromCard > 0 ? 'CARD' : 'BALANCE');
      const cardLast4 = fromCard > 0 ? (chargeResult?.last4 || 'N/A') : 'N/A';

      const chargedLeads = leads.map(l => ({
        leadId: l.lead_id,
        firstName: l.first_name,
        lastName: l.last_name,
        email: l.email,
        amount: l.lead_cost || 0,
        paymentMethod: paymentMethodStr,
        campaignName: l.campaign_id?.name || 'Unknown'
      }));

      await MAIL_HANDLER.sendPendingLeadsPaymentSuccessEmail({
        to: user.email,
        userName: user.name,
        chargedLeads,
        totalAmount,
        newBalance: finalBalance,
        paymentMethod: paymentMethodStr,
        cardLast4
      });

      if (user.phoneNumber) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await sendSms({ to: user.phoneNumber, message: `LeadFusion Alert: Recovered $${totalAmount.toFixed(2)} for ${leads.length} leads. Service resumed.` });
      }

      // Admin Email (Simplified logic)
      if (process.env.ADMIN_NOTIFICATION_EMAILS) {
        // Enforce delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const admins = process.env.ADMIN_NOTIFICATION_EMAILS.split(',').map(e => e.trim()).filter(Boolean);
        if (admins.length) {
          await MAIL_HANDLER.sendPendingLeadsPaymentSuccessAdminEmail({
            to: admins,
            userName: user.name,
            userEmail: user.email,
            chargedLeads,
            totalAmount,
            newBalance: finalBalance,
            paymentMethod: paymentMethodStr,
            cardLast4
          });
        }
      }

    } catch (e) { billingLogger.error('Notification failed', e); }
  }
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
      amount: amount,
      user_id: user._id
    });

    billingLogger.info('Balance top-up webhook sent', { userId, amount });


    // ---------------------------------------
    // 🔹 AUTO-RECOVERY: Attempt to clear pending debt
    // ---------------------------------------
    let recoveryResult = { success: false };
    const oldPendingAmount = user.pending_payment?.amount || 0;

    if (oldPendingAmount > 0) {
      try {
        console.log(`💰 Attempting auto-recovery for user ${user._id} after top-up...`);
        // Pass the user and the vault ID we just used (or let it pick default)
        recoveryResult = await processPendingPaymentRecovery(user, customerVaultIdToUse, { includeAll: true });
        console.log('✅ Auto-recovery result:', recoveryResult);
      } catch (recoveryErr) {
        console.error('❌ Auto-recovery failed inside addFunds:', recoveryErr);
        billingLogger.error('Auto-recovery failed inside addFunds', recoveryErr, { userId });
      }
    }

    // ---------------------------------------
    // 🔹 Re-fetch User State for Email Conditions
    // ---------------------------------------
    // We need fresh data to see if debt was cleared and what the final balance is
    const updatedUser = await User.findById(userId);
    const finalBalance = updatedUser.balance || 0;
    const finalPendingAmount = updatedUser.pending_payment?.amount || 0;

    // ---------------------------------------
    // 🔹 CONDITIONAL "SERVICE RESUMED" EMAIL
    // ---------------------------------------
    // Condition:
    // 1. WAS PAUSED? -> Old Balance <= 0 OR Old Pending > 0
    // 2. IS NOW ACTIVE? -> New Balance > 0 AND New Pending == 0

    // You can adjust this threshold (e.g., 5 or 10) if you have a minimum buffer
    const LOW_BALANCE_THRESHOLD = 0;

    const wasPaused = (oldBalance <= LOW_BALANCE_THRESHOLD) || (oldPendingAmount > 0);
    const isNowHealthy = (finalBalance > LOW_BALANCE_THRESHOLD) && (finalPendingAmount === 0);

    console.log('[Email Logic] Service Resumed Check:', {
      oldBalance,
      oldPendingAmount,
      finalBalance,
      finalPendingAmount,
      wasPaused,
      isNowHealthy
    });

    if (wasPaused && isNowHealthy) {

      console.log('🚀 Sending Service Resumed Emails...');

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

      // ✅ Check ENV for overrides, otherwise use DB
      let adminEmails = [];
      if (process.env.ADMIN_NOTIFICATION_EMAILS) {
        adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);
      } else {
        adminEmails = (adminUsers || [])
          .map(a => a.email?.trim().toLowerCase())
          .filter(e => e && !EXCLUDED.has(e));
      }

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
      if (adminEmails.length > 0) {
        await MAIL_HANDLER.sendCampaignResumedAdminEmail({
          to: adminEmails,
          userName: user.name,
          userEmail: user.email,
          partnerId: user.integrations?.boberdoo?.external_id || ""
        });
      }
    } else {
      console.log('ℹ️ Skipping "Service Resumed" email (User was not paused or is not yet fully healthy)');
    }


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

// Unified assignment via processLeadTransaction
const assignLeadNew = async (userId, leadId, leadCost, assignedBy, session, paymentType = 'prepaid') => {
  const user = await User.findById(userId).session(session);
  if (!user) throw new ErrorHandler(404, 'User not found'); // Restored throw for controller

  // Use the global unified processor
  const result = await processLeadTransaction({
    user,
    leadId,
    amount: leadCost,
    paymentType, // Defaults to 'prepaid' logic (strict balance check) if not provided
    assignedBy,
    session,
    descriptionPrefix: 'Lead assigned (New)'
  });

  // Controller expects a throw on failure, not a return object
  if (!result.success) {
    throw new ErrorHandler(400, result.message || 'Payment failed');
  }

  return result;
};


// --------------------------------------------------------------------------
// Unified Lead Payment Processor
// --------------------------------------------------------------------------
const processLeadTransaction = async ({
  user,
  leadId,
  amount,
  paymentType, // 'prepaid' | 'payasyougo'
  assignedBy,
  session,
  descriptionPrefix = 'Lead assigned'
}) => {
  const currentBalance = user.balance || 0;
  const currentRefund = user.refundMoney || 0;

  // 1. Calculate Split (Refund -> Balance -> Card)
  let amountFromRefund = 0;
  let amountFromBalance = 0;
  let amountFromCard = 0;

  let remainingToPay = amount;

  // A. Use Refund Money first
  if (currentRefund > 0) {
    amountFromRefund = Math.min(currentRefund, remainingToPay);
    remainingToPay -= amountFromRefund;
  }

  // B. Use Wallet Balance next
  if (remainingToPay > 0 && currentBalance > 0) {
    amountFromBalance = Math.min(currentBalance, remainingToPay);
    remainingToPay -= amountFromBalance;
  }

  // C. Remainder to Card
  amountFromCard = remainingToPay;

  // 2. Validate PREPAID constraints
  if (paymentType === 'prepaid' && amountFromCard > 0) {
    return {
      success: false,
      error: 'INSUFFICIENT_BALANCE',
      message: `Insufficient funds (Balance + Refund). Required: $${amount}, Available: $${currentBalance + currentRefund}`
    };
  }

  // 3. Charge Card (If needed)
  let chargeResult = null;
  let cardGatewayTxnId = null;

  if (amountFromCard > 0) {
    // Find default card
    const defaultPaymentMethod = user.paymentMethods?.find(pm => pm.isDefault);

    if (!defaultPaymentMethod?.customerVaultId) {
      return {
        success: false,
        error: 'NO_PAYMENT_METHOD',
        message: 'Insufficient balance and no default payment method found.'
      };
    }

    chargeResult = await chargeCustomerVault(
      defaultPaymentMethod.customerVaultId,
      amountFromCard,
      `${descriptionPrefix}: ${leadId} (Partial/Full Card)`
    );

    if (!chargeResult.success) {
      billingLogger.error("Lead assignment card charge failed", {
        userId: user._id,
        amount: amountFromCard,
        message: chargeResult.message
      });
      return {
        success: false,
        error: 'CARD_DECLINED',
        message: chargeResult.message || 'Card payment failed',
        responseCode: chargeResult.responseCode,
        cardLast4: defaultPaymentMethod.cardLastFour
      };
    }

    // Success
    cardGatewayTxnId = chargeResult.transactionId;

    // Clear error flags if payment succeeds
    if (user.payment_error) {
      user.payment_error = false;
      user.last_payment_error_message = null;
    }
  }

  // 4. Update User Funds (Memory) - Validated by save() later
  if (amountFromRefund > 0) {
    user.refundMoney = Math.max(0, currentRefund - amountFromRefund);
  }
  if (amountFromBalance > 0) {
    user.balance = Math.max(0, currentBalance - amountFromBalance);
  }

  await user.save({ session });

  // 5. Record Transactions
  let primaryTransactionId = null; // This will hold the MongoDB ObjectId

  // A. Refund Transaction (Internal logic often grouped with balance, but tracking separately is cleaner if schema allows,
  // or we can just treat it as 'BALANCE' type but with description note)
  if (amountFromRefund > 0) {
    // NOTE: 'refundMoney' is internal credit. We'll record it as a BALANCE payment for simplicity unless strictly separated.
    // checking assignLeadNew: it logged 'MANUAL' type 'BALANCE' method for the total amount.
    // We will log it as BALANCE payment.
    const refundTxn = new Transaction({
      userId: user._id,
      type: "LEAD_ASSIGNMENT",
      amount: -amountFromRefund,
      status: "COMPLETED",
      description: `${descriptionPrefix}: ${leadId} (Refund Credit)`,
      paymentMethod: "BALANCE",
      leadId,
      assignedBy,
      balanceAfter: user.balance // This might be misleading if we only deducted refundMoney, but user.balance is what remains.
    });
    await refundTxn.save({ session });
    if (!primaryTransactionId) primaryTransactionId = refundTxn._id;
  }

  // B. Balance Transaction
  if (amountFromBalance > 0) {
    const balanceTxn = new Transaction({
      userId: user._id,
      type: "LEAD_ASSIGNMENT",
      amount: -amountFromBalance,
      status: "COMPLETED",
      description: `${descriptionPrefix}: ${leadId} (Wallet Balance)`,
      paymentMethod: "BALANCE",
      leadId,
      assignedBy,
      balanceAfter: user.balance
    });
    await balanceTxn.save({ session });

    if (!primaryTransactionId) primaryTransactionId = balanceTxn._id;
  }

  if (amountFromCard > 0 && chargeResult) {
    const cardTxn = new Transaction({
      userId: user._id,
      type: "LEAD_ASSIGNMENT",
      amount: -amountFromCard,
      status: "COMPLETED",
      description: `${descriptionPrefix}: ${leadId} (Card)`,
      paymentMethod: "CARD",
      transactionId: cardGatewayTxnId,
      paymentMethodDetails: {
        customerVaultId: user.defaultPaymentMethod
      },
      leadId,
      assignedBy,
      balanceAfter: user.balance
    });
    await cardTxn.save({ session });

    primaryTransactionId = cardTxn._id;
  }

  return {
    success: true,
    newBalance: user.balance,
    transactionId: primaryTransactionId,
    gatewayTransactionId: cardGatewayTxnId,
    amountFromBalance,
    amountFromCard
  };
};

const assignLeadPrepaid = async (userId, leadId, leadCost, assignedBy, session) => {
  const user = await User.findById(userId).session(session);
  if (!user) return { success: false, error: 'USER_NOT_FOUND', message: 'User not found' };

  return await processLeadTransaction({
    user,
    leadId,
    amount: leadCost,
    paymentType: 'prepaid',
    assignedBy,
    session,
    descriptionPrefix: 'Lead assigned (Prepaid)'
  });
};

const assignLeadPayAsYouGo = async (userId, leadId, leadCost, assignedBy, session, campaignMeta = {}) => {
  const user = await User.findById(userId).session(session);
  if (!user) return { success: false, error: 'USER_NOT_FOUND', message: 'User not found' };

  return await processLeadTransaction({
    user,
    leadId,
    amount: leadCost,
    paymentType: 'payasyougo',
    assignedBy,
    session,
    descriptionPrefix: 'Lead assigned (Pay-As-You-Go)'
  });
};

/**
 * Handle payment failure - updates user, sends webhook, emails
 * Used by both createLead and processBoberdoLead
 */
const handlePaymentFailure = async ({
  userId,
  leadId,
  leadCost,
  campaign,
  billingResult,
  logger = console
}) => {
  try {
    logger.info?.('Starting payment failure handling...', { user_id: userId });

    const owner = await User.findById(userId);

    if (!owner) {
      logger.error?.('Owner not found for payment error update', { user_id: userId });
      return { success: false, error: 'Owner not found' };
    }

    // ✅ 1. Update pending_payment
    // This bypasses Mongoose schema validation and updates directly
    await User.collection.updateOne(
      { _id: owner._id },
      {
        $inc: {
          "pending_payment.amount": leadCost,
          "pending_payment.count": 1
        },
        $set: {
          payment_error: true,
          last_payment_error_message: billingResult.message || 'Payment failed'
        }
      }
    );

    logger.info?.('🧾 pending_payment updated', {
      user_id: userId,
      lead_id: leadId
    });

    // ✅ 2. Update payment_error flag
    await User.updateOne(
      { _id: owner._id },
      {
        $set: {
          payment_error: true,
          last_payment_error_message: billingResult.message || 'Payment failed'
        }
      }
    );

    logger.info?.('✅ Payment error flag updated', {
      user_id: owner._id,
      payment_error: true,
      message: billingResult.message
    });

    // ✅ 3. Send stop webhook
    try {
      await sendLowBalanceAlert({
        campaign_name: campaign.name,
        filter_set_id: campaign.boberdoo_filter_set_id,
        partner_id: owner.integrations?.boberdoo?.external_id || "",
        email: owner.email,
        user_id: owner._id,
        campaign_id: campaign._id
      });
      logger.info?.('Stop webhook sent for payment failure');
    } catch (webhookErr) {
      logger.error?.('Failed to send stop webhook', webhookErr);
    }

    // ✅ 4. Send failure email to USER
    try {
      await MAIL_HANDLER.sendFailedLeadPaymentEmail({
        to: owner.email,
        userName: owner.name || owner.fullName || owner.email,
        leadId: leadId,
        amount: leadCost,
        cardLast4: billingResult.cardLast4 || "N/A",
        errorMessage: billingResult.message
      });
      logger.info?.('User failure email sent');
    } catch (emailErr) {
      logger.error?.("User failed-payment email failed", emailErr);
    }

    // ✅ 5. Send failure email to ADMINS
    try {
      // Enforce delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const EXCLUDED = new Set(["admin@gmail.com", "admin123@gmail.com", "admin1234@gmail.com"]);

      const adminUsers = await User.find({
        role: { $in: ["ADMIN", "SUPER_ADMIN"] },
        isActive: { $ne: false }
      }).select("email");

      let adminEmails = adminUsers
        .map(a => a.email?.trim().toLowerCase())
        .filter(e => e && !EXCLUDED.has(e));

      // ✅ NEW: override with env emails if present (still an array)
      console.log("ENV CHECK → ADMIN_NOTIFICATION_EMAILS =", process.env.ADMIN_NOTIFICATION_EMAILS);

      console.log("Admin before override =", adminEmails);

      if (process.env.ADMIN_NOTIFICATION_EMAILS) {
        adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);
      }

      console.log("Admin AFTER override =", adminEmails);
      const emailString = adminEmails.join(',');
      await MAIL_HANDLER.sendFailedLeadPaymentAdminEmail({
        to: emailString,
        userEmail: owner.email,
        userName: owner.name || "",
        leadId: leadId,
        amount: leadCost,
        cardLast4: billingResult.cardLast4 || "N/A",
        errorMessage: billingResult.message
      });
      logger.info?.('Admin failure email sent');
    } catch (emailErr) {
      logger.error?.("Admin failed-payment email failed", emailErr);
    }

    logger.info?.('✅ Payment failure handling completed', { user_id: owner._id });

    return { success: true };

  } catch (err) {
    logger.error?.('❌ Error handling payment failure', err);
    console.error('❌ Payment failure handling error:', err);
    return { success: false, error: err.message };
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

  // Calculate pending balance
  const pendingBalanceResult = await Lead.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        payment_status: 'pending'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$lead_cost" }
      }
    }
  ]);

  const pendingBalance = pendingBalanceResult[0]?.total || 0;

  return {
    balance: user.balance || 0,
    pending_balance: pendingBalance,
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


const chargeSingleLead = async (userId, leadId) => {
  const logMeta = { user_id: userId, lead_id: leadId, action: 'Charge Single Lead' };


  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler(404, 'User not found');


  let lead = await Lead.findOne({ _id: leadId }).populate('campaign_id');
  if (!lead) {
    lead = await Lead.findOne({ lead_id: leadId }).populate('campaign_id');
  }
  if (!lead) throw new ErrorHandler(404, 'Lead not found');

  if (lead.payment_status === 'paid') {
    return { success: true, message: 'Lead is already paid', alreadyPaid: true };
  }

  const campaign = lead.campaign_id;
  if (!campaign) throw new ErrorHandler(400, 'Campaign not found for lead');


  //  'payasyougo' logic to enable Split Payment (Refund -> Balance -> Card)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const paymentResult = await processLeadTransaction({
      user,
      leadId: lead._id,
      amount: lead.lead_cost,
      paymentType: 'payasyougo',
      assignedBy: userId,
      session,
      descriptionPrefix: 'Single Lead Charge'
    });

    if (!paymentResult.success) {
      await session.abortTransaction();
      return { success: false, error: paymentResult.error, message: paymentResult.message };
    }


    lead.payment_status = 'paid';
    lead.status = 'active';
    lead.transaction_id = paymentResult.transactionId;
    lead.payment_error_message = null;
    await lead.save({ session });

    if (user.pending_payment && user.pending_payment.amount > 0) {
      user.pending_payment.amount = Math.max(0, user.pending_payment.amount - lead.lead_cost);
      if (user.pending_payment.count > 0) user.pending_payment.count -= 1;
      await user.save({ session });
    }

    await session.commitTransaction();

    // Send Notifications (Async - fire and forget)
    const BoberDoService = require('../../services/boberdoo/boberdoo.service');

    (async () => {
      billingLogger.info('DEBUG: Starting async notifications for single lead charge', logMeta);

      // 1. Send Receipt - REMOVED (Handled by BoberDoService to avoid duplicates)
      // try {
      //   await ReceiptService.sendLeadPaymentReceipt({
      //     user,
      //     lead,
      //     campaign,
      //     billingResult: paymentResult
      //   });
      // } catch (err) {
      //   billingLogger.error('Failed to send lead payment receipt for single lead charge', err, logMeta);
      // }

      // 2. Send Boberdo Notifications
      try {
        // Enforce delay to prevent Rate Limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        await BoberDoService.sendBoberdoLeadNotifications(lead, campaign, paymentResult);
      } catch (err) {
        billingLogger.error('Failed to send Boberdoo notifications for single lead charge', err, logMeta);
      }

      billingLogger.info('DEBUG: Finished async notifications for single lead charge', logMeta);
    })();

    return {
      success: true,
      message: 'Lead charged successfully',
      transactionId: paymentResult.transactionId,
      newBalance: paymentResult.newBalance,
      amountFromBalance: paymentResult.amountFromBalance,
      amountFromCard: paymentResult.amountFromCard
    };

  } catch (error) {
    await session.abortTransaction();
    billingLogger.error('Single lead charge transaction error', error, logMeta);
    throw new ErrorHandler(500, error.message || 'Payment processing failed');
  } finally {
    session.endSession();
  }
};


const checkAndSendLowBalanceAlerts = async ({ campaign, leadCost, remainingBalance, logger = console }) => {
  try {
    const owner = await User.findById(campaign.user_id);
    if (!owner) return;

    if (campaign.payment_type === "prepaid" && remainingBalance < leadCost) {

      // TRIGGER WEBHOOK FIRST
      try {
        const lowBalanceResp = await sendLowBalanceAlert({
          campaign_name: campaign.name,
          filter_set_id: campaign.boberdoo_filter_set_id,
          partner_id: owner.integrations?.boberdoo?.external_id || "",
          email: owner.email,
          user_id: owner._id,
          campaign_id: campaign._id
        });

        if (lowBalanceResp.success) {
          logger.info("Low Balance webhook sent successfully", {
            campaignId: campaign._id,
            response: lowBalanceResp
          });
        } else {
          logger.warn("Low Balance webhook failed", {
            campaignId: campaign._id,
            error: lowBalanceResp.error || "Unknown error",
            response: lowBalanceResp
          });
        }
      } catch (err) {
        logger.error("Fatal error while sending low balance webhook", err, {
          error: err.message
        });
      }

      //SEND LOW BALANCE EMAIL TO USER
      try {
        const emailResp = await MAIL_HANDLER.sendInsufficientBalanceEmail({
          to: owner.email,
          userName: owner.name || owner.fullName || owner.email,
          requiredAmount: leadCost,
          currentBalance: remainingBalance,
          campaignName: campaign.name || `Campaign #${campaign._id}`,
          campaignId: campaign._id
        });

        if (emailResp?.data?.id) {
          logger.info("Low Balance email sent successfully", {
            email_to: owner.email,
            response_id: emailResp.data.id
          });
        } else {
          logger.warn("Low Balance email sending failed", {
            email_to: owner.email,
            error: emailResp?.error || "Unknown error",
            response: emailResp
          });
        }
      } catch (err) {
        logger.error("Fatal error sending low balance user email", err, {
          error: err.message
        });
      }

      // SEND LOW BALANCE EMAIL TO ADMINS
      try {
        const EXCLUDED = new Set([
          'admin@gmail.com',
          'admin123@gmail.com',
          'admin1234@gmail.com',
        ]);

        const adminUsers = await User.find({
          role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: { $ne: false }
        }).select('email');

        let adminEmails = (adminUsers || [])
          .map(a => a.email)
          .filter(Boolean)
          .map(e => e.trim().toLowerCase())
          .filter(e => !EXCLUDED.has(e));

        if (process.env.ADMIN_NOTIFICATION_EMAILS) {
          adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);
        }

        const emailString = adminEmails.join(',');

        if (adminEmails.length > 0) {
          const adminEmailResp = await MAIL_HANDLER.sendLowBalanceAdminEmail({
            to: emailString,
            userEmail: owner.email,
            userName: owner.name || owner.fullName || "",
            campaignName: campaign.name,
            campaignId: campaign._id,
            requiredAmount: leadCost,
            currentBalance: remainingBalance
          });

          if (adminEmailResp?.data?.id) {
            logger.info("Low Balance ADMIN email sent successfully", {
              email_to: adminEmails,
              response_id: adminEmailResp.data.id
            });
          } else {
            logger.warn("Low Balance ADMIN email failed", {
              email_to: adminEmails,
              error: adminEmailResp?.error || "Unknown error",
              response: adminEmailResp
            });
          }
        }
      } catch (err) {
        logger.error("Fatal error sending low balance admin email", err, {
          error: err.message
        });
      }

      logger.warn("Low balance flow completed (webhook + user email + admin email)", {
        campaignId: campaign._id,
        userId: owner._id,
        balance: remainingBalance
      });
    }
  } catch (err) {
    logger.error('Error in low balance check logic', err);
  }
};

const retryUserPendingPayments = async (userId) => {
  billingLogger.info('Manual retry of pending payments initiated', { userId });

  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }

  // Check for pending amount
  if (!user.pending_payment || user.pending_payment.amount <= 0) {
    // Double check leads manually just in case
    const pendingCount = await Lead.countDocuments({
      user_id: userId,
      payment_status: 'pending',
      // We rely on processPendingPaymentRecovery to filter PayAsYouGo
    });

    if (pendingCount === 0) {
      return { success: true, message: 'No pending payments to recover' };
    }
  }

  // Find default card
  const defaultCard = user.paymentMethods?.find(pm => pm.isDefault) || user.paymentMethods?.[0];

  if (!defaultCard || !defaultCard.customerVaultId) {
    throw new ErrorHandler(400, 'No valid payment method found. Please add a card first.');
  }

  // Trigger recovery with includeAll: true to catch Prepaid and PayAsYouGo
  const result = await processPendingPaymentRecovery(user, defaultCard.customerVaultId, { includeAll: true });

  if (!result.success) {
    if (result.message === 'Duplicate') {
      throw new ErrorHandler(400, 'Payment Gateway Warning: Duplicate transaction detected. You may have already paid or need to wait a few minutes before retrying the same amount.');
    }
    throw new ErrorHandler(400, result.message || 'Payment recovery failed');
  }

  return {
    success: true,
    message: 'Pending payments recovered successfully',
    details: result
  };
};




module.exports = {
  checkAndSendLowBalanceAlerts,
  chargeSingleLead,
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
  handlePaymentFailure,
  // sendLeadPaymentReceipt, // ✅ Removed to avoid circular dependency

  assignLeadPrepaid,
  assignLeadPayAsYouGo,
  processPendingPaymentRecovery,
  retryUserPendingPayments
};
