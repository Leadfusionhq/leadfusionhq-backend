import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    await connectDB()
    
    const user = await User.findOneAndUpdate(
      { email },
      { verificationTokenExpires: new Date('2025-07-29T00:00:00.000Z') },
      { new: true }
    )
    
    return NextResponse.json({ 
      message: 'Token expired for testing', 
      user: { email: user?.email, expires: user?.verificationTokenExpires }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to expire token' }, { status: 500 })
  }
}