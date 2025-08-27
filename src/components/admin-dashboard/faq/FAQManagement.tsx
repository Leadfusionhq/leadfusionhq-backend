"use client";

import React, { useState } from "react";
import AddFAQForm from "@/components/admin-dashboard/faq/AddFAQForm";
import FAQList from "@/components/admin-dashboard/faq/FAQList";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// Example FAQ type
interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQManagement = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  // Save new or edited FAQ
  const handleSave = (faq: FAQ) => {
    if (editingFAQ) {
      setFaqs(faqs.map((f) => (f.id === faq.id ? faq : f)));
      setEditingFAQ(null);
    } else {
      setFaqs([...faqs, { ...faq, id: Date.now().toString() }]);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingFAQ(null);
  };

  // Edit FAQ
  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
  };

  // Delete FAQ
  const handleDelete = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <AddFAQForm
        editingFAQ={editingFAQ || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <FAQList faqs={faqs} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
};

export default FAQManagement;
