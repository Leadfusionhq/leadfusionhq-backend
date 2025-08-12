'use client'
import { Field, ErrorMessage, FieldAttributes } from 'formik';


const FormikTextarea = ({ label, ...props }: { label?: string } & FieldAttributes<string>) => (
    <div className="w-full">
        {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
        <Field
        as="textarea"
        {...props}
        className="h-32 w-full border border-[#E0E0E0] rounded-[8px] px-5 py-2 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition w-full resize-none"

        />
        <ErrorMessage name={props.name} component="div" className="text-red-500 text-xs mt-1" />
    </div>
);
export default FormikTextarea;
