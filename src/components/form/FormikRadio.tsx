'use client'
import { Field, ErrorMessage, FieldAttributes } from 'formik';


  const FormikRadio = ({ label, ...props }: { label?: string } & FieldAttributes<string | number>) => (
    <div className="flex items-center space-x-2">
      <Field
        {...props}
        type="radio"
        className="w-5 h-5 text-[#1C1C1C] border-[#E0E0E0] rounded-full focus:ring-[#1C1C1C]"
      />
      {label && <label className="text-[#1C1C1C] text-lg">{label}</label>}
      <div className="min-h-[20px]">
        <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs transition-opacity duration-300" />
      </div>
    </div>
  );
export default FormikRadio;
