'use client'
import { Field, ErrorMessage, FieldAttributes } from 'formik';

const FormikTextarea = ({ label, errorMessage, ...props }: { label?: string; errorMessage?: string } & FieldAttributes<string>) => (
  <div className="w-full">
    {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
    <Field
      as="textarea"
      {...props}
      className="h-32 w-full border border-[#E0E0E0] rounded-[8px] px-5 py-2 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition resize-none"
    />
    <div className="min-h-[20px]">
      {errorMessage ? (
        <div className="text-red-500 text-xs mt-1">{errorMessage}</div>
      ) : (
        <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs mt-1" />
      )}
    </div>
  </div>
);

export default FormikTextarea;