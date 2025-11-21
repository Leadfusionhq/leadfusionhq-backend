'use client'

import { Formik, Form, Field, ErrorMessage } from 'formik';
import { FieldAttributes } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';

import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';


const AddNewUser = () => {

  const token = useSelector((state: RootState) => state.auth.token);

  const initialValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: '',
    // zipCode: '',
    role: 'USER',
  };

  type ApiError = {
    error: boolean;
    message: string;
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
    // zipCode: Yup.string().required('Zip Code is required'),
    role: Yup.string().required('Role is required'),
  });

 const handleSubmit = async (values: typeof initialValues, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }) => {
    try {
      setSubmitting(true);
      const response = await axiosWrapper('post', API_URL.ADD_USER, values, token ?? undefined) as { message?: string };
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
    <div className="container mx-auto min-h-screen flex flex-col items-center  px-4 md:px-0 py-8">
      <h2 className="text-3xl font-semibold text-center mb-6">Add New User</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6 bg-white p-8 rounded-lg border border-gray-300 shadow-lg max-w-4xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <FormikInput name="name" autoComplete="off" placeholder="Full Name" label="Name" />
              </div>
              <div className="col-span-1">
                <FormikInput name="email" autoComplete="off" placeholder="Email Address" type="email" label="Email" />
              </div>
              <div className="col-span-1">
                <FormikInput name="password" autoComplete="off" placeholder="Password" type="password" label="Password" />
              </div>
              <div className="col-span-1">
                <FormikInput name="confirmPassword" autoComplete="off" placeholder="Confirm Password" type="password" label="Confirm Password" />
              </div>
              <div className="col-span-1">
                <FormikInput name="companyName" autoComplete="off" placeholder="Company Name" label="Company" />
              </div>
              <div className="col-span-1">
                <FormikInput name="phoneNumber" autoComplete="off" placeholder="Phone Number" label="Phone Number" />
              </div>
              {/* <div className="col-span-1">
                <FormikInput name="zipCode" autoComplete="off" placeholder="Zip Code" label="Zip Code" />
              </div> */}
            </div>
            <button
              type="submit"
              className="w-full h-[56px] bg-[#1C1C1C] text-white text-[20px] font-inter font-semibold rounded-[8px] border-none cursor-pointer transition hover:bg-[#1C1C1C]"
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
