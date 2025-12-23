'use client'
import { Field, ErrorMessage, FieldAttributes } from 'formik';

const FormikRadio = ({ label, errorMessage, ...props }: { label?: string; errorMessage?: string } & FieldAttributes<any>) => (
  <label className="inline-flex items-center gap-2 cursor-pointer group min-h-[40px]">
    <Field
      {...props}
      type="radio"
      className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-900 border-gray-300 focus:ring-gray-400 focus:ring-2 cursor-pointer"
    />
    {label && (
      <span className="text-gray-700 text-sm sm:text-base group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    )}
  </label>
);

export default FormikRadio;