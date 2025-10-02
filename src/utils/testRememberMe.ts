// Temporary utility to test Remember Me functionality
import { decodeToken } from './auth';
import Cookies from 'js-cookie';

export const testRememberMeToken = () => {
  const token = Cookies.get('token');
  if (!token) {
    console.log('❌ No token found');
    return;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    console.log('❌ Could not decode token');
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = (decoded as any).exp;
  const rememberMe = (decoded as any).rememberMe;
  
  const timeUntilExpiry = exp - now;
  const daysUntilExpiry = timeUntilExpiry / (24 * 60 * 60);
  const hoursUntilExpiry = timeUntilExpiry / (60 * 60);

  console.log('🔍 Token Analysis:');
  console.log('Remember Me:', rememberMe ? '✅ YES (30 days)' : '❌ NO (24 hours)');
  console.log('Current Time:', new Date().toLocaleString());
  console.log('Token Expires:', new Date(exp * 1000).toLocaleString());
  console.log('Time Until Expiry:', `${daysUntilExpiry.toFixed(2)} days (${hoursUntilExpiry.toFixed(2)} hours)`);
  
  // Check if expiry matches expected duration
  if (rememberMe) {
    const expectedDays = 30;
    const actualDays = daysUntilExpiry;
    const isCorrect = actualDays >= 29 && actualDays <= 30; // Allow small variance
    console.log(`Expected: ~${expectedDays} days, Actual: ${actualDays.toFixed(2)} days`, isCorrect ? '✅' : '❌');
  } else {
    const expectedHours = 24;
    const actualHours = hoursUntilExpiry;
    const isCorrect = actualHours >= 23 && actualHours <= 24; // Allow small variance
    console.log(`Expected: ~${expectedHours} hours, Actual: ${actualHours.toFixed(2)} hours`, isCorrect ? '✅' : '❌');
  }

  return {
    rememberMe,
    expiresAt: new Date(exp * 1000),
    daysUntilExpiry: daysUntilExpiry.toFixed(2),
    hoursUntilExpiry: hoursUntilExpiry.toFixed(2),
    isWorkingCorrectly: rememberMe ? (daysUntilExpiry >= 29) : (hoursUntilExpiry >= 23)
  };
};

// Call this in browser console after login
if (typeof window !== 'undefined') {
  (window as any).testRememberMe = testRememberMeToken;
}
