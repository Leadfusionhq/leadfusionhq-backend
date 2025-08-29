"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import axiosWrapper from "@/utils/api";
import { FAQ_API } from "@/utils/apiUrl";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store"; 

// Types
interface FAQ {
  _id: string;
  question: string;
  answer: string;
  isActive: boolean;
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FAQResponse {
  message?: string;
  faqs?: FAQ[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

const FAQPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token); 

const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [leftColumnFaqs, setLeftColumnFaqs] = useState<FAQ[]>([]);
  const [rightColumnFaqs, setRightColumnFaqs] = useState<FAQ[]>([]);

// Fetch FAQs - simplified (no role check needed)
// Fetch FAQs - use public endpoint
const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        isActive: "true",
        limit: "100"
      });
  
      // Use PUBLIC endpoint instead of admin endpoint
      const response = (await axiosWrapper(
        "get",
        `${FAQ_API.GET_PUBLIC_FAQS}?${params.toString()}`,
        {},
        token || undefined // Convert null to undefined
      )) as FAQResponse;
  
      if (response.faqs) {
        setFaqs(response.faqs);
      } else {
        throw new Error(response.message || 'Failed to fetch FAQs');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchFAQs();
    }
  }, [token, fetchFAQs]);

  useEffect(() => {
    // Split FAQs into two columns for the exact layout
    const midpoint = Math.ceil(faqs.length / 2);
    setLeftColumnFaqs(faqs.slice(0, midpoint));
    setRightColumnFaqs(faqs.slice(midpoint));
  }, [faqs]);

  const toggleExpanded = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const FAQItem: React.FC<{ faq: FAQ }> = ({ faq }) => (
    <div className="border-b border-gray-200 last:border-b-0 mb-4">
      <button
        onClick={() => toggleExpanded(faq._id)}
        className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 rounded-lg border border-gray-200"
      >
        <span className="text-sm font-normal text-gray-900 pr-4 leading-relaxed">
          {faq.question}
        </span>
        {expandedFAQ === faq._id ? (
          <ChevronUp className="w-4 h-4 text-gray-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
        )}
      </button>
      
      {expandedFAQ === faq._id && (
        <div className="px-4 pb-4 mt-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Frequently Asked Questions
            </h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Frequently Asked Questions
            </h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchFAQs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Frequently Asked Questions
          </h1>
        </div>

        {/* FAQ Grid - Exact layout like image */}
        {faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-base">No FAQs available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              {leftColumnFaqs.map((faq) => (
                <FAQItem key={faq._id} faq={faq} />
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {rightColumnFaqs.map((faq) => (
                <FAQItem key={faq._id} faq={faq} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8">
          <p className="text-sm text-gray-500">
            © 2025 Lead Fusion. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;