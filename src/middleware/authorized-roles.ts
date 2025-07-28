import { NextRequest, NextResponse } from 'next/server';
import { UserDocument } from '@/models/User';

declare module 'next/server' {
  interface NextRequest {
    user?: UserDocument;
  }
}

export const authorizedRoles = (roles: string[]) => {
  return (req: NextRequest) => {
    const user = req.user;
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!roles.includes(user.role)) {
      return NextResponse.json({ error: 'You do not have permission to access this resource' }, { status: 403 });
    }
    return null;
  };
};
