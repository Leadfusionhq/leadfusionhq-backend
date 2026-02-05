const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Leadfusionhq <noreply@leadfusionhq.com>';

const { generateTransactionReceipt } = require('../services/pdf/receiptGenerator');
const { formatFullAddress, makeAddressLink } = require('../utils/address.utile');

const createEmailTemplate = ({
  title = '',
  greeting = '',
  mainText = '',
  highlightedContent = '',
  highlightLabel = '',
  buttonText = '',
  buttonUrl = '',
  footerText = '',
  warningText = '',
  companyName = 'Leadfusionhq',
  fallbackUrl = ''
}) => {
  return `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="background-color: #F5F5F5; color: #333; font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-image: url('${process.env.UI_LINK}/images/log_bg.png'); background-size: cover; background-position: center; padding: 50px 0; min-height: 100vh;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15); margin: 0 auto;">
            
            <!-- ✅✅✅ EXACT ORIGINAL LOGO HEADER - ZERO CHANGES ✅✅✅ -->
            <tr>
              <td align="center" style="padding: 40px 20px; background: linear-gradient(to right, #204D9D, #306A64, #204D9D);">
                <img
                  src="${process.env.UI_LINK}/images/logo.png"
                  alt="${companyName}"
                  width="120"
                  height="120"
                  style="border-radius: 50%; background: black; padding: 10px;"
                />
              </td>
            </tr>

            <!-- ==================== MAIN CONTENT ==================== -->
            <tr>
              <td style="padding: 40px 30px; font-family: Arial, sans-serif; color: #1C1C1C;">
                
                ${title ? `<h2 style="margin: 0 0 20px; font-size: 24px; text-align: center; text-transform: uppercase; color: #204D9D;">${title}</h2>` : ''}
                
                ${greeting ? `<h3 style="margin: 0 0 20px; font-size: 18px; text-align: center; color: #333;">${greeting}</h3>` : ''}
                
                ${mainText ? `<div style="font-size: 16px; line-height: 24px; text-align: center; margin: 20px 0;">${mainText}</div>` : ''}

                ${highlightedContent ? `
                <!-- Highlighted Content (OTP, Password, etc.) -->
                <div style="text-align: center; margin: 30px 0;">
                  ${highlightLabel ? `<p style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">${highlightLabel}</p>` : ''}
                  <div style="font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 16px 32px; border-radius: 12px; display: inline-block; border: 2px solid #dee2e6; color: #204D9D; letter-spacing: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${highlightedContent}
                  </div>
                </div>` : ''}

                ${buttonText && buttonUrl ? `
                <!-- Action Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${buttonUrl}" style="background: linear-gradient(to right, #204D9D, #306A64); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 8px rgba(32, 77, 157, 0.3); transition: all 0.3s ease;">${buttonText}</a>
                </div>
                
                ${fallbackUrl ? `
                  <div style="text-align: center; margin: 20px 0; font-size: 14px; color: #666; word-break: break-all;">
                    <p style="margin-bottom: 5px;">If the button doesn't work, you can click or copy-paste this link:</p>
                    <a href="${fallbackUrl}" style="color: #204D9D; text-decoration: underline;">${fallbackUrl}</a>
                  </div>
                ` : ''}
                ` : ''}

                ${warningText ? `<p style="text-align: center; font-size: 14px; color: #dc3545; background-color: #f8d7da; padding: 12px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0;"><strong>⚠️ Important:</strong> ${warningText}</p>` : ''}

                ${footerText ? `<p style="text-align: center; font-size: 14px; color: #6c757d; margin: 20px 0; line-height: 20px;">${footerText}</p>` : ''}

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #dee2e6;">
                <p style="font-size: 12px; color: #6c757d; margin: 0; line-height: 18px;">
                  © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
                  This email was sent from an automated system. Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
};

// Updated email functions using the reusable template

const sendEmailToUserWithOTP = async ({ to, email, otp }) => {
  const html = createEmailTemplate({
    title: 'Email Verification',
    greeting: `Hello, ${email}`,
    mainText: 'Please use the following One-Time Password (OTP) to verify your email address.',
    highlightedContent: otp,
    highlightLabel: 'Your OTP Code',
    warningText: 'This code expires in 10 minutes. Do not share it with anyone.',
    footerText: 'If you did not request this verification, please ignore this email or contact support.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your One-Time Password (OTP)',
    html,
  });
};

const sendVerificationEmail = async ({ to, name, token }) => {
  const verifyUrl = `${process.env.UI_LINK}/verify-email?token=${token}`;

  const html = createEmailTemplate({
    title: 'Email Verification',
    greeting: `Hello ${name}!`,
    mainText: 'Welcome to our platform! Please verify your email address to activate your account.',
    buttonText: 'Verify Email',
    buttonUrl: verifyUrl,
    fallbackUrl: verifyUrl,
    warningText: 'This verification link expires in 24 hours.',
    footerText: 'If you did not sign up for this account, you can safely ignore this email.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verify Your Email Address',
    html,
  });
};

const sendAccountCreationEmailWithVerification = async ({ to, name, token, password }) => {
  const verifyUrl = `${process.env.UI_LINK}/verify-email?token=${token}`;

  const html = createEmailTemplate({
    title: 'Account Created',
    greeting: `Welcome ${name}!`,
    mainText: 'Your account has been successfully created by our team. ' +
      (password ? 'Below is your temporary password:' : 'Please verify your email to get started.'),
    highlightedContent: password || '',
    highlightLabel: password ? 'Temporary Password' : '',
    buttonText: 'Verify Email & Activate Account',
    buttonUrl: verifyUrl,
    fallbackUrl: verifyUrl,
    warningText: password ? 'Please change your password after logging in for security.' : 'This verification link expires in 24 hours.',
    footerText: 'If you did not expect this email, please contact our support team immediately.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your Account Has Been Created – Verify and Login',
    html,
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const html = createEmailTemplate({
    title: 'Password Reset',
    greeting: `Hello ${name}`,
    mainText: 'We received a request to reset your password. Click the button below to create a new password.',
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
    warningText: 'This reset link expires in 1 hour. If you did not request this, please ignore this email.',
    footerText: 'For security reasons, this link can only be used once.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password',
    html,
  });
};

const sendWelcomeEmail = async ({ to, name }) => {
  const html = createEmailTemplate({
    title: 'Welcome!',
    greeting: `Welcome ${name}!`,
    mainText: 'Thank you for joining our platform. We\'re excited to have you on board and look forward to helping you achieve your goals.',
    buttonText: 'Get Started',
    buttonUrl: `${process.env.UI_LINK}/dashboard`,
    footerText: 'Need help getting started? Check out our documentation or contact our support team.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Leadfusionhq!',
    html,
  });
};

const sendNotificationEmail = async ({ to, name, title, message, actionText = '', actionUrl = '' }) => {
  const html = createEmailTemplate({
    title: title,
    greeting: `Hello ${name}`,
    mainText: message,
    buttonText: actionText,
    buttonUrl: actionUrl,
    footerText: 'This is an automated notification. If you have any questions, please contact support.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: title,
    html,
  });
};

const sendTestMail = async (toEmail) => {
  try {
    const html = createEmailTemplate({
      title: 'Test Email',
      greeting: 'Hello Developer!',
      mainText: 'Logo test email',
      footerText: 'Testing logo display'
    });

    console.log('HTML generated:', html.substring(0, 500)); // Log first 500 chars
    console.log('Logo URL:', `${process.env.UI_LINK}/images/logo.png`);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Test Email - Logo Check',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (err) {
    console.error('Email error:', err.message);
    throw err;
  }
};

const sendLeadAssignEmail = async ({ to, name, leadName, assignedBy, leadDetailsUrl, campaignName, leadData, realleadId, subject }) => {

  const recipients = Array.isArray(to)
    ? to
    : to.split(',').map(email => email.trim());

  const {
    first_name,
    last_name,
    phone_number,
    email,
    address = {},
    lead_id,
    note,
    _id,
  } = leadData;

  const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'N/A';
  const emailDisplay = email || 'N/A';

  // ✅ Phone with black clickable link
  const phoneDisplay = phone_number
    ? `<a href="tel:${phone_number}" style="color: #000; text-decoration: none;">${phone_number}</a>`
    : 'N/A';

  // const addressParts = [
  // address.street,
  // address?.full_address,
  // address.city,
  // address.state?.name || address.state, 
  // address.zip_code
  // ].filter(Boolean); 

  // const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
  //  const composedAddressParts = [
  //     address?.street,
  //     address?.city,
  //     address?.state?.name || address?.state,
  //     address?.zip_code
  //   ].filter(Boolean);

  //   const composedAddress = composedAddressParts.join(', ');

  //   const fullAddress = address?.full_address || composedAddress || 'N/A';
  const fullAddress = formatFullAddress(address);
  const addressDisplay = makeAddressLink(fullAddress);

  // const addressDisplay = fullAddress !== 'N/A'
  //   ? `<a href="https://maps.google.com/?q=${encodeURIComponent(fullAddress)}" 
  //         target="_blank" 
  //         rel="noopener noreferrer" 
  //         style="color: #000; text-decoration: none;">
  //         ${fullAddress}
  //     </a>`
  //   : fullAddress;

  const leadDetailsLink = `https://www.leadfusionhq.com/dashboard/leads/${realleadId}`;

  // ✅ Gmail-style table layout - everything left-aligned
  const mainText = `
    <div style="max-width: 600px; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; background: #fff;">
        <tr>
          <td style="padding: 15px;">
            
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Name:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${fullName}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Phone:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${phoneDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Email:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; word-break: break-word;">
                  ${emailDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Address:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; line-height: 1.4;">
                  ${addressDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Lead ID:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${lead_id}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Campaign:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${campaignName}
                </td>
              </tr>
              
              ${note ? `
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Note:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${note}
                </td>
              </tr>` : ''}
              
              <tr>
                <td colspan="2" style="padding: 10px 0 5px 0; border-top: 1px solid #eee;">
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">View Lead:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; word-break: break-all;">
                  ${leadDetailsLink}
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
    </div>
  `;

  const html = createEmailTemplate({
    title: 'Lead Fusion - New Lead',
    mainText: mainText,
  });

  const finalSubject = (subject && subject.trim()) || `New Lead Assigned in "${campaignName}"`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: finalSubject,
    html,
  });
};

/**
 * Email sent to ADMINS when a new lead is assigned
 * Same structure as sendLeadAssignEmail but includes campaign owner info
 */
const sendLeadAssignAdminEmail = async ({
  to,
  userName,
  userEmail,
  leadName,
  assignedBy,
  leadDetailsUrl,
  campaignName,
  leadData,
  realleadId,
  subject
}) => {
  const recipients = Array.isArray(to)
    ? to
    : to.split(',').map(email => email.trim());

  const {
    first_name,
    last_name,
    phone_number,
    email,
    address = {},
    lead_id,
    note,
    _id,
  } = leadData;

  const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'N/A';
  const emailDisplay = email || 'N/A';

  // ✅ Phone with black clickable link
  const phoneDisplay = phone_number
    ? `<a href="tel:${phone_number}" style="color: #000; text-decoration: none;">${phone_number}</a>`
    : 'N/A';

  const fullAddress = formatFullAddress(address);
  const addressDisplay = makeAddressLink(fullAddress);

  const leadDetailsLink = `https://www.leadfusionhq.com/dashboard/leads/${realleadId}`;

  // ✅ Gmail-style table layout - same as sendLeadAssignEmail with user info added
  const mainText = `
    <div style="max-width: 600px; margin: 0; padding: 0;">

      <!-- ✅ Campaign Owner Info Section (Admin Only) -->
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; border: 1px solid #b8daff; border-radius: 4px; background: #e7f3ff; margin-bottom: 15px;">
        <tr>
          <td style="padding: 12px 15px;">
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 3px 10px 3px 0; vertical-align: top; width: 110px; text-align: left;">
                  <strong style="color: #004085;">User Name:</strong>
                </td>
                <td style="padding: 3px 0; vertical-align: top; text-align: left; color: #004085;">
                  ${userName || 'N/A'}
                </td>
              </tr>
              <tr>
                <td style="padding: 3px 10px 3px 0; vertical-align: top; width: 110px; text-align: left;">
                  <strong style="color: #004085;">User Email:</strong>
                </td>
                <td style="padding: 3px 0; vertical-align: top; text-align: left; color: #004085;">
                  ${userEmail || 'N/A'}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- ✅ Lead Details Section (Same as sendLeadAssignEmail) -->
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; background: #fff;">
        <tr>
          <td style="padding: 15px;">
            
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Name:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${fullName}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Phone:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${phoneDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Email:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; word-break: break-word;">
                  ${emailDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Address:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; line-height: 1.4;">
                  ${addressDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Lead ID:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${lead_id}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Campaign:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${campaignName}
                </td>
              </tr>
              
              ${note ? `
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Note:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${note}
                </td>
              </tr>` : ''}
              
              <tr>
                <td colspan="2" style="padding: 10px 0 5px 0; border-top: 1px solid #eee;">
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">View Lead:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; word-break: break-all;">
                  ${leadDetailsLink}
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
    </div>
  `;

  const html = createEmailTemplate({
    title: 'Lead Fusion - New Lead',
    mainText: mainText,
  });

  const finalSubject = (subject && subject.trim()) || `New Lead Assigned - ${campaignName} - ${userEmail}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: finalSubject,
    html,
  });
};

const sendLeadReturnEmail = async ({ adminEmails, lead, campaign, returnedBy, returnStatus, returnReason, returnComments }) => {
  const {
    first_name,
    last_name,
    phone_number,
    email,
    address = {},
    lead_id,
  } = lead;
  // ✅ Filter out admin@gmail.com from recipients
  const filteredAdmins = Array.isArray(adminEmails)
    ? adminEmails.filter(email => email.toLowerCase() !== 'admin@gmail.com')
    : adminEmails.split(',')
      .map(e => e.trim())
      .filter(email => email.toLowerCase() !== 'admin@gmail.com');

  // If no valid admins after filtering, skip email
  if (filteredAdmins.length === 0) {
    console.log('⚠️ No admin emails to notify (admin@gmail.com excluded)');
    return null;
  }


  const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'N/A';
  const emailDisplay = email || 'N/A';

  // ✅ Phone with black clickable link
  const phoneDisplay = phone_number
    ? `<a href="tel:${phone_number}" style="color: #000; text-decoration: none;">${phone_number}</a>`
    : 'N/A';

  // const addressParts = [
  //   address.street,
  //   address.full_address,
  //   address.city,
  //   address.state?.name || address.state, 
  //   address.zip_code
  // ].filter(Boolean); 

  // const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';

  // const addressDisplay = fullAddress !== 'N/A'
  //   ? `<a href="https://maps.google.com/?q=${encodeURIComponent(fullAddress)}" target="_blank" rel="noopener noreferrer" style="color: #000; text-decoration: none;">${fullAddress}</a>`
  //   : fullAddress;
  // const composedAddressParts = [
  //   address?.street,
  //   address?.city,
  //   address?.state?.name || address?.state,
  //   address?.zip_code
  // ].filter(Boolean);

  // const composedAddress = composedAddressParts.join(', ');

  // const fullAddress = address?.full_address || composedAddress || 'N/A';

  const fullAddress = formatFullAddress(address);

  const addressDisplay = makeAddressLink(fullAddress);

  // const addressDisplay = fullAddress !== 'N/A'
  //   ? `<a href="https://maps.google.com/?q=${encodeURIComponent(fullAddress)}" 
  //         target="_blank" 
  //         rel="noopener noreferrer" 
  //         style="color: #000; text-decoration: none;">
  //         ${fullAddress}
  //     </a>`
  //   : fullAddress;


  const mainText = `
    <div style="max-width: 600px; margin: 0; padding: 0;">
      
      <div style="margin: 0 0 15px 0; padding: 12px; background: #fee; border-left: 4px solid #dc2626; color: #333; border-radius: 4px; font-size: 14px; text-align: left;">
        <strong>Lead ${lead_id}</strong> returned by <strong>${returnedBy}</strong> • Status: <strong>${returnStatus}</strong>
      </div>

      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; background: #fff;">
        <tr>
          <td style="padding: 15px;">
            
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Name:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${fullName}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Phone:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${phoneDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Email:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; word-break: break-word;">
                  ${emailDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Address:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333; line-height: 1.4;">
                  ${addressDisplay}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Lead ID:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${lead_id}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 5px 10px 5px 0; vertical-align: top; width: 90px; text-align: left;">
                  <strong style="color: #555;">Campaign:</strong>
                </td>
                <td style="padding: 5px 0; vertical-align: top; text-align: left; color: #333;">
                  ${campaign?.name || 'N/A'}
                </td>
              </tr>

              ${returnReason ? `
              <tr>
                <td colspan="2" style="padding: 15px 0 5px 0;">
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 10px;">
                    <strong style="color: #dc2626;">Return Reason:</strong>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 5px 0; color: #333;">
                  ${returnReason}
                </td>
              </tr>
              ` : ''}

              ${returnComments ? `
              <tr>
                <td colspan="2" style="padding: 15px 0 5px 0;">
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 10px;">
                    <strong style="color: #dc2626;">Additional Comments:</strong>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 5px 0; color: #333;">
                  ${returnComments}
                </td>
              </tr>
              ` : ''}
              
            </table>
            
          </td>
        </tr>
      </table>

      <div style="margin: 15px 0 0 0; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; color: #333; border-radius: 4px; font-size: 14px; text-align: left;">
        <strong>⚡ Action Required:</strong> Please review and take necessary action.
      </div>
      
    </div>
  `;

  const html = createEmailTemplate({
    title: 'Lead Returned',
    greeting: 'Admin,',
    mainText: mainText,
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to: filteredAdmins,
    subject: `Lead Returned - ${lead_id} from "${campaign?.name || 'Campaign'}"`,
    html,
  });
};

const sendUserLeadReturnStatusEmail = async ({
  userEmail,
  userName,
  leadData = {},
  campaignName,
  returnStatus,
  returnReason,
  returnComments,
  refundAmount,
  transactionId,
  newBalance,
  approvedBy
}) => {

  // Extract safely
  const first_name = leadData.first_name || "N/A";
  const last_name = leadData.last_name || "";
  const phone_number = leadData.phone_number || "N/A";
  const email = leadData.email || "N/A";
  const address = leadData.address || {};
  const lead_id = leadData._id || leadData.lead_id || "N/A";

  const fullName = `${first_name} ${last_name}`.trim();
  const phoneDisplay = phone_number !== "N/A"
    ? `<a href="tel:${phone_number}" style="color:#000;text-decoration:none;">${phone_number}</a>`
    : "N/A";

  const fullAddress = formatFullAddress(address);
  const addressDisplay = makeAddressLink(fullAddress);

  const statusColor =
    returnStatus === "Approved"
      ? "#16a34a"
      : returnStatus === "Rejected"
        ? "#dc2626"
        : "#f59e0b";

  const mainText = `
    <div style="max-width:600px;margin:0;padding:0;">

      <!-- Status Badge -->
      <div style="margin-bottom:15px;padding:12px;background:#f9fafb;
        border-left:4px solid ${statusColor};border-radius:4px;font-size:14px;">
        <strong>Your lead return request has been ${returnStatus}.</strong>
      </div>

      <!-- Main Details Table -->
      <table cellpadding="0" cellspacing="0" border="0"
        style="width:100%;border:1px solid #ddd;border-radius:6px;background:#fff;
        font-size:14px;font-family:Arial,sans-serif;">
        
        <tr><td style="padding:15px;">
          
          <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">

            <tr>
              <td style="padding:6px 10px;font-weight:bold;width:150px;">Name:</td>
              <td style="padding:6px 10px;">${fullName}</td>
            </tr>

            <tr>
              <td style="padding:6px 10px;font-weight:bold;">Phone:</td>
              <td style="padding:6px 10px;">${phoneDisplay}</td>
            </tr>

            <tr>
              <td style="padding:6px 10px;font-weight:bold;">Email:</td>
              <td style="padding:6px 10px;">${email}</td>
            </tr>

            <tr>
              <td style="padding:6px 10px;font-weight:bold;">Address:</td>
              <td style="padding:6px 10px;">${addressDisplay}</td>
            </tr>

            <tr>
              <td style="padding:6px 10px;font-weight:bold;">Lead ID:</td>
              <td style="padding:6px 10px;">${lead_id}</td>
            </tr>

            <tr>
              <td style="padding:6px 10px;font-weight:bold;">Campaign:</td>
              <td style="padding:6px 10px;">${campaignName}</td>
            </tr>

            ${returnReason
      ? `
                  <tr>
                    <td colspan="2" style="padding:12px 10px;border-top:1px solid #eee;">
                      <strong style="color:#dc2626;">Return Reason:</strong><br>
                      ${returnReason}
                    </td>
                  </tr>`
      : ""
    }

            ${returnComments
      ? `
                  <tr>
                    <td colspan="2" style="padding:12px 10px;border-top:1px solid #eee;">
                      <strong style="color:#dc2626;">Additional Comments:</strong><br>
                      ${returnComments}
                    </td>
                  </tr>`
      : ""
    }

            <!-- Refund Section -->
            ${returnStatus === "Approved"
      ? `
                  <tr>
                    <td colspan="2" style="padding:15px;border-top:1px solid #eee;">
                      <div style="padding:12px;background:#ecfdf5;border-left:4px solid #16a34a;
                        border-radius:4px;line-height:20px;">
                        <strong>Refund Processed:</strong><br>
                        Amount: $${refundAmount}<br>
                        Transaction ID: ${transactionId || "N/A"}<br>
                        Updated Balance: $${newBalance}
                      </div>
                    </td>
                  </tr>`
      : ""
    }

          </table>

        </td></tr>

      </table>

      <!-- Footer Note -->
      <div style="margin-top:15px;padding:12px;background:#fef3c7;border-left:4px solid #f59e0b;
        border-radius:4px;font-size:14px;">
        If you have any questions, reply to this email and our support team will assist you.
      </div>

    </div>
  `;

  const html = createEmailTemplate({
    title: `Lead Return ${returnStatus}`,
    greeting: `Hello ${userName || "User"},`,
    mainText
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Lead Return ${returnStatus} - Lead ${lead_id}`,
    html
  });
};



/**
 * Send New User Registration Notification to Admin
 */
const sendNewUserRegistrationToAdmin = async ({
  adminEmails,
  userName,
  userEmail,
  companyName,
  phoneNumber,
  registrationDate,
  userRole = 'User'
}) => {
  // ✅ Filter unwanted admin emails
  const filteredAdmins = Array.isArray(adminEmails)
    ? adminEmails.filter(email => email && email.toLowerCase() !== 'admin@gmail.com')
    : [adminEmails].filter(email => email && email.toLowerCase() !== 'admin@gmail.com');

  if (filteredAdmins.length === 0) {
    console.log('⚠️ No admin emails to notify (admin@gmail.com excluded)');
    return null;
  }

  // ✅ Simple left-aligned structure (like Brett Cooper layout)
  const userDetailsTable = `
    <table cellpadding="0" cellspacing="0" border="0" 
           style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; 
                  color: #1e3a8a; line-height: 1.6; text-align: left;">
      
      <tr>
        <td style="padding: 4px 0; vertical-align: top;">
          <strong style="color: #1e3a8a;">User Name</strong>
        </td>
        <td style="padding: 4px 0; color: #1e40af;">${userName}</td>
      </tr>

      <tr>
        <td style="padding: 4px 0; vertical-align: top;">
          <strong style="color: #1e3a8a;">Email</strong>
        </td>
        <td style="padding: 4px 0;">
          <a href="mailto:${userEmail}" style="color: #2563eb; text-decoration: none;">
            ${userEmail}
          </a>
        </td>
      </tr>

      ${companyName ? `
      <tr>
        <td style="padding: 4px 0; vertical-align: top;">
          <strong style="color: #1e3a8a;">Company Name</strong>
        </td>
        <td style="padding: 4px 0; color: #1e40af;">${companyName}</td>
      </tr>` : ''}

      ${phoneNumber ? `
      <tr>
        <td style="padding: 4px 0; vertical-align: top;">
          <strong style="color: #1e3a8a;">Phone Number</strong>
        </td>
        <td style="padding: 4px 0; color: #1e40af;">${phoneNumber}</td>
      </tr>` : ''}

      <tr>
        <td style="padding: 4px 0; vertical-align: top;">
          <strong style="color: #1e3a8a;">Role</strong>
        </td>
        <td style="padding: 4px 0; color: #1e40af;">${userRole}</td>
      </tr>

      <tr>
        <td style="padding: 4px 0; vertical-align: top;">
          <strong style="color: #1e3a8a;">Registered</strong>
        </td>
        <td style="padding: 4px 0; color: #1e40af;">${registrationDate}</td>
      </tr>
    </table>
  `;

  // ✅ Simple email body (no button, no footer)
  const html = createEmailTemplate({
    title: 'New User Registration',
    // greeting: 'Admin Team,',
    mainText: userDetailsTable,
    footerText: '' // removed footer
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to: filteredAdmins,
    subject: `New User Registered - ${userName}`,
    html,
  });
};



// Add these new email functions to your existing emailService.js
const sendTransactionEmail = async ({
  to,
  bcc, // ✅ Add BCC support
  userName,
  transactionType,
  amount,
  transactionId,
  date,
  newBalance,
  description = '',
  metadata = {}
}) => {
  const formattedAmount = Math.abs(Number(amount || 0)).toFixed(2);

  // Optional metadata (keeps signature unchanged)
  // Ensure we display the passed userName/Email in the receipt body, NOT the entire bcc list
  const userEmail = metadata.userEmail || (Array.isArray(to) ? to[0] : to);
  const oldBalance = metadata.oldBalance;
  const paymentMethod = metadata.payment_type || '';

  // Make Place of Supply EXACTLY what the email uses (fullAddress)
  const placeOfSupply = (metadata.fullAddress && String(metadata.fullAddress).trim()) || 'N/A';

  const logoPath = `${(process.env.UI_LINK || '').replace(/\/+$/, '')}/images/logo.png`;

  // US timezone (default EST/EDT); override via RECEIPT_TZ if needed
  const TZ = process.env.RECEIPT_TZ || 'America/New_York';
  const inputDate = metadata.transactionDate || date || Date.now();
  const dateObj = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const displayDate = dateObj.toLocaleString('en-US', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' });
  const dateShort = displayDate.split(',')[0]; // first part only (e.g., Sep 12, 2025)

  // Divider under the title
  const dividerUnderTitle = `
    <div style="height:1px; background:#e5e7eb; margin:8px 0 16px 0;"></div>
  `;

  // ----- Invoice Meta (Billed To left; Invoice No/Date right) -----
  const invoiceMeta = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border-collapse:collapse; margin:0; font-family: Arial, sans-serif;">
      <tr>
        <td valign="top" align="left" style="padding:0; margin:0; vertical-align:top; width:50%;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0; padding:0;">
            <tr><td style="font-size:12px; color:#555;">Billed To</td></tr>
            <tr><td style="font-size:13px; color:#111; font-weight:bold;">${userName || 'Customer'}</td></tr>
            <tr><td style="font-size:12px; color:#555;">${userEmail || ''}</td></tr>
          </table>
        </td>
        <td valign="top" align="right" style="padding:0; margin:0; vertical-align:top; width:50%;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0;">
            <tr><td align="right" style="font-size:12px; color:#555;">Invoice No</td></tr>
            <tr><td align="right" style="font-size:12px; color:#111; font-weight:bold;">${transactionId}</td></tr>
            <tr><td align="right" style="font-size:12px; color:#555; padding-top:8px;">Invoice Date</td></tr>
            <tr><td align="right" style="font-size:12px; color:#111; font-weight:bold;">${displayDate}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  // ----- Strict line-items table -----
  const rawDesc = (description || transactionType || 'Transaction').trim();
  const maxDescChars = 90;
  const truncatedDesc = rawDesc.length > maxDescChars ? (rawDesc.slice(0, maxDescChars - 1) + '…') : rawDesc;

  const lineItemTable = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; border:1px solid #e5e7eb; table-layout:fixed; font-family: Arial, sans-serif; margin-top:8px;">
      <colgroup>
        <col style="width:92px;" />
        <col style="width:auto;" />
        <col style="width:82px;" />
        <col style="width:90px;" />
        <col style="width:90px;" />
      </colgroup>
      <thead>
        <tr style="background-color:#f7f7f7;">
          <th align="left"  style="padding:8px 6px; font-size:12px; color:#444; font-weight:bold; border-bottom:1px solid #e5e7eb;">Date</th>
          <th align="left"  style="padding:8px 6px; font-size:12px; color:#444; font-weight:bold; border-bottom:1px solid #e5e7eb;">Description</th>
          <th align="right" style="padding:8px 6px; font-size:12px; color:#444; font-weight:bold; border-bottom:1px solid #e5e7eb;">Rate</th>
          <th align="right" style="padding:8px 6px; font-size:12px; color:#444; font-weight:bold; border-bottom:1px solid #e5e7eb;">Amount</th>
          <th align="right" style="padding:8px 6px; font-size:12px; color:#444; font-weight:bold; border-bottom:1px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td align="left"  style="padding:8px 6px; font-size:12px; color:#111; border-bottom:1px solid #e5e7eb;">${dateShort || ''}</td>
          <td align="left"  style="padding:8px 6px; font-size:12px; color:#111; border-bottom:1px solid #e5e7eb;">${truncatedDesc}</td>
          <td align="right" style="padding:8px 6px; font-size:12px; color:#111; border-bottom:1px solid #e5e7eb;">$${formattedAmount}</td>
          <td align="right" style="padding:8px 6px; font-size:12px; color:#111; border-bottom:1px solid #e5e7eb;">$${formattedAmount}</td>
          <td align="right" style="padding:8px 6px; font-size:12px; color:#111; border-bottom:1px solid #e5e7eb;">$${formattedAmount}</td>
        </tr>
      </tbody>
    </table>
  `;

  // ----- Totals -----
  const totalsBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin-top:10px; font-family: Arial, sans-serif;">
      <tr>
        <td width="60%"></td>
        <td width="40%">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr><td align="left"  style="padding:6px 0; font-size:12px; color:#111;">SUBTOTAL:</td><td align="right" style="padding:6px 0; font-size:12px; color:#111;">$${formattedAmount}</td></tr>
            <tr><td align="left"  style="padding:6px 0; font-size:12px; color:#111;">TAX (0%):</td><td align="right" style="padding:6px 0; font-size:12px; color:#111;">$0.00</td></tr>
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb; height:1px; line-height:1px; font-size:0;"></td></tr>
            <tr><td align="left"  style="padding:6px 0; font-size:12px; color:#111; font-weight:bold;">TOTAL:</td><td align="right" style="padding:6px 0; font-size:12px; color:#111; font-weight:bold;">$${formattedAmount}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  // ----- Meta lines (ensure same Place of Supply as email) -----
  const metaBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin-top:12px; font-family: Arial, sans-serif;">
      <tr><td style="font-size:12px; color:#555;">Payment Method: ${paymentMethod || 'N/A'}</td></tr>
      <tr><td style="font-size:12px; color:#555;">Place of Supply: ${placeOfSupply}</td></tr>
    </table>
  `;

  // Assemble body
  const body = `
    ${dividerUnderTitle}
    ${invoiceMeta}
    ${lineItemTable}
    ${totalsBlock}
    ${metaBlock}
  `;

  const html = createEmailTemplate({
    title: 'Transaction Receipt',
    greeting: '',
    mainText: body,
    footerText: 'If you have any questions about this transaction, please contact our support team.'
  });

  // 1) Generate PDF receipt (pass Place of Supply; do not show address in header)
  let receiptBuffer = null;
  try {
    receiptBuffer = await generateTransactionReceipt({
      transactionId,
      userName,
      userEmail,
      transactionType,
      amount: Number(amount || 0),
      date: displayDate,                        // already in US timezone
      newBalance: Number(newBalance || 0),
      oldBalance: oldBalance !== undefined ? Number(oldBalance) : undefined,
      description,
      paymentMethod,
      logoPath,
      companyName: 'Leadfusionhq',
      // address will NOT be rendered in header anymore (see PDF gen)
      companyAddress: '525 NJ-73 Suite 104',
      companyCity: 'Marlton, NJ 08053',
      companyPhone: '+1 (609) 707-6818',
      companyEmail: 'support@leadfusionhq.com',
      companyWebsite: 'www.leadfusionhq.com',
      placeOfSupply,                            // NEW
    });
  } catch (e) {
    console.error('Receipt PDF generation failed:', e.message);
  }

  // 2) Public download URL (served by your route)
  const downloadUrl = `${process.env.BACKEND_LINK}/billing/receipts/${encodeURIComponent(transactionId)}`;

  const payload = {
    from: FROM_EMAIL,
    to,
    subject: `Transaction Receipt - ${transactionType}`,
    html
  };

  if (receiptBuffer) {
    payload.attachments = [{ filename: `receipt-${transactionId}.pdf`, content: receiptBuffer }];
  }

  if (bcc) {
    payload.bcc = bcc;
  }

  return resend.emails.send(payload);
};

async function sendCampaignCreatedEmailtoN8N(campaign) {
  try {
    const toEmail = "mahadiqbal72462@gmail.com"; // <-- Mohad's email
    // const toEmail = "jatindev1022@gmail.com"; // <-- Mohad's email


    const partnerId = campaign?.user_id?.integrations?.boberdoo?.external_id || "N/A";
    const filterSetId = campaign?.boberdoo_filter_set_id || "N/A";

    // ---- Campaign Details Table ----
    const campaignTable = `
      <table cellpadding="0" cellspacing="0" border="0" 
        style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; 
               color: #1e3a8a; line-height: 1.6; text-align: left;">

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #1e3a8a;">Campaign Name</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${campaign.name}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #1e3a8a;">Campaign ID</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${campaign.campaign_id}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #1e3a8a;">User Partner ID</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${partnerId}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #1e3a8a;">Filter Set ID</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${filterSetId}</td>
        </tr>

      </table>
    `;

    // ---- Email Template ----
    const html = createEmailTemplate({
      title: "New Campaign Created",
      mainText: `
        <div style="font-size: 14px; color: #1e3a8a;">
          Hi there,<br><br>
          A new campaign has been created. The relevant information is listed below.<br><br>
          ${campaignTable}
        </div>
      `,
      footerText: "" // No footer
    });

    await resend.emails.send({
      from: "LeadFusionHQ <noreply@leadfusionhq.com>",
      to: toEmail,
      subject: `New Campaign Created - ${campaign.name}`,
      html,
    });

    console.log("📧 Campaign email sent to Mohad:", toEmail);

  } catch (err) {
    console.error("❌ Failed to send campaign creation email:", err.message);
  }
}

// Email to Admin
async function sendCampaignCreatedEmailToAdmin(campaign) {
  try {
    console.log("ENV CHECK → ADMIN_NOTIFICATION_EMAILS =", process.env.ADMIN_NOTIFICATION_EMAILS);

    let adminEmails = [];

    if (process.env.ADMIN_NOTIFICATION_EMAILS) {
      adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
    }

    console.log("Admin emails for campaign creation =", adminEmails);

    if (adminEmails.length === 0) {
      console.log("⚠️ No admin emails configured for campaign creation notification");
      return;
    }

    const userName = campaign?.user_id?.name || campaign?.user_id?.email || "N/A";
    const campaignName = campaign?.name || "N/A";
    const campaignId = campaign?.campaign_id || "N/A";
    const syncStatus = campaign?.boberdoo_sync_status || "N/A";

    // ---- Campaign Details Table ----
    const campaignTable = `
      <table cellpadding="0" cellspacing="0" border="0" 
        style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; 
               color: #1e3a8a; line-height: 1.6; text-align: left;">

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">User Name</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${userName}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">Campaign Name</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${campaignName}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">Campaign ID</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${campaignId}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">Boberdoo Sync Status</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${syncStatus}</td>
        </tr>

      </table>
    `;

    // ---- Email Template ----
    const html = createEmailTemplate({
      title: "New Campaign Created",
      mainText: `
        <div style="font-size: 14px; color: #1e3a8a;">
          Hi Admin,<br><br>
          A new campaign has been created. The relevant information is listed below.<br><br>
          ${campaignTable}
        </div>
      `,
      footerText: ""
    });

    const emailString = adminEmails.join(',');

    await resend.emails.send({
      from: "LeadFusionHQ <noreply@leadfusionhq.com>",
      to: emailString,
      subject: `New Campaign Created - ${campaignName}`,
      html,
    });

    console.log("📧 Campaign creation email sent to admins:", emailString);

  } catch (err) {
    console.error("❌ Failed to send campaign creation email to admin:", err.message);
    throw err;
  }
}

// Email to User
async function sendCampaignCreatedEmailToUser(campaign) {
  try {
    // 🔍 Add debugging to see what's coming in
    console.log("🔍 sendCampaignCreatedEmailToUser - Campaign received");
    console.log("🔍 Campaign ID:", campaign?.campaign_id);
    console.log("🔍 Campaign user_id object:", campaign?.user_id);
    console.log("🔍 User email:", campaign?.user_id?.email);

    const userEmail = campaign?.user_id?.email;

    if (!userEmail) {
      console.log("⚠️ No user email found for campaign creation notification");
      console.log("⚠️ Full campaign.user_id:", JSON.stringify(campaign?.user_id, null, 2));
      return;
    }

    const campaignName = campaign?.name || "N/A";
    const campaignId = campaign?.campaign_id || "N/A";
    const syncStatus = campaign?.boberdoo_sync_status || "N/A";
    const createdAt = campaign?.createdAt
      ? new Date(campaign.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
      : "N/A";

    // ---- Campaign Details Table ----
    const campaignTable = `
      <table cellpadding="0" cellspacing="0" border="0" 
        style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; 
               color: #1e3a8a; line-height: 1.6; text-align: left;">

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">Campaign Name</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${campaignName}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">Campaign ID</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${campaignId}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">Status</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${campaign?.status || "ACTIVE"}</td>
        </tr>

        <tr>
          <td style="padding: 4px 0; vertical-align: top;">
            <strong style="color: #28282B;">Created At</strong>
          </td>
          <td style="padding: 4px 0; color: #1e40af;">${createdAt}</td>
        </tr>

      </table>
    `;

    // ---- Email Template ----
    const html = createEmailTemplate({
      title: "Campaign Created Successfully",
      mainText: `
        <div style="font-size: 14px; color: #1e3a8a;">
          Hi there,<br><br>
          Your campaign has been created successfully. The details are listed below.<br><br>
          ${campaignTable}
        </div>
      `,
      footerText: ""
    });

    console.log("📧 Attempting to send email to user:", userEmail);

    const result = await resend.emails.send({
      from: "LeadFusionHQ <noreply@leadfusionhq.com>",
      to: userEmail,
      subject: `Campaign Created - ${campaignName}`,
      html,
    });

    console.log("✅ Campaign creation email sent to user:", userEmail);
    console.log("✅ Resend response:", result);

  } catch (err) {
    console.error("❌ Failed to send campaign creation email to user");
    console.error("❌ Error message:", err.message);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Full error object:", JSON.stringify(err, null, 2));
    throw err;
  }
}

/**
 * Send Funds Added Email
 */
const sendFundsAddedEmail = async ({
  to,
  userName,
  amount,
  transactionId,
  paymentMethod,
  newBalance
}) => {
  const date = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return sendTransactionEmail({
    to,
    userName,
    transactionType: 'Manual Recharge',
    amount: parseFloat(amount),
    transactionId,
    date,
    newBalance,
    description: `Payment via ${paymentMethod || 'Card'}`,
    metadata: { paymentMethod }
  });
};

/**
 * Send Auto Top-Up Email
 */
const sendAutoTopUpEmail = async ({
  to,
  userName,
  amount,
  transactionId,
  triggerReason,
  newBalance,
  threshold
}) => {
  const date = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const autoTopUpDetails = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 10px; border-left: 5px solid #f97316; padding: 20px;">
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 10px;">
                <span style="font-size: 24px;">🔄</span>
                <strong style="font-size: 16px; color: #9a3412; margin-left: 10px;">Auto Top-Up Triggered</strong>
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #7c2d12; line-height: 22px;">
                Your balance fell below <strong>$${parseFloat(threshold).toFixed(2)}</strong>. 
                We've automatically added <strong>$${parseFloat(amount).toFixed(2)}</strong> to your account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return sendTransactionEmail({
    to,
    userName,
    transactionType: 'Auto Top-Up',
    amount: parseFloat(amount),
    transactionId,
    date,
    newBalance,
    description: triggerReason || `Balance below threshold ($${parseFloat(threshold).toFixed(2)})`,
    metadata: { threshold, triggerReason }
  });
};

/**
 * Send Lead Payment Email
 */
const sendLeadPaymentEmail = async ({
  to,
  userName,
  leadCost,
  leadId,
  leadName,
  campaignName,
  payment_type,
  full_address,
  transactionId,
  newBalance,
  amountFromBalance = 0,
  amountFromCard = 0,
  leadData = {}
}) => {
  const date = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const {
    first_name = '',
    last_name = '',
    phone_number = '',
    email = '',
    address = {}
  } = leadData;

  const fullName = `${first_name} ${last_name}`.trim() || leadName || 'N/A';

  // Format the breakdown string
  let breakdown = '';
  const bal = parseFloat(amountFromBalance || 0);
  const card = parseFloat(amountFromCard || 0);

  if (bal > 0 && card > 0) {
    breakdown = ` (Split: $${bal.toFixed(2)} Wallet, $${card.toFixed(2)} Card)`;
  } else if (bal > 0) {
    breakdown = ' (Paid via Wallet)';
  } else if (card > 0) {
    breakdown = ' (Paid via Card)';
  }

  const addressParts = [
    // address.street,
    address?.full_address,
    // address.city,
    // address.state?.name || address.state, 
    // address.zip_code
  ].filter(Boolean);

  // const fullAddress = full_address ?? 'N/A';

  // const composedAddressParts = [
  //   address?.street,
  //   address?.city,
  //   address?.state?.name || address?.state,
  //   address?.zip_code
  // ].filter(Boolean);

  // const composedAddress = composedAddressParts.join(', ');

  // const fullAddress = address?.full_address || composedAddress || 'N/A';
  const fullAddress = formatFullAddress(address);

  const leadDetailsSection = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; border: 2px solid #3b82f6; overflow: hidden;">
      <tr>
        <td style="padding: 20px 25px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 15px; text-align: center;">
                <span style="font-size: 28px;">🎯</span>
                <div style="display: inline-block; margin-left: 10px; font-size: 16px; font-weight: 700; color: #1e40af;">Lead Assigned</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-weight: 600; color: #1e3a8a; width: 35%;">👤 Name:</td>
                    <td style="color: #1e40af; font-weight: 600; text-align: right;">${fullName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${phone_number ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-weight: 600; color: #1e3a8a; width: 35%;">📞 Phone:</td>
                    <td style="text-align: right;"><a href="tel:${phone_number}" style="color: #2563eb; text-decoration: none;">${phone_number}</a></td>
                  </tr>
                </table>
              </td>
            </tr>` : ''}
            ${email ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-weight: 600; color: #1e3a8a; width: 35%;">📧 Email:</td>
                    <td style="text-align: right;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none; font-size: 13px; word-break: break-all;">${email}</a></td>
                  </tr>
                </table>
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-weight: 600; color: #1e3a8a; width: 35%;">🆔 Lead ID:</td>
                    <td style="color: #1e40af; text-align: right; font-family: 'Courier New', monospace; font-size: 13px;">${leadId}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-weight: 600; color: #1e3a8a; width: 35%;">🎯 Campaign:</td>
                    <td style="color: #1e40af; font-weight: 600; text-align: right;">${campaignName}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  // ✅ Include ADMIN emails in the receipt via BCC (so User doesn't see them)
  const EXCLUDED = new Set([
    'admin@gmail.com',
    'admin123@gmail.com',
    'admin1234@gmail.com'
  ]);

  let bccRecipients = [];

  if (process.env.ADMIN_NOTIFICATION_EMAILS) {
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e && !EXCLUDED.has(e));

    bccRecipients.push(...adminEmails);
  }

  // Remove duplicates and filter valid
  bccRecipients = [...new Set(bccRecipients)].filter(Boolean);

  return sendTransactionEmail({
    to: to, // ✅ Send TO the user only
    bcc: bccRecipients.length > 0 ? bccRecipients : undefined, // ✅ BCC the admins
    userName,
    transactionType: 'Lead Assignment',
    amount: -parseFloat(leadCost),
    transactionId,
    date,
    newBalance,
    description: `Lead ${leadId} assigned to ${campaignName}${breakdown}`,
    metadata: {
      leadId,
      campaignName,
      payment_type,
      fullAddress,
      leadCost,
      customSection: leadDetailsSection,
      userEmail: to // Ensure the receipt displays the User's email in "Billed To"
    }
  });
};

/**
 * Send Low Balance Warning
 */
const sendLowBalanceWarning = async ({
  to,
  userName,
  currentBalance,
  threshold
}) => {
  const warningContent = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68
    a 100%); border-radius: 12px; border: 2px solid #f59e0b; overflow: hidden;">
      <tr>
        <td style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align: center; padding-bottom: 20px;">
                <div style="font-size: 60px; margin-bottom: 10px;">⚠️</div>
                <h3 style="margin: 0; color: #92400e; font-size: 20px; font-weight: 700;">Low Balance Alert</h3>
              </td>
            </tr>
            <tr>
              <td style="padding: 15px 0; text-align: center;">
                <p style="margin: 0; font-size: 15px; color: #78350f; line-height: 24px;">
                  Your account balance has fallen below the minimum threshold.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 8px; overflow: hidden;">
                  <tr>
                    <td style="padding: 15px 20px; border-bottom: 1px solid #fde68a;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-weight: 600; color: #78350f; width: 50%;">Current Balance:</td>
                          <td style="color: #dc2626; font-weight: 900; text-align: right; font-size: 24px;">$${parseFloat(currentBalance).toFixed(2)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-weight: 600; color: #78350f; width: 50%;">Minimum Threshold:</td>
                          <td style="color: #92400e; font-weight: 700; text-align: right; font-size: 18px;">$${parseFloat(threshold).toFixed(2)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">
                  ⚡ Please add funds to continue receiving leads.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = createEmailTemplate({
    title: 'Low Balance Alert',
    greeting: `Hello ${userName}!`,
    mainText: warningContent,
    buttonText: 'Add Funds Now',
    buttonUrl: `${process.env.UI_LINK}/dashboard/billing`,
    warningText: 'Your lead assignments may be paused if balance reaches $0.00',
    footerText: 'To avoid service interruption, please recharge your account as soon as possible.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '⚠️ Low Balance Warning - Add Funds to Continue',
    html,
  });
};

/**
 * Send Insufficient Balance Email
 */
const sendLowBalanceWarningEmail = async ({
  to,
  userName,
  partnerId,
  email,
  currentBalance,
  leadCost
}) => {

  const lowBalanceContent = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" 
      style="margin: 30px 0; background: linear-gradient(135deg, #fef9c3 0%, #fde68a 100%); 
      border-radius: 12px; border: 2px solid #ca8a04; overflow: hidden;">
      <tr>
        <td style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">

            <!-- Icon + Heading -->
            <tr>
              <td style="text-align: center; padding-bottom: 20px;">
                <div style="font-size: 60px; margin-bottom: 10px;">⚠️</div>
                <h3 style="margin: 0; color: #854d0e; font-size: 22px; font-weight: 700;">
                  Low Balance Alert
                </h3>
              </td>
            </tr>

            <!-- Sub Text -->
            <tr>
              <td style="text-align: center; padding-bottom: 15px;">
                <p style="margin: 0; font-size: 15px; color: #713f12; line-height: 24px;">
                  Your wallet balance is running low. New leads may pause soon until you add funds.
                </p>
              </td>
            </tr>

            <!-- Details Box -->
            <tr>
              <td style="padding-top: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" 
                  style="background: #ffffff; border-radius: 8px; overflow: hidden;">

                  <!-- Partner ID -->
                  <tr>
                    <td style="padding: 15px 20px; border-bottom: 1px solid #fef3c7;">
                      <table width="100%">
                        <tr>
                          <td style="font-weight: 600; color: #713f12; text-align: left;" >Partner ID:</td>
                          <td style="text-align: right; color: #854d0e; font-weight: 700;">
                            ${partnerId}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Email -->
                  <tr>
                    <td style="padding: 15px 20px; border-bottom: 1px solid #fef3c7;">
                      <table width="100%">
                        <tr>
                          <td style="font-weight: 600; color: #713f12; text-align: left;">Account Email:</td>
                          <td style="text-align: right; color: #854d0e; font-weight: 700;">
                            ${email}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Current Balance -->
                  <tr>
                    <td style="padding: 15px 20px; border-bottom: 1px solid #fef3c7;">
                      <table width="100%">
                        <tr>
                          <td style="font-weight: 600; color: #713f12; text-align: left;">Current Balance:</td>
                          <td style="text-align: right; color: #b45309; font-weight: 900; font-size: 20px;">
                            $${parseFloat(currentBalance).toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Lead Price -->
                  <tr>
                    <td style="padding: 15px 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
                      <table width="100%">
                        <tr>
                          <td style="font-weight: 700; color: #854d0e;">Lead Price:</td>
                          <td style="text-align: right; color: #a16207; font-weight: 900; font-size: 22px;">
                            $${parseFloat(leadCost).toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  `;

  const html = createEmailTemplate({
    title: 'Low Balance Alert',
    greeting: `Hello ${userName}!`,
    mainText: lowBalanceContent,
    buttonText: 'Add Funds Now',
    buttonUrl: `${process.env.UI_LINK}/dashboard/billing`,
    warningText: 'Your account may stop receiving new leads soon. Please add funds to keep services active.',

  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Low Balance Alert',
    html
  });
};


const sendInsufficientBalanceEmail = async ({
  to,
  userName,
  requiredAmount,
  currentBalance,
  campaignName,
  campaignId
}) => {

  const insufficientContent = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; border: 2px solid #dc2626; overflow: hidden;">
      <tr>
        <td style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">

            <!-- ICON + HEADING -->
            <tr>
              <td style="text-align: center; padding-bottom: 20px;">
                <div style="font-size: 60px; margin-bottom: 10px;">🚫</div>
                <h3 style="margin: 0; color: #991b1b; font-size: 20px; font-weight: 700;">Insufficient Balance</h3>
              </td>
            </tr>

            <!-- CAMPAIGN DETAILS -->
            <tr>
              <td style="padding: 10px 0; text-align: center;">
                <p style="margin: 0; font-size: 15px; color: #7f1d1d; line-height: 24px;">
                  Unable to assign leads to campaign 
                  <strong>"${campaignName}"</strong> (ID: <strong>${campaignId}</strong>)
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 8px; overflow: hidden;">

                  <!-- REQUIRED AMOUNT -->
                  <tr>
                    <td style="padding: 15px 20px; border-bottom: 1px solid #fecaca;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-weight: 600; color: #7f1d1d;">Required Balance (Lead Price):</td>
                          <td style="color: #dc2626; font-weight: 900; text-align: right; font-size: 20px;">
                            $${parseFloat(requiredAmount).toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- CURRENT BALANCE -->
                  <tr>
                    <td style="padding: 15px 20px; border-bottom: 1px solid #fecaca;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-weight: 600; color: #7f1d1d;">Current Balance:</td>
                          <td style="color: #991b1b; font-weight: 700; text-align: right; font-size: 20px;">
                            $${parseFloat(currentBalance).toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- AMOUNT NEEDED -->
                  <tr>
                    <td style="padding: 15px 20px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-weight: 700; color: #1e3a8a;">Amount Needed:</td>
                          <td style="color: #2563eb; font-weight: 900; text-align: right; font-size: 22px;">
                            $${parseFloat(requiredAmount - currentBalance).toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  `;

  const html = createEmailTemplate({
    title: 'Transaction Failed',
    greeting: `Hello ${userName}!`,
    mainText: insufficientContent,
    buttonText: 'Add Funds Now',
    buttonUrl: `${process.env.UI_LINK}/dashboard/billing`,
    warningText: 'Your campaign is currently paused. Add funds immediately to resume receiving leads.',
    footerText: 'If you have any questions, please contact our support team.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '❌ Transaction Failed - Insufficient Balance',
    html,
  });
};

const sendLowBalanceAdminEmail = async ({
  to,
  userEmail,
  userName,
  campaignName,
  campaignId,
  requiredAmount,
  currentBalance
}) => {

  // Always ensure "to" is an array
  const recipients = Array.isArray(to) ? to : [to];

  // Format values
  const leadCost = parseFloat(requiredAmount).toFixed(2);
  const balance = parseFloat(currentBalance).toFixed(2);
  const needed = parseFloat(requiredAmount - currentBalance).toFixed(2);

  // 📌 Styled table (same design as new user registration)
  const table = `
    <table cellpadding="0" cellspacing="0" border="0"
           style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; 
                  color: #1e3a8a; line-height: 1.6; text-align: left;">

      <tr>
        <td style="padding: 4px 0; vertical-align: top;"><strong>User</strong></td>
        <td style="padding: 4px 0; color: #1e40af;">
          ${userName} (${userEmail})
        </td>
      </tr>

      <tr>
        <td style="padding: 4px 0; vertical-align: top;"><strong>Campaign</strong></td>
        <td style="padding: 4px 0; color: #1e40af;">
          ${campaignName}
        </td>
      </tr>

      <tr>
        <td style="padding: 4px 0; vertical-align: top;"><strong>Campaign ID</strong></td>
        <td style="padding: 4px 0; color: #1e40af;">
          ${campaignId}
        </td>
      </tr>

      <tr>
        <td style="padding: 4px 0; vertical-align: top;"><strong>Lead Cost</strong></td>
        <td style="padding: 4px 0; color: #1e40af;">$${leadCost}</td>
      </tr>

      <tr>
        <td style="padding: 4px 0; vertical-align: top;"><strong>User Balance</strong></td>
        <td style="padding: 4px 0; color: #1e40af;">$${balance}</td>
      </tr>

      <tr>
        <td style="padding: 4px 0; vertical-align: top;"><strong>Amount Needed</strong></td>
        <td style="padding: 4px 0; color: #dc2626;">$${needed}</td>
      </tr>

    </table>
  `;

  // 📌 Use the SAME email wrapper template as registration emails
  const html = createEmailTemplate({
    title: 'Low Balance Alert – Lead Assignment Stopped',
    mainText: `
      <p style="margin-bottom: 10px; color: #1e3a8a;">
        A lead assignment was stopped due to <strong>insufficient balance</strong>.
      </p>

      ${table}

    `,
    footerText: '' // no footer
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: "Low Balance Alert – Lead Stopped",
    html
  });
};

const sendCampaignResumedEmail = async ({ to, userName, email, partnerId }) => {
  const html = createEmailTemplate({
    title: '✅ Lead Service Resumed',
    greeting: `Hello ${userName}!`,
    mainText: `
            <p>Your lead service has been resumed successfully.</p>
            <p><strong>Partner ID:</strong> ${partnerId}</p>
            <p><strong>Email:</strong> ${email}</p>
        `,
    footerText: 'If you have any questions, please contact support.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✅ Lead Service Resumed`,
    html
  });
};
const sendCampaignResumedAdminEmail = async ({ to, userName, userEmail, partnerId }) => {
  const recipients = Array.isArray(to) ? to : [to];

  const table = `
        <table cellpadding="0" cellspacing="0" border="0"
               style="width: 100%; font-family: Arial, sans-serif; font-size: 14px; color: #1e3a8a; line-height: 1.6;">
          <tr>
            <td><strong>User</strong></td>
            <td>${userName} (${userEmail})</td>
          </tr>
          <tr>
            <td><strong>Partner ID</strong></td>
            <td>${partnerId}</td>
          </tr>
        </table>
    `;

  const html = createEmailTemplate({
    title: 'Lead Service Resumed – Balance Added',
    mainText: `
            <p>The lead assignment service for the user has been resumed after sufficient funds were added:</p>
            ${table}
        `,
    footerText: ''
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: `Lead Service Resumed – Partner ID ${partnerId}`,
    html
  });
};

const sendFailedLeadPaymentEmail = async ({ to, userName, leadId, amount, cardLast4, errorMessage }) => {
  const html = createEmailTemplate({
    title: '❌ Lead Payment Failed',
    greeting: `Hello ${userName},`,
    mainText: `
      <p>Your Pay-As-You-Go payment for a new lead has failed.</p>
      <table cellpadding="6" style="width:100%; border-collapse: collapse;">
        <tr><td><strong>Lead ID:</strong></td><td>${leadId}</td></tr>
        <tr><td><strong>Amount:</strong></td><td>$${amount}</td></tr>
        <tr><td><strong>Card Used:</strong></td><td>**** **** **** ${cardLast4}</td></tr>
        <tr><td><strong>Error:</strong></td><td>${errorMessage}</td></tr>
      </table>
      <p>Please update your payment method to continue receiving leads.</p>
    `,
    footerText: 'If you need help, feel free to contact support.'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "❌ Lead Payment Failed",
    html
  });
};


const sendFailedLeadPaymentAdminEmail = async ({ to, userName, userEmail, leadId, amount, cardLast4, errorMessage }) => {
  const recipients = Array.isArray(to) ? to : [to];

  const table = `
    <table cellpadding="6" cellspacing="0" style="width:100%; border-collapse: collapse;">
      <tr><td><strong>User Name</strong></td><td>${userName}</td></tr>
      <tr><td><strong>User Email</strong></td><td>${userEmail}</td></tr>
      <tr><td><strong>Lead ID</strong></td><td>${leadId}</td></tr>
      <tr><td><strong>Amount</strong></td><td>$${amount}</td></tr>
      <tr><td><strong>Card Used</strong></td><td>**** **** **** ${cardLast4}</td></tr>
      <tr><td><strong>Error</strong></td><td>${errorMessage}</td></tr>
    </table>
  `;

  const html = createEmailTemplate({
    title: 'Lead Payment Failed – User Attempted Card Charge',
    mainText: `
      <p>A Pay-As-You-Go lead charge has failed for the following user:</p>
      ${table}
    `,
    footerText: ''
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: `Lead Payment Failed – ${userEmail}`,
    html
  });
};

/**
 * Email sent to USER when PENDING leads are successfully charged
 * Shows ALL charged leads in one table
 */
const sendPendingLeadsPaymentSuccessEmail = async ({
  to,
  userName,
  chargedLeads,  // Array of all charged leads
  totalAmount,
  newBalance,
  paymentMethod,
  cardLast4
}) => {
  // Build leads table rows
  const leadsTableRows = chargedLeads.map((lead, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.leadId}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.firstName || ''} ${lead.lastName || ''}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.email || 'N/A'}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.phone || 'N/A'}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.campaignName || 'N/A'}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right;"><strong>$${lead.amount?.toFixed(2) || '0.00'}</strong></td>
      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: center;">
        <span style="background-color: #28a745; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">Active</span>
      </td>
    </tr>
  `).join('');

  const leadsTable = `
    <table cellpadding="0" cellspacing="0" style="width:100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin: 15px 0; font-size: 14px;">
      <thead>
        <tr style="background-color: #343a40; color: white;">
          <th style="border: 1px solid #454d55; padding: 12px; text-align: center;">#</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Lead ID</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Name</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Email</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Phone</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Campaign</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: right;">Amount</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${leadsTableRows}
      </tbody>
      <tfoot>
        <tr style="background-color: #d4edda;">
          <td colspan="6" style="border: 1px solid #c3e6cb; padding: 12px; text-align: right;"><strong>Total Charged:</strong></td>
          <td style="border: 1px solid #c3e6cb; padding: 12px; text-align: right;"><strong style="font-size: 16px;">$${totalAmount?.toFixed(2) || '0.00'}</strong></td>
          <td style="border: 1px solid #c3e6cb; padding: 12px; text-align: center;"><strong>${chargedLeads.length} Leads</strong></td>
        </tr>
      </tfoot>
    </table>
  `;

  const summaryTable = `
    <table cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin: 15px 0;">
      <tr style="background-color: #d4edda;">
        <td style="border: 1px solid #c3e6cb; padding: 12px;"><strong>Total Leads Charged</strong></td>
        <td style="border: 1px solid #c3e6cb; padding: 12px;"><strong>${chargedLeads.length}</strong></td>
      </tr>
      <tr>
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>Total Amount Charged</strong></td>
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong style="color: #28a745;">$${totalAmount?.toFixed(2) || '0.00'}</strong></td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>Payment Method</strong></td>
        <td style="border: 1px solid #e0e0e0; padding: 12px;">${paymentMethod === 'CARD' ? `Card **** ${cardLast4}` : paymentMethod === 'MIXED' ? 'Balance + Card' : 'Account Balance'}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>Remaining Balance</strong></td>
        <td style="border: 1px solid #e0e0e0; padding: 12px;">$${newBalance?.toFixed(2) || '0.00'}</td>
      </tr>
    </table>
  `;

  const html = createEmailTemplate({
    title: '✅ Pending Payments Successfully Processed',
    greeting: `Hello ${userName},`,
    mainText: `
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
        <strong style="color: #155724; font-size: 18px;">🎉 Great News!</strong>
        <p style="color: #155724; margin: 5px 0 0 0;">
          <strong>${chargedLeads.length} pending payment${chargedLeads.length > 1 ? 's have' : ' has'}</strong> been successfully charged and ${chargedLeads.length > 1 ? 'are' : 'is'} now <strong>ACTIVE</strong>.
        </p>
      </div>

      <p>The following leads were previously pending due to payment issues. After adding funds or updating your payment method, all pending payments have been processed successfully.</p>
      
      <h3 style="color: #333; margin-top: 25px;">📊 Payment Summary</h3>
      ${summaryTable}
      
      <h3 style="color: #333; margin-top: 25px;">📋 Charged Leads Details</h3>
      ${leadsTable}
      
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin-top: 20px;">
        <strong style="color: #856404;">ℹ️ What happened?</strong>
        <p style="color: #856404; margin: 5px 0 0 0;">
          These leads were originally received but payment failed at that time. Once you added funds or your payment method was updated, we automatically charged all pending amounts and activated the leads.
        </p>
      </div>

      <p style="margin-top: 20px;">All these leads are now available in your dashboard.</p>
    `,
    footerText: 'Thank you for using our service!'
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✅ ${chargedLeads.length} Pending Payment${chargedLeads.length > 1 ? 's' : ''} Processed - $${totalAmount?.toFixed(2)} Charged`,
    html
  });
};

/**
 * Email sent to ADMINS when PENDING leads are successfully charged
 * Shows ALL charged leads in one table
 */
const sendPendingLeadsPaymentSuccessAdminEmail = async ({
  to,
  userName,
  userEmail,
  chargedLeads,  // Array of all charged leads
  totalAmount,
  newBalance,
  paymentMethod,
  cardLast4
}) => {
  const recipients = Array.isArray(to) ? to : [to];

  // Build leads table rows
  const leadsTableRows = chargedLeads.map((lead, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.leadId}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.firstName || ''} ${lead.lastName || ''}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.email || 'N/A'}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.phone || 'N/A'}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px;">${lead.campaignName || 'N/A'}</td>
      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right;"><strong>$${lead.amount?.toFixed(2) || '0.00'}</strong></td>
      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: center;">
        <span style="background-color: #28a745; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">Active</span>
      </td>
    </tr>
  `).join('');

  const leadsTable = `
    <table cellpadding="0" cellspacing="0" style="width:100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin: 15px 0; font-size: 14px;">
      <thead>
        <tr style="background-color: #343a40; color: white;">
          <th style="border: 1px solid #454d55; padding: 12px; text-align: center;">#</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Lead ID</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Name</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Email</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Phone</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: left;">Campaign</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: right;">Amount</th>
          <th style="border: 1px solid #454d55; padding: 12px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${leadsTableRows}
      </tbody>
      <tfoot>
        <tr style="background-color: #d4edda;">
          <td colspan="6" style="border: 1px solid #c3e6cb; padding: 12px; text-align: right;"><strong>Total Charged:</strong></td>
          <td style="border: 1px solid #c3e6cb; padding: 12px; text-align: right;"><strong style="font-size: 16px;">$${totalAmount?.toFixed(2) || '0.00'}</strong></td>
          <td style="border: 1px solid #c3e6cb; padding: 12px; text-align: center;"><strong>${chargedLeads.length} Leads</strong></td>
        </tr>
      </tfoot>
    </table>
  `;

  const userTable = `
    <table cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin: 15px 0;">
      <tr style="background-color: #cce5ff;">
        <td style="border: 1px solid #b8daff; padding: 10px;"><strong>User Name</strong></td>
        <td style="border: 1px solid #b8daff; padding: 10px;">${userName}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>User Email</strong></td>
        <td style="border: 1px solid #e0e0e0; padding: 10px;">${userEmail}</td>
      </tr>
    </table>
  `;

  const summaryTable = `
    <table cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin: 15px 0;">
      <tr style="background-color: #d4edda;">
        <td style="border: 1px solid #c3e6cb; padding: 12px;"><strong>Total Leads Charged</strong></td>
        <td style="border: 1px solid #c3e6cb; padding: 12px;"><strong>${chargedLeads.length}</strong></td>
      </tr>
      <tr>
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>Total Amount Charged</strong></td>
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong style="color: #28a745;">$${totalAmount?.toFixed(2) || '0.00'}</strong></td>
      </tr>
      <tr style="background-color: #f5f5f5;">
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>Payment Method</strong></td>
        <td style="border: 1px solid #e0e0e0; padding: 12px;">${paymentMethod === 'CARD' ? `Card **** ${cardLast4}` : paymentMethod === 'MIXED' ? 'Balance + Card' : 'Account Balance'}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #e0e0e0; padding: 12px;"><strong>User's Remaining Balance</strong></td>
        <td style="border: 1px solid #e0e0e0; padding: 12px;">$${newBalance?.toFixed(2) || '0.00'}</td>
      </tr>
    </table>
  `;

  const html = createEmailTemplate({
    title: 'Pending Payments Successfully Processed',
    mainText: `
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
        <strong style="color: #155724; font-size: 18px;"> Pending Payments Cleared</strong>
        <p style="color: #155724; margin: 5px 0 0 0;">
          <strong>${chargedLeads.length} pending payment${chargedLeads.length > 1 ? 's have' : ' has'}</strong> been successfully processed for this user.
        </p>
      </div>

      <h3 style="color: #333; margin-top: 20px;"> User Details</h3>
      ${userTable}
      
      <h3 style="color: #333; margin-top: 25px;"> Payment Summary</h3>
      ${summaryTable}
      
      <h3 style="color: #333; margin-top: 25px;"> All Charged Leads</h3>
      ${leadsTable}

      <div style="background-color: #e2e3e5; border: 1px solid #d6d8db; border-radius: 5px; padding: 15px; margin-top: 20px;">
        <strong style="color: #383d41;"> Status Change:</strong>
        <p style="color: #383d41; margin: 5px 0 0 0;">
          All ${chargedLeads.length} leads: <span style="color: #dc3545;">Pending</span> → <span style="color: #28a745;"><strong>Active</strong></span>
        </p>
      </div>
    `,
    footerText: ''
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    subject: `✅ ${chargedLeads.length} Pending Payments Processed - ${userEmail} - $${totalAmount?.toFixed(2)}`,
    html
  });
};



module.exports = {
  createEmailTemplate,
  sendVerificationEmail,
  sendEmailToUserWithOTP,
  sendAccountCreationEmailWithVerification,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendTestMail,
  sendLeadAssignEmail,
  sendLeadAssignAdminEmail,
  sendLeadReturnEmail,
  sendUserLeadReturnStatusEmail,
  // ✅ New Transaction Email Functions
  sendTransactionEmail,
  sendFundsAddedEmail,
  sendAutoTopUpEmail,
  sendLeadPaymentEmail,
  sendLowBalanceWarning,
  sendInsufficientBalanceEmail,
  sendNewUserRegistrationToAdmin,
  sendCampaignCreatedEmailtoN8N,
  sendLowBalanceAdminEmail,
  sendCampaignResumedEmail,
  sendCampaignResumedAdminEmail,
  sendLowBalanceWarningEmail,
  sendFailedLeadPaymentEmail,
  sendFailedLeadPaymentAdminEmail,
  sendPendingLeadsPaymentSuccessEmail,
  sendPendingLeadsPaymentSuccessAdminEmail,
  sendCampaignCreatedEmailToAdmin,
  sendCampaignCreatedEmailToUser
};