import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken' 
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key';

// Helper function to generate JWT token
interface UserJwtPayload {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

const generateToken = (user: UserJwtPayload, rememberMe: boolean = false) => {
  const expiresIn = rememberMe ? '30d' : '24h';
  
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      isActive: user.isActive,
      rememberMe
    },
    JWT_SECRET,
    { expiresIn }
  );
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, role, rememberMe = false } = await req.json()

    // Input Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check if account is deactivated
    if (!user.isActive) {
      return NextResponse.json({ error: 'Your Account is deactivated please contact Admin.' }, { status: 403 })
    }

    // Enhanced email verification check
    if (!user.isEmailVerified) {
      // Check if verification token is expired
      const now = new Date()
      const isTokenExpired = !user.verificationTokenExpires || user.verificationTokenExpires < now

      if (isTokenExpired) {
        return NextResponse.json({ 
          error: 'Email not verified and verification link expired',
          code: 'VERIFICATION_EXPIRED',
          email: user.email,
          message: 'Please request a new verification email'
        }, { status: 403 })
      } else {
        return NextResponse.json({ 
          error: 'Please verify your email first',
          code: 'EMAIL_NOT_VERIFIED',
          email: user.email,
          message: 'Check your inbox for verification email'
        }, { status: 403 })
      }
    }

    // Check user role
    if (user.role !== role) {
      return NextResponse.json({ error: `Only ${role}s can log in here.` }, { status: 403 })
    }

    // Password validation
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate JWT Token with remember me support
    const token = generateToken(user, rememberMe)
    const tokenExpiration = rememberMe ? '30d' : '24h'
    const tokenExpiryTimestamp = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)

    // Create response with secure cookie
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      tokenExpiration,
      tokenExpiry: tokenExpiryTimestamp,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        address: user.address,
        dob: user.dob,
        balance: user.balance,
        avatar: user.avatar
      },
    }, { status: 200 })

    // Set secure HTTP-only cookie as backup
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 24 hours in seconds
      path: '/'
    })

    return response

  } catch (error: unknown) {
    console.error('Error in POST /api/auth/login:', error)
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : (error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
