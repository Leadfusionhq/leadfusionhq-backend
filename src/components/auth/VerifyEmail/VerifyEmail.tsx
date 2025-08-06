'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';
import { getErrorMessage } from '@/utils/errorHandler';

const VerifyOtpPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationComplete, setVerificationComplete] = useState(false);
  
  // Use ref to prevent multiple API calls
  const hasVerified = useRef(false);
  
  const token = searchParams.get('token') || '';

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent multiple calls
      if (!token || hasVerified.current || verificationComplete) {
        if (!token) {
          toast.error('Verification token is missing.');
          router.push('/login');
        }
        return;
      }

      // Mark as processing to prevent duplicate calls
      hasVerified.current = true;
      
      console.warn('Verifying token:', token);

      try {
        // Clear any previous toasts
        toast.dismiss();
        
        const response = await axiosWrapper('get', `${API_URL.VERIFY_EMAIL}?token=${token}`, {}) as {
          message?: string;
          success?: boolean;
        };

        console.log('Verification response:', response);

        if (response?.message) {
          setVerificationComplete(true);
          toast.success(response.message || 'Email verified successfully.');
          
          // Add a small delay before redirect to ensure user sees the success message
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 2000);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (error: unknown) {
        console.error('Verification error:', error);
        setVerificationComplete(true);

        // Clear any existing toasts
        toast.dismiss();

        // Use utility function to extract error message
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);

        // Redirect after showing error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    // Only run if we haven't verified yet and have a token
    if (token && !hasVerified.current && !verificationComplete) {
      verifyEmail();
    }
  }, [token, router, verificationComplete]);

  if (verificationComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-4">Email verification complete!</div>
          <div className="text-sm text-gray-600">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-lg mb-4">Verifying your email...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;