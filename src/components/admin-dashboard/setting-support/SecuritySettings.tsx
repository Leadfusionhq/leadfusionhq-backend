"use client";

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/auth/authSlice';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Check, Lock, AlertTriangle } from 'lucide-react';

interface PasswordValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const SecuritySettings = () => {
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
    const dispatch = useDispatch();

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
                token ?? undefined
            );

            toast.success('Password changed successfully! Please login again.');
            resetForm();
            const res = await dispatch(logout());

            // Small delay to ensure toast is seen and state is cleared
            setTimeout(() => {
                router.replace("/login");
            }, 500);

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 md:px-8 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[#306A64]" />
                        Security Settings
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Update your password to keep your account secure.
                    </p>
                </div>
            </div>

            {/* <div className="p-6 md:p-8 pb-0">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <div className="bg-amber-500 text-white p-2 rounded-lg mt-0.5">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Password Security Tips</h3>
                            <ul className="text-sm text-gray-700 space-y-2">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                                    <span>Use at least 8 characters (12+ recommended)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                                    <span>Include uppercase and lowercase letters</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                                    <span>Add numbers and special characters (@$!%*?&)</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div> */}

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ values, errors, touched, isValid, dirty }) => (
                    <Form className="p-6 md:p-8 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {/* Current Password */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    Current Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Field
                                        name="currentPassword"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 pr-10 ${errors.currentPassword && touched.currentPassword
                                            ? "bg-white border-red-500 focus:ring-2 focus:ring-red-200"
                                            : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                                            }`}
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                <ErrorMessage name="currentPassword" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Field
                                        name="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 pr-10 ${errors.newPassword && touched.newPassword
                                            ? "bg-white border-red-500 focus:ring-2 focus:ring-red-200"
                                            : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                                            }`}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                <ErrorMessage name="newPassword" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                                <PasswordStrengthIndicator password={values.newPassword} />
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Field
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 pr-10 ${errors.confirmPassword && touched.confirmPassword
                                            ? "bg-white border-red-500 focus:ring-2 focus:ring-red-200"
                                            : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                                            }`}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                                {/* Password Match Indicator */}
                                {values.confirmPassword && (
                                    <div className="mt-2">
                                        {values.newPassword === values.confirmPassword ? (
                                            <p className="text-green-600 text-xs flex items-center gap-1 font-medium">
                                                <Check className="w-3.5 h-3.5" />
                                                Passwords match
                                            </p>
                                        ) : (
                                            <p className="text-red-600 text-xs flex items-center gap-1 font-medium">
                                                <div className="w-3.5 h-3.5 rounded-full bg-red-100 flex items-center justify-center text-red-600 border border-red-200" >!</div>
                                                Passwords do not match
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || !isValid || !dirty}
                                className="px-8 py-2.5 bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white rounded-lg hover:shadow-lg text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" /> Change Password
                                    </>
                                )}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default SecuritySettings;
