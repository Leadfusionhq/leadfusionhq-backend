"use client";

import React, { useState, useEffect } from "react";
import AddFAQForm from "@/components/admin-dashboard/faq/AddFAQForm";
import FAQList from "@/components/admin-dashboard/faq/FAQList";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axiosWrapper from "@/utils/api";
import { FAQ_API } from "@/utils/apiUrl";
interface FAQ {
  _id: string;
  question: string;
  answer: string;
  isActive: boolean;
  createdBy?: {
    _id?: string; // Make it optional
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
interface FAQResponse {
  message?: string;
  faq?: FAQ;
  faqs?: FAQ[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}



const FAQManagement = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });

  // Fetch FAQs
  const fetchFAQs = async (page = 1, search = "") => {
    if (!token) return;
  
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
  
      if (search) params.append("search", search);
  
      const url = `${FAQ_API.GET_ALL_FAQS}?${params.toString()}`;
      const response = (await axiosWrapper("get", url, {}, token)) as FAQResponse;
  
      setFaqs(response.faqs || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch FAQs");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFAQs();
  }, [token]);

  // Save FAQ
  const handleSave = async (faqData: { question: string; answer: string }) => {
    if (!token) return;
  
    try {
      if (editingFAQ) {
        const url = FAQ_API.UPDATE_FAQ.replace(":faqId", editingFAQ._id);
        const response = (await axiosWrapper("put", url, faqData, token)) as FAQResponse;
        
        // Refresh after edit
        await fetchFAQs(pagination.current, searchTerm);
        
        setEditingFAQ(null);
        toast.success(response.message || "FAQ updated successfully");
      } else {
        const response = (await axiosWrapper("post", FAQ_API.CREATE_FAQ, faqData, token)) as FAQResponse;
        
        // Refresh after add (go to first page to see new item)
        await fetchFAQs(1, searchTerm);
        
        toast.success(response.message || "FAQ created successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save FAQ");
    }
  };
  

  const handleCancel = () => setEditingFAQ(null);

  const handleEdit = (faq: FAQ) => setEditingFAQ(faq);

 
  // Delete FAQ
  // Delete FAQ permanently
  const handleDelete = async (id: string) => {
    if (!token) return;
  
    try {
      const url = FAQ_API.DELETE_FAQ.replace(":faqId", id) + "?permanent=true";
      const response = (await axiosWrapper("delete", url, {}, token)) as FAQResponse;
  
      // Refresh the list with current search term and page
      await fetchFAQs(pagination.current, searchTerm);
      
      toast.success(response.message || "FAQ deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete FAQ");
    }
  };


  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm); // Store the search term
    fetchFAQs(1, searchTerm);
  };

  const handlePageChange = (page: number) => fetchFAQs(page);

  if (!token) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-10">
          <p className="text-gray-600">Please log in to manage FAQs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">FAQ Management</h1>
        <p className="text-gray-600">Manage frequently asked questions for your application.</p>
      </div>

      <AddFAQForm editingFAQ={editingFAQ} onSave={handleSave} onCancel={handleCancel} />

      <FAQList
        faqs={faqs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default FAQManagement;
