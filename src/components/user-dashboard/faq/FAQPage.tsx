"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Search, MessageCircle } from "lucide-react";
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
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch FAQs - use public endpoint
  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        isActive: "true",
        limit: "100"
      });

      const response = (await axiosWrapper(
        "get",
        `${FAQ_API.GET_PUBLIC_FAQS}?${params.toString()}`,
        {},
        token || undefined
      )) as FAQResponse;

      if (response.faqs) {
        setFaqs(response.faqs);
        setFilteredFaqs(response.faqs);
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

  // Filter FAQs based on search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredFaqs(faqs);
    } else {
      const filtered = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFaqs(filtered);
    }
  }, [searchTerm, faqs]);

  const toggleExpanded = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  // FAQ Item Component
  const FAQItem: React.FC<{ faq: FAQ; index: number }> = ({ faq, index }) => {
    const isExpanded = expandedFAQ === faq._id;

    return (
      <div className={`bg-white rounded-xl border transition-all duration-200 ${isExpanded
          ? 'border-gray-300 shadow-md'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }`}>
        <button
          onClick={() => toggleExpanded(faq._id)}
          className="w-full p-4 sm:p-5 text-left flex items-start gap-3 sm:gap-4"
        >
          {/* Number Badge */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${isExpanded
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-500'
            }`}>
            {index + 1}
          </div>

          {/* Question */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm sm:text-base font-medium leading-relaxed break-words transition-colors ${isExpanded ? 'text-black' : 'text-gray-800'
              }`}>
              {faq.question}
            </h3>
          </div>

          {/* Chevron */}
          <div className={`flex-shrink-0 p-1 rounded-full transition-all ${isExpanded ? 'bg-gray-100 rotate-180' : ''
            }`}>
            <ChevronDown className={`w-5 h-5 transition-colors ${isExpanded ? 'text-gray-700' : 'text-gray-400'
              }`} />
          </div>
        </button>

        {/* Expanded Answer */}
        {isExpanded && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
            <div className="pl-11 sm:pl-12">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header Skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>

          {/* Search Skeleton */}
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse mb-6"></div>

          {/* FAQ Skeletons */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load FAQs</h2>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchFAQs}
              className="px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium min-h-[48px]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-black rounded-xl">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Frequently Asked Questions
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Find answers to common questions about our services
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 text-sm transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Count */}
        {searchTerm && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* FAQ List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              {searchTerm ? "No matching FAQs" : "No FAQs available"}
            </h2>
            <p className="text-sm text-gray-500">
              {searchTerm ? "Try a different search term" : "Check back later for updates"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <FAQItem key={faq._id} faq={faq} index={index} />
            ))}
          </div>
        )}

        {/* Help Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-5 sm:p-6 text-center">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Still have questions?</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <a
              href="/dashboard/setting-support"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;