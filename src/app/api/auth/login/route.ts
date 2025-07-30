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

const generateToken = (user: UserJwtPayload) => {
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      isActive: user.isActive
    },
    JWT_SECRET,
    { expiresIn: '1h' } // Token expires in 1 hour
  );
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json()

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

    // Generate JWT Token
    const token = generateToken(user)

    return NextResponse.json({
      message: 'Login successful',
      token,
      tokenExpiration: '1h', // Fix: should be '1h' not '1d'
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Error in POST /api/auth/login:', error)
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : (error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
