"use client";

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL, LOCATION_API } from '@/utils/apiUrl';
import FormikGoogleAddressInput from '@/components/common/FormikGoogleAddressInput';
import CustomFormikAsyncSelect from '@/components/form/CustomFormikAsyncSelect';
import { StateOption, State } from '@/types/campaign';
import { setUser } from '@/redux/auth/authSlice';
import { MapPin, Check, X, Edit2 } from 'lucide-react';

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

const AddressSettings = () => {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
    const [isLoadingStates, setIsLoadingStates] = useState(true);
    const dispatch = useDispatch();

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

    const handleSubmit = async (values: AddressValues) => {
        setIsLoading(true);
        try {
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
                token ?? undefined
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 md:px-8 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#306A64]" />
                        Address Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your location information</p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isEditing
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                        }`}
                >
                    {isEditing ? (
                        <>
                            <X className="w-4 h-4" /> Cancel
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-4 h-4" /> Edit
                        </>
                    )}
                </button>
            </div>

            <Formik
                initialValues={getInitialValues()}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue }) => (
                    <Form className="p-6 md:p-8 space-y-6">

                        {/* Smart Address Lookup */}
                        {isEditing && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="bg-blue-500 text-white p-2 rounded-lg">
                                        <MapPin className="w-5 h-5" />
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
                                        if (!isEditing) return;

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {/* Street Address */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Street Address <span className="text-red-500">*</span>
                                </label>
                                <Field
                                    name="street"
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${isEditing
                                            ? 'bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                                            : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500'
                                        }`}
                                    placeholder="123 Main Street"
                                />
                                <ErrorMessage name="street" component="div" className="text-red-500 text-xs mt-1" />
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <Field
                                    name="city"
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${isEditing
                                            ? 'bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                                            : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500'
                                        }`}
                                    placeholder="Los Angeles"
                                />
                                <ErrorMessage name="city" component="div" className="text-red-500 text-xs mt-1" />
                            </div>

                            {/* State */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    State <span className="text-red-500">*</span>
                                </label>
                                {isLoadingStates ? (
                                    <div className="flex items-center justify-center p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                        <span className="ml-2 text-sm text-gray-500">Loading...</span>
                                    </div>
                                ) : (
                                    <div className={!isEditing ? "pointer-events-none opacity-80" : ""}>
                                        <CustomFormikAsyncSelect
                                            name="state"
                                            loadOptions={loadStates}
                                            defaultOptions={stateOptions.slice(0, 50)}
                                            placeholder="Select State"
                                            cacheOptions={true}
                                            isDisabled={!isEditing}
                                        />
                                    </div>
                                )}
                                <ErrorMessage name="state" component="div" className="text-red-500 text-xs mt-1" />
                            </div>

                            {/* ZIP Code */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    ZIP Code <span className="text-red-500">*</span>
                                </label>
                                <Field
                                    name="zip_code"
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${isEditing
                                            ? 'bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                                            : 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500'
                                        }`}
                                    placeholder="90001"
                                />
                                <ErrorMessage name="zip_code" component="div" className="text-red-500 text-xs mt-1" />
                            </div>

                            {/* Country */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    value="United States"
                                    disabled
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        {isEditing && (
                            <div className="pt-6 border-t border-gray-100 flex items-center justify-end animate-in slide-in-from-top-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-2.5 bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" /> Save Address
                                        </>
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

export default AddressSettings;
