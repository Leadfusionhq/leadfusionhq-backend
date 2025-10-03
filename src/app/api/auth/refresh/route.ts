import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify the current token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const userId = (payload as any).id;
    const rememberMe = (payload as any).rememberMe || false;

    // Check if user still exists and is active
    await connectDB();
    const user = await User.findById(userId);
    
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Generate new token
    const expiresIn = rememberMe ? '30d' : '24h';
    const newToken = await new SignJWT({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      rememberMe
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresIn)
      .setIssuedAt()
      .sign(secret);

    const tokenExpiryTimestamp = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);

    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      token: newToken,
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
      }
    });

    // Set new cookie
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ 
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }
}

