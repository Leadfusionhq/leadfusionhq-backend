// FAQList.tsx
"use client";

import React, { useState } from "react";
import { Skeleton, Box, Button, Typography } from "@mui/material";
import ConfirmDialog from "@/components/common/ConfirmDialog";

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

interface FAQListProps {
    faqs: FAQ[];
    onEdit: (faq: FAQ) => void;
    onDelete: (id: string) => void;
    onSearch: (searchTerm: string) => void;
    loading?: boolean;
    pagination?: {
        current: number;
        pages: number;
        total: number;
        limit: number;
    };
    onPageChange?: (page: number) => void;
}

const FAQList = ({ 
    faqs, 
    onEdit, 
    onDelete, 
    onSearch, 
    loading = false,
    pagination,
    onPageChange 
}: FAQListProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
     // dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);


    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchTerm);
    };

    const handleSearchClear = () => {
        setSearchTerm("");
        onSearch("");
    };

    const handleDeleteClick = (id: string) => {
        setSelectedId(id);
        setConfirmOpen(true);
      };
    
      const handleConfirmDelete = () => {
        if (selectedId) {
          onDelete(selectedId);
        }
        setConfirmOpen(false);
        setSelectedId(null);
      };
    
      const handleCancelDelete = () => {
        setConfirmOpen(false);
        setSelectedId(null);
      };



    const toggleExpanded = (faqId: string) => {
        setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderPagination = () => {
        if (!pagination || !onPageChange || pagination.pages <= 1) return null;
    
        const { current, pages } = pagination;
        const pageNumbers: (number | string)[] = []; // Explicitly type the array
        
        // Show first page
        if (current > 3) {
            pageNumbers.push(1);
            if (current > 4) pageNumbers.push('...');
        }
        
        // Show pages around current
        for (let i = Math.max(1, current - 2); i <= Math.min(pages, current + 2); i++) {
            pageNumbers.push(i);
        }
        
        // Show last page
        if (current < pages - 2) {
            if (current < pages - 3) pageNumbers.push('...');
            pageNumbers.push(pages);
        }
    
        return (
            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
                <div className="text-sm text-gray-500">
                    Showing {((current - 1) * pagination.limit) + 1} to {Math.min(current * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-1">
                    <button
                        onClick={() => onPageChange(current - 1)}
                        disabled={current === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    {pageNumbers.map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                            disabled={page === '...' || page === current}
                            className={`px-3 py-1 text-sm border border-gray-300 rounded-md ${
                                page === current 
                                    ? 'bg-gray-900 text-white border-gray-900' 
                                    : page === '...' 
                                        ? 'cursor-default' 
                                        : 'hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => onPageChange(current + 1)}
                        disabled={current === pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-800">
                        FAQ List {pagination && `(${pagination.total} total)`}
                    </h2>
                </div>
                
      
                {/* Search */}
                {/* ✅ Search bar should always be visible */}
                <form onSubmit={handleSearchSubmit} className="flex space-x-3 mb-3">
                <div className="flex-1">
                    <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search FAQs by question or answer..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                focus:outline-none focus:ring-2 focus:ring-gray-500 
                                focus:border-gray-500"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium"
                >
                    Search
                </button>
                {searchTerm && (
                    <button
                    type="button"
                    onClick={handleSearchClear}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
                    >
                    Clear
                    </button>
                )}
                </form>

                {/* ✅ Results / message */}
               
                <div>{/* Render FAQ list here */}</div>
                


            </div>

            {/* Content */}
            <div className="divide-y divide-gray-200">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-2 text-gray-500">Loading FAQs...</p>
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No FAQs found.</p>
                        {searchTerm && <p className="text-sm mt-1">Try adjusting your search terms.</p>}
                    </div>
                ) : (
                    faqs.map((faq) => (
                        <div key={faq._id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 
                                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700"
                                            onClick={() => toggleExpanded(faq._id)}
                                        >
                                            {faq.question}
                                        </h3>
                                    </div>
                                    
                                    {expandedFAQ === faq._id && (
                                        <div className="mt-3 space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                            <div className="text-xs text-gray-500 space-y-1">
                                             
                                                {faq.createdBy && (
                                                    <p>By: {faq.createdBy.name}</p>
                                                )}
                                               
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={() => toggleExpanded(faq._id)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title={expandedFAQ === faq._id ? "Collapse" : "Expand"}
                                    >
                                        <svg className={`w-5 h-5 transition-transform ${
                                            expandedFAQ === faq._id ? 'rotate-180' : ''
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                  
                                    <div className="flex gap-2">
                                    <Button
                                        className="!bg-[#838383] !text-white hover:!bg-[#6b6b6b]"
                                        size="small"
                                        sx={{
                                        fontSize: "11px",
                                        minWidth: "50px",
                                        height: "26px",
                                        padding: "0px 6px",
                                        textTransform: "capitalize",
                                        fontWeight: 500,
                                        }}
                                        onClick={() => onEdit(faq)}
                                    >
                                        Edit
                                    </Button>

                                    <Button
                                        className="!bg-white !text-[#838383] hover:!bg-[#f5f5f5] border border-[#838383]"
                                        size="small"
                                        sx={{
                                        fontSize: "11px",
                                        minWidth: "50px",
                                        height: "26px",
                                        padding: "0px 6px",
                                        textTransform: "capitalize",
                                        fontWeight: 500,
                                        }}
                                        onClick={() => handleDeleteClick(faq._id)}
                                    >
                                        Delete
                                    </Button>
                                    </div>

                                    <ConfirmDialog
                                        open={confirmOpen}
                                        title="Delete FAQ"
                                        message="Are you sure you want to delete this FAQ? This action cannot be undone."
                                        onConfirm={handleConfirmDelete}
                                        onCancel={handleCancelDelete}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {renderPagination()}
        </div>
    );
};

export default FAQList;