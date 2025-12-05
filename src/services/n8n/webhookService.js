const axios = require('axios');
const State = require('../../models/state.model');
const { User,RegularUser } = require('../../models/user.model');

const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const { createCustomerVault, chargeCustomerVault ,deleteCustomerVault} = require('../nmi/nmi.service');
const mongoose = require('mongoose');
const BoberDoService = require('../../services/boberdoo/boberdoo.service');
const Lead = require('../../models/lead.model');
const Transaction = require('../../models/transaction.model');

// Create, Update, and Delete Webhook URLs
const WEBHOOK_CREATE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/ffe20f26-ebb5-42fa-8e2d-8867957396b2';
const WEBHOOK_UPDATE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/update';
const WEBHOOK_DELETE_URL = 'https://n8n.srv997679.hstgr.cloud/webhook/delete';
const { billingLogger } = require('../../utils/logger');
const MAIL_HANDLER = require('../../mail/mails');
const sendToN8nWebhook = async (campaignData) => {
  try {

    // -----------------------------------------------
    // GET ACTIVE DAYS (send DB values directly)
    // -----------------------------------------------
    const activeDays = campaignData?.delivery?.schedule?.days
      ?.filter(day => day.active)
      ?.map(day => day.day)   // <-- using DB value
      || [];


    // ✅ Resolve multiple states (abbreviations)
    let stateAbbrs = [];
    const stateVal = campaignData?.geography?.state;


    if (Array.isArray(stateVal)) {
      const stateDocs = await State.find({ _id: { $in: stateVal } }).select('abbreviation');
      stateAbbrs = stateDocs.map((s) => s.abbreviation).filter(Boolean);
    } else if (typeof stateVal === 'object' && stateVal.abbreviation) {
      stateAbbrs = [stateVal.abbreviation];
    } else if (stateVal) {
      try {
        const stateDoc = await State.findById(stateVal).select('abbreviation');
        if (stateDoc) stateAbbrs = [stateDoc.abbreviation];
      } catch (e) {
        console.error('State lookup failed:', e.message);
      }
    }

    // ✅ Resolve user name
    let userName = '';
    let partnerId = '';
    const userVal = campaignData?.user_id;
    if (userVal) {
      if (typeof userVal === 'object') {
        const u = userVal;
        userName =
          u.name ||
          u.fullName ||
          u.username ||
          `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
          u.email ||
          '';
        
        // ✅ FIX
        partnerId = u?.integrations?.boberdoo?.external_id || '';
      } else {
        try {
          const userDoc = await User.findById(userVal).select('name fullName username firstName lastName email integrations');
          if (userDoc) {
            userName =
              userDoc.name ||
              userDoc.fullName ||
              userDoc.username ||
              `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() ||
              userDoc.email ||
              '';
                  // ⬇️ Extract Partner ID
            partnerId = userDoc.integrations?.boberdoo?.external_id || '';
          }
        } catch (e) {
          console.error('User lookup failed:', e.message);
        }
      }
    }

    // ✅ Zip codes
    const zipCodes = Array.isArray(campaignData?.geography?.coverage?.partial?.zip_codes)
      ? campaignData.geography.coverage.partial.zip_codes
      : [];

    // ✅ Get lead_type and mapped boberdoo number
    const leadTypeKey = campaignData.lead_type;
    const boberdooTypeId =  CONSTANT_ENUM.BOBERDOO_LEAD_TYPE_MAP[leadTypeKey] || null;

    // ✅ Payload
    const payload = {
      action: campaignData.action || 'create',
      campaign_id: campaignData.campaign_id || '',
      states: stateAbbrs,
      zip_codes: zipCodes,
      client_name: userName,
      partner_id: partnerId,       
      boberdoo_filter_set_id: campaignData.boberdoo_filter_set_id || null,
      timezone: campaignData.delivery?.schedule?.timezone || 'America/New_York',
      submitted_at: new Date().toISOString(),

      // NEW FIELDS
      lead_type: leadTypeKey,
      boberdoo_lead_type_id: boberdooTypeId,
      active_days: activeDays,

    };


    // ✅ Choose correct webhook
    let webhookUrl = WEBHOOK_CREATE_URL;
    if (campaignData.action === 'update') webhookUrl = WEBHOOK_UPDATE_URL;
    else if (campaignData.action === 'delete') webhookUrl = WEBHOOK_DELETE_URL;

    console.log(`📤 Sending ${campaignData.action} webhook to:`, webhookUrl);
    console.log('Payload:', payload);

    // ✅ Send request
    const resp = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ N8N response:', resp.status, resp.data);
    return { success: true, data: resp.data };
  } catch (error) {
    console.error('❌ Error sending webhook to N8N:', error?.response?.status, error?.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

const sendLowBalanceAlert = async ({ campaign_name, filter_set_id, partner_id, email,user_id,campaign_id}) => {
  try {
 const LOW_BALANCE_API = "https://n8n.srv997679.hstgr.cloud/webhook/low_balance";


    const payload = {
      campaign_name,
      filter_set_id,
      partner_id,
      email,
      triggered_at: new Date().toISOString()
    };

    console.log("📤 Sending LOW BALANCE alert:", payload);

    const resp = await axios.post(LOW_BALANCE_API, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });
    console.log("✅ Low Balance API Response:", resp.status);
// ✅ STORE THE STOPPED CAMPAIGN INFO ON USER - DIRECT SAVE METHOD
    if (user_id && filter_set_id) {
      try {
        // Fetch user directly
        const userToUpdate = await User.findById(user_id);
        
        if (!userToUpdate) {
          console.error("❌ User not found for stopped_campaigns update:", user_id);
          return { success: true }; // Webhook was successful, just DB update failed
        }

        // Initialize array if not exists
        if (!userToUpdate.stopped_campaigns) {
          userToUpdate.stopped_campaigns = [];
        }

        // Check if already exists
        const alreadyExists = userToUpdate.stopped_campaigns.some(
          sc => sc.filter_set_id === filter_set_id
        );

        if (!alreadyExists) {
          // Push new stopped campaign
          userToUpdate.stopped_campaigns.push({
            campaign_id: campaign_id,
            campaign_name: campaign_name,
            filter_set_id: filter_set_id,
            stopped_at: new Date(),
            reason: 'low_balance'
          });

          // Save directly
          await userToUpdate.save();

          console.log("✅ Stored stopped campaign info for user:", user_id);
          console.log("📋 stopped_campaigns now:", userToUpdate.stopped_campaigns);
        } else {
          console.log("ℹ️ Campaign already stopped, skipping:", filter_set_id);
        }

      } catch (dbErr) {
        console.error("❌ Failed to store stopped campaign info:", dbErr.message);
        console.error("❌ Stack:", dbErr.stack);
      }
    }

   
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending low balance alert:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};


const sendBalanceTopUpAlert = async ({ partner_id, email, amount, user_id }) => {
  try {
    let pendingLeadsResult = { processed: 0, failed: 0, total: 0 };
    
    // ✅ FIRST: Process all pending leads for this user
    if (user_id) {
      pendingLeadsResult = await processPendingLeadsForUser(user_id);
      console.log(`✅ Processed ${pendingLeadsResult.processed} pending leads`);
    }

    // ✅ FETCH USER TO GET STOPPED CAMPAIGNS
    let stoppedCampaigns = [];
    let userDoc = null;
    
    if (user_id) {
      userDoc = await User.findById(user_id);
      
      console.log("🔍 DEBUG - User found:", userDoc ? "Yes" : "No");
      console.log("🔍 DEBUG - stopped_campaigns raw:", userDoc?.stopped_campaigns);
      console.log("🔍 DEBUG - stopped_campaigns length:", userDoc?.stopped_campaigns?.length);
      
      stoppedCampaigns = userDoc?.stopped_campaigns || [];
      console.log(`📋 Found ${stoppedCampaigns.length} stopped campaigns for user`);
      
      if (stoppedCampaigns.length > 0) {
        console.log("📋 Stopped campaigns details:", JSON.stringify(stoppedCampaigns, null, 2));
      }
    }

    // ⚠️ CHECK: If pending leads failed and no new balance was added, DON'T resume!
    if (pendingLeadsResult.failed > 0 && pendingLeadsResult.processed === 0) {
      console.log("⚠️ WARNING: Pending leads payment failed, NOT sending resume webhook");
      console.log("⚠️ User needs to add funds or fix payment method first");
      
      return { 
        success: false, 
        error: 'PAYMENT_STILL_FAILING',
        message: 'Cannot resume campaigns - payment is still failing',
        pending_leads: pendingLeadsResult
      };
    }

    const BALANCE_TOP_UP_API = "https://n8n.srv997679.hstgr.cloud/webhook/balance_toped_up";

    // ✅ BUILD PAYLOAD
    const payload = {
      partner_id,
      email,
      amount,
      user_id: user_id?.toString(),
      topped_up_at: new Date().toISOString(),
      stopped_campaigns: stoppedCampaigns.map(sc => ({
        campaign_name: sc.campaign_name,
        filter_set_id: sc.filter_set_id,
        campaign_id: sc.campaign_id?.toString(),
        stopped_at: sc.stopped_at
      })),
      filter_set_ids: stoppedCampaigns.map(sc => sc.filter_set_id).filter(Boolean)
    };

    console.log("📤 Sending BALANCE TOP-UP alert:", JSON.stringify(payload, null, 2));
    billingLogger.info('Sending BALANCE TOP-UP alert payload:',  JSON.stringify(payload, null, 2));

    const resp = await axios.post(BALANCE_TOP_UP_API, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ Balance Top-Up API Response:", resp.status);
    billingLogger.info("✅ Balance Top-Up API Response:", resp.status);


    // ✅ CLEAR STOPPED CAMPAIGNS AFTER SUCCESSFUL RESUME WEBHOOK
    if (resp.status === 200 && stoppedCampaigns.length > 0 && userDoc) {
      try {
        userDoc.stopped_campaigns = [];
        await userDoc.save();
        console.log("✅ Cleared stopped_campaigns for user:", user_id);
      } catch (clearErr) {
        console.error("❌ Failed to clear stopped_campaigns:", clearErr.message);
      }
    } else {
      console.log("ℹ️ No stopped_campaigns to clear or already empty");
    }

    return { success: true };

  } catch (error) {
    console.error("❌ Error sending balance top-up alert:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

const processPendingLeadsForUser = async (userId) => {
  const logMeta = {
    user_id: userId,
    action: 'Process Pending Leads'
  };

  billingLogger.info('Starting pending leads processing', logMeta);

  const pendingLeads = await Lead.find({
    user_id: userId,
    payment_status: 'pending'
  }).populate('campaign_id').sort({ createdAt: 1 });

  if (pendingLeads.length === 0) {
    billingLogger.info('No pending leads found for user', logMeta);
    return { processed: 0, failed: 0, total: 0 };
  }

  billingLogger.info(`Found ${pendingLeads.length} pending leads to process`, {
    ...logMeta,
    pending_count: pendingLeads.length
  });

  let processed = 0;
  let failed = 0;

  // ✅ NEW: Collect all successfully charged leads for summary email
  const chargedLeads = [];
  let totalAmountCharged = 0;
  let usedCard = false;
  let usedBalance = false;
  let lastCardLast4 = null;
  let finalBalance = 0;

  // ✅ NEW: Fetch user once for email details
  const userForEmail = await RegularUser.findById(userId);

  for (const lead of pendingLeads) {
    const session = await mongoose.startSession();
    session.startTransaction();

    const leadLogMeta = {
      ...logMeta,
      lead_id: lead.lead_id,
      lead_internal_id: lead._id,
      campaign_id: lead.campaign_id?._id,
      campaign_name: lead.campaign_id?.name,
      lead_cost: lead.lead_cost
    };

    try {
      billingLogger.info('Processing pending lead', leadLogMeta);

      const user = await User.findById(userId).session(session);
      if (!user) {
        billingLogger.error('User not found while processing pending lead', null, leadLogMeta);
        await session.abortTransaction();
        failed++;
        break;
      }

      const leadCost = lead.lead_cost;
      const campaign = lead.campaign_id;

      if (!campaign) {
        billingLogger.error('Campaign not found for pending lead', null, leadLogMeta);
        await session.abortTransaction();
        failed++;
        continue;
      }

      // ✅ UPDATED: Added paymentMethod and cardLast4 to track for email
      let paymentResult = { success: false, paymentMethod: null, cardLast4: null };

      // Try based on payment type
      if (campaign.payment_type === 'prepaid') {
        billingLogger.info('Attempting prepaid balance charge for pending lead', {
          ...leadLogMeta,
          user_balance: user.balance,
          required: leadCost
        });

        // Prepaid - only balance
        if (user.balance >= leadCost) {
          user.balance -= leadCost;
          await user.save({ session });

          const txn = await new Transaction({
            userId,
            type: "LEAD_ASSIGNMENT",
            amount: -leadCost,
            status: "COMPLETED",
            paymentMethod: "BALANCE",
            description: `Pending lead charged: ${lead.lead_id}`,
            leadId: lead._id,
            balanceAfter: user.balance
          }).save({ session });

          // ✅ UPDATED: Added paymentMethod
          paymentResult = { 
            success: true, 
            transactionId: txn._id, 
            newBalance: user.balance,
            paymentMethod: 'BALANCE',
            cardLast4: null
          };

          billingLogger.info('Prepaid balance charge successful for pending lead', {
            ...leadLogMeta,
            transaction_id: txn._id,
            new_balance: user.balance
          });
        } else {
          billingLogger.warn('Insufficient balance for prepaid pending lead', {
            ...leadLogMeta,
            user_balance: user.balance,
            required: leadCost,
            shortfall: leadCost - user.balance
          });
        }
      } else {
        // Pay as you go - try balance then card
        billingLogger.info('Attempting pay-as-you-go charge for pending lead', {
          ...leadLogMeta,
          user_balance: user.balance,
          required: leadCost
        });

        if (user.balance >= leadCost) {
          user.balance -= leadCost;
          await user.save({ session });

          const txn = await new Transaction({
            userId,
            type: "LEAD_ASSIGNMENT",
            amount: -leadCost,
            status: "COMPLETED",
            paymentMethod: "BALANCE",
            description: `Pending lead charged: ${lead.lead_id}`,
            leadId: lead._id,
            balanceAfter: user.balance
          }).save({ session });

          // ✅ UPDATED: Added paymentMethod
          paymentResult = { 
            success: true, 
            transactionId: txn._id, 
            newBalance: user.balance,
            paymentMethod: 'BALANCE',
            cardLast4: null
          };

          billingLogger.info('Balance charge successful for pending lead', {
            ...leadLogMeta,
            transaction_id: txn._id,
            new_balance: user.balance,
            payment_method: 'BALANCE'
          });
        } else {
          // Try card
          billingLogger.info('Balance insufficient, attempting card charge for pending lead', {
            ...leadLogMeta,
            user_balance: user.balance,
            required: leadCost
          });

          const defaultCard = user.paymentMethods?.find(pm => pm.isDefault);

          if (!defaultCard?.customerVaultId) {
            billingLogger.warn('No default payment method found for pending lead', leadLogMeta);
          } else {
            billingLogger.info('Charging card for pending lead', {
              ...leadLogMeta,
              card_last4: defaultCard.cardLastFour || 'N/A',
              card_brand: defaultCard.brand || 'Card'
            });

            const chargeResult = await chargeCustomerVault(
              defaultCard.customerVaultId,
              leadCost,
              `Pending lead: ${lead.lead_id}`
            );

            if (chargeResult.success) {
              const txn = await new Transaction({
                userId,
                type: "LEAD_ASSIGNMENT",
                amount: -leadCost,
                status: "COMPLETED",
                paymentMethod: "CARD",
                transactionId: chargeResult.transactionId,
                description: `Pending lead charged (Card): ${lead.lead_id}`,
                leadId: lead._id,
                balanceAfter: user.balance
              }).save({ session });

              // ✅ UPDATED: Added paymentMethod and cardLast4
              paymentResult = {
                success: true,
                transactionId: txn._id,
                gatewayTransactionId: chargeResult.transactionId,
                newBalance: user.balance,
                paymentMethod: 'CARD',
                cardLast4: defaultCard.cardLastFour || 'N/A'
              };

              billingLogger.info('Card charge successful for pending lead', {
                ...leadLogMeta,
                transaction_id: txn._id,
                gateway_transaction_id: chargeResult.transactionId,
                payment_method: 'CARD',
                card_last4: defaultCard.cardLastFour || 'N/A'
              });
            } else {
              billingLogger.error('Card charge failed for pending lead', null, {
                ...leadLogMeta,
                error: chargeResult.message,
                response_code: chargeResult.responseCode,
                card_last4: defaultCard.cardLastFour || 'N/A'
              });
            }
          }
        }
      }

      if (paymentResult.success) {
        // ✅ Update lead to active
        lead.status = 'active';
        lead.payment_status = 'paid';
        lead.transaction_id = paymentResult.transactionId;
        lead.payment_error_message = null;
        await lead.save({ session });

        // ✅ Update pending_payment
        user.pending_payment.amount -= leadCost;
        user.pending_payment.count -= 1;
        await user.save({ session });

        await session.commitTransaction();
        processed++;

        // ✅ NEW: Add to charged leads array for summary email
        chargedLeads.push({
          leadId: lead.lead_id,
          firstName: lead.first_name,
          lastName: lead.last_name,
          email: lead.email,
          phone: lead.phone_number,
          campaignName: campaign.name,
          amount: leadCost,
          paymentMethod: paymentResult.paymentMethod,
          transactionId: paymentResult.transactionId?.toString()
        });

        totalAmountCharged += leadCost;
        finalBalance = paymentResult.newBalance;

        // Track payment methods used
        if (paymentResult.paymentMethod === 'CARD') {
          usedCard = true;
          lastCardLast4 = paymentResult.cardLast4;
        } else {
          usedBalance = true;
        }

        billingLogger.info('Pending lead successfully activated', {
          ...leadLogMeta,
          transaction_id: paymentResult.transactionId,
          new_status: 'active',
          new_payment_status: 'paid'
        });

        // Send notifications for this lead (async)
        process.nextTick(async () => {
          try {
            await BoberDoService.sendBoberdoLeadNotifications(lead, campaign, paymentResult);
          } catch (err) {
            billingLogger.error('Failed to send notifications for activated pending lead', err, leadLogMeta);
          }
        });
      } else {
        await session.abortTransaction();
        failed++;

        billingLogger.warn('Could not charge pending lead - stopping processing', {
          ...leadLogMeta,
          processed_so_far: processed,
          failed_so_far: failed
        });

        break; // Stop if can't pay
      }

    } catch (err) {
      await session.abortTransaction();
      failed++;

      billingLogger.error('Error processing pending lead', err, {
        ...leadLogMeta,
        error: err.message,
        stack: err.stack
      });
    } finally {
      session.endSession();
    }
  }

  // ✅ NEW: Send ONE summary email with ALL charged leads
  if (chargedLeads.length > 0 && userForEmail) {
    const overallPaymentMethod = usedBalance && usedCard ? 'MIXED' : (usedCard ? 'CARD' : 'BALANCE');

    process.nextTick(async () => {
      // Send email to USER
      try {
        await MAIL_HANDLER.sendPendingLeadsPaymentSuccessEmail({
          to: userForEmail.email,
          userName: userForEmail.name || userForEmail.fullName || userForEmail.email,
          chargedLeads,
          totalAmount: totalAmountCharged,
          newBalance: finalBalance,
          paymentMethod: overallPaymentMethod,
          cardLast4: lastCardLast4
        });
        billingLogger.info('Pending leads success email sent to user', {
          ...logMeta,
          leads_count: chargedLeads.length,
          total_amount: totalAmountCharged
        });
      } catch (emailErr) {
        billingLogger.error('Failed to send pending leads success email to user', emailErr, logMeta);
      }

      // Send email to ADMINS
      try {
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
        if (adminEmails.length > 0) {
          await MAIL_HANDLER.sendPendingLeadsPaymentSuccessAdminEmail({
            to: emailString,
            userName: userForEmail.name || userForEmail.fullName || '',
            userEmail: userForEmail.email,
            chargedLeads,
            totalAmount: totalAmountCharged,
            newBalance: finalBalance,
            paymentMethod: overallPaymentMethod,
            cardLast4: lastCardLast4
          });
          billingLogger.info('Pending leads success email sent to admins', {
            ...logMeta,
            leads_count: chargedLeads.length
          });
        }
      } catch (emailErr) {
        billingLogger.error('Failed to send pending leads success email to admins', emailErr, logMeta);
      }
    });
  }

  // Clear payment error if all processed successfully
  if (failed === 0 && processed > 0) {
    await RegularUser.findByIdAndUpdate(userId, {
      payment_error: false,
      last_payment_error_message: null
    });

    billingLogger.info('Payment error flag cleared for user', {
      ...logMeta,
      processed,
      failed
    });
  }

  billingLogger.info('Pending leads processing completed', {
    ...logMeta,
    processed,
    failed,
    total: pendingLeads.length,
    remaining: pendingLeads.length - processed
  });

  return { processed, failed, total: pendingLeads.length };
};


module.exports = { sendToN8nWebhook,sendLowBalanceAlert,sendBalanceTopUpAlert,processPendingLeadsForUser};
