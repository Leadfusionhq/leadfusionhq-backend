'use client'
import React from 'react';
import AsyncSelect from 'react-select/async';
import { useField } from 'formik';

interface Option {
  label: string;
  value: string;
}

interface FormikAsyncSelectProps {
  name: string;
  label?: string;
  loadOptions: (inputValue: string, callback: (options: Option[]) => void) => void;
  placeholder?: string;
  isMulti?: boolean;
  onChange?: (option: Option | Option[] | null) => void;
  defaultOptions?: boolean | Option[];
  cacheOptions?: boolean;
}

const CustomFormikAsyncSelect = ({
  name,
  label,
  loadOptions,
  placeholder,
  isMulti = false,
  onChange,
  defaultOptions = true,
  cacheOptions = true,
}: FormikAsyncSelectProps) => {
  const [field, meta, helpers] = useField(name);
  const { setValue, setTouched } = helpers;

  const selectedOption = field.value || (isMulti ? [] : null);

  const handleChange = (option: Option | Option[] | null) => {
    if (isMulti) {
      setValue(option ? (option as Option[]) : []);
    } else {
      setValue(option ? (option as Option) : null);
    }
    
    // Mark the field as touched when a value is selected
    setTouched(true, false);
    
    if (onChange) {
      onChange(option);
    }
  };

  const handleBlur = () => {
    // Mark the field as touched when it loses focus
    setTouched(true, false);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
      <AsyncSelect
        cacheOptions={cacheOptions}
        defaultOptions={defaultOptions}
        loadOptions={loadOptions}
        onChange={handleChange}
        onBlur={handleBlur} // Added onBlur handler
        value={selectedOption}
        placeholder={placeholder}
        classNamePrefix="react-select"
        isMulti={isMulti}
        isClearable
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: '48px',
            border: meta.touched && meta.error 
              ? '1px solid #ef4444' // Red border for error state
              : '1px solid #E0E0E0',
            borderRadius: '8px',
            paddingLeft: '12px',
            fontSize: '16px',
            fontFamily: 'Inter',
            backgroundColor: '#FFFFFF',
            color: '#333333',
            '&:hover': {
              borderColor: meta.touched && meta.error ? '#ef4444' : '#000',
            },
            '&:focus-within': {
              borderColor: meta.touched && meta.error ? '#ef4444' : '#000',
              boxShadow: meta.touched && meta.error 
                ? '0 0 0 1px #ef4444' 
                : '0 0 0 1px #000',
            },
          }),
        }}
      />
      {meta.touched && meta.error && (
        <div className="text-red-500 text-xs mt-1">{meta.error}</div>
      )}
    </div>
  );
};

export default CustomFormikAsyncSelect;