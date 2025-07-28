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
    const { email, password } = await req.json()

    // Input Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Establish DB connection
    await connectDB()

    // Find the user by email
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check if account is deactivated
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    // Compare the password with the hashed one
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate JWT Token
    const token = generateToken(user)

    return NextResponse.json({
      message: 'Login successful',
      token,
      tokenExpiration: '1d', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Error in POST /api/auth/login:', error)

    // Improved error response handling based on environment
    const errorMessage = process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again later.' : (error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
