'use client';

import { useParams, useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, FieldAttributes } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

import axiosWrapper from '@/utils/api';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { API_URL } from '@/utils/apiUrl';
import { useState } from 'react';

const AddBalance = () => {
    const { userId } = useParams();
    console.log(userId);

    const router = useRouter();
    const token = useSelector((state: RootState) => state.auth.token);

    const [initialValues] = useState({
        amount: '',
    });

    const validationSchema = Yup.object().shape({
        amount: Yup.number()
            .typeError('Amount must be a number')
            .positive('Amount must be greater than 0')
            .required('Amount is required'),
    });

    const handleSubmit = async (
        values: typeof initialValues,
        { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        try {
            setSubmitting(true);

            const payload = {
                userId: Array.isArray(userId) ? userId[0] : userId,
                amount: Number(values.amount),
            };
            console.log(payload);

            const url = API_URL.ADD_BALANCE.replace(':userId', payload.userId as string);
            
            const response = await axiosWrapper('post', url, payload, token ?? undefined) as { message?: string };

            const message = response?.message ?? 'Balance added successfully!';
            
            toast.success(message);

            router.push('/admin/user-management');
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || err?.message || 'Something went wrong';
            toast.error(errorMessage);
            // toast.error(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

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
        <div className="container mx-auto min-h-screen flex flex-col items-center px-4 md:px-0 pt-12 pb-8">
            <h2 className="text-3xl font-semibold text-center mb-6">
                Add Balance 
            </h2>
            <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form className="space-y-6 bg-white p-8 rounded-lg border border-gray-300 shadow-lg max-w-lg w-full">
                        <FormikInput name="amount" placeholder="Enter amount" label="Amount" type="number" />
                        <button
                            type="submit"
                            className="w-full h-[56px] bg-[#1C1C1C] text-white text-[20px] font-inter font-semibold rounded-[8px] border-none cursor-pointer transition hover:bg-[#000]"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Balance'}
                        </button>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default AddBalance;
