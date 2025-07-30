import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/mails/mails'
import crypto from 'crypto'

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map()

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Rate limiting check (1 request per 5 minutes per email)
    const now = Date.now()
    const lastRequest = rateLimitMap.get(email)
    
    if (lastRequest && now - lastRequest < 5 * 60 * 1000) {
      return NextResponse.json({ 
        error: 'Please wait 5 minutes before requesting another verification email' 
      }, { status: 429 })
    }

    await connectDB()

    const user = await User.findOne({ 
      email, 
      isEmailVerified: false 
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found or already verified' 
      }, { status: 404 })
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    user.verificationToken = verificationToken
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await user.save()

    // Send email
    await sendVerificationEmail({
      to: email,
      name: user.name,
      token: verificationToken,
    })

    // Update rate limit
    rateLimitMap.set(email, now)

    return NextResponse.json({ 
      message: 'Verification email sent successfully' 
    }, { status: 200 })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}