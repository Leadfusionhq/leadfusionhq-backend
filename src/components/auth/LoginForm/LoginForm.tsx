'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/redux/auth/authActions';
import { RootState, AppDispatch } from '@/redux/store';
import { toast } from 'react-toastify';
import { clearError } from '@/redux/auth/authSlice';

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './LoginForm.module.css';
import { usePathname } from 'next/navigation';
import { useSearchParams } from 'next/navigation'; 
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';
import { getErrorMessage } from '@/utils/errorHandler';
import { useLoader } from '@/context/LoaderContext'; // Import the loader context

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [showResendButton, setShowResendButton] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); 
  const { showLoader, hideLoader } = useLoader(); // Get loader functions

  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast.dismiss();
      toast.success('Your account has been verified! You can now log in.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (pathname === '/admin-login') {
      setRole('ADMIN');
    } 
    if (pathname === '/login') {
      setRole('USER');
    } 
  }, [pathname]);

  useEffect(() => {
    if (user) {
      console.warn('user', user)
      toast.dismiss();
      toast.success('Login successful!');
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (error) {
      if (error.includes('Email not verified and verification link expired') || 
          error.includes('verification link expired')) {
        setShowResendButton(true);

        const formEmail = document.querySelector('input[name="email"]') as HTMLInputElement;
        if (formEmail && formEmail.value) {
          setUserEmail(formEmail.value);
          setResendEmail(formEmail.value);
        }
      }
      toast.dismiss();
      toast.error(error);
      setTimeout(() => {
        dispatch(clearError());
      }, 3000);
      
      // Hide loader on error
      hideLoader();
    }
  }, [error, dispatch, hideLoader]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!resendEmail || !resendEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setResendLoading(true);
    showLoader("Sending verification email..."); // Show loader for resend
    
    try {
      const response = await axiosWrapper('put', API_URL.SEND_VERIFICATION_EMAIL, {
        email: resendEmail,
      }) as { message?: string };
      
      toast.success(response.message || 'Verification email sent successfully!');
      setShowResendButton(false);
      setUserEmail('');
      setResendEmail('');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
      hideLoader(); // Hide loader after resend completes
    }
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-[url('/images/log_bg.png')] bg-cover bg-center bg-no-repeat">
      <div className="w-full max-w-[760px] p-5 mx-[150px] my-[50px] md:my-[75px] lg:my-[150px]">
        {/* Top Section with Logo and Role Switch */}
        <div className="relative flex flex-col items-center rounded-t-3xl" style={{ background: 'linear-gradient(90deg,  #204D9D 0%, #306A64 50%, #204D9D 100%' }}>
          <div className="mrg_img flex flex-col items-center -mt-8 xs:-mt-10 sm:-mt-12 md:-mt-16 lg:-mt-20 xl:-mt-24">
            <div className="otr_img rounded-full shadow-md mb-2 bg-black">
              <div className="rounded-full w-[90px] h-[90px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] xl:w-[200px] xl:h-[200px]"> 
                <Image className="log_img rounded-full w-full" src="/images/logo.svg" alt="Firm Foundations Marketing" width={100} height={100} />
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-4.5 mb-5.5 max-[575px]:flex-wrap max-[575px]:gap-y-2 m-2">
            <Link href="/admin-login" passHref>
              <button type="button"
                className={`cursor-pointer px-7.5 py-3.5 rounded-full font-medium text-xs max-[575px]:w-full
                  ${role === 'ADMIN' ? 'bg-white text-black border-white' : 'bg-transparent border text-white'}`}>
                Login as Admin
              </button>
            </Link>
            <Link href="/login" passHref>
              <button type="button"
                className={`cursor-pointer px-7.5 py-3.5 rounded-full font-medium text-xs max-[575px]:w-full
                  ${role === 'USER' ? 'bg-white text-black border-white' : 'bg-transparent border text-white'}`}>
                Login as Client
              </button>
            </Link>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white w-full rounded-b-3xl shadow-md p-[20px] px-[22px] sm:p-8 sm:pb-14 sm:px-12">
          <h1 className={`text-[#000] font-semibold leading-none text-center mb-0 tracking-wide uppercase text-sm max-[575px]:text-xs ${styles.login_h1}`}>
            Welcome Back
          </h1>
          <p className='sign_txt text-[#1C1C1C] mb-[30px] text-[18px] leading-7 text-center m-auto max-w-[520px]'>
            Sign in to access your Lead Manager and stay on top of your leads—all in one place.
          </p>

          {/* Enhanced Email Verification Resend Section */}
          {showResendButton && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Email Verification Required</h3>
                  <p className="text-sm text-blue-700">
                    Your account needs to be verified before you can log in. Enter your email below to receive a new verification link.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading || !resendEmail}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {resendLoading ? 'Sending...' : 'Send Verification Email'}
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowResendButton(false);
                      setResendEmail('');
                      setUserEmail('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <Formik
            initialValues={{
              email: '',
              password: '',
              role: role,
            }}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={async ({ email, password, role }, { setSubmitting }) => {
              // Clear any previous resend states
              setShowResendButton(false);
              setUserEmail('');
              setResendEmail('');
              
              // Show loader
              showLoader("Logging in...");
              
              try {
                await dispatch(loginUser({ email, password, role })).unwrap();
                // Login success - the useEffect will handle navigation
              } catch (error) {
                // Error is handled by the useEffect above
                console.error('Login failed:', error);
              } finally {
                // Hide loader and reset form submission state
                hideLoader();
                setSubmitting(false);
              }
            }}
          >
            {({ values, handleChange, handleBlur, isSubmitting }) => (
              <Form className="space-y-4">
                <div className='mb-5'>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    id="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="h-[66px] border border-[#01010121] rounded-[8px] px-5 text-[18px] font-inter bg-[#FFFFFF] text-[#1C1C1C] focus:border-[#222] outline-none transition w-full"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                <div className="relative mb-5">
                  <Field
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    id="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="h-[66px] border border-[#01010121] rounded-[8px] px-5 text-[18px] font-inter bg-[#FFFFFF] text-[#1C1C1C] focus:border-[#222] outline-none transition w-full"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                  <ErrorMessage name="password" component="div" className="absolute text-red-500 text-xs mt-1" />
                </div>

                {/* Options Row */}
                <div className="flex items-center justify-between mt-6 max-[575px]:flex-wrap">
                  <label className="flex items-center text-gray-700 max-[575px]:w-full">
                    <input type="checkbox" className="border border-[#01010121] text-base w-[30px] h-[30px] mr-2 accent-[#01010121] focus:border-[#010101] focus:ring-2 focus:ring-[#01010121]" />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="text-base text-[#1C1C1C] hover:underline max-[575px]:w-full max-[575px]:text-end">
                    Forgot password?
                  </Link>
                </div>

                <div className='w-full flex justify-center'>
                  <button
                    type="submit"
                    className="m-auto w-full max-w-[575px] py-3 px-[50px] text-white rounded-md font-bold text-lg bg-[#000] hover:bg-[linear-gradient(90deg,#306A64_0%,#204D9D_50%,#306A64_100%)] transition-all duration-600 cursor-pointer sm:w-fit sm:py-[20px] sm:px-[78px]"
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? 'Logging in...' : 'LOG IN'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          <div className="text-center mt-4 text-base text-[#1C1C1C]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#1C1C1C] font-bold hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;