// components/billing/PaymentMethods.tsx
"use client";

import React, { useState } from "react";

interface PaymentMethod {
  id: string;
  nameOnCard: string;
  lastFourDigits: string;
  expirationDate: string;
  isPrimary: boolean;
  brand: string;
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  onSetPrimary: (id: string) => void;
  onDeleteMethod: (id: string) => void;
  onAddNew: () => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  paymentMethods,
  onSetPrimary,
  onDeleteMethod,
  onAddNew,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="bg-[#000] text-white p-4 rounded-t-lg -mt-6 -mx-6 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Payment Method</h2>
        <button
          onClick={onAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition duration-200"
        >
          Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Primary</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Name on card</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Last 4 Digits</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Expiration</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Delete?</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.map((method) => (
              <tr key={method.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input
                    type="radio"
                    name="primaryPayment"
                    checked={method.isPrimary}
                    onChange={() => onSetPrimary(method.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="py-3 px-4 text-gray-900">{method.nameOnCard}</td>
                <td className="py-3 px-4 text-gray-900">
                  <span className="flex items-center">
                    <span className="mr-2">{getCardIcon(method.brand)}</span>
                    {method.lastFourDigits}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-900">{method.expirationDate}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onDeleteMethod(method.id)}
                    className="text-red-600 hover:text-red-800 text-xl"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paymentMethods.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No payment methods found.</p>
          <button
            onClick={onAddNew}
            className="mt-2 text-blue-600 hover:text-blue-500 underline"
          >
            Add your first payment method
          </button>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="stripe"
            name="paymentProvider"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="stripe" className="text-sm text-gray-700">
            Pay by Stripe
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="bank"
            name="paymentProvider"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="bank" className="text-sm text-gray-700">
            Pay by bank
          </label>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;