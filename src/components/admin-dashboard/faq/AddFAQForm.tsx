"use client";

import React, { useState, useEffect, forwardRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { HelpCircle, MessageSquare, Sparkles } from "lucide-react";

interface FAQ {
    _id: string;
    question: string;
    answer: string;
    isActive: boolean;
}

interface AddFAQFormProps {
    editingFAQ?: FAQ | null;
    onSave: (faq: { question: string; answer: string }) => Promise<void>;
    onCancel: () => void;
}

const AddFAQForm = forwardRef<HTMLDivElement, AddFAQFormProps>(({ editingFAQ, onSave, onCancel }, ref) => {
    const initialValues = {
        question: editingFAQ?.question || "",
        answer: editingFAQ?.answer || "",
    };

    const validationSchema = Yup.object({
        question: Yup.string()
            .min(5, "Question must be at least 5 characters")
            .max(500, "Question cannot exceed 500 characters")
            .required("Question is required"),
        answer: Yup.string()
            .min(10, "Answer must be at least 10 characters")
            .max(2000, "Answer cannot exceed 2000 characters")
            .required("Answer is required"),
    });

    const handleSubmit = async (values: typeof initialValues, { resetForm, setSubmitting }: any) => {
        try {
            await onSave({
                question: values.question.trim(),
                answer: values.answer.trim(),
            });

            if (!editingFAQ) {
                resetForm();
            }
        } catch (error) {
            console.error('Error saving FAQ:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = (resetForm: () => void) => {
        resetForm();
        onCancel();
    };

    return (
        <div ref={ref} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                        {editingFAQ ? <MessageSquare className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-white">
                            {editingFAQ ? "Edit FAQ" : "Add New FAQ"}
                        </h2>
                        <p className="text-xs text-gray-300">
                            {editingFAQ ? "Update the question and answer" : "Create a new frequently asked question"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-5 sm:p-6">
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ isSubmitting, errors, touched, resetForm, values }) => (
                        <Form className="space-y-5">
                            <div>
                                <label htmlFor="question" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <HelpCircle className="w-4 h-4 text-gray-400" />
                                    Question
                                </label>
                                <Field
                                    id="question"
                                    name="question"
                                    type="text"
                                    placeholder="What would users commonly ask?"
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 focus:bg-white text-sm transition-all ${errors.question && touched.question
                                        ? "border-red-300 bg-red-50/50"
                                        : "border-gray-200"
                                        }`}
                                    disabled={isSubmitting}
                                />
                                <div className="flex justify-between items-center mt-1.5">
                                    <ErrorMessage
                                        name="question"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                    <span className="text-xs text-gray-400">{values.question.length}/500</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="answer" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                    Answer
                                </label>
                                <Field
                                    as="textarea"
                                    id="answer"
                                    name="answer"
                                    placeholder="Provide a clear and helpful answer..."
                                    rows={4}
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 focus:bg-white text-sm resize-y transition-all ${errors.answer && touched.answer
                                        ? "border-red-300 bg-red-50/50"
                                        : "border-gray-200"
                                        }`}
                                    disabled={isSubmitting}
                                />
                                <div className="flex justify-between items-center mt-1.5">
                                    <ErrorMessage
                                        name="answer"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                    <span className="text-xs text-gray-400">{values.answer.length}/2000</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-sm hover:shadow-md min-h-[48px] flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            {editingFAQ ? "Updating..." : "Saving..."}
                                        </>
                                    ) : (
                                        <>
                                            {editingFAQ ? "Update FAQ" : "Save FAQ"}
                                        </>
                                    )}
                                </button>
                                {editingFAQ && (
                                    <button
                                        type="button"
                                        onClick={() => handleCancel(resetForm)}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[48px]"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
});

AddFAQForm.displayName = "AddFAQForm";

export default AddFAQForm;