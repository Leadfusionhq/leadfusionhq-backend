// components/billing/ContractModal.tsx
"use client";

import React, { useState } from "react";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (signature: string, date: string) => void;
  contractText: string;
}

const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  contractText,
}) => {
  const [signature, setSignature] = useState("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (signature.trim() && hasScrolledToBottom) {
      const currentDate = new Date().toLocaleString();
      onAccept(signature, currentDate);
      setSignature("");
      setHasScrolledToBottom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Service Agreement</h2>
          <p className="text-sm text-gray-600 mt-2">
            Please read the entire contract and provide your electronic signature to continue.
          </p>
        </div>

        <div
          className="flex-1 p-6 overflow-y-auto bg-gray-50"
          onScroll={handleScroll}
          style={{ maxHeight: "60vh" }}
        >
          <div className="bg-white p-6 rounded border">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: contractText }} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {!hasScrolledToBottom && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Please scroll to the bottom of the contract to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2">
                Electronic Signature *
              </label>
              <input
                type="text"
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full legal name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!hasScrolledToBottom}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                By typing your name, you agree to the terms and conditions outlined in this contract.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              
              <button
                onClick={handleAccept}
                disabled={!signature.trim() || !hasScrolledToBottom}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;