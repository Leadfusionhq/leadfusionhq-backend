'use client'

import { Formik, Form, Field, ErrorMessage } from 'formik';
import { FieldAttributes } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axiosWrapper from '@/utils/api';
import { API_URL, LOCATION_API } from '@/utils/apiUrl';
import FormikGoogleAddressInput from '@/components/common/FormikGoogleAddressInput';
import CustomFormikAsyncSelect from '@/components/form/CustomFormikAsyncSelect';
import { StateOption, State } from '@/types/campaign';

const AddNewUser = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);

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
   
  };

  type ApiError = {
    error: boolean;
    message: string;
  };

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
    phoneNumber: Yup.string()
      .required('Phone Number is required')
      .test('is-10-digits', 'Phone number must be exactly 10 digits', (value) => {
        if (!value) return false;
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length === 10;
      })
      .matches(/^\d{10}$/, 'Phone number must contain only digits'),
    address: Yup.object().shape({
      full_address: Yup.string().required('Full address is required'),
      street: Yup.string().required('Street address is required'),
      city: Yup.string().required('City is required'),
      state: Yup.object().nullable().required('State is required'),
      zip_code: Yup.string()
        .required('ZIP code is required')
        .matches(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
    }),

  });

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    try {
      setSubmitting(true);
      
      // Combine firstName and lastName into name
      const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`;

      const submitData = {
        name: fullName,
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
      
      };

      console.log("📤 Submit data:", submitData);

      const response = await axiosWrapper('post', API_URL.ADD_USER, submitData, token ?? undefined) as { message?: string };
      toast.success(response?.message || 'User added successfully!');
      resetForm();
    } catch (err) {
      console.error('Error saving user:', err);
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
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
    <div className="w-full">
      {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
      <Field
        {...props}
        className="h-[48px] border border-[#E0E0E0] rounded-[8px] px-5 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition w-full"
      />
      <div className="min-h-[20px]">
        <ErrorMessage
          name={props.name}
          component="div"
          className="text-red-500 text-xs transition-opacity duration-300"
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto min-h-screen flex flex-col items-center px-4 md:px-0 py-8">
      <h2 className="text-3xl font-semibold text-center mb-6">Add New User</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, touched, errors, setFieldValue }) => (
          <Form className="space-y-6 bg-white p-8 rounded-lg border border-gray-300 shadow-lg max-w-4xl w-full">
            
            {/* First Name and Last Name Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput
                name="firstName"
                autoComplete="off"
                placeholder="First Name"
                label="First Name"
              />
              <FormikInput
                name="lastName"
                autoComplete="off"
                placeholder="Last Name"
                label="Last Name"
              />
            </div>

            {/* Email and Company Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput
                name="email"
                autoComplete="off"
                placeholder="Email Address"
                type="email"
                label="Email"
              />
              <FormikInput
                name="companyName"
                autoComplete="off"
                placeholder="Company Name"
                label="Company"
              />
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput
                name="password"
                autoComplete="off"
                placeholder="Password"
                type="password"
                label="Password"
              />
              <FormikInput
                name="confirmPassword"
                autoComplete="off"
                placeholder="Confirm Password"
                type="password"
                label="Confirm Password"
              />
            </div>

            {/* Phone Number */}
            {/* Phone Number - IMPROVED */}
            <div className="w-full">
              <label className="block text-[#1C1C1C] text-lg mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Field
                name="phoneNumber"
                value={values.phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  let clean = e.target.value.replace(/\D/g, '');
                  
                  // ✅ Block 11th digit entry with non-spammy toast
                  if (clean.length > 10) {
                    clean = clean.slice(0, 10);
                    toast.error('Phone number cannot exceed 10 digits', {
                      toastId: 'phone-limit', // Prevents duplicate toasts
                      autoClose: 2000
                    });
                  }
                  
                  setFieldValue("phoneNumber", clean);
                }}
                placeholder="1234567890"
                maxLength={10} // ✅ HTML-level protection
                className={`h-[48px] border ${
                  touched.phoneNumber && errors.phoneNumber 
                    ? 'border-red-500' 
                    : 'border-[#E0E0E0]'
                } rounded-[8px] px-5 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition w-full`}
              />
              <div className="min-h-[20px] flex items-center justify-between">
                <ErrorMessage 
                  name="phoneNumber" 
                  component="div" 
                  className="text-red-500 text-xs transition-opacity duration-300" 
                />
                {/* ✅ Visual feedback */}
                {/* <span className={`text-xs ${
                  values.phoneNumber.length === 10 
                    ? 'text-green-600' 
                    : values.phoneNumber.length > 0 
                    ? 'text-orange-500' 
                    : 'text-gray-400'
                }`}>
                  {values.phoneNumber.length}/10
                </span> */}
              </div>
            </div>

            {/* Google Address Autocomplete */}
            <div className="w-full">
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

            {/* Address Components: Street and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput
                name="address.street"
                label="Street Address"
                placeholder="Street"
              />
              <FormikInput
                name="address.city"
                label="City"
                placeholder="City"
              />
            </div>

            {/* State and ZIP Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {isLoadingStates ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    <span className="ml-2">Loading states...</span>
                  </div>
                ) : (
                  <CustomFormikAsyncSelect
                    name="address.state"
                    label="State"
                    loadOptions={loadStates}
                    defaultOptions={stateOptions.slice(0, 50)}
                    placeholder="Select State"
                    cacheOptions={true}
                  />
                )}
              </div>

              <FormikInput
                name="address.zip_code"
                label="ZIP Code"
                placeholder="ZIP Code"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-[56px] bg-[#1C1C1C] text-white text-[20px] font-inter font-semibold rounded-[8px] border-none cursor-pointer transition hover:bg-[#000]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding User...' : 'Add User'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddNewUser;