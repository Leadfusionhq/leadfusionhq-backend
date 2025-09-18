'use client'
import React from 'react';
import AsyncSelect from 'react-select/async';
import { useField, ErrorMessage } from 'formik';

interface Option {
  label: string;
  value: string;
}

interface Props {
  name: string;
  label?: string;
  loadOptions: (
    inputValue: string,
    callback: (options: Option[]) => void
  ) => void;
  placeholder?: string;
  isMulti?: boolean;
  onChange?: (option: Option | Option[] | null) => void;
  defaultOptions?: boolean | Option[];
  cacheOptions?: boolean;
  isDisabled?: boolean; // ✅ added here
}

const CustomFormikAsyncSelect: React.FC<Props> = ({
  name,
  label,
  loadOptions,
  placeholder,
  isMulti = false,
  onChange,
  defaultOptions = true,
  cacheOptions = true,
  isDisabled = false, // ✅ default false
}) => {
  const [field, meta, helpers] = useField(name);
  const { setValue, setTouched } = helpers;

  const selectedOption = field.value || (isMulti ? [] : null);

  const handleChange = (option: Option | Option[] | null) => {
    if (isMulti) {
      setValue(option ? (option as Option[]) : []);
    } else {
      setValue(option ? (option as Option) : null);
    }

    setTouched(true);

    if (onChange) {
      onChange(option);
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const hasValue =
    isMulti
      ? Array.isArray(selectedOption) && selectedOption.length > 0
      : selectedOption !== null;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>
      )}
      <AsyncSelect
        cacheOptions={cacheOptions}
        defaultOptions={defaultOptions}
        loadOptions={loadOptions}
        onChange={handleChange}
        onBlur={handleBlur}
        value={selectedOption}
        placeholder={placeholder}
        classNamePrefix="react-select"
        isMulti={isMulti}
        isClearable
        isDisabled={isDisabled} // ✅ forward here
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '48px',
            border:
              meta.touched && meta.error && !hasValue
                ? '1px solid #ef4444'
                : '1px solid #E0E0E0',
            borderRadius: '8px',
            paddingLeft: '12px',
            fontSize: '16px',
            fontFamily: 'Inter',
            backgroundColor: '#FFFFFF',
            color: '#333333',
          }),
        }}
      />
      <div className="min-h-[20px]">
        {!hasValue ? (
          <ErrorMessage
            name={name}
            component="div"
            className="text-red-500 text-xs transition-opacity duration-300"
          />
        ) : null}
      </div>
    </div>
  );
};

export default CustomFormikAsyncSelect;
