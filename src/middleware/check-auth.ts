import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getUserByID } from '@/services/user-service';

const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const checkAuth = async (req: NextRequest) => {
  const token = req.headers.get('Authorization')?.split(' ')[1]; 

  if (!token) {
    return NextResponse.json({ error: 'Authorization token is missing' }, { status: 401 }); 
  }

  const decoded = verifyToken(token); 

  if (!decoded) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }); 
  }
  
  const userExist = await getUserByID(decoded.id, true); 

  if (!userExist) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  req.user = userExist; 
  return decoded;
};
