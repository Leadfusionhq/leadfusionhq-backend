'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Invalid or missing token.</p>
      </div>
    );
  }

  const initialValues = {
    password: '',
    confirmPassword: '',
    token, // Include token in form values
  };

  const validationSchema = Yup.object().shape({
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm your password'),
  });

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (val: boolean) => void }
  ) => {
    try {
      const response = await axiosWrapper('post', API_URL.RESET_PASSWORD, {
        token: values.token,
        newPassword: values.password,
      }) as { message?: string };

      toast.success(response?.message || 'Password reset successfully!');
      router.push('/login');
    } catch (err) {
      toast.error('Password reset failed. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/images/log_bg.png')] bg-cover bg-center bg-no-repeat">
      <div className="max-w-[500px] w-full bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Reset Your Password</h1>
        <p className="text-gray-600 text-center mb-6">Enter a new password to secure your account.</p>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <Field
                  type="password"
                  name="password"
                  placeholder="New Password"
                  className="w-full h-[50px] px-4 border rounded-md focus:outline-none"
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div>
                <Field
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="w-full h-[50px] px-4 border rounded-md focus:outline-none"
                />
                <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-[#204D9D] transition"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
