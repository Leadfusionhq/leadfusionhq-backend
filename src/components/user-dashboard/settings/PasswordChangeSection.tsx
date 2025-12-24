// /app/dashboard/settings/components/PasswordChangeSection.tsx
'use client'

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/auth/authSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { useRouter } from 'next/navigation';


interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PasswordChangeSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string()
      .required('Current password is required')
      .min(8, 'Password must be at least 8 characters'),
    newPassword: Yup.string()
      .required('New password is required')
      .min(8, 'Password must be at least 8 characters')
      .notOneOf([Yup.ref('currentPassword')], 'New password must be different from current password')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: Yup.string()
      .required('Please confirm your new password')
      .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
  });

  const { token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const initialValues: PasswordValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const handleSubmit = async (values: PasswordValues, { resetForm }: any) => {
    setIsLoading(true);
    try {
      await axiosWrapper(
        'put',
        API_URL.CHANGE_MY_PASSWORD,
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        },
        token ?? undefined // ✅ add token here
      );

      toast.success('Password changed successfully! Please login again.');
      resetForm();
      dispatch(logout());
      setTimeout(() => {
        router.replace("/login");
      }, 50);

    } catch (error: any) {
      toast.error(error?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };


  const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    const getStrength = () => {
      if (!password) return { label: '', color: '', width: '0%' };

      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[@$!%*?&]/.test(password)) strength++;

      if (strength <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
      if (strength <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
      return { label: 'Strong', color: 'bg-green-500', width: '100%' };
    };

    const strength = getStrength();
    if (!password) return null;

    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Password Strength:</span>
          <span className={`text-xs font-semibold ${strength.label === 'Weak' ? 'text-red-600' :
              strength.label === 'Medium' ? 'text-yellow-600' :
                'text-green-600'
            }`}>
            {strength.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${strength.color} h-2 rounded-full transition-all duration-300`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Section Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🔒</span> Security Settings
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
      </div>

      {/* Security Tips */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-amber-500 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Password Security Tips</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Use at least 8 characters (12+ recommended)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Include uppercase and lowercase letters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Add numbers and special characters (@$!%*?&)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Avoid common words and personal information</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, isValid, dirty }) => (
          <Form className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Field
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20 transition-all duration-200"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <ErrorMessage name="currentPassword" component="div" className="text-red-500 text-xs mt-1" />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Field
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20 transition-all duration-200"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <ErrorMessage name="newPassword" component="div" className="text-red-500 text-xs mt-1" />
              <PasswordStrengthIndicator password={values.newPassword} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Field
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-white focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20 transition-all duration-200"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />

              {/* Password Match Indicator */}
              {values.confirmPassword && (
                <div className="mt-2">
                  {values.newPassword === values.confirmPassword ? (
                    <p className="text-green-600 text-xs flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </p>
                  ) : (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading || !isValid || !dirty}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Changing Password...
                  </span>
                ) : (
                  '🔐 Change Password'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {/* Additional Security Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Important Security Notice</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• After changing your password, you will be logged out from all devices</li>
              <li>• Make sure to remember your new password or store it securely</li>
              <li>• If you suspect unauthorized access, change your password immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeSection;