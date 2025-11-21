'use client'
import { Field, ErrorMessage, FieldAttributes } from 'formik';

const FormikSelect = ({ 
  label, 
  options, 
  isDisabled = false, 
  errorMessage, 
  ...props 
}: { 
  isDisabled?: boolean; 
  label?: string; 
  options: { value: string; label: string }[];
  errorMessage?: string;
} & FieldAttributes<any>) => (
  <div className="w-full">
    {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
    <Field
      {...props}
      disabled={isDisabled}
      as="select"
      className="h-[48px] border border-[#E0E0E0] rounded-[8px] px-5 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition w-full"
    >
      {options.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Field>
    <div className="min-h-[20px]">
      {errorMessage ? (
        <div className="text-red-500 text-xs transition-opacity duration-300">{errorMessage}</div>
      ) : (
        <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs transition-opacity duration-300" />
      )}
    </div>
  </div>
);

export default FormikSelect;