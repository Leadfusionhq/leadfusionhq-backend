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



module.exports = router;
