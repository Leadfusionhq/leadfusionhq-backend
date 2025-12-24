// /app/dashboard/settings/components/AddressSection.tsx
'use client'

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL, LOCATION_API } from '@/utils/apiUrl';
import FormikGoogleAddressInput from '@/components/common/FormikGoogleAddressInput';
import CustomFormikAsyncSelect from '@/components/form/CustomFormikAsyncSelect';
import { StateOption, State } from '@/types/campaign';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/auth/authSlice';


// ✅ Define Address interface
interface Address {
  full_address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  coordinates?: { lat: number; lng: number };
  place_id?: string;
}

interface AddressValues {
  full_address: string;
  street: string;
  city: string;
  state: StateOption | null;
  zip_code: string;
  coordinates: { lat: number; lng: number };
  place_id: string;
}

const AddressSection = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setIsLoadingStates(true);
        const response = await axiosWrapper('get', LOCATION_API.GET_STATES, {}) as {
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
        console.error('Failed to load states:', err);
        toast.error('Failed to load states. Please refresh the page.');
      } finally {
        setIsLoadingStates(false);
      }
    };

    fetchStates();
  }, []);

  const validationSchema = Yup.object().shape({
    full_address: Yup.string().required('Full address is required'),
    street: Yup.string().required('Street address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.object().nullable().required('State is required'),
    zip_code: Yup.string()
      .required('ZIP code is required')
      .matches(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
  });

  const getInitialValues = (): AddressValues => {
    // ✅ Type the address properly
    const address: Address = typeof user?.address === 'object' ? user.address : {};


    // Find matching state from options
    let stateValue: StateOption | null = null;
    if (address.state && stateOptions.length > 0) {
      stateValue = stateOptions.find(
        (opt) => opt.abbreviation === address.state || opt.name === address.state
      ) || null;
    }

    return {
      full_address: address.full_address || '',
      street: address.street || '',
      city: address.city || '',
      state: stateValue,
      zip_code: address.zip_code || '',
      coordinates: address.coordinates || { lat: 0, lng: 0 },
      place_id: address.place_id || '',
    };
  };

  const dispatch = useDispatch();

  const handleSubmit = async (values: AddressValues) => {
    setIsLoading(true);
    try {
      // ✅ Fixed: Use USER_API.UPDATE_MY_PROFILE instead of API_URL
      const response = await axiosWrapper(
        'put',
        API_URL.UPDATE_MY_PROFILE,
        {
          address: {
            full_address: values.full_address,
            street: values.street,
            city: values.city,
            state: values.state?.abbreviation || '',
            zip_code: values.zip_code,
            coordinates: values.coordinates,
            place_id: values.place_id,
          },
        },
        token ?? undefined // ✅ token passed correctly
      ) as { user: any; message: string };

      toast.success('Address updated successfully!');
      setIsEditing(false);
      dispatch(setUser(response.user));
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update address');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStates = (inputValue: string) => {
    return new Promise<StateOption[]>((resolve) => {
      if (!inputValue) {
        resolve(stateOptions.slice(0, 50));
      } else {
        const filtered = stateOptions.filter(
          (state) =>
            state.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            state.abbreviation.toLowerCase().includes(inputValue.toLowerCase())
        );
        resolve(filtered);
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📍</span> Address Details
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your location information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl font-medium transition-all duration-200 text-sm ${isEditing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white hover:shadow-lg'
            }`}
        >
          {isEditing ? '✕ Cancel' : '✏️ Edit'}
        </button>
      </div>

      <Formik
        initialValues={getInitialValues()}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form className="space-y-6">

            {/* ✅ Only show Smart Address Lookup when editing */}
            {isEditing && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-blue-500 text-white p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Address Lookup</h3>
                    <p className="text-sm text-gray-600">Start typing to search and auto-fill your address</p>
                  </div>
                </div>

                <FormikGoogleAddressInput
                  name="full_address"
                  placeholder="Start typing your address..."
                  errorMessage={touched.full_address ? errors.full_address : undefined}
                  showCurrentLocation={true}
                  disabled={!isEditing}
                  autoFillFields={{
                    street: 'street',
                    city: 'city',
                    state: 'state',
                    zipCode: 'zip_code',
                    coordinates: 'coordinates',
                    placeId: 'place_id',
                  }}
                  onAddressSelect={(addressData) => {
                    if (!isEditing) return; // ✅ Prevent unwanted auto updates

                    if (addressData) {
                      const selectedState = stateOptions.find(
                        (state) =>
                          state.abbreviation === addressData.addressComponents.state ||
                          state.name.toLowerCase() === addressData.addressComponents.state?.toLowerCase()
                      );

                      if (selectedState) setFieldValue('state', selectedState);
                      if (addressData.coordinates) setFieldValue('coordinates', addressData.coordinates);
                      if (addressData.placeId) setFieldValue('place_id', addressData.placeId);
                    }
                  }}
                />
              </div>
            )}




            {/* Address Details Grid */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-6">
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-4">Address Components</h3>

              {/* Street Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <Field
                  name="street"
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${isEditing
                      ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                      : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                    }`}
                  placeholder="123 Main Street"
                />
                <ErrorMessage name="street" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              {/* City and State Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="city"
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${isEditing
                        ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                      }`}
                    placeholder="Los Angeles"
                  />
                  <ErrorMessage name="city" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  {isLoadingStates ? (
                    <div className="flex items-center justify-center p-4 bg-white border border-gray-300 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading states...</span>
                    </div>
                  ) : (
                    <CustomFormikAsyncSelect
                      name="state"
                      loadOptions={loadStates}
                      defaultOptions={stateOptions.slice(0, 50)}
                      placeholder="Select State"
                      cacheOptions={true}
                      isDisabled={!isEditing}
                    />
                  )}
                  <ErrorMessage name="state" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>

              {/* ZIP Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="zip_code"
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${isEditing
                        ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                      }`}
                    placeholder="90001"
                  />
                  <ErrorMessage name="zip_code" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Country (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value="United States"
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-100 rounded-lg cursor-not-allowed text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Currently limited to US addresses</p>
                </div>
              </div>

              {/* Coordinates Display (if available) */}
              {values.coordinates?.lat !== 0 && values.coordinates?.lng !== 0 && (
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">GPS Coordinates Captured</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Lat: {values.coordinates.lat.toFixed(6)}, Lng: {values.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            {isEditing && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    '💾 Save Address'
                  )}
                </button>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddressSection;