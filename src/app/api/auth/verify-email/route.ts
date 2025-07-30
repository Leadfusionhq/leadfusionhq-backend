import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    await connectDB()

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }, // Token not expired
      isEmailVerified: false
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 })
    }

    // Verify the user
    user.isEmailVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    // Redirect to success page or return success response
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/login?verified=true`)
    
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}