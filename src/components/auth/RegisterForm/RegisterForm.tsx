'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { FieldAttributes } from 'formik';

import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { registerUser } from '@/redux/auth/authActions';
import { RootState, AppDispatch } from '@/redux/store';
import { clearError, clearSuccess } from '@/redux/auth/authSlice';
import TermsAndConditionsModal from '@/components/common/TermsAndConditionsModal';

const RegisterForm = () => {
  const dispatch: AppDispatch = useDispatch();
  const { loading, error, success, message } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    if (success && message) {
      toast.dismiss();
      toast.success(message);
      dispatch(clearSuccess());
      router.push('/login');
    }
  }, [success, message, dispatch]);

  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error(error);
      dispatch(clearError()); // Clear error state after showing toast
    }
  }, [error, dispatch]);

  const initialValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: '',
    terms: false,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm Password is required'),
    companyName: Yup.string().required('Company Name is required'),
    phoneNumber: Yup.string().required('Phone Number is required'),
    terms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
  });

  const handleSubmit = async (values: typeof initialValues, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }) => {
    dispatch(registerUser(values));
    setSubmitting(false);
    resetForm();
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTermsModalOpen(true);
  };

  // Custom Formik-compatible Input
  const FormikInput = ({ label, ...props }: { label?: string } & FieldAttributes<string>) => (
    <div className="w-full mb-2">
      <Field
        {...props}
        className="h-[66px] border border-[#01010121] rounded-[8px] px-5 text-[18px] font-inter bg-[#FFFFFF] text-[#1C1C1C] focus:border-[#222] outline-none transition w-full"
      />
      <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs mt-1" />
    </div>
  );

  return (
    <div className="reigster_box bg-[url('/images/log_bg.png')] bg-cover bg-no-repeat min-h-screen ">
      <div className='outer_register p-[20px] sm:p-[10px] md:p-[40px] lg:py-[50px] lg:px-[50px]'>
        <div className="register-container container sm:p-[0px] mx-auto min-h-screen flex flex-col px-4 md:px-0  ">
          {/* Centered Logo Above Grid */}
          <div className="flex justify-center items-center w-full">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={167}
              height={167}
              className="rounded-full w-[167px] h-[167px] max-[991px]:w-[120px] max-[991px]:h-[120px] max-[575px]:w-[80px] max-[575px]:h-[80px] "
              priority
            />
          </div>
          
          {/* Grid: Form and Side Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center flex-1 w-full  mt-[10px] lg:mt-11.5">
            {/* Left: Form Section */}
            <div className="outer_inputrsgt lg:mb-8 sm:mb-1">
              <div className="mb-2   max-lg:pr-0  flex flex-col justify-start items-center mt-2 py-8 md:py-0 pt-0  pr-10">
                {/* Title */}
                <h1 className=" lg: max-w-[550px] [letter-spacing:0.1em] font-bold text-[#000000] font-[Times_New_Roman] text-[54px] leading-[100%] tracking-[0.01em] text-center uppercase">
                  Sign Up to Get Qualified Leads Today!
                </h1>
                
                {/* Subtitle */}
                <p className="font-inter font-normal text-[18px] leading-[28px] text-center mt-4 text-[#222] m-auto max-w-[600px]">
                  Create your account to start using Lead Manager—organize, track, and grow your leads with ease from one simple dashboard.
                </p>
                
                {/* Formik Form */}
                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form className="max-w-[571px]  rounded-[12px] p-0 mt-8  flex flex-col gap-4">
                      <FormikInput
                        name="name"
                        placeholder="Name"
                        className="w-full p-5 border border-[#E0E0E0] rounded-lg
                        placeholder-[#999] placeholder-opacity-100
                        focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />
                      <FormikInput
                        name="email"
                        placeholder="Email Address"
                        type="email"
                        className="w-full p-5 border border-[#E0E0E0] rounded-lg
                        placeholder-[#999] placeholder-opacity-100
                        focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />
                      <FormikInput
                        name="password"
                        placeholder="Password"
                        type="password"
                        className="w-full p-5 border border-[#E0E0E0] rounded-lg
                        placeholder-[#999] placeholder-opacity-100
                        focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />
                      <FormikInput
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        type="password"
                        className="w-full p-5 border border-[#E0E0E0] rounded-lg
                        placeholder-[#999] placeholder-opacity-100
                        focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />
                      <FormikInput
                        name="companyName"
                        placeholder="Company Name"
                        className="w-full p-5 border border-[#E0E0E0] rounded-lg
                        placeholder-[#999] placeholder-opacity-100
                        focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />
                      <FormikInput
                        name="phoneNumber"
                        placeholder="Phone Number"
                        className="w-full p-5 border border-[#E0E0E0] rounded-lg
                        placeholder-[#999] placeholder-opacity-100
                        focus:placeholder-[#1C1C1C] focus:border-[#1C1C1C]
                          transition-colors duration-200"
                      />

                      <div className="flex items-start gap-2 mt-2 w-full max-w-[520px]">
                        <Field
                          type="checkbox"
                          name="terms"
                          id="terms"
                          className="mt-0 border border-[#01010121] text-base w-[33px] h-[33px] accent-[#01010121]
                         focus:border-[#010101]  focus:ring-[#01010121]"
                        />
                        <label htmlFor="terms" className=" text-[14px] text-xs text-gray-500 leading-[1.7]">
                          I agree to the{' '}
                          <button 
                            type="button"
                            onClick={handleTermsClick}
                            className="text-black underline hover:text-[#306A64] transition-colors duration-200"
                          >
                            terms and conditions
                          </button>
                          . <br />
                          By clicking &quot;Sign Up&quot;, I certify under penalty of perjury that the information I have provided on this form is true and correct.
                        </label>
                      </div>
                      <ErrorMessage name="terms" component="div" className="text-red-500 text-xs mt-1" />
                      
                      <div className='outr_sbmit mt-10 w-full flex justify-center '>
                        <button
                          type="submit"
                          className=" m-auto w-full max-w-[575px] py-3 px-[50px] text-white rounded-md font-bold text-lg bg-[#000] hover:bg-[linear-gradient(90deg,#306A64_0%,#204D9D_50%,#306A64_100%)] transition-all duration-600 cursor-pointer sm:w-fit sm:py-[18px] sm:px-[68px]"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting || loading ? 'Signing Up...' : 'SIGN UP'}
                        </button>
                      </div>
                      
                      <p className="text-[16px] text-center text-xs text-gray-500 mt-2">
                        Already have an account?{' '}
                        <Link href="/login" className="text-black underline text-[16px] text-center text-xs text-black-600">
                          Sign In
                        </Link>
                      </p>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
            
            {/* Right: Side Image */}
            <div className="flex items-start justify-center py-8 md:py-0 pt-0 ">
              <div className="flex justify-center items-start w-full h-full">
                <Image
                  src="/images/register/side-image-placeholder.png"
                  alt="Event"
                  width={779}
                  height={100}
                  className="w-full h-auto object-cover rounded-[25px]"
                  priority={false}
                  sizes="100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        open={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        showAcceptButton={false}
      />
    </div>
  );
};

export default RegisterForm;