import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { NextRequest, NextResponse } from 'next/server'
import { sendResetPasswordEmail } from '@/mails/mails' // You need to implement this
import crypto from 'crypto'

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, number>()

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Rate limiting (1 request per 5 minutes per email)
    const now = Date.now()
    const lastRequest = rateLimitMap.get(email)

    if (lastRequest && now - lastRequest < 5 * 60 * 1000) {
      return NextResponse.json({
        error: 'Please wait 5 minutes before requesting another reset link',
      }, { status: 429 })
    }

    await connectDB()

    const user = await User.findOne({ email, isEmailVerified: true })

    if (!user) {
      return NextResponse.json({
        error: 'User not found or not verified',
      }, { status: 404 })
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    // Send password reset email
    await sendResetPasswordEmail({
      to: email,
      name: user.name,
      token: resetToken,
    })

    // Update rate limit map
    rateLimitMap.set(email, now)

    return NextResponse.json({
      message: 'Password reset email sent successfully',
    }, { status: 200 })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
