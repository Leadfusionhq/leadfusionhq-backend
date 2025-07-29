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
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`

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

export const sendForgotPasswordEmail = async ({
  to,
  name,
  resetToken,
}: {
  to: string
  name: string
  resetToken: string
}) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password',
    html: `
      <h2>Hi ${name},</h2>
      <p>You requested to reset your password.</p>
      <a href="${resetUrl}" style="color:#D97706;">Reset Password</a>
      <p>This link will expire in 30 minutes.</p>
    `,
  })
}
