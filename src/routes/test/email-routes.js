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


module.exports = router;
