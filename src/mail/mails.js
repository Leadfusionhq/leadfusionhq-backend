const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Leadfusionhq <noreply@leadfusionhq.com>';

const sendVerificationEmail = async ({ to, name, token }) => {
  const verifyUrl = `${process.env.UI_LINK}/verify-email?token=${token}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verify Your Email',
    html: `
      <h2>Hello ${name},</h2>
      <p>Click below to verify your account:</p>
      <a href="${verifyUrl}" style="color:#4F46E5;">Verify Email</a>
      <p>If you did not sign up, you can ignore this message.</p>
    `,
  });
};

const sendEmailToUserWithOTP = async ({ to, email, otp }) => {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2>Hello ${email},</h2>
        <p>We received a request to log in or verify your account. Use the OTP below:</p>
        
        <div style="font-size: 24px; font-weight: bold; background: #f3f3f3; padding: 10px 20px; display: inline-block; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        
        <p>This code is valid for a limited time. Please do not share it with anyone.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        
        <br/>
        <p style="font-size: 14px; color: #888;">– Leadfusionhq</p>
      </div>
    `,
  });
};
const sendAccountCreationEmailWithVerification = async ({ to, name, token, password }) => {
  const verifyUrl = `${process.env.UI_LINK}/verify-email?token=${token}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your Account Has Been Created – Verify and Login',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2>Welcome, ${name}!</h2>

        <p>Your account has been successfully created by our team.</p>

        ${password ? `
        <p><strong>Temporary Password:</strong></p>
        <div style="font-size: 20px; font-weight: bold; background: #f3f3f3; padding: 10px 20px; display: inline-block; border-radius: 8px; margin: 10px 0;">
          ${password}
        </div>
        <p>Please change your password after logging in.</p>
        ` : ''}

        <p>To activate your account, please verify your email by clicking the button below:</p>

        <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Verify Email</a>

        <p>If you did not expect this email, you can ignore it.</p>

        <br/>
        <p style="font-size: 14px; color: #888;">– The Your App Team</p>
      </div>
    `,
  });
};
const sendTestMail = async (toEmail) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Test Email from Node.js',
      html: '<strong>Hello from your Node.js backend!</strong>',
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
module.exports = {
  sendVerificationEmail,
  sendEmailToUserWithOTP,
  sendAccountCreationEmailWithVerification,
  sendTestMail,
};
