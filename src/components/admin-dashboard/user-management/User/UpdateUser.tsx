'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { FieldAttributes } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import axiosWrapper from '@/utils/api';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { API_URL } from '@/utils/apiUrl';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
type User = {
  name: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  zipCode: string;
  role: string;
};

const EditUser = () => {
  const { userId } = useParams();
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const [initialValues, setInitialValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: '',
    zipCode: '',
    role: 'User',
  });

  const [loading, setLoading] = useState(true);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: Yup.string().when('password', {
        is: (val: string) => val && val.length > 0,
        then: (schema) =>
        schema
            .required('Confirm Password is required')
            .oneOf([Yup.ref('password')], 'Passwords must match'),
        otherwise: (schema) => schema.notRequired(),
    }),
    companyName: Yup.string().required('Company Name is required'),
    phoneNumber: Yup.string().required('Phone Number is required'),
    zipCode: Yup.string().required('Zip Code is required'),
    role: Yup.string().required('Role is required'),
  });


  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      const id = Array.isArray(userId) ? userId[0] : userId;
      if (!id) return;

      try {
        console.log(id);
        const url = API_URL.GET_USER_BY_ID.replace(':userId', id);
        // const res = await axiosWrapper('get', url, {}, token ?? undefined) as { user?: string };
        const res = await axiosWrapper('get', url, {}, token ?? undefined) as { user?: User };

        const user = res?.user;
        if (user) {
          setInitialValues({
            name: user.name || '',
            email: user.email || '',
            password: '',
            confirmPassword: '',
            companyName: user.companyName || '',
            phoneNumber: user.phoneNumber || '',
            zipCode: user.zipCode || '',
            role: user.role || 'User',
          });
        }
      } catch (err) {
        console.log('error for failed to fetch :', err);
        toast.error('Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, token, router]);


  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      setSubmitting(true);

      const payload = { ...values };

      const url = API_URL.UPDATE_USER.replace(':userId', userId as string);
      const response = await axiosWrapper('put', url, payload, token ?? undefined) as { message?: string };

      toast.success(response?.message || 'User updated successfully!');
      router.push('/admin/user-management');
    } catch (err) {
      // const errorMessage =
      //   err?.response?.data?.message ||
      //   err?.error ||
      //   'Unable to update user. Please try again.';
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const FormikInput = ({ label, ...props }: { label?: string } & FieldAttributes<string>) => (
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

  if (loading) {
    return <div className="text-center py-10 text-lg font-medium">Loading user data...</div>;
  }

  return (
    <div className="container mx-auto min-h-screen flex flex-col items-center justify-center px-4 md:px-0 py-8">
      <h2 className="text-[24px] font-[500] text-[#1C1C1C] text-center mb-6">Edit User</h2>
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="w-full max-w-[900px] space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput name="name" placeholder="Full Name" label="Name" />
              <FormikInput name="email" placeholder="Email" type="email" label="Email" />
              <FormikInput name="password" placeholder="New Password (optional)" type="password" label="Password" />
              <FormikInput name="confirmPassword" placeholder="Confirm Password" type="password" label="Confirm Password" />
              <FormikInput name="companyName" placeholder="Company Name" label="Company" />
              <FormikInput name="phoneNumber" placeholder="Phone Number" label="Phone Number" />
              <FormikInput name="zipCode" placeholder="Zip Code" label="Zip Code" />
            </div>
            <button
              type="submit"
              className="w-full h-[56px] bg-[#1C1C1C] text-white text-[20px] font-inter font-semibold rounded-[8px] border-none cursor-pointer transition hover:bg-[#000]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditUser;
