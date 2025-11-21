'use client';
import { Field, ErrorMessage, FieldAttributes } from 'formik';

const FormikCheckbox = ({ label, errorMessage, ...props }: { label?: string; errorMessage?: string } & FieldAttributes<any>) => (
  <div className="w-full flex items-center space-x-2">
    <Field
      {...props}
      type="checkbox"
      className="w-5 h-5 text-[#1C1C1C] border-[#E0E0E0] rounded focus:ring-[#1C1C1C]"
    />
    {label && <label className="text-[#1C1C1C] text-lg">{label}</label>}
    <div className="min-h-[20px]">
      {errorMessage ? (
        <div className="text-red-500 text-xs transition-opacity duration-300">{errorMessage}</div>
      ) : (
        <ErrorMessage
          name={props.name}
          component="div"
          className="text-red-500 text-xs transition-opacity duration-300"
        />
      )}
    </div>
  </div>
);

export default FormikCheckbox;