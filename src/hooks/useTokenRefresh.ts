import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/auth/authSlice';
import { isTokenExpired, getTokenExpiry, removeToken } from '@/utils/auth';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isLoggedIn, token, rememberMe } = useSelector((state: RootState) => state.auth);

  const handleTokenExpiry = useCallback(() => {
    console.log('[TokenRefresh] Token expired - logging out user');
    dispatch(logout());
    removeToken();
    toast.error('Your session has expired. Please log in again.');
    router.push('/login');
  }, [dispatch, router]);

  const checkTokenExpiry = useCallback(() => {
    if (!isLoggedIn || !token) return;

    const tokenExpiry = getTokenExpiry();
    if (!tokenExpiry) return;

    const now = Date.now();
    const timeUntilExpiry = tokenExpiry - now;
    
    // If token is already expired
    if (timeUntilExpiry <= 0) {
      handleTokenExpiry();
      return;
    }

    // Show warning 5 minutes before expiry (for non-remember-me sessions)
    const fiveMinutes = 5 * 60 * 1000;
    if (!rememberMe && timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
      toast.warning('Your session will expire in 5 minutes. Please save your work.', {
        toastId: 'session-warning',
        autoClose: false,
      });
    }

    // Show warning 1 day before expiry (for remember-me sessions)
    const oneDay = 24 * 60 * 60 * 1000;
    if (rememberMe && timeUntilExpiry <= oneDay && timeUntilExpiry > fiveMinutes) {
      toast.info('Your extended session will expire in less than 24 hours.', {
        toastId: 'extended-session-warning',
        autoClose: 8000,
      });
    }
  }, [isLoggedIn, token, rememberMe, handleTokenExpiry]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    // Check immediately
    checkTokenExpiry();

    // Set up periodic checks every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn, token, checkTokenExpiry]);

  // Additional check using the utility function
  useEffect(() => {
    if (isLoggedIn && token && isTokenExpired()) {
      handleTokenExpiry();
    }
  }, [isLoggedIn, token, handleTokenExpiry]);

  return {
    checkTokenExpiry,
    handleTokenExpiry
  };
};

