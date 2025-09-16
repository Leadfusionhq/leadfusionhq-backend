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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6 text-[#1C1C1C] font-inter">
            <div className="max-w-4xl mx-auto space-y-8 p-6 bg-white shadow-sm rounded-xl">
              {/* Heading */}
              <h1 className="text-3xl font-bold text-gray-900 border-b pb-4">
                Lead Generation Agreement
              </h1>

              {/* Section 1 */}
              <section>
                <p className="text-gray-700 leading-relaxed">
                  This Lead Generation Agreement (&quot;Agreement&quot;) is made and
                  entered into as of the date of your acceptance by and between{" "}
                  <span className="font-semibold">Lead Fusion HQ, LLC</span>, with its
                  principal place of business at{" "}
                  <span className="font-medium">525 Rt 73N, Marlton, NJ 08053</span>{" "}
                  (&quot;Supplier&quot;), and you, the Lead buyer (&quot;Buyer&quot;).
                  By agreeing to the terms set forth herein, you confirm that you have
                  the authority to bind Buyer to this Agreement. Supplier and Buyer are
                  each referred to individually as a “Party” and collectively as the
                  “Parties.”
                </p>
              </section>

              {/* Repeatable Section Template */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Purpose</h2>
                <p className="text-gray-700 leading-relaxed">
                  This Agreement establishes the terms under which Lead Fusion HQ, LLC
                  (&quot;Supplier&quot;) will provide leads to the Lead Buyer
                  (&quot;Buyer&quot;) for its business operations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  2. Responsibilities of the Buyer
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Buyer shall maintain confidentiality of all proprietary information
                  provided by Supplier and ensure compliance with all applicable laws
                  and regulations when using leads.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  3. Payment Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Supplier’s total liability shall not exceed the Lead Fees actually
                  paid by Buyer in the preceding six (6) months. Fees may be pre-paid
                  via Merchant Account or paid on a Pay-as-you-go basis. Late payments
                  may require pre-payment before leads are distributed. Supplier’s
                  system is the sole source of truth regarding payments.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  4. Representations and Warranties
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Buyer represents and warrants that it has authority to enter this
                  Agreement, will use leads in compliance with laws, possesses all
                  required licenses and approvals, and complies with privacy and data
                  protection laws including the CCPA.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  5. Supplier’s Services
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Supplier shall use commercially reasonable efforts to provide leads in
                  compliance with 10DLC standards. Leads will be delivered via email,
                  XML feed, or other agreed methods, and verified according to company
                  standards.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  6. Intellectual Property
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Buyer may use leads solely to contact potential consumers. Buyer shall
                  not sublicense, transfer, or resell leads to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  7. No Chargeback Clause
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  All payments are final and non-refundable. Buyer agrees not to
                  initiate chargebacks, disputes, or reversals with their bank or
                  payment processor. Disputes must be addressed directly with Supplier
                  through its web portal.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  8. Filtering Criteria
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Leads shall be filtered based on Buyer’s selected criteria including
                  lead type, project type, and customer location.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  9. Lead Delivery
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  A &quot;Lead&quot; is defined as contact information for a potential
                  customer. Supplier shall include name, address, contact details, and
                  other relevant information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  10. Modifications
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Buyer may modify filtering criteria at any time through Supplier’s
                  portal or written communication. Lead prices may change subject to
                  Supplier’s confirmation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  11. Disclaimers and Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Lead services are provided “as is.” Each Party disclaims all
                  warranties. Neither Party shall be liable for consequential, indirect,
                  or punitive damages.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  12. Indemnification
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Buyer agrees to indemnify Supplier against any losses, damages,
                  claims, or expenses arising from Buyer’s non-compliance, unlawful use,
                  or negligence.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  13. Other Conditions
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  All conditions or waivers must be made in writing.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  14. Termination
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Either Party may terminate this Agreement upon thirty (30) days’
                  written notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  15. Notices
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  All notices must be in writing and delivered in person, by email, or
                  certified mail. <br />
                  <span className="font-semibold">To Supplier:</span> 525 Rt 73N,
                  Marlton, NJ 08053 <br />
                  <span className="font-semibold">To Buyer:</span> Address provided
                  during registration.
                </p>
              </section>

              {/* Footer */}
              <div className="mt-8 p-6 bg-gray-50 border rounded-lg text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Supplier:</span> Lead Fusion HQ, LLC
                </p>
                <p>
                  <span className="font-semibold">Location:</span> 525 Rt 73N, Marlton,
                  NJ 08053
                </p>
                <p>
                  <span className="font-semibold">Agreement Effective Date:</span> Upon
                  Buyer’s acceptance
                </p>
              </div>
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