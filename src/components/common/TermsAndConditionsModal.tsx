'use client'

import React from 'react';
import Image from 'next/image';

interface TermsAndConditionsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export default function TermsAndConditionsModal({
  open,
  onClose,
  onAccept,
  showAcceptButton = false,
}: TermsAndConditionsModalProps) {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-[12px] w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#E0E0E0]">
          <h2 className="text-2xl font-bold text-[#1C1C1C] font-[Times_New_Roman]">
            Terms and Conditions
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-[#1C1C1C] transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6 text-[#1C1C1C] font-inter">
            
            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">1. Acceptance of Terms</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                By accessing and using Lead Manager, you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">2. Description of Service</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                Lead Manager is a web-based application that helps businesses organize, track, and manage their leads 
                through a centralized dashboard. Our service includes lead tracking, analytics, and management tools.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">3. User Registration and Account</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                To access certain features of our service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[16px] text-[#444] ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Keep your login credentials secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">4. Data Privacy and Security</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                We take your privacy seriously. We collect, use, and protect your personal information in accordance 
                with our Privacy Policy. You consent to the collection and use of your information as outlined in our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">5. Prohibited Uses</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                You may not use our service:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[16px] text-[#444] ml-4">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To transmit or procure the sending of any advertising or promotional material without our prior written consent</li>
                <li>To impersonate or attempt to impersonate the company, another user, or any other person or entity</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">6. Intellectual Property Rights</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                The service and its original content, features, and functionality are and will remain the exclusive property 
                of Lead Manager and its licensors. The service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">7. Limitation of Liability</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                In no event shall Lead Manager, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                be liable for any indirect, incidental, special, consequential, or punitive damages, including without 
                limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">8. Changes to Terms</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3 text-[#222]">9. Contact Information</h3>
              <p className="text-[16px] leading-[1.6] text-[#444] mb-4">
                If you have any questions about these Terms and Conditions, please contact us at support@leadmanager.com
              </p>
            </section>

            <div className="mt-8 p-4 bg-[#F5F5F5] rounded-[8px] border border-[#E0E0E0]">
              <p className="text-[14px] text-[#666] leading-[1.5]">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-[#E0E0E0] bg-[#FAFAFA]">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#E0E0E0] text-[#666] rounded-[8px] hover:bg-[#F5F5F5] hover:text-[#1C1C1C] transition-colors duration-200 font-inter"
          >
            Close
          </button>
          {showAcceptButton && (
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-[#000] text-white rounded-[8px] hover:bg-[linear-gradient(90deg,#306A64_0%,#204D9D_50%,#306A64_100%)] transition-all duration-300 font-inter font-medium"
            >
              Accept Terms
            </button>
          )}
        </div>
      </div>
    </div>
  );
}