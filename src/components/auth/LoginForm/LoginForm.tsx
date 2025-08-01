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

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'Admin' | 'User'>('Admin');
  const [showResendButton, setShowResendButton] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); 

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
      setRole('Admin');
    } 
    if (pathname === '/login') {
      setRole('User');
    } 
  }, [pathname]);

  useEffect(() => {
    if (user) {
      console.warn('user',user)
      toast.dismiss();
      toast.success('Login successful!');
      if (user.role === 'Admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

 useEffect(() => {
  // Handle login error - enhanced for verification cases
  if (error) {
    console.log('Error type:', typeof error);
    console.log('Error value:', error);
    console.log('Has code property?', error && typeof error === 'object' && 'code' in error);
    
    toast.dismiss();
    
    // Check if error is verification related
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.log('Processing verification error:', error);
      
      if (error.code === 'VERIFICATION_EXPIRED') {
        setShowResendButton(true);
        console.log('Setting user email:', error.email);
        setUserEmail(error.email || '');
        toast.error('Your verification link expired. Click below to get a new one.');
      } else if (error.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please check your email and verify your account first.');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } else {
      // Handle regular string errors
      const errorMessage = typeof error === 'string' ? error : 'Login failed';
      console.log('Processing string error:', errorMessage);
      toast.error(errorMessage);
    }
    
    // Clear error state after a delay
    setTimeout(() => {
      dispatch(clearError());
    }, 3000);
  }
}, [error, dispatch]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('New verification email sent! Check your inbox.');
        setShowResendButton(false);
        setUserEmail('');
      } else {
        toast.error(data.error || 'Failed to resend email. Try again.');
      }
    } catch (error) {
      toast.error('Failed to resend email. Try again.');
    } finally {
      setResendLoading(false);
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
                  ${role === 'Admin' ? 'bg-white text-black border-white' : 'bg-transparent border text-white'}`}>
                Login as Admin
              </button>
            </Link>
            <Link href="/login" passHref>
              <button type="button"
                className={`cursor-pointer px-7.5 py-3.5 rounded-full font-medium text-xs max-[575px]:w-full
                  ${role === 'User' ? 'bg-white text-black border-white' : 'bg-transparent border text-white'}`}>
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

          {/* Email Verification Resend Section */}
          {showResendButton && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Email Verification Required</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your verification link has expired. Get a new one sent to: <strong>{userEmail}</strong>
                  </p>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-[200px] bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? 'Sending...' : 'Resend Email'}
                </button>
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
            onSubmit={({ email, password, role }, { setSubmitting }) => {
              // Clear any previous resend states
              setShowResendButton(false);
              setUserEmail('');
              
              const data = dispatch(loginUser({ email, password, role })).finally(() => setSubmitting(false));
              console.warn('data',data)
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