'use client'
import { Field, ErrorMessage, FieldAttributes } from 'formik';

const FormikInput = ({ label, errorMessage, ...props }: { label?: string; errorMessage?: string } & FieldAttributes<any>) => (
  <div className="w-full">
    {label && (
      <label className="block text-gray-700 text-sm sm:text-base font-medium mb-1.5 sm:mb-2">
        {label}
      </label>
    )}
    <Field
      {...props}
      className="min-h-[44px] sm:min-h-[48px] w-full border border-gray-200 rounded-lg px-3 sm:px-4 text-sm sm:text-base bg-white text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all duration-200 shadow-sm hover:border-gray-300"
    />
    {(errorMessage || props.name) && (
      <div className="min-h-[18px] mt-1">
        {errorMessage ? (
          <div className="text-red-500 text-xs sm:text-sm">{errorMessage}</div>
        ) : (
          <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs sm:text-sm" />
        )}
      </div>
    )}
  </div>
);

export default FormikInput;