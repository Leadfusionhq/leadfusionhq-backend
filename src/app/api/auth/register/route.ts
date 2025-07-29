import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import bcrypt from 'bcrypt'
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/mails/mails'
import crypto from 'crypto'

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  console.log('trigger in api ...')
  try {
    const { name, email, password, role, companyName, phoneNumber, zipCode } = await req.json();
    console.warn({ name, email, password, role, companyName, phoneNumber, zipCode });
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if ((role !== 'Admin') && (!companyName || !phoneNumber || !zipCode)) {
      return NextResponse.json({
        error: 'Company name, phone number, and zip code are required for users or if role is null',
      }, { status: 400 })
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Establish DB connection
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const newUser = new User({
      name,
      email,
      companyName,
      phoneNumber,
      zipCode,
      password: hashedPassword,
      role: role || 'User',
      verificationToken,
      // isActive:false,
    })

    // Save user to DB
    await newUser.save()

    // console.log('About to send verification email...')
    // const emailResult = await sendVerificationEmail({
    //   to: email,
    //   name,
    //   token: verificationToken,
    // })
    // console.log('Email send result:', emailResult)

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/auth/register:', error);
    return NextResponse.json({
      error: 'Server error',
      details: process.env.NODE_ENV === 'production'
        ? 'Unknown error'
        : error instanceof Error
          ? error.message
          : 'Unknown error',
    }, { status: 500 });
  }
}
