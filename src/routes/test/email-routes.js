const express = require('express');
const router = express.Router();
const MAIL_HANDLER = require('../../mail/mails');
const { User } = require('../../models/user.model');

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

// ========================================
// ✅ TEST: Pending Leads Payment Success Email (User)
// ========================================
router.post('/send-test-pending-leads-success-mail', async (req, res) => {
  try {
    const {
      to,
      userName,
      chargedLeads,
      totalAmount,
      newBalance,
      paymentMethod,
      cardLast4
    } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    // Default test data with multiple leads
    const defaultChargedLeads = [
      {
        leadId: "LED-TEST-001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        campaignName: "Solar Campaign CA",
        amount: 50
      },
      {
        leadId: "LED-TEST-002",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1 (555) 234-5678",
        campaignName: "Home Insurance TX",
        amount: 75
      },
      {
        leadId: "LED-TEST-003",
        firstName: "Bob",
        lastName: "Wilson",
        email: "bob.wilson@example.com",
        phone: "+1 (555) 345-6789",
        campaignName: "Solar Campaign CA",
        amount: 50
      },
      {
        leadId: "LED-TEST-004",
        firstName: "Alice",
        lastName: "Brown",
        email: "alice.brown@example.com",
        phone: "+1 (555) 456-7890",
        campaignName: "Auto Insurance FL",
        amount: 60
      },
      {
        leadId: "LED-TEST-005",
        firstName: "Charlie",
        lastName: "Davis",
        email: "charlie.davis@example.com",
        phone: "+1 (555) 567-8901",
        campaignName: "Home Insurance TX",
        amount: 75
      }
    ];

    const leadsToUse = chargedLeads || defaultChargedLeads;
    const calculatedTotal = leadsToUse.reduce((sum, lead) => sum + (lead.amount || 0), 0);

    const response = await MAIL_HANDLER.sendPendingLeadsPaymentSuccessEmail({
      to,
      userName: userName || "Test User",
      chargedLeads: leadsToUse,
      totalAmount: totalAmount || calculatedTotal,
      newBalance: newBalance || 150.00,
      paymentMethod: paymentMethod || "BALANCE",
      cardLast4: cardLast4 || "4242"
    });

    res.status(200).json({
      message: "✅ Test Pending Leads Success Email sent to user!",
      data: response,
      testData: {
        leadsCount: leadsToUse.length,
        totalAmount: totalAmount || calculatedTotal
      }
    });

  } catch (error) {
    console.error("❌ Failed to send pending leads success email:", error);
    res.status(500).json({
      message: "Failed to send pending leads success email",
      error: error.message
    });
  }
});

// ========================================
// ✅ TEST: Pending Leads Payment Success Email (Admin)
// ========================================
router.post('/send-test-pending-leads-success-admin-mail', async (req, res) => {
  try {
    const {
      to,
      userName,
      userEmail,
      chargedLeads,
      totalAmount,
      newBalance,
      paymentMethod,
      cardLast4
    } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Admin email(s) required (string or array)" });
    }

    // Default test data with multiple leads
    const defaultChargedLeads = [
      {
        leadId: "LED-TEST-001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        campaignName: "Solar Campaign CA",
        amount: 50
      },
      {
        leadId: "LED-TEST-002",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1 (555) 234-5678",
        campaignName: "Home Insurance TX",
        amount: 75
      },
      {
        leadId: "LED-TEST-003",
        firstName: "Bob",
        lastName: "Wilson",
        email: "bob.wilson@example.com",
        phone: "+1 (555) 345-6789",
        campaignName: "Solar Campaign CA",
        amount: 50
      },
      {
        leadId: "LED-TEST-004",
        firstName: "Alice",
        lastName: "Brown",
        email: "alice.brown@example.com",
        phone: "+1 (555) 456-7890",
        campaignName: "Auto Insurance FL",
        amount: 60
      },
      {
        leadId: "LED-TEST-005",
        firstName: "Charlie",
        lastName: "Davis",
        email: "charlie.davis@example.com",
        phone: "+1 (555) 567-8901",
        campaignName: "Home Insurance TX",
        amount: 75
      },
      {
        leadId: "LED-TEST-006",
        firstName: "Diana",
        lastName: "Miller",
        email: "diana.miller@example.com",
        phone: "+1 (555) 678-9012",
        campaignName: "Solar Campaign CA",
        amount: 50
      },
      {
        leadId: "LED-TEST-007",
        firstName: "Edward",
        lastName: "Taylor",
        email: "edward.taylor@example.com",
        phone: "+1 (555) 789-0123",
        campaignName: "Auto Insurance FL",
        amount: 60
      },
      {
        leadId: "LED-TEST-008",
        firstName: "Fiona",
        lastName: "Anderson",
        email: "fiona.anderson@example.com",
        phone: "+1 (555) 890-1234",
        campaignName: "Home Insurance TX",
        amount: 75
      },
      {
        leadId: "LED-TEST-009",
        firstName: "George",
        lastName: "Thomas",
        email: "george.thomas@example.com",
        phone: "+1 (555) 901-2345",
        campaignName: "Solar Campaign CA",
        amount: 50
      },
      {
        leadId: "LED-TEST-010",
        firstName: "Hannah",
        lastName: "Jackson",
        email: "hannah.jackson@example.com",
        phone: "+1 (555) 012-3456",
        campaignName: "Auto Insurance FL",
        amount: 60
      }
    ];

    const leadsToUse = chargedLeads || defaultChargedLeads;
    const calculatedTotal = leadsToUse.reduce((sum, lead) => sum + (lead.amount || 0), 0);

    const response = await MAIL_HANDLER.sendPendingLeadsPaymentSuccessAdminEmail({
      to: Array.isArray(to) ? to : [to],
      userName: userName || "Test User",
      userEmail: userEmail || "testuser@example.com",
      chargedLeads: leadsToUse,
      totalAmount: totalAmount || calculatedTotal,
      newBalance: newBalance || 150.00,
      paymentMethod: paymentMethod || "MIXED",
      cardLast4: cardLast4 || "4242"
    });

    res.status(200).json({
      message: "✅ Test Pending Leads Success Admin Email sent!",
      data: response,
      testData: {
        leadsCount: leadsToUse.length,
        totalAmount: totalAmount || calculatedTotal
      }
    });

  } catch (error) {
    console.error("❌ Failed to send pending leads success admin email:", error);
    res.status(500).json({
      message: "Failed to send pending leads success admin email",
      error: error.message
    });
  }
});

// ========================================
// ✅ TEST: Single Lead with Custom Data
// ========================================
router.post('/send-test-pending-leads-success-single', async (req, res) => {
  try {
    const { to, userName } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    // Single lead for quick testing
    const singleLead = [
      {
        leadId: "LED-SINGLE-001",
        firstName: "Test",
        lastName: "Lead",
        email: "test.lead@example.com",
        phone: "+1 (555) 000-0000",
        campaignName: "Test Campaign",
        amount: 100
      }
    ];

    const response = await MAIL_HANDLER.sendPendingLeadsPaymentSuccessEmail({
      to,
      userName: userName || "Test User",
      chargedLeads: singleLead,
      totalAmount: 100,
      newBalance: 50.00,
      paymentMethod: "CARD",
      cardLast4: "1234"
    });

    res.status(200).json({
      message: "✅ Test Single Pending Lead Success Email sent!",
      data: response
    });

  } catch (error) {
    console.error("❌ Failed to send single pending lead email:", error);
    res.status(500).json({
      message: "Failed to send single pending lead email",
      error: error.message
    });
  }
});


// ========================================
// ✅ TEST: Lead Assignment Admin Email
// ========================================
router.post('/send-test-lead-assign-admin-mail', async (req, res) => {
  try {
    const {
      to,
      userName,
      userEmail,
      campaignName
    } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Admin email(s) required" });
    }

    const testLeadData = {
      first_name: "John",
      last_name: "Doe",
      phone_number: "+1 (555) 123-4567",
      email: "john.doe@example.com",
      address: {
        full_address: "123 Main St, New York, NY 10001",
        street: "123 Main St",
        city: "New York",
        state: { name: "New York" },
        zip_code: "10001"
      },
      lead_id: "LED-TEST-001",
      note: "This is a test lead note"
    };

    const response = await MAIL_HANDLER.sendLeadAssignAdminEmail({
      to: Array.isArray(to) ? to : [to],
      userName: userName || "Test Campaign Owner",
      userEmail: userEmail || "owner@example.com",
      leadName: "LED-TEST-001",
      assignedBy: "Test System",
      leadDetailsUrl: "https://www.leadfusionhq.com/dashboard/leads/test123",
      campaignName: campaignName || "Test Campaign",
      leadData: testLeadData,
      realleadId: "test123"
    });

    res.status(200).json({
      message: "✅ Test Lead Assignment Admin Email sent!",
      data: response
    });

  } catch (error) {
    console.error("❌ Failed to send lead assignment admin email:", error);
    res.status(500).json({
      message: "Failed to send lead assignment admin email",
      error: error.message
    });
  }
});

// In your test routes or auth routes file
router.post("/resend-verification-email", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email is already verified"
      });
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    const response = await MAIL_HANDLER.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken
    });

    return res.status(200).json({
      message: "✅ Verification email sent successfully!",
      data: response
    });

  } catch (error) {
    console.error("❌ Failed to resend verification email:", error);
    return res.status(500).json({
      message: "Failed to send verification email",
      error: error.message
    });
  }
});

module.exports = router;
