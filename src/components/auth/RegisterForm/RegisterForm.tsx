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
import FormikGoogleAddressInput from '@/components/common/FormikGoogleAddressInput';
import CustomFormikAsyncSelect from '@/components/form/CustomFormikAsyncSelect';
import { StateOption } from '@/types/campaign';
import axiosWrapper from "@/utils/api";
import { LOCATION_API } from "@/utils/apiUrl";
import { State } from "@/types/campaign";

const RegisterForm = () => {
  const dispatch: AppDispatch = useDispatch();
  const { loading, error, success, message } = useSelector((state: RootState) => state.auth);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const router = useRouter();

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setIsLoadingStates(true);
        const response = await axiosWrapper("get", LOCATION_API.GET_STATES, {}) as {
          data: State[];
        };

        if (response?.data) {
          const options = response.data.map((state) => ({
            label: `${state.name} (${state.abbreviation})`,
            value: state._id,
            name: state.name,
            abbreviation: state.abbreviation,
          }));
          
          setStateOptions(options);
        }
      } catch (err) {
        console.error("Failed to load states:", err);
        toast.error("Failed to load states. Please refresh the page.");
      } finally {
        setIsLoadingStates(false);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    if (success && message) {
      toast.dismiss();
      toast.success(message);
      dispatch(clearSuccess());
      router.push('/login');
    }
  }, [success, message, dispatch, router]);

  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ✅ Updated initial values with firstName and lastName
  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: '',
    address: {
      full_address: '',
      street: '',
      city: '',
      state: null as StateOption | null,
      zip_code: '',
      coordinates: { lat: 0, lng: 0 },
      place_id: ''
    },
    terms: false,
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTermsModalOpen(true);
  };

  // ✅ Updated validation schema
  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: Yup.string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm Password is required'),
    companyName: Yup.string().required('Company Name is required'),
    phoneNumber: Yup.string().required('Phone Number is required'),
    address: Yup.object().shape({
      full_address: Yup.string().required('Full address is required'),
      street: Yup.string().required('Street address is required'),
      city: Yup.string().required('City is required'),
      state: Yup.object().nullable().required('State is required'),
      zip_code: Yup.string()
        .required('ZIP code is required')
        .matches(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
    }),
    terms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
  });

  // ✅ Updated handleSubmit - combines firstName and lastName into name
  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    // ✅ Combine firstName and lastName into name
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`;

    const submitData = {
      name: fullName, // ✅ Combined name
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      companyName: values.companyName,
      phoneNumber: values.phoneNumber,
      address: {
        full_address: values.address.full_address,
        street: values.address.street,
        city: values.address.city,
        state: values.address.state?.abbreviation || '',
        zip_code: values.address.zip_code,
        coordinates: values.address.coordinates,
        place_id: values.address.place_id
      },
      terms: values.terms
    };

    console.log("📤 Submit data with combined name:", submitData);
    
    dispatch(registerUser(submitData));
    setSubmitting(false);
    resetForm();
  };

  // Load states function for AsyncSelect
  const loadStates = (inputValue: string) => {
    return new Promise<StateOption[]>((resolve) => {
      if (!inputValue) {
        resolve(stateOptions.slice(0, 50));
      } else {
        const filtered = stateOptions.filter(
          state =>
            state.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            state.abbreviation.toLowerCase().includes(inputValue.toLowerCase())
        );
        resolve(filtered);
      }
    });
  };

  // Custom Formik-compatible Input
  const FormikInput = ({ label, ...props }: { label?: string } & FieldAttributes<any>) => (
    <div className="w-full mb-2">
      {label && <label className="block text-[#1C1C1C] text-sm mb-1 font-medium">{label}</label>}
      <Field
        {...props}
        className="h-[66px] border border-[#E0E0E0] rounded-[8px] px-5 text-[16px] font-inter bg-[#FFFFFF] text-[#1C1C1C] placeholder-[#999] focus:border-[#222] outline-none transition w-full"
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
                <h1 className="lg: max-w-[550px] [letter-spacing:0.1em] font-bold text-[#000000] font-[Times_New_Roman] text-[54px] leading-[100%] tracking-[0.01em] text-center uppercase">
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
                  {({ isSubmitting, values, touched, errors, setFieldValue }) => (
                    <Form className="max-w-[571px] rounded-[12px] p-0 mt-8 flex flex-col gap-4">
                      
                      {/* ✅ First Name and Last Name Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormikInput
                          name="firstName"
                          placeholder="First Name *"
                        />
                        <FormikInput
                          name="lastName"
                          placeholder="Last Name *"
                        />
                      </div>
                      
                      <FormikInput
                        name="email"
                        placeholder="Email Address *"
                        type="email"
                      />
                      
                      <FormikInput
                        name="password"
                        placeholder="Password *"
                        type="password"
                      />
                      
                      <FormikInput
                        name="confirmPassword"
                        placeholder="Confirm Password *"
                        type="password"
                      />
                      
                      <FormikInput
                        name="companyName"
                        placeholder="Company Name *"
                      />
                      
                      <FormikInput
                        name="phoneNumber"
                        placeholder="Phone Number *"
                      />

                      {/* Google Address Autocomplete */}
                      <div className="w-full mb-2">
                        <FormikGoogleAddressInput
                          name="address.full_address"
                          label="Full Address *"
                          placeholder="Start typing your address..."
                          errorMessage={
                            touched?.address?.full_address ? errors?.address?.full_address : undefined
                          }
                          showCurrentLocation={true}
                          autoFillFields={{
                            street: 'address.street',
                            city: 'address.city',
                            state: 'address.state',
                            zipCode: 'address.zip_code',
                            coordinates: 'address.coordinates',
                            placeId: 'address.place_id'
                          }}
                          onAddressSelect={(addressData) => {
                            if (addressData) {
                              const selectedState = stateOptions.find(
                                state => state.abbreviation === addressData.addressComponents.state ||
                                         state.name.toLowerCase() === addressData.addressComponents.state?.toLowerCase()
                              );
                              
                              if (selectedState) {
                                setFieldValue('address.state', selectedState);
                              }
                              
                              if (addressData.coordinates) {
                                setFieldValue('address.coordinates', addressData.coordinates);
                              }
                              
                              if (addressData.placeId) {
                                setFieldValue('address.place_id', addressData.placeId);
                              }
                            }
                          }}
                        />
                      </div>

                      {/* Address Components Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-0">
                        <FormikInput
                          name="address.street"
                          label="Street Address *"
                          placeholder="Street"
                        />
                        <FormikInput
                          name="address.city"
                          label="City *"
                          placeholder="City"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-0">
                        <div>
                          {isLoadingStates ? (
                            <div className="flex items-center justify-center p-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                              <span className="ml-2">Loading states...</span>
                            </div>
                          ) : (
                            <CustomFormikAsyncSelect
                              name="address.state"
                              label="State *"
                              loadOptions={loadStates}
                              defaultOptions={stateOptions.slice(0, 50)}
                              placeholder="State"
                              cacheOptions={true}
                            />
                          )}
                        </div>

                        <FormikInput
                          name="address.zip_code"
                          label="ZIP Code *"
                          placeholder="ZIP Code"
                        />
                      </div>

                      {/* Debug Section */}
                      {/* {(values.address?.coordinates?.lat || values.address?.place_id) && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                          <div className="font-semibold text-blue-800 mb-1">📍 Google Data Captured</div>
                          {values.address?.coordinates?.lat && (
                            <div className="text-blue-600">
                              Coordinates: {values.address.coordinates.lat.toFixed(6)}, {values.address.coordinates.lng.toFixed(6)}
                            </div>
                          )}
                          {values.address?.place_id && (
                            <div className="text-blue-600 break-all">
                              Place ID: {values.address.place_id}
                            </div>
                          )}
                        </div> )}            */}
                               {/* Terms and Conditions */}
                  <div className="flex items-start gap-2 mt-2 w-full max-w-[520px]">
                    <Field
                      type="checkbox"
                      name="terms"
                      id="terms"
                      className="mt-0 border border-[#01010121] text-base w-[33px] h-[33px] accent-[#01010121] focus:border-[#010101] focus:ring-[#01010121]"
                    />
                    <label htmlFor="terms" className="text-[14px] text-xs text-gray-500 leading-[1.7]">
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

                  {/* Submit Button */}
                  <div className='outr_sbmit mt-10 w-full flex justify-center'>
                    <button
                      type="submit"
                      className="m-auto w-full max-w-[575px] py-3 px-[50px] text-white rounded-md font-bold text-lg bg-[#000] hover:bg-[linear-gradient(90deg,#306A64_0%,#204D9D_50%,#306A64_100%)] transition-all duration-600 cursor-pointer sm:w-fit sm:py-[18px] sm:px-[68px]"
                      disabled={isSubmitting || loading}
                    >
                      {isSubmitting || loading ? 'Signing Up...' : 'SIGN UP'}
                    </button>
                  </div>

                  <p className="text-[16px] text-center text-xs text-gray-500 mt-2">
                    Already have an account? <Link href="/login" className="text-black underline">Sign In</Link>
                  </p>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* Right: Side Image */}
        <div className="flex items-start justify-center py-8 md:py-0 pt-0">
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

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        open={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        showAcceptButton={false}
      />
    </div>
  </div>
</div>);
};

export default RegisterForm;