import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ 
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
    // Clear all authentication cookies (both httpOnly and regular)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set expiration to a past date
      path: '/',
      sameSite: 'strict' as const,
    };

    // Clear the main token cookie
    response.cookies.set('token', '', cookieOptions);
    
    // Clear any session-related cookies
    response.cookies.set('toast', '', {
      ...cookieOptions,
      httpOnly: false, // Toast cookies need to be accessible by client
    });
    
    response.cookies.set('toast-message', '', {
      ...cookieOptions,
      httpOnly: false,
    });

    // Add headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error in POST /api/auth/logout:', error);
    return NextResponse.json({ 
      error: 'Something went wrong during logout',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}