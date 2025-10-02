import Cookies from 'js-cookie';
import { NextRequest } from 'next/server';

export function saveToken(token: string, rememberMe: boolean = false) {
  if (typeof window !== 'undefined') {
    const expires = rememberMe ? 30 : 1; // 30 days if remember me, otherwise 1 day
    Cookies.set('token', token, { 
      expires, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'Strict',
      path: '/'
    });
    
    // Store remember me preference and expiry time
    if (rememberMe) {
      const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      localStorage.setItem('rememberMe', 'true');
    } else {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 1 day in milliseconds
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      localStorage.setItem('rememberMe', 'false');
    }
  }
}

export const getToken = (req: NextRequest) => {
  const cookie = req.cookies.get('token'); 
  return cookie ? cookie : null;
};

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(typeof window !== 'undefined' ? atob(payload) : Buffer.from(payload, 'base64').toString());
  } catch (err) {
    console.log(err)
    return null;
  }
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    Cookies.remove('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('rememberMe');
  }
}

export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  
  const expiryTime = localStorage.getItem('tokenExpiry');
  if (!expiryTime) return true;
  
  return Date.now() > parseInt(expiryTime);
}

export function getTokenExpiry(): number | null {
  if (typeof window === 'undefined') return null;
  
  const expiryTime = localStorage.getItem('tokenExpiry');
  return expiryTime ? parseInt(expiryTime) : null;
}

export function isRememberMeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  return localStorage.getItem('rememberMe') === 'true';
}
