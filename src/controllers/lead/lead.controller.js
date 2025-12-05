const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const LeadServices = require('../../services/lead/lead.service.js');
const NotificationServices = require('../../services/notification/notification.service');
const { ErrorHandler } = require('../../utils/error-handler');
const Lead = require('../../models/lead.model.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const { getPaginationParams, extractFilters } = require('../../utils/pagination');
const generateUniqueLeadId = require('../../utils/idGenerator');
const { cleanupTempFile } = require('../../middleware/csv-upload');
const path = require('path');
const fs = require('fs');
const MAIL_HANDLER = require('../../mail/mails');
const SmsServices = require('../../services/sms/sms.service');
const BillingServices = require('../../services/billing/billing.service.js');
const mongoose = require('mongoose');
const { User } = require('../../models/user.model.js');
const { sendToN8nWebhook, sendLowBalanceAlert} = require('../../services/n8n/webhookService.js');
// Create single lead
const Campaign = require('../../models/campaign.model.js');
const { leadLogger } = require('../../utils/logger');
const { formatFullAddress } = require('../../utils/address.utile.js');

// const createLead = wrapAsync(async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
  
//     const logMeta = {
//       user_id: req?.user?._id,
//       user_role: req?.user?.role,
//       route: req.originalUrl,
//       action: 'Create Lead',
//     };
  
//     try {
//       leadLogger.info('Starting lead creation process', logMeta);
  
//       const { campaign_id } = req.body;
//       const user_id = req.user._id;
  
//       if (!campaign_id) {
//         leadLogger.warn('Missing campaign_id during lead creation', logMeta);
//         throw new ErrorHandler(400, 'Campaign ID is required');
//       }
  
//       const { campaignData, leadCost } = await LeadServices.validatePrepaidCampaignBalance(campaign_id);
//       leadLogger.info('Validated campaign balance', { ...logMeta, campaign_id, leadCost });
  
//       const lead_id = await generateUniqueLeadId();
//       let leadData = { ...req.body, user_id, lead_id };
  
//       const result = await LeadServices.createLead(leadData, { session });
//       await result.populate('campaign_id');
//       await result.populate('address.state');
  
//       leadLogger.info('Lead created successfully in database', {
//         ...logMeta,
//         lead_id: result.lead_id,
//         campaign_name: result.campaign_id?.name,
//         campaign_owner_id: result.campaign_id?.user_id,
//       });
  
//       const assignedBy = req.user._id;
//       const billingResult = await BillingServices.assignLeadNew(
//         campaignData.user_id,
//         result._id,
//         leadCost,
//         assignedBy,
//         session
//       );
  
//       leadLogger.info('Billing and balance updated successfully', {
//         ...logMeta,
//         transaction_id: billingResult.transactionId,
//         new_balance: billingResult.newBalance,
//         lead_cost: leadCost,
//       });
  
//       await session.commitTransaction();
//       session.endSession();payment_error
  
//       const campaign = result.campaign_id;
//       const campaignOwner = await User.findById(campaign.user_id);
  
//       // Send lead payment transaction email
//       try {
//         await MAIL_HANDLER.sendLeadPaymentEmail({
//           to: campaignOwner.email,
//           userName: campaignOwner.name,
//           leadCost: leadCost,
//           leadId: result.lead_id,
//           leadName: `${result.first_name} ${result.last_name}`.trim(),
//           campaignName: campaign.name,
//           payment_type: campaign.payment_type,
//           full_address: result.address.full_address,
//           transactionId: billingResult.transactionId,
//           newBalance: billingResult.newBalance,
//           leadData: {
//             first_name: result.first_name,
//             last_name: result.last_name,
//             phone_number: result.phone_number,
//             email: result.email,
//             address: result.address
//           }
//         });
  
//         leadLogger.info('Lead payment email sent successfully', {
//           ...logMeta,
//           email_to: campaignOwner.email,
//           transaction_id: billingResult.transactionId
//         });
//       } catch (emailErr) {
//         leadLogger.error('Failed to send lead payment email', emailErr, {
//           ...logMeta,
//           error: emailErr.message
//         });
//       }
  
//       const message = 'New Lead has been assigned to your campaign!';
//       try {
//         await NotificationServices.createNotification(
//           user_id,
//           campaign.user_id,
//           'info',
//           message,
//           0,
//           `/dashboard/leads`
//         );
  
//         leadLogger.info('Notification created successfully', {
//           ...logMeta,
//           recipient_id: campaign.user_id,
//         });
  
//         if (campaign?.delivery?.method?.includes('email') && campaign?.delivery?.email?.addresses) {
//           try {
//             const emailSubjectFromCampaign = campaign?.delivery?.email?.subject?.trim();
  
//             await MAIL_HANDLER.sendLeadAssignEmail({
//               to: campaign.delivery.email.addresses,
//               name: campaignOwner.name || 'Campaign User',
//               leadName: result.lead_id,
//               assignedBy: req.user?.name || 'System',
//               leadDetailsUrl: `${process.env.UI_LINK}/dashboard/leads/${result._id}`,
//               campaignName: campaign.name,
//               leadData: leadData,
//               realleadId: result._id,
//               subject: emailSubjectFromCampaign || `Lead Fusion - New Lead"`,
//             });
  
//             leadLogger.info('Lead assignment email sent successfully', {
//               ...logMeta,
//               email_to: campaign.delivery.email.addresses,
//             });
//           } catch (err) {
//             leadLogger.error('Failed to send lead assignment email', err, {
//               ...logMeta,
//               error: err.message
//             });
//           }
//         }
  
//         if (campaign?.delivery?.method?.includes('phone') && campaign?.delivery?.phone?.numbers) {
//           try {
//             const fullName = `${result.first_name || ''} ${result.last_name || ''}`.trim();
//             const phoneNumber = result.phone_number || result.phone || '';
//             const email = result.email || '';
//             const address = [
//               result?.address?.full_address || '',
//               result?.address?.city || '',
//               result?.address?.zip_code || '',
//             ].filter(Boolean).join(', ');
//             const campaignName = campaign?.name || 'N/A';
  
//             const MAX_NOTE_LENGTH = 100;
//             let notes = result.note || 'No notes provided';
//             if (notes.length > MAX_NOTE_LENGTH) notes = notes.substring(0, MAX_NOTE_LENGTH) + '...';
  
//             const smsMessage = `New Lead Assigned
  
//   Name: ${fullName}
//   Phone: ${phoneNumber}
//   Email: ${email}
//   Address: ${address}
//   Lead ID: ${result.lead_id}
//   Campaign: ${campaignName}
//   Notes: ${notes}
  
//   View Lead: ${process.env.UI_LINK}/dashboard/leads/${result._id}`;
  
//             const smsResult = await SmsServices.sendSms({
//               to: campaign.delivery.phone.numbers,
//               message: smsMessage,
//               from: process.env.SMS_SENDER_ID || '+18563908470',
//             });
  
//             if (smsResult.success) {
//               leadLogger.info('Lead assignment SMS sent successfully', {
//                 ...logMeta,
//                 sent_to: smsResult.sentTo.join(', ')
//               });
//             } else {
//               leadLogger.warn('Lead assignment SMS failed', {
//                 ...logMeta,
//                 error: smsResult
//               });
//             }
//           } catch (err) {
//             leadLogger.error('Fatal error during SMS sending', err, {
//               ...logMeta,
//               error: err.message
//             });
//           }
//         }
  
//       } catch (err) {
//         leadLogger.error('Failed during notification or delivery process', err, {
//           ...logMeta,
//           error: err.message
//         });
//       }
  
//       leadLogger.info('Lead creation process completed successfully', {
//         ...logMeta,
//         lead_id: result.lead_id
//       });
  
//       sendResponse(res, { leadData: result }, 'Lead has been created successfully', 201);
  
//     } catch (err) {
//       await session.abortTransaction();
//       session.endSession();
  
//       leadLogger.error('Error during lead creation process', err, {
//         ...logMeta,
//         error: err.message,
//         stack: err.stack
//       });
  
//       throw err;
//     }
//   });
  






// Get all leads (paginated with filters)



const createLead = wrapAsync(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const logMeta = {
    user_id: req?.user?._id,
    user_role: req?.user?.role,
    route: req.originalUrl,
    action: 'Create Lead',
  };

  try {
    leadLogger.info('Starting lead creation process', logMeta);

    const { campaign_id } = req.body;
    const user_id = req.user._id;

    if (!campaign_id) {
      leadLogger.warn('Missing campaign_id during lead creation', logMeta);
      throw new ErrorHandler(400, 'Campaign ID is required');
    }

    // ========================================
    // ✅ GET CAMPAIGN DATA
    // ========================================
    const campaign = await Campaign.findById(campaign_id);
    if (!campaign) {
      throw new ErrorHandler(404, 'Campaign not found');
    }
    const leadCost = campaign.bid_price || 0;

    leadLogger.info('Got campaign data', { ...logMeta, campaign_id, leadCost });

    const lead_id = await generateUniqueLeadId();
    const assignedBy = req.user._id;

    // ========================================
    // ✅ TRY BILLING FIRST (before creating lead)
    // ========================================
    let billingResult;

    if (campaign.payment_type === "prepaid") {
      billingResult = await BillingServices.assignLeadPrepaid(
        campaign.user_id,
        lead_id,
        leadCost,
        assignedBy,
        session
      );
    } else if (campaign.payment_type === "payasyougo") {
      billingResult = await BillingServices.assignLeadPayAsYouGo(
        campaign.user_id,
        lead_id,
        leadCost,
        assignedBy,
        session,
        campaign
      );
    } else {
      throw new ErrorHandler(400, "Invalid campaign payment type.");
    }

    // ========================================
    // ✅ CHECK PAYMENT RESULT
    // ========================================
    const isPaid = billingResult.success;
    leadLogger.info(`Payment result: ${isPaid ? 'SUCCESS' : 'FAILED'}`, {
      ...logMeta,
      error: billingResult.message || null
    });

    // ========================================
    // ✅ CREATE LEAD WITH STATUS BASED ON PAYMENT
    // ========================================
    let leadData = {
      ...req.body,
      user_id: campaign.user_id,
      lead_id,
      status: isPaid ? 'active' : 'payment_pending',
      payment_status: isPaid ? 'paid' : 'pending',
      lead_cost: leadCost,
      transaction_id: isPaid ? billingResult.transactionId : null,
      original_cost: leadCost,
      payment_error_message: isPaid ? null : billingResult.message
    };

    const result = await LeadServices.createLead(leadData, { session });
    await result.populate('campaign_id');
    await result.populate('address.state');

    leadLogger.info('Lead created successfully in database', {
      ...logMeta,
      lead_id: result.lead_id,
      status: result.status,
      payment_status: result.payment_status,
      campaign_name: result.campaign_id?.name,
      campaign_owner_id: result.campaign_id?.user_id,
    });

    // ========================================
    // ✅ IF PAYMENT SUCCEEDED - Do existing low balance check (for prepaid)
    // ========================================
    if (isPaid) {
      leadLogger.info('Billing and balance updated successfully', {
        ...logMeta,
        transaction_id: billingResult.transactionId,
        new_balance: billingResult.newBalance,
        lead_cost: leadCost,
      });

      // Your existing low balance check for PREPAID
      try {
        const remainingBalance = billingResult.newBalance;

        if (campaign.payment_type === "prepaid" && remainingBalance < leadCost) {
          const owner = await User.findById(campaign.user_id);

          // 1️⃣ TRIGGER WEBHOOK FIRST (to stop n8n lead flow)
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
              leadLogger.info("Low Balance webhook sent successfully", {
                campaignId: campaign._id,
                response: lowBalanceResp
              });
            } else {
              leadLogger.warn("Low Balance webhook failed", {
                campaignId: campaign._id,
                error: lowBalanceResp.error || "Unknown error",
                response: lowBalanceResp
              });
            }
          } catch (err) {
            leadLogger.error("Fatal error while sending low balance webhook", err, {
              error: err.message
            });
          }

          // 2️⃣ SEND LOW BALANCE EMAIL TO USER (unchanged)
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
              leadLogger.info("Low Balance email sent successfully", {
                email_to: owner.email,
                response_id: emailResp.data.id
              });
            } else {
              leadLogger.warn("Low Balance email sending failed", {
                email_to: owner.email,
                error: emailResp?.error || "Unknown error",
                response: emailResp
              });
            }
          } catch (err) {
            leadLogger.error("Fatal error sending low balance user email", err, {
              error: err.message
            });
          }

          // 3️⃣ SEND LOW BALANCE EMAIL TO ADMINS (unchanged)
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
              leadLogger.info("Low Balance ADMIN email sent successfully", {
                email_to: adminEmails,
                response_id: adminEmailResp.data.id
              });
            } else {
              leadLogger.warn("Low Balance ADMIN email failed", {
                email_to: adminEmails,
                error: adminEmailResp?.error || "Unknown error",
                response: adminEmailResp
              });
            }

          } catch (err) {
            leadLogger.error("Fatal error sending low balance admin email", err, {
              error: err.message
            });
          }

          leadLogger.warn("Low balance flow completed (webhook + user email + admin email)", {
            campaignId: campaign._id,
            userId: owner._id,
            balance: remainingBalance
          });
        }
      } catch (lowBalanceErr) {
        leadLogger.error('Error in low balance check', lowBalanceErr);
      }
    }

    // ========================================
    // ✅ COMMIT TRANSACTION - Lead is now saved!
    // ========================================
    await session.commitTransaction();
    session.endSession();

    // ========================================
    // ✅ POST-COMMIT: Handle based on payment result
    // ========================================
    if (isPaid) {
      // (POST-COMMIT flows unchanged)
      const campaignOwner = await User.findById(campaign.user_id);

      try {
        await MAIL_HANDLER.sendLeadPaymentEmail({
          to: campaignOwner.email,
          userName: campaignOwner.name,
          leadCost: leadCost,
          leadId: result.lead_id,
          leadName: `${result.first_name} ${result.last_name}`.trim(),
          campaignName: campaign.name,
          payment_type: campaign.payment_type,
          full_address: result.address.full_address,
          transactionId: billingResult.transactionId,
          newBalance: billingResult.newBalance,
          leadData: {
            first_name: result.first_name,
            last_name: result.last_name,
            phone_number: result.phone_number,
            email: result.email,
            address: result.address
          }
        });

        leadLogger.info('Lead payment email sent successfully', {
          ...logMeta,
          email_to: campaignOwner.email,
          transaction_id: billingResult.transactionId
        });
      } catch (emailErr) {
        leadLogger.error('Failed to send lead payment email', emailErr, {
          ...logMeta,
          error: emailErr.message
        });
      }

      const message = 'New Lead has been assigned to your campaign!';
      try {
        await NotificationServices.createNotification(
          user_id,
          campaign.user_id,
          'info',
          message,
          0,
          `/dashboard/leads`
        );

        leadLogger.info('Notification created successfully', {
          ...logMeta,
          recipient_id: campaign.user_id,
        });

        if (campaign?.delivery?.method?.includes('email') && campaign?.delivery?.email?.addresses) {
          try {
            const emailSubjectFromCampaign = campaign?.delivery?.email?.subject?.trim();

            await MAIL_HANDLER.sendLeadAssignEmail({
              to: campaign.delivery.email.addresses,
              name: campaignOwner.name || 'Campaign User',
              leadName: result.lead_id,
              assignedBy: req.user?.name || 'System',
              leadDetailsUrl: `${process.env.UI_LINK}/dashboard/leads/${result._id}`,
              campaignName: campaign.name,
              leadData: leadData,
              realleadId: result._id,
              subject: emailSubjectFromCampaign || `Lead Fusion - New Lead`,
            });

            leadLogger.info('Lead assignment email sent successfully', {
              ...logMeta,
              email_to: campaign.delivery.email.addresses,
            });
          } catch (err) {
            leadLogger.error('Failed to send lead assignment email', err, {
              ...logMeta,
              error: err.message
            });
          }
        }
          // ✅ NEW: Send lead assignment email to ADMINS
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

            if (adminEmails.length > 0) {
              const emailString = adminEmails.join(',');

              await MAIL_HANDLER.sendLeadAssignAdminEmail({
                to: emailString,
                userName: campaignOwner.name || campaignOwner.fullName || 'N/A',
                userEmail: campaignOwner.email,
                leadName: result.lead_id,
                assignedBy: req.user?.name || 'System',
                leadDetailsUrl: `${process.env.UI_LINK}/dashboard/leads/${result._id}`,
                campaignName: campaign.name,

                note: leadData.note ?? "",

                leadData: {
                  ...(result.toObject ? result.toObject() : result),
                  note: result.note ?? ""
                },

                realleadId: result._id,
              });


              leadLogger.info('Lead assignment admin email sent successfully', {
                ...logMeta,
                admin_count: adminEmails.length,
              });
            }
          } catch (err) {
            leadLogger.error('Failed to send lead assignment admin email', err, {
              ...logMeta,
              error: err.message
            });
          }


        if (campaign?.delivery?.method?.includes('phone') && campaign?.delivery?.phone?.numbers) {
          try {
            const fullName = `${result.first_name || ''} ${result.last_name || ''}`.trim();
            const phoneNumber = result.phone_number || result.phone || '';
            const email = result.email || '';
            // const address = [
            //   result?.address?.full_address || '',
            // ].filter(Boolean).join(', ');
            const address = formatFullAddress(result.address);

            
            const campaignName = campaign?.name || 'N/A';

            const MAX_NOTE_LENGTH = 100;
            let notes = result.note || 'No notes provided';
            if (notes.length > MAX_NOTE_LENGTH) notes = notes.substring(0, MAX_NOTE_LENGTH) + '...';

            const smsMessage = `New Lead Assigned

Name: ${fullName}
Phone: ${phoneNumber}
Email: ${email}
Address: ${address}
Lead ID: ${result.lead_id}
Campaign: ${campaignName}
Notes: ${notes}

View Lead: ${process.env.UI_LINK}/dashboard/leads/${result._id}`;

            const smsResult = await SmsServices.sendSms({
              to: campaign.delivery.phone.numbers,
              message: smsMessage,
              from: process.env.SMS_SENDER_ID || '+18563908470',
            });

            if (smsResult.success) {
              leadLogger.info('Lead assignment SMS sent successfully', {
                ...logMeta,
                sent_to: smsResult.sentTo.join(', ')
              });
            } else {
              leadLogger.warn('Lead assignment SMS failed', {
                ...logMeta,
                error: smsResult
              });
            }
          } catch (err) {
            leadLogger.error('Fatal error during SMS sending', err, {
              ...logMeta,
              error: err.message
            });
          }
        }

      } catch (err) {
        leadLogger.error('Failed during notification or delivery process', err, {
          ...logMeta,
          error: err.message
        });
      }

      leadLogger.info('Lead creation process completed successfully', {
        ...logMeta,
        lead_id: result.lead_id
      });

      sendResponse(res, { leadData: result }, 'Lead has been created successfully', 201);

    } else {
    // ========================================
    // ✅ PAYMENT FAILED
    // ========================================
    leadLogger.warn('Payment failed, lead saved as pending', {
        ...logMeta,
        lead_id: result.lead_id,
        error: billingResult.message
    });

    // Handle payment failure async
    (async () => {
        await BillingServices.handlePaymentFailure({
        userId: campaign.user_id,
        leadId: result.lead_id,
        leadCost,
        campaign,
        billingResult,
        logger: leadLogger
        });
    })();

    // Return response immediately
    sendResponse(res, {
        leadData: result,
        paymentStatus: 'pending'
    }, 'Lead saved with pending payment - will be activated once payment is processed', 201);
    }

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    leadLogger.error('Error during lead creation process', err, {
      ...logMeta,
      error: err.message,
      stack: err.stack
    });

    throw err;
  }
});



const getLeads = wrapAsync(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const user = req.user;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let data;
    // after
    if (isAdmin) {
        const allowedFilterKeys = ['campaign_id', 'status', 'state'];
        const filters = extractFilters(req.query, allowedFilterKeys);
        data = await LeadServices.getLeads(page, limit, filters);
    } else {
        const allowedFilterKeys = ['campaign_id', 'status', 'state'];
        const filters = extractFilters(req.query, allowedFilterKeys);
        data = await LeadServices.getLeadByUserId(page, limit, user._id, filters);
    }

    sendResponse(res, data, "Leads fetched successfully", 200);
});

const getReturnLeads = wrapAsync(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);

    data = await LeadServices.getReturnLeads(page, limit);

    sendResponse(res, data, "Return leads fetched successfully", 200);
});

// ✅ Updated rejectReturnLead with logging
const rejectReturnLead = wrapAsync(async (req, res) => {
    const { lead_id, return_status } = req.body;
    
    const logMeta = {
        user_id: req?.user?._id,
        user_role: req?.user?.role,
        lead_id: lead_id,
        return_status: return_status,
        route: req.originalUrl,
    };

    try {
        leadLogger.info('Starting lead return rejection process', logMeta);

        // Validate input
        if (!lead_id || !return_status) {
            leadLogger.warn('Missing required fields for lead return rejection', {
                ...logMeta,
                missingFields: {
                    lead_id: !lead_id,
                    return_status: !return_status
                }
            });
            throw new ErrorHandler(400, 'Lead ID and return status are required');
        }

        // Get lead details before rejection
        const lead = await Lead.findById(lead_id).populate('campaign_id user_id');
        
        if (!lead) {
            leadLogger.error('Lead not found for rejection', logMeta);
            throw new ErrorHandler(404, 'Lead not found');
        }

        leadLogger.info('Lead details retrieved for rejection', {
            ...logMeta,
            campaign_id: lead.campaign_id?._id,
            owner_user_id: lead.user_id?._id,
            current_return_status: lead.return_status
        });

        // Process rejection
        const result = await LeadServices.rejectReturnLead(lead_id, return_status);

        leadLogger.info('Lead return rejected successfully', {
            ...logMeta,
            previous_status: lead.return_status,
            new_status: return_status,
            result: result
        });

        // Optionally send notification to lead owner
        try {
            if (lead.user_id && lead.user_id.email) {
                // You can add email notification here if needed
                leadLogger.info('Lead owner notified of rejection', {
                    ...logMeta,
                    owner_email: lead.user_id.email
                });
            }
        } catch (notificationErr) {
            leadLogger.error('Failed to notify lead owner of rejection', notificationErr, {
                ...logMeta,
                error: notificationErr.message
            });
        }

        leadLogger.info('Lead return rejection process completed', logMeta);
        sendResponse(res, result, 'Lead return rejected successfully', 200);

    } catch (err) {
        leadLogger.error('Error during lead return rejection', err, {
            ...logMeta,
            error: err.message,
            stack: err.stack
        });
        throw err;
    }
});


// ✅ Updated approveReturnLead with logging
const approveReturnLead = wrapAsync(async (req, res) => {
  const { lead_id, return_status } = req.body;

  const logMeta = {
    user_id: req?.user?._id,
    user_role: req?.user?.role,
    lead_id,
    return_status,
    route: req.originalUrl,
  };

  try {
    leadLogger.info('Starting lead return approval process', logMeta);

    if (!lead_id) {
      throw new ErrorHandler(400, 'Lead ID is required');
    }

    const lead = await Lead.findById(lead_id)
      .populate('campaign_id')
      .populate('user_id')
      .populate('address.state');

    if (!lead) {
      throw new ErrorHandler(404, 'Lead not found');
    }

    leadLogger.info('Lead details retrieved for approval', {
      ...logMeta,
      campaign_id: lead.campaign_id?._id,
      campaign_name: lead.campaign_id?.name,
      owner_user_id: lead.user_id?._id,
      owner_email: lead.user_id?.email,
      current_return_status: lead.return_status,
      return_reason: lead.return_reason
    });

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role);
    const isDirectReturn = isAdmin && return_status === 'Approved';

    const result = await LeadServices.approveReturnLead(
      lead_id,
      return_status,
      isDirectReturn
    );

    leadLogger.info('Lead return processed successfully', {
      ...logMeta,
      previous_status: lead.return_status,
      new_status: return_status,
      isDirectReturn,
      refund_amount: result.refundedAmount,
      refund_transaction_id: result.refundTransactionId,
      new_balance: result.newBalance
    });

    // ---------------------------------------------------
    // 📧 SAFE EMAIL PAYLOAD (no destructuring issues)
    // ---------------------------------------------------
    try {
      if (lead.user_id?.email) {
        const safeLeadData = lead.toObject ? lead.toObject() : lead;

        leadLogger.info("EMAIL PAYLOAD DEBUG", {
          userEmail: lead.user_id.email,
          userName: lead.user_id.name,
          leadData_keys: Object.keys(safeLeadData),
          has_first_name: Boolean(safeLeadData.first_name),
          has_last_name: Boolean(safeLeadData.last_name)
        });

        await MAIL_HANDLER.sendUserLeadReturnStatusEmail({
          userEmail: lead.user_id.email,
          userName: lead.user_id.name,

          leadData: safeLeadData,

          campaignName: lead.campaign_id?.name || "N/A",

          returnStatus: return_status,
          returnReason: lead.return_reason || "",
          returnComments: lead.return_comments || "",

          refundAmount: result.refundedAmount,
          transactionId: result.refundTransactionId,
          newBalance: result.newBalance,

          approvedBy: req.user?.name || "Admin"
        });

        leadLogger.info("User notified of return status", {
          ...logMeta,
          owner_email: lead.user_id.email
        });
      }
    } catch (emailErr) {
      leadLogger.error("Failed to notify user of return status", {
        ...logMeta,
        error: emailErr.message,
        stack: emailErr.stack
      });
    }

    const message = isDirectReturn
      ? `Lead returned successfully by admin. Refund of $${result.refundedAmount} added to balance.`
      : `Lead return approved successfully. Refund of $${result.refundedAmount} added to balance.`;

    sendResponse(res, result, message, 200);

  } catch (err) {
    leadLogger.error('Error during lead return approval', {
      ...logMeta,
      error: err.message,
      stack: err.stack
    });
    throw err;
  }
});


// Get single lead by ID
const getLeadById = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { leadId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let data;
    if (isAdmin) {
        data = await LeadServices.getLeadByIdForAdmin(leadId);
    } else {
        data = await LeadServices.getLeadById(leadId, user_id);
        // data = await LeadServices.getLeadByIdForAdmin(leadId);
    }

    console.log(`the lead data is : `);
    console.log(data);

    sendResponse(res, { data }, 'Lead fetched successfully', 200);
});

// Update existing lead
const updateLead = wrapAsync(async (req, res) => {
    const { _id: user_id, role } = req.user;
    const { leadId } = req.params;
    const leadData = { ...req.body };

    const result = await LeadServices.updateLead(leadId, user_id, role, leadData);

    sendResponse(res, { result }, 'Lead has been updated successfully', 200);
});

const returnLead = wrapAsync(async (req, res) => {
    const { lead_id, return_status, return_reason, return_comments } = req.body;

    const logMeta = {
        user_id: req?.user?._id,
        lead_id: lead_id,
        return_status: return_status,
        return_reason: return_reason,
        route: req.originalUrl,
    };

    try {
        leadLogger.info('Starting lead return process', logMeta);

        // Validate input
        if (!lead_id || !return_status) {
            leadLogger.warn('Missing required fields for lead return', {
                ...logMeta,
                missingFields: {
                    lead_id: !lead_id,
                    return_status: !return_status
                }
            });
            throw new ErrorHandler(400, 'Lead ID and return status are required');
        }
        const leadData = await Lead.findById(lead_id);

        if (!leadData) {
            throw new ErrorHandler(404, "Lead not found");
        }

        const createdAt = new Date(leadData.createdAt);
        const now = new Date();
        const diffInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

        if (diffInDays > 5) {
            leadLogger.warn('Return attempt blocked — window expired', {
                ...logMeta,
                leadCreatedAt: leadData.createdAt,
                daysPassed: diffInDays
            });

            throw new ErrorHandler(
                400,
                'Return window expired. You can only return a lead within 5 days of purchase.'
            );
        }

        // Process the return
        const result = await LeadServices.returnLead(
            lead_id,
            return_status,
            return_reason,
            return_comments
        );

        leadLogger.info('Lead return processed successfully', {
            ...logMeta,
            result: result
        });

        // Get campaign and lead details
        const campaign = await LeadServices.getCampaignByLead(lead_id);
        const lead = await Lead.findById(lead_id).populate('address.state');

        if (!lead) {
            leadLogger.error('Lead not found after return process', logMeta);
            throw new ErrorHandler(404, 'Lead not found');
        }

        leadLogger.info('Retrieved lead and campaign details', {
            ...logMeta,
            campaign_id: campaign?._id,
            campaign_name: campaign?.name
        });

        // Send email notification to admins
        try {
            const adminUsers = await User.find({ role: 'ADMIN' });

            if (adminUsers && adminUsers.length > 0) {
            let adminEmails = adminUsers.map(admin => admin.email).filter(Boolean);
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
                    await MAIL_HANDLER.sendLeadReturnEmail({
                        adminEmails: emailString,
                        lead: lead,
                        campaign: campaign,
                        returnedBy: req.user?.name || req.user?.email || 'User',
                        returnStatus: return_status,
                        returnReason: return_reason,
                        returnComments: return_comments,
                    });

                    leadLogger.info('Lead return email sent to admins', {
                        ...logMeta,
                        adminCount: adminEmails.length,
                        adminEmails: adminEmails
                    });
                } else {
                    leadLogger.warn('No valid admin emails found', logMeta);
                }
            } else {
                leadLogger.warn('No admin users found in system', logMeta);
            }
        } catch (emailErr) {
            leadLogger.error('Failed to send lead return email to admins', emailErr, {
                ...logMeta,
                error: emailErr.message,
                stack: emailErr.stack
            });
            // Don't throw - email failure shouldn't break the return process
        }

        leadLogger.info('Lead return process completed successfully', logMeta);
        sendResponse(res, { result }, 'Lead return request submitted successfully', 200);

    } catch (err) {
        leadLogger.error('Error during lead return process', err, {
            ...logMeta,
            error: err.message,
            stack: err.stack
        });
        throw err;
    }
});

// Delete lead (soft delete or hard delete based on role)
const deleteLead = wrapAsync(async (req, res) => {
    const { _id: user_id, role } = req.user;
    const { leadId } = req.params;

    const result = await LeadServices.deleteLead(leadId, user_id, role);
    console.log(res, { result }, 'Lead has been permanently deleted', 200);
    sendResponse(res, { result }, 'Lead has been permanently deleted', 200);
});

// Validate CSV format and return sample data
const validateCSV = wrapAsync(async (req, res) => {
    if (!req.file) {
        throw new ErrorHandler(400, 'CSV file is required');
    }

    try {
        const validation = await LeadServices.validateCSVFormat(req.file.path, 10);

        // Clean up temp file after validation
        cleanupTempFile(req.file.path);

        sendResponse(res, validation, 'CSV validation completed', 200);
    } catch (error) {
        // Clean up temp file on error
        cleanupTempFile(req.file.path);
        throw error;
    }
});

// Upload CSV file and start processing
const uploadCSV = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    let { column_mapping } = req.body;

    if (!req.file) {
        throw new ErrorHandler(400, 'CSV file is required');
    }

    // Parse column mapping
    let mappings;
    try {
        mappings = typeof column_mapping === 'string'
            ? JSON.parse(column_mapping)
            : column_mapping;
    } catch (error) {
        // Clean up uploaded file on error
        cleanupTempFile(req.file.path);
        throw new ErrorHandler(400, 'Invalid column mapping format');
    }

    // Validate mappings before processing
    const requiredFields = [
        'first_name', 'last_name', 'phone_number',
        'address.street', 'address.city', 'address.state', 'address.zip', 'campaign_id'
    ];
    // sendResponse(res, { mappings }, 'CSV processing started successfully', 202);

    const mappedDbColumns = Object.values(mappings);
    const missingRequired = requiredFields.filter(field => !mappedDbColumns.includes(field));

    if (missingRequired.length > 0) {
        cleanupTempFile(req.file.path);
        throw new ErrorHandler(400, `Missing required column mappings: ${missingRequired.join(', ')}`);
    }

    try {
        const data = await LeadServices.processCSVUpload(
            req.file.path,
            user_id, // Admin can process for any campaign
            mappings
        );

        sendResponse(res, { data }, 'CSV processing started successfully', 202);
    } catch (error) {
        // Clean up uploaded file on error
        cleanupTempFile(req.file.path);
        throw error;
    }
});

// Get CSV processing status by job ID
const getProcessingStatus = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { jobId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let jobStatus;
    if (isAdmin) {
        // Admin can check any job status
        const JobStatus = require('../../models/jobStatus.model');
        jobStatus = await JobStatus.findById(jobId);
        if (!jobStatus) {
            throw new ErrorHandler(404, 'Job not found');
        }
    } else {
        jobStatus = await LeadServices.getProcessingStatus(jobId, user_id);
    }

    sendResponse(res, { jobStatus }, 'Processing status retrieved successfully', 200);
});

// Get user's processing jobs (paginated)
const getProcessingJobs = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { page, limit } = getPaginationParams(req.query);
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    let data;
    if (isAdmin) {
        // Admin can see all processing jobs
        const JobStatus = require('../../models/jobStatus.model');
        const skip = (page - 1) * limit;

        const [jobs, total] = await Promise.all([
            JobStatus.find({})
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            JobStatus.countDocuments({})
        ]);

        data = {
            data: jobs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } else {
        data = await LeadServices.getUserProcessingJobs(user_id, page, limit);
    }

    sendResponse(res, data, 'Processing jobs retrieved successfully', 200);
});

// Cancel processing job
const cancelProcessingJob = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { jobId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    const JobStatus = require('../../models/jobStatus.model');

    const filter = { _id: jobId };
    if (!isAdmin) {
        filter.userId = user_id;
    }

    const job = await JobStatus.findOne(filter);
    if (!job) {
        throw new ErrorHandler(404, 'Job not found or access denied');
    }

    if (job.status === 'completed' || job.status === 'failed') {
        throw new ErrorHandler(400, 'Cannot cancel completed or failed job');
    }

    // Update job status to cancelled
    await JobStatus.findByIdAndUpdate(jobId, {
        status: 'cancelled',
        message: 'Job cancelled by user',
        completedAt: new Date()
    });

    // Try to remove from queue (if still queued)
    try {
        const { csvProcessingQueue } = require('../../services/queue/csvProcessor');
        const queueJobs = await csvProcessingQueue.getJobs(['waiting', 'active']);
        const queueJob = queueJobs.find(qJob => qJob.data.jobId === jobId);
        if (queueJob) {
            await queueJob.remove();
        }
    } catch (error) {
        console.error('Error removing job from queue:', error);
    }

    sendResponse(res, null, 'Job cancelled successfully', 200);
});

// Retry failed processing job
const retryProcessingJob = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const { jobId } = req.params;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    const JobStatus = require('../../models/jobStatus.model');

    const filter = { _id: jobId };
    if (!isAdmin) {
        filter.userId = user_id;
    }

    const job = await JobStatus.findOne(filter);
    if (!job) {
        throw new ErrorHandler(404, 'Job not found or access denied');
    }

    if (job.status !== 'failed') {
        throw new ErrorHandler(400, 'Only failed jobs can be retried');
    }

    // Reset job status
    await JobStatus.findByIdAndUpdate(jobId, {
        status: 'queued',
        message: 'Job retried by user',
        progress: 0,
        error: null,
        result: null,
        completedAt: null
    });

    // Add back to queue
    try {
        const { csvProcessingQueue } = require('../../services/queue/csvProcessor');
        await csvProcessingQueue.add('process-csv', {
            ...job.metadata,
            jobId: job._id,
            userId: job.userId
        }, {
            attempts: 3,
            backoff: 'exponential',
            delay: 5000
        });
    } catch (error) {
        console.error('Error adding job to queue:', error);
        throw new ErrorHandler(500, 'Failed to retry job');
    }

    sendResponse(res, null, 'Job retry started successfully', 200);
});

// Get leads by campaign ID
const getLeadsByCampaign = wrapAsync(async (req, res) => {
    const { campaignId } = req.params;
    const { page, limit } = getPaginationParams(req.query);
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;

    const filters = { campaign_id: campaignId };

    let data;
    if (isAdmin) {
        data = await LeadServices.getLeads(page, limit, filters);
    } else {
        // Verify user has access to this campaign
        const Campaign = require('../../models/campaign.model');
        const campaign = await Campaign.findById(campaignId);

        if (!campaign || campaign.user_id.toString() !== user_id.toString()) {
            throw new ErrorHandler(403, 'Access denied to this campaign');
        }

        data = await LeadServices.getLeads(page, limit, filters);
    }

    sendResponse(res, data, 'Campaign leads fetched successfully', 200);
});

// Bulk update leads
const bulkUpdateLeads = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    const { leadIds, updateData } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        throw new ErrorHandler(400, 'Lead IDs array is required');
    }

    if (!updateData || Object.keys(updateData).length === 0) {
        throw new ErrorHandler(400, 'Update data is required');
    }

    const filter = { _id: { $in: leadIds } };
    if (!isAdmin) {
        filter.user_id = user_id;
    }

    const result = await Lead.updateMany(filter, {
        ...updateData,
        updatedAt: new Date()
    });

    sendResponse(res, {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
    }, 'Bulk update completed successfully', 200);
});

// Get lead statistics
const getLeadStats = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    const { campaignId } = req.query;

    let matchFilter = {};

    if (!isAdmin) {
        matchFilter.user_id = user_id;
    }

    if (campaignId) {
        matchFilter.campaign_id = campaignId;
    }

    const stats = await Lead.aggregate([
        { $match: matchFilter },
        {
            $group: {
                _id: null,
                totalLeads: { $sum: 1 },
                activeLeads: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                },
                contactedLeads: {
                    $sum: { $cond: [{ $eq: ["$status", "contacted"] }, 1, 0] }
                },
                convertedLeads: {
                    $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] }
                },
                leadsThisMonth: {
                    $sum: {
                        $cond: [
                            {
                                $gte: [
                                    "$createdAt",
                                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const result = stats[0] || {
        totalLeads: 0,
        activeLeads: 0,
        contactedLeads: 0,
        convertedLeads: 0,
        leadsThisMonth: 0
    };

    sendResponse(res, { stats: result }, 'Lead statistics retrieved successfully', 200);
});

// Export leads to CSV
const exportLeads = wrapAsync(async (req, res) => {
    const user_id = req.user._id;
    const isAdmin = req.user.role === CONSTANT_ENUM.USER_ROLE.ADMIN;
    const { campaignId, status, format = 'csv' } = req.query;

    let filter = {};
    if (!isAdmin) {
        filter.user_id = user_id;
    }
    if (campaignId) {
        filter.campaign_id = campaignId;
    }
    if (status) {
        filter.status = status;
    }

    const leads = await Lead.find(filter)
        .populate('campaign_id', 'name campaign_id')
        .populate('address.state', 'name abbreviation')
        .lean();

    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=leads-export.json');
        res.json(leads);
    } else {
        // CSV export
        const csv = require('csv-writer').createObjectCsvStringifier({
            header: [
                { id: 'lead_id', title: 'Lead ID' },
                { id: 'first_name', title: 'First Name' },
                { id: 'last_name', title: 'Last Name' },
                { id: 'email', title: 'Email' },
                { id: 'phone_number', title: 'Phone' },
                { id: 'address.full_address', title: 'Address' },
                { id: 'address.city', title: 'City' },
                { id: 'address.state.abbreviation', title: 'State' },
                { id: 'address.zip_code', title: 'Zip Code' },
                { id: 'status', title: 'Status' },
                { id: 'createdAt', title: 'Created At' }
            ]
        });

        const csvString = csv.getHeaderString() + csv.stringifyRecords(leads);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
        res.send(csvString);
    }
});

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    uploadCSV,
    validateCSV,
    getProcessingStatus,
    getProcessingJobs,
    cancelProcessingJob,
    retryProcessingJob,
    getLeadsByCampaign,
    bulkUpdateLeads,
    getLeadStats,
    exportLeads,
    returnLead,
    getReturnLeads,
    rejectReturnLead,
    approveReturnLead,
};