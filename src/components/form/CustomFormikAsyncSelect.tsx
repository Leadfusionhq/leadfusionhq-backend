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
  defaultOptions = true, // Default to true (shows options on focus)
  cacheOptions = true,   // Default to true (enables caching)
}: FormikAsyncSelectProps) => {
  const [field, meta, helpers] = useField(name);
  const { setValue } = helpers;

  const selectedOption = field.value || (isMulti ? [] : null);

  const handleChange = (option: Option | Option[] | null) => {
    if (isMulti) {
      setValue(option ? (option as Option[]) : []);
    } else {
      setValue(option ? (option as Option) : null);
    }
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
      <AsyncSelect
        cacheOptions={cacheOptions}
        defaultOptions={defaultOptions}
        loadOptions={loadOptions}
        onChange={handleChange}
        value={selectedOption}
        placeholder={placeholder}
        classNamePrefix="react-select"
        isMulti={isMulti}
        isClearable
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '48px',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            paddingLeft: '12px',
            fontSize: '16px',
            fontFamily: 'Inter',
            backgroundColor: '#FFFFFF',
            color: '#333333',
            '&:focus': {
              borderColor: '#000',
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