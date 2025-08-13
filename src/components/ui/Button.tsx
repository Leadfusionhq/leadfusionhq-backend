'use client'
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-medium transition-all';
  const variantClasses = {
    primary: 'bg-[#1C1C1C] text-white hover:bg-[#333333]',
    outline: 'bg-white border border-[#E0E0E0] hover:bg-gray-50'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};