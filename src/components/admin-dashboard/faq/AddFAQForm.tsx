// AddFAQForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface FAQ {
    id: string; // The FAQ type from the parent component
    question: string;
    answer: string;
}

interface AddFAQFormProps {
    editingFAQ?: FAQ | null;
    onSave: (faq: FAQ) => void; // This needs to accept the full FAQ object
    onCancel: () => void;
}

const AddFAQForm = ({ editingFAQ, onSave, onCancel }: AddFAQFormProps) => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    useEffect(() => {
        if (editingFAQ) {
            setQuestion(editingFAQ.question);
            setAnswer(editingFAQ.answer);
        } else {
            setQuestion("");
            setAnswer("");
        }
    }, [editingFAQ]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (question.trim() && answer.trim()) {
            // Pass the existing ID if editing, otherwise a new ID will be created by the parent
            const faqToSave = {
                id: editingFAQ ? editingFAQ.id : Date.now().toString(), // ✅ Add the ID here
                question: question.trim(),
                answer: answer.trim(),
            };
            onSave(faqToSave);
            
            if (!editingFAQ) {
                toast.success("FAQ added successfully");
            } else {
                toast.success("FAQ updated successfully");
            }
            
            // Clear the form after saving
            setQuestion("");
            setAnswer("");
        }
    };

    const handleCancel = () => {
        setQuestion("");
        setAnswer("");
        if (onCancel) onCancel();
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
                {editingFAQ ? "Edit FAQ" : "Add New FAQ"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                    </label>
                    <input
                        id="question"
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Enter FAQ question"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-grey-500 focus:border-grey-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                        Answer
                    </label>
                    <textarea
                        id="answer"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Enter FAQ answer"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-grey-500 focus:border-grey-500 resize-vertical"
                        required
                    />
                </div>
                <div className="flex space-x-3">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium"
                    >
                        {editingFAQ ? "Update FAQ" : "Save FAQ"}
                    </button>
                    {editingFAQ && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AddFAQForm;
