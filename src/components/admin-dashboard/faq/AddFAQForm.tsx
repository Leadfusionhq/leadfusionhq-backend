"use client";

import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

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

const AddFAQForm = ({ editingFAQ, onSave, onCancel }: AddFAQFormProps) => {
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
            
            // Clear the form after successful save (only for new FAQs)
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
                {editingFAQ ? "Edit FAQ" : "Add New FAQ"}
            </h2>
            
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ isSubmitting, errors, touched, resetForm }) => (
                    <Form className="space-y-4">
                        <div>
                            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                                Question
                            </label>
                            <Field
                                id="question"
                                name="question"
                                type="text"
                                placeholder="Enter FAQ question"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                                    errors.question && touched.question
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                disabled={isSubmitting}
                            />
                            <ErrorMessage
                                name="question"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                                Answer
                            </label>
                            <Field
                                as="textarea"
                                id="answer"
                                name="answer"
                                placeholder="Enter FAQ answer"
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-vertical ${
                                    errors.answer && touched.answer
                                        ? "border-red-500"
                                        : "border-gray-300"
                                }`}
                                disabled={isSubmitting}
                            />
                            <ErrorMessage
                                name="answer"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                            />
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                            >
                                {isSubmitting ? (
                                    editingFAQ ? "Updating..." : "Saving..."
                                ) : (
                                    editingFAQ ? "Update FAQ" : "Save FAQ"
                                )}
                            </button>
                            {editingFAQ && (
                                <button
                                    type="button"
                                    onClick={() => handleCancel(resetForm)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default AddFAQForm;