// /app/dashboard/settings/components/BasicInformationSection.tsx
'use client'

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/auth/authSlice';

interface BasicInfoValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
}

const BasicInformationSection = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: Yup.string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email')
      .required('Email is required'),
    phoneNumber: Yup.string()
      .required('Phone number is required'),
    companyName: Yup.string()
      .required('Company name is required'),
  });

  // Split name into firstName and lastName
  const getInitialValues = (): BasicInfoValues => {
    const nameParts = user?.name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      firstName,
      lastName,
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      companyName: user?.companyName || '',
    };
  };
  const dispatch = useDispatch();
  const handleSubmit = async (values: BasicInfoValues) => {
    setIsLoading(true);
    try {
      const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`;
      
      // ✅ Fixed: Use UPDATE_MY_PROFILE instead of UPDATE_PROFILE
      const response = await axiosWrapper(
        'put',
        API_URL.UPDATE_MY_PROFILE,
        {
          name: fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          companyName: values.companyName,
        },
        token ?? undefined
      )as { user: any; message: string };
      console.log('✅ API Response:', response);
      console.log('👤 Updated User:', response.user);
  
      toast.success(response.message || 'Profile updated successfully!');
      setIsEditing(false);
  
      // ✅ Use correct field — no `.data`
      dispatch(setUser(response.user));
  
      // Optionally dispatch Redux action to update user in store
      // dispatch(updateUserInfo(response.data.user));
      
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>👤</span> Basic Information
          </h2>
          <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isEditing
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
        {({ values, errors, touched }) => (
          <Form className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Field
                  name="firstName"
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  placeholder="Enter first name"
                />
                <ErrorMessage name="firstName" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Field
                  name="lastName"
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  placeholder="Enter last name"
                />
                <ErrorMessage name="lastName" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Field
                  name="email"
                  type="email"
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  placeholder="your.email@example.com"
                />
                {user?.isEmailVerified && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm flex items-center gap-1">
                    ✓ Verified
                  </span>
                )}
              </div>
              <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
            </div>

            {/* Phone and Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Field
                  name="phoneNumber"
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Field
                  name="companyName"
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
                    isEditing
                      ? 'border-gray-300 bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }`}
                  placeholder="Your Company Inc."
                />
                <ErrorMessage name="companyName" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>

            {/* Submit Button */}
            {isEditing && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    '💾 Save Changes'
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

export default BasicInformationSection;