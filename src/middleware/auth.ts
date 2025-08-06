import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getToken } from '@/utils/auth';

export function authMiddleware(req: NextRequest, role: 'ADMIN' | 'USER') {
  console.log('req',req);
  const token = getToken(req); // Extract the token from cookies
  console.warn('token',token)
  // if (!token) {
  //   return NextResponse.redirect(new URL('/login', req.url)); // Redirect if no token
  // }

  // try {
  //   const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  //   console.log(decoded);

  //   // Check if the user's role matches the required role
  //   if (decoded.role !== role) {
  //     return NextResponse.redirect(new URL(role === 'ADMIN' ? '/dashboard' : '/admin/dashboard', req.url));
  //   }

  //   return NextResponse.next(); // Continue if the role matches
  // } catch (error) {
  //   return NextResponse.redirect(new URL('/login', req.url)); // Invalid token, redirect to login
  // }
}
