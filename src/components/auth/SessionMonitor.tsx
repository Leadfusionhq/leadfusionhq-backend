'use client';

import { useEffect } from 'react';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const SessionMonitor = () => {
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);
  const { checkTokenExpiry } = useTokenRefresh();

  useEffect(() => {
    if (!isLoggedIn) return;

    // Listen for storage events (token changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tokenExpiry' || e.key === 'rememberMe') {
        checkTokenExpiry();
      }
    };

    // Listen for visibility changes (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn) {
        checkTokenExpiry();
      }
    };

    // Listen for focus events (when user returns to window)
    const handleFocus = () => {
      if (isLoggedIn) {
        checkTokenExpiry();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoggedIn, checkTokenExpiry]);

  // This component doesn't render anything
  return null;
};

export default SessionMonitor;

