'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { FieldAttributes } from 'formik';

import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { registerUser } from '@/redux/auth/authActions';
import { RootState, AppDispatch } from '@/redux/store';
import { clearError, clearSuccess } from '@/redux/auth/authSlice';

const RegisterForm = () => {
  const dispatch: AppDispatch = useDispatch();
  const { loading, error, success, message } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const formikRef = useRef<any>(null);

  // Handle successful registration
  useEffect(() => {
    if (success && message) {
      toast.dismiss();
      toast.success(message);
      dispatch(clearSuccess());
      // Only reset form on successful registration
      if (formikRef.current) {
        formikRef.current.resetForm();
      }
      // Navigate to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  }, [success, message, dispatch, router]);

  // Handle registration errors
  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error(error);
      dispatch(clearError());
      // Don't clear form on error - keep user data intact
    }
  }, [error, dispatch]);

  const initialValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: '',
    zipCode: '',
    terms: false,
  };

  const phoneRegExp = /^[0-9]{10,15}$/;
  const zipCodeRegExp = /^[0-9]{4,10}$/;
  const passwordRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .required('Full name is required'),

    email: Yup.string()
      .trim()
      .email('Please enter a valid email address')
      .required('Email is required'),

    password: Yup.string()
      .matches(
        passwordRegExp,
        'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
      )
      .required('Password is required'),

    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords do not match')
      .required('Please confirm your password'),

    companyName: Yup.string()
      .trim()
      .min(2, 'Company name must be at least 2 characters')
      .required('Company name is required'),

    phoneNumber: Yup.string()
      .trim()
      .matches(phoneRegExp, 'Phone number must be 10 to 15 digits')
      .required('Phone number is required'),

    zipCode: Yup.string()
      .trim()
      .matches(zipCodeRegExp, 'Zip code must be 4 to 10 digits')
      .required('Zip code is required'),

    terms: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions')
  });

  const handleSubmit = async (
    values: typeof initialValues, 
    { setSubmitting }: { 
      setSubmitting: (isSubmitting: boolean) => void;
    }
  ) => {
    try {
      // Clear any previous toasts
      toast.dismiss();
      
      // Remove confirmPassword from the data sent to backend
      const { confirmPassword, terms, ...registrationData } = values;
      
      // Dispatch the registration action with clean data
      await dispatch(registerUser(registrationData));
      
    } catch (error) {
      console.error('Registration error msg:', error);
      // Error handling is done in useEffect through Redux state
    } finally {
      setSubmitting(false);
    }
  };

  // Custom Formik-compatible Input
  const FormikInput = ({ 
    label, 
    ...props 
  }: { 
    label?: string 
  } & FieldAttributes<string>) => (
    <div className="w-full mb-2">
      <Field
        {...props}
        className="h-[66px] border border-[#01010121] rounded-[8px] px-5 text-[18px] font-inter bg-[#FFFFFF] text-[#1C1C1C] focus:border-[#222] outline-none transition w-full"
      />
      <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs mt-1" />
    </div>
  );

  return (
    <div className="reigster_box bg-[url('/images/log_bg.png')] bg-cover bg-no-repeat min-h-screen">
      <div className='outer_register p-[20px] sm:p-[10px] md:p-[40px] lg:py-[50px] lg:px-[50px]'>
        <div className="register-container container sm:p-[0px] mx-auto min-h-screen flex flex-col px-4 md:px-0">
          {/* Centered Logo Above Grid */}
          <div className="flex justify-center items-center w-full">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={167}
              height={167}
              className="rounded-full w-[167px] h-[167px] max-[991px]:w-[120px] max-[991px]:h-[120px] max-[575px]:w-[80px] max-[575px]:h-[80px]"
              priority
            />
          </div>

          {/* Grid: Form and Side Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center flex-1 w-full mt-[10px] lg:mt-11.5">
            {/* Left: Form Section */}
            <div className="outer_inputrsgt lg:mb-8 sm:mb-1">
              <div className="mb-2 max-lg:pr-0 flex flex-col justify-start items-center mt-2 py-8 md:py-0 pt-0 pr-10">
                {/* Title */}
                <h1 className="max-w-[550px] font-bold text-[#000000] font-[Times_New_Roman] text-[54px] leading-[100%] tracking-[0.01em] text-center uppercase max-[991px]:text-[42px] max-[575px]:text-[32px]">
                  Sign Up to Get Qualified Leads Today!
                </h1>

                {/* Subtitle */}
                <p className="font-inter font-normal text-[18px] leading-[28px] text-center mt-4 text-[#222] m-auto max-w-[600px] max-[575px]:text-[16px]">
                  Create your account to start using Lead Manager—organize, track, and grow your leads with ease from one simple dashboard.
                </p>

                {/* Formik Form */}
                <Formik
                  innerRef={formikRef}
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                  enableReinitialize={false}
                >
                  {({ isSubmitting }) => (
                    <Form className="max-w-[571px] rounded-[12px] p-0 mt-8 flex flex-col gap-4 w-full">
                      <FormikInput
                        name="name"
                        placeholder="Full Name"
                        className="w-full h-[66px] p-5 border border-[#E0E0E0] rounded-lg
                          placeholder-[#999] placeholder-opacity-100
                          focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <FormikInput
                        name="email"
                        placeholder="Email Address"
                        type="email"
                        className="w-full h-[66px] p-5 border border-[#E0E0E0] rounded-lg
                          placeholder-[#999] placeholder-opacity-100
                          focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <FormikInput
                        name="password"
                        placeholder="Password"
                        type="password"
                        className="w-full h-[66px] p-5 border border-[#E0E0E0] rounded-lg
                          placeholder-[#999] placeholder-opacity-100
                          focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <FormikInput
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        type="password"
                        className="w-full h-[66px] p-5 border border-[#E0E0E0] rounded-lg
                          placeholder-[#999] placeholder-opacity-100
                          focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <FormikInput
                        name="companyName"
                        placeholder="Company Name"
                        className="w-full h-[66px] p-5 border border-[#E0E0E0] rounded-lg
                          placeholder-[#999] placeholder-opacity-100
                          focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <FormikInput
                        name="phoneNumber"
                        placeholder="Phone Number"
                        className="w-full h-[66px] p-5 border border-[#E0E0E0] rounded-lg
                          placeholder-[#999] placeholder-opacity-100
                          focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <FormikInput
                        name="zipCode"
                        placeholder="Zip Code"
                        className="w-full h-[66px] p-5 border border-[#E0E0E0] rounded-lg
                          placeholder-[#999] placeholder-opacity-100
                          focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <div className="flex items-start gap-3 mt-2 w-full">
                        <Field
                          type="checkbox"
                          name="terms"
                          id="terms"
                          className="mt-1 w-5 h-5 accent-black border border-gray-300 rounded
                            focus:ring-2 focus:ring-black focus:ring-offset-0"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                          I agree to the terms and conditions. <br />
                          By clicking &quot;Sign Up&quot;, I certify under penalty of perjury that the information I have provided on this form is true and correct.
                        </label>
                      </div>
                      <ErrorMessage name="terms" component="div" className="text-red-500 text-xs mt-1" />

                      <div className='mt-6 w-full flex justify-center'>
                        <button
                          type="submit"
                          className="w-full max-w-[575px] py-4 px-8 text-white rounded-md font-bold text-lg 
                            bg-black hover:bg-gradient-to-r hover:from-[#306A64] hover:via-[#204D9D] hover:to-[#306A64] 
                            transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                            sm:w-auto sm:px-16"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting || loading ? 'SIGNING UP...' : 'SIGN UP'}
                        </button>
                      </div>

                      <p className="text-center text-sm text-gray-500 mt-4">
                        Already have an account? 
                        <Link href="/login" className="text-black underline font-medium ml-1 hover:text-gray-700">
                          Sign In
                        </Link>
                      </p>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>

            {/* Right: Side Image */}
            <div className="flex items-start justify-center py-8 md:py-0">
              <div className="flex justify-center items-start w-full h-full">
                <Image
                  src="/images/register/side-image-placeholder.png"
                  alt="Registration illustration"
                  width={779}
                  height={500}
                  className="w-full h-auto object-cover rounded-[25px] max-w-[600px]"
                  priority={false}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;