"use client";

import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import axiosWrapper from "@/utils/api";
import { FEEDBACK_API } from "@/utils/apiUrl";
import { toast } from "react-toastify";

interface Feedback {
  _id: string;
  title: string;
  description: string;
  userId: string;
  createdAt: string;
}

const FeedbackForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get auth data from Redux store
  const { user, token } = useSelector((state: RootState) => state.auth);

  const initialValues = {
    title: "",
    description: "",
  };

  const validationSchema = Yup.object({
    title: Yup.string()
      .min(5, "Title must be at least 5 characters")
      .max(100, "Title cannot exceed 100 characters")
      .required("Title is required"),
    description: Yup.string()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description cannot exceed 1000 characters")
      .required("Description is required"),
  });

  const handleSubmit = async (values: typeof initialValues, { resetForm }: any) => {
    setIsSubmitting(true);
  
    try {
      const feedbackData = {
        ...values,
      };
  
      const response = (await axiosWrapper(
        "post",
        FEEDBACK_API.CREATE_FEEDBACK,
        feedbackData,
        token || undefined
      )) as { feedback?: any; message?: string };
  
      // Check if we have a feedback object in response (indicating success)
      if (response.feedback) {
        resetForm(); // ✅ clear form on success
        toast.success(response.message || "Feedback submitted successfully!");
      } else {
        toast.error(response.message || "Failed to submit feedback");
      }
    } catch (error: any) {
      console.error("Error saving feedback:", error);
  
      let errorMessage = "An error occurred while submitting feedback";
  
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = "No response from server";
      } else {
        errorMessage = error.message || errorMessage;
      }
  
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Share Your Feedback</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title
              </label>
              <Field
                id="title"
                name="title"
                type="text"
                placeholder="Enter feedback title"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                  errors.title && touched.title
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              <ErrorMessage
                name="title"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <Field
                as="textarea"
                id="description"
                name="description"
                placeholder="Enter your detailed feedback here..."
                rows={6}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-vertical ${
                  errors.description && touched.description
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              <ErrorMessage
                name="description"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            <div className="flex">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Save Feedback"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default FeedbackForm;
