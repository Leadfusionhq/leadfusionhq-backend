const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 'resend_dummy_key');

const FROM_EMAIL = 'Leadfusionhq <noreply@leadfusionhq.com>';

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

                ${
                  highlightedContent
                    ? `
                <!-- Highlighted Content (OTP, Password, etc.) -->
                <div style="text-align: center; margin: 30px 0;">
                  ${highlightLabel ? `<p style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">${highlightLabel}</p>` : ''}
                  <div style="font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 16px 32px; border-radius: 12px; display: inline-block; border: 2px solid #dee2e6; color: #204D9D; letter-spacing: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${highlightedContent}
                  </div>
                </div>`
                    : ''
                }

                ${
                  buttonText && buttonUrl
                    ? `
                <!-- Action Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${buttonUrl}" style="background: linear-gradient(to right, #204D9D, #306A64); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 8px rgba(32, 77, 157, 0.3); transition: all 0.3s ease;">${buttonText}</a>
                </div>`
                    : ''
                }

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
    footerText:
      'If you did not request this verification, please ignore this email or contact support.',
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
    warningText: 'This verification link expires in 24 hours.',
    footerText: 'If you did not sign up for this account, you can safely ignore this email.',
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
    mainText:
      'Your account has been successfully created by our team. ' +
      (password ? 'Below is your temporary password:' : 'Please verify your email to get started.'),
    highlightedContent: password || '',
    highlightLabel: password ? 'Temporary Password' : '',
    buttonText: 'Verify Email & Activate Account',
    buttonUrl: verifyUrl,
    warningText: password
      ? 'Please change your password after logging in for security.'
      : 'This verification link expires in 24 hours.',
    footerText: 'If you did not expect this email, please contact our support team immediately.',
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
    mainText:
      'We received a request to reset your password. Click the button below to create a new password.',
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
    warningText:
      'This reset link expires in 1 hour. If you did not request this, please ignore this email.',
    footerText: 'For security reasons, this link can only be used once.',
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
    mainText:
      "Thank you for joining our platform. We're excited to have you on board and look forward to helping you achieve your goals.",
    buttonText: 'Get Started',
    buttonUrl: `${process.env.UI_LINK}/dashboard`,
    footerText:
      'Need help getting started? Check out our documentation or contact our support team.',
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Leadfusionhq!',
    html,
  });
};

module.exports = {
  createEmailTemplate,
  sendVerificationEmail,
  sendEmailToUserWithOTP,
  sendAccountCreationEmailWithVerification,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
