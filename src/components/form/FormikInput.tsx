'use client'
import { Field, ErrorMessage, FieldAttributes } from 'formik';

const FormikInput = ({ label, errorMessage, ...props }: { label?: string; errorMessage?: string } & FieldAttributes<any>) => (
  <div className="w-full">
    {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
    <Field
      {...props}
      className="h-[48px] border border-[#E0E0E0] rounded-[8px] px-5 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition w-full"
    />
    <div className="min-h-[20px]">
      {errorMessage ? (
        <div className="text-red-500 text-xs transition-opacity duration-300">{errorMessage}</div>
      ) : (
        <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs transition-opacity duration-300" />
      )}
    </div>
  </div>
);

export default FormikInput;