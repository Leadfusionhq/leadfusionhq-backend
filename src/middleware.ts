import { NextRequest, NextResponse } from 'next/server';
// import { authMiddleware } from '@/middleware/auth';

export function middleware(req: NextRequest): NextResponse {
  const path = req.nextUrl.pathname;
  console.log(path);
  // if (path.startsWith('/admin/dashboard')) return authMiddleware(req, 'ADMIN');
  // if (path.startsWith('/dashboard')) return authMiddleware(req, 'USER');
 
  return NextResponse.next();
}
