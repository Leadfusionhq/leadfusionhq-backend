const express = require('express');
const router = express.Router();
const MAIL_HANDLER = require('../../mail/mails');

router.post('/send-test-mail', async (req, res) => {
  const { to } = req.body;

  if (!to) return res.status(400).json({ message: 'Email is required' });

  try {
    const response = await MAIL_HANDLER.sendTestMail(to);
    res.status(200).json({
      message: 'Email sent successfully!',
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send email',
      error: error.message,
    });
  }
});

router.post('/send-test-lead-mail', async (req, res) => {
  const {
    to,
    name,
    leadName,
    assignedBy,
    leadDetailsUrl,
    campaignName,
    leadData,
    realleadId,
    subject
  } = req.body;

  if (!to) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const response = await MAIL_HANDLER.sendLeadAssignEmail({
      to,
      name,
      leadName,
      assignedBy,
      leadDetailsUrl,
      campaignName,
      leadData,
      realleadId,
      subject
    });

    res.status(200).json({
      message: 'Email sent successfully!',
      data: response,
    });
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(500).json({
      message: 'Failed to send email',
      error: error.message,
    });
  }
});

router.post('/send-test-new-user-mail', async (req, res) => {
  const {
    adminEmails,
    userName,
    userEmail,
    companyName,
    phoneNumber,
    registrationDate,
    verificationDate,
    userRole
  } = req.body;

  if (!adminEmails || !userEmail) {
    return res.status(400).json({ message: 'Admin emails and user email are required' });
  }

  try {
    const response = await MAIL_HANDLER.sendNewUserRegistrationToAdmin({
      adminEmails,
      userName: userName || 'John Doe',
      userEmail,
      companyName: companyName || 'Example Corp',
      phoneNumber: phoneNumber || '+1-555-123-4567',
      registrationDate: registrationDate || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      verificationDate: verificationDate || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      userRole: userRole || 'User'
    });

    res.status(200).json({
      message: '✅ Test user registration email sent successfully!',
      data: response,
    });
  } catch (error) {
    console.error('❌ Error sending test mail:', error);
    res.status(500).json({
      message: 'Failed to send new user registration email',
      error: error.message,
    });
  }
});

router.post('/send-test-campaign-created-mail', async (req, res) => {
  try {
    const {
      to,
      name,
      campaignName,
      campaignId,
      partnerId,
      filterSetId
    } = req.body;

    if (!to) {
      return res.status(400).json({ message: 'Email (to) is required' });
    }

    // Fake campaign object to test email template
    const testCampaign = {
      name: campaignName || "Test Campaign",
      campaign_id: campaignId || "TEST12345",
      user_id: {
        name: name || "Test User",
        email: to
      },
      boberdoo_filter_set_id: filterSetId || "FILTER_TEST_100",
      userPartnerId: partnerId || "PARTNER_9999"
    };

    const result = await MAIL_HANDLER.sendCampaignCreatedEmail(testCampaign);

    res.status(200).json({
      message: "🚀 Test campaign creation email sent!",
      data: result
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      message: "Failed to send test campaign email",
      error: error.message
    });
  }
});


router.post('/send-test-low-balance-admin-mail', async (req, res) => {
  try {
    const {
      to,
      userEmail,
      userName,
      campaignName,
      campaignId,
      requiredAmount,
      currentBalance
    } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Admin email(s) are required" });
    }

    const response = await MAIL_HANDLER.sendLowBalanceAdminEmail({
      to,
      userEmail: userEmail || "testuser@example.com",
      userName: userName || "Test User",
      campaignName: campaignName || "Demo Campaign",
      campaignId: campaignId || "CAMP-TEST-001",
      requiredAmount: requiredAmount || 50,
      currentBalance: currentBalance || 10
    });

    res.status(200).json({
      message: "🚨 Test Low Balance Admin Email sent successfully!",
      data: response
    });
  } catch (error) {
    console.error("❌ Failed to send low balance admin email:", error);
    res.status(500).json({
      message: "Failed to send Low Balance Admin Email",
      error: error.message
    });
  }
});
router.post('/send-test-low-balance-mail', async (req, res) => {
  try {
    const {
      to,
      userName,
      partnerId,
      email,
      currentBalance,
      leadCost
    } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    const response = await MAIL_HANDLER.sendLowBalanceWarningEmail({
      to,
      userName: userName || "Test User",
      partnerId: partnerId || "PARTNER-TEST-001",
      email: email || "testuser@example.com",
      currentBalance: currentBalance || 0.50,
      leadCost: leadCost || 5
    });

    res.status(200).json({
      message: "⚠️ Test Low Balance Warning Email sent successfully!",
      data: response
    });

  } catch (error) {
    console.error("❌ Failed to send low balance warning email:", error);
    res.status(500).json({
      message: "Failed to send Low Balance Warning Email",
      error: error.message
    });
  }
});


router.post('/send-test-failed-lead-payment-mail', async (req, res) => {
  try {
    const {
      to,
      userName,
      leadId,
      amount,
      cardLast4,
      errorMessage
    } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    const response = await MAIL_HANDLER.sendFailedLeadPaymentEmail({
      to,
      userName: userName || "Test User",
      leadId: leadId || "LEAD-TEST-001",
      amount: amount || 10,
      cardLast4: cardLast4 || "4242",
      errorMessage: errorMessage || "Test payment failure"
    });

    res.status(200).json({
      message: "❌ Test Failed Payment Email sent to user!",
      data: response
    });

  } catch (error) {
    console.error("❌ Failed to send user failed-payment email:", error);
    res.status(500).json({
      message: "Failed to send user failed-payment email",
      error: error.message
    });
  }
});


router.post('/send-test-failed-lead-payment-admin-mail', async (req, res) => {
  try {
    const {
      to,
      userName,
      userEmail,
      leadId,
      amount,
      cardLast4,
      errorMessage
    } = req.body;

    if (!to || !Array.isArray(to)) {
      return res.status(400).json({ message: "Admin email array is required" });
    }

    const response = await MAIL_HANDLER.sendFailedLeadPaymentAdminEmail({
      to,
      userName: userName || "Test User",
      userEmail: userEmail || "testuser@example.com",
      leadId: leadId || "LEAD-TEST-001",
      amount: amount || 10,
      cardLast4: cardLast4 || "4242",
      errorMessage: errorMessage || "Test admin failure message"
    });

    res.status(200).json({
      message: "⚠️ Test Failed Payment Admin Email sent!",
      data: response
    });

  } catch (error) {
    console.error("❌ Failed to send admin failed-payment email:", error);
    res.status(500).json({
      message: "Failed to send admin failed-payment email",
      error: error.message
    });
  }
});


module.exports = router;
