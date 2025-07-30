import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Your App <onboarding@resend.dev>'

export const sendVerificationEmail = async ({
  to,
  name,
  token,
}: {
  to: string
  name: string
  token: string
}) => {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`

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
  })
}

// mails/mails.ts
export const sendResetPasswordEmail = async ({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password',
    html: `
      <h2>Hello ${name},</h2>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background-color: #204D9D; color: #ffffff; border-radius: 6px; text-decoration: none;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
};


