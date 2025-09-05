"use client";

import React, { useState } from "react";

interface WalletProps {
  totalAmount: number;
  walletAmount: number;
  finalPay: number;
  onAddMoney: () => void;
  onPayNow: () => void;
  loading?: boolean;
}

const Wallet: React.FC<WalletProps> = ({
  totalAmount,
  walletAmount,
  finalPay,
  onAddMoney,
  onPayNow,
  loading = false
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="bg-[#000] text-white p-4 rounded-t-lg -mt-6 -mx-6 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Use Wallet</h2>
        <button
          onClick={onAddMoney}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition duration-200"
        >
          Add Money to Wallet
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Total Amount</p>
          <p className="text-lg font-semibold text-gray-900">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Wallet Amount</p>
          <p className="text-lg font-semibold text-green-600">${walletAmount.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Final Pay</p>
          <p className="text-lg font-semibold text-red-600">${finalPay.toFixed(2)}</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="agreeTerms" className="ml-2 text-sm text-gray-700">
            I agree to the{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500 underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </a>
            .
          </label>
        </div>

        <button
          onClick={onPayNow}
          disabled={!agreedToTerms || loading}
          className="w-full bg-[#000] text-white py-3 px-4 rounded-md hover:bg-[#000] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
};

export default Wallet;