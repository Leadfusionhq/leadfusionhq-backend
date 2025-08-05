'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';
import Link from 'next/link';
import Image from 'next/image';

const VerifyOtpPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get('email') || '';

  const initialValues = { otp: '', email };

  const validationSchema = Yup.object().shape({
    otp: Yup.string().required('OTP is required'),
    email: Yup.string().email().required(),
  });

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (val: boolean) => void }
  ) => {
    try {
      const response = await axiosWrapper('put', API_URL.VERIFY_OTP, values) as {
        resetToken?: string;
        message?: string;
      };
      console.warn('response',response)
      if (response?.resetToken) {
        toast.success(response?.message || 'OTP verified. Please reset your password.');
        router.push(`/reset-password?token=${response.resetToken}`);
      } else {
        toast.error('OTP verification failed.');
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      toast.error('Invalid or expired OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/images/log_bg.png')] bg-cover bg-center bg-no-repeat">
      <div className="w-full max-w-[760px] p-5 mx-[150px] my-[50px] md:my-[75px] lg:my-[150px]">
        
        {/* Logo Header */}
        <div className="relative flex flex-col items-center rounded-t-3xl bg-gradient-to-r from-[#204D9D] via-[#306A64] to-[#204D9D]">
          <div className="flex flex-col items-center -mt-20">
            <div className="bg-black rounded-full shadow-md mb-2">
              <div className="rounded-full w-[90px] h-[90px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] xl:w-[200px] xl:h-[200px]"> 
                <Image
                  src="/images/logo.svg"
                  alt="Firm Foundations Marketing"
                  width={100}
                  height={100}
                  className="rounded-full w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white w-full rounded-b-3xl shadow-md p-6 sm:p-8">
          <h1 className="text-black font-semibold text-center uppercase text-sm sm:text-base mb-2">
            Verify OTP
          </h1>
          <p className="text-[#1C1C1C] text-center mb-6 text-[18px] leading-7 max-w-[520px] mx-auto">
            Enter the OTP sent to <span className="font-medium">{email}</span>
          </p>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <Field
                  type="text"
                  name="otp"
                  placeholder="Enter OTP"
                  className="h-[66px] border border-[#01010121] rounded-[8px] px-5 text-[18px] font-inter bg-white text-[#1C1C1C] focus:border-[#222] outline-none transition w-full"
                />
                <ErrorMessage name="otp" component="div" className="text-red-500 text-sm" />

            
                <div className="w-full flex justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="uppercase w-full max-w-[575px] py-3 px-[50px] text-white rounded-md font-bold text-lg bg-black hover:bg-gradient-to-r from-[#306A64] via-[#204D9D] to-[#306A64] transition-all duration-600 cursor-pointer sm:w-fit sm:py-[20px] sm:px-[78px]"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          <div className="text-center mt-4 text-base text-[#1C1C1C]">
            Remembered your password?{' '}
            <Link href="/login" className="font-bold hover:underline">
              Go Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
