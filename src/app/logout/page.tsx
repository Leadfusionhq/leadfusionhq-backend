'use client';

import { useDispatch } from 'react-redux';
import { logout } from '@/redux/auth/authSlice';
import { removeToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppDispatch } from '@/redux/store';
import { API_URL } from '@/utils/apiUrl';
import { useLoader } from '@/context/LoaderContext';

const Logout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    const logoutUser = async () => {
      showLoader("Logging out...");

      try {
        // const response = await fetch(API_URL.LOGOUT_USER, { method: 'POST' });
        await fetch("/api/auth/logout", { method: "POST" });
        // if (!response.ok) {
        //   throw new Error('Logout failed');
        // }

        dispatch(logout());
        removeToken();

        await new Promise(resolve => setTimeout(resolve, 800));

        router.push('/login');
      } catch (error) {
        console.error('Logout failed', error);
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push('/login'); 
      } finally {
        hideLoader();
      }
    };

    logoutUser();
  }, [dispatch, router, showLoader, hideLoader]);

  return null; 
};

export default Logout;
