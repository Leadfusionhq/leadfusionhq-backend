// FAQList.tsx
"use client";

import React, { useState } from "react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Search, ChevronDown, ChevronUp, Edit2, Trash2, HelpCircle, ChevronLeft, ChevronRight, X, List } from "lucide-react";

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
            day: 'numeric'
        });
    };

    const renderPagination = () => {
        if (!pagination || !onPageChange || pagination.pages <= 1) return null;

        const { current, pages } = pagination;

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <div className="text-xs sm:text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{((current - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(current * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-900">{pagination.total}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(current - 1)}
                        disabled={current === 1}
                        className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                        let pageNum: number;
                        if (pages <= 5) {
                            pageNum = i + 1;
                        } else if (current <= 3) {
                            pageNum = i + 1;
                        } else if (current >= pages - 2) {
                            pageNum = pages - 4 + i;
                        } else {
                            pageNum = current - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`px-3 py-2 text-sm rounded-lg min-w-[40px] min-h-[40px] transition-all ${pageNum === current
                                    ? 'bg-black text-white font-medium'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => onPageChange(current + 1)}
                        disabled={current === pages}
                        className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-xl">
                            <List className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                                FAQ List
                            </h2>
                            {pagination && (
                                <p className="text-xs text-gray-500">{pagination.total} questions total</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by question or answer..."
                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 focus:bg-white text-sm transition-all"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleSearchClear}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 text-sm font-medium transition-all min-h-[48px] shadow-sm hover:shadow-md"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-100">
                {loading ? (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-500 text-sm">Loading FAQs...</p>
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                            <HelpCircle className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-medium mb-1">No FAQs found</p>
                        <p className="text-sm text-gray-500">
                            {searchTerm ? "Try adjusting your search terms" : "Add your first FAQ using the form above"}
                        </p>
                    </div>
                ) : (
                    faqs.map((faq, index) => (
                        <div
                            key={faq._id}
                            className={`group transition-colors ${expandedFAQ === faq._id ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}
                        >
                            <div className="p-4 sm:p-5">
                                {/* Mobile: Stack layout / Desktop: Row layout */}
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                    {/* Number + Question */}
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="hidden sm:flex flex-shrink-0 w-7 h-7 bg-gray-100 rounded-lg items-center justify-center text-xs font-medium text-gray-500 mt-0.5">
                                            {index + 1 + ((pagination?.current || 1) - 1) * (pagination?.limit || 10)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => toggleExpanded(faq._id)}
                                                className="w-full text-left group/question"
                                            >
                                                <h3 className="text-sm font-medium text-gray-900 leading-relaxed break-words group-hover/question:text-gray-700">
                                                    {faq.question}
                                                </h3>
                                            </button>

                                            {/* Expanded Answer */}
                                            {expandedFAQ === faq._id && (
                                                <div className="mt-3">
                                                    <div className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                        <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                                                            {faq.answer}
                                                        </p>
                                                        {faq.createdBy && (
                                                            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                                                <span>Created by {faq.createdBy.name}</span>
                                                                {faq.createdAt && (
                                                                    <>
                                                                        <span className="hidden sm:inline">•</span>
                                                                        <span>{formatDate(faq.createdAt)}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions - Full width on mobile, inline on desktop */}
                                    <div className="flex items-center justify-end gap-2 sm:gap-1.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                        <button
                                            onClick={() => toggleExpanded(faq._id)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 text-gray-500 hover:text-gray-700 bg-gray-50 sm:bg-transparent hover:bg-gray-100 rounded-lg transition-all min-h-[40px] text-xs font-medium sm:font-normal"
                                            title={expandedFAQ === faq._id ? "Collapse" : "Expand"}
                                        >
                                            {expandedFAQ === faq._id ? (
                                                <>
                                                    <ChevronUp className="w-4 h-4" />
                                                    <span className="sm:hidden">Collapse</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-4 h-4" />
                                                    <span className="sm:hidden">View</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => onEdit(faq)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 sm:bg-transparent sm:text-gray-400 sm:hover:text-blue-600 sm:hover:bg-blue-50 rounded-lg transition-all min-h-[40px] text-xs font-medium sm:font-normal"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            {/* <span className="sm:hidden">Edit</span> */}
                                        </button>

                                        <button
                                            onClick={() => handleDeleteClick(faq._id)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 sm:bg-transparent sm:text-gray-400 sm:hover:text-red-600 sm:hover:bg-red-50 rounded-lg transition-all min-h-[40px] text-xs font-medium sm:font-normal"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {/* <span className="sm:hidden">Delete</span> */}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {renderPagination()}

            <ConfirmDialog
                open={confirmOpen}
                title="Delete FAQ"
                message="Are you sure you want to delete this FAQ? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
};

export default FAQList;