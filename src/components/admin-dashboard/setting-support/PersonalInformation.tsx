"use client";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Edit2,
  X,
  Check
} from "lucide-react";
import { toast } from "react-toastify";
import axiosWrapper from "@/utils/api";
import { API_URL } from "@/utils/apiUrl";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { setUser, User } from "@/redux/auth/authSlice";
import * as Yup from "yup";

const PersonalInformation = ({ user }: { user: User }) => {
  const [isEditing, setIsEditing] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();

  const initialValues = {
    name: user?.name || "",
    dateOfBirth: user?.dob
      ? new Date(user.dob).toISOString().split("T")[0]
      : "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    dateOfBirth: Yup.date()
      .required("Date of Birth is required")
      .max(new Date(), "Date of Birth cannot be in the future"),
    phone: Yup.string()
      .matches(/^\+?[0-9\- ]+$/, "Only numbers are allowed")
      .required("Phone number is required"),
  });

  const handleSubmit = async (values: typeof initialValues, { resetForm }: any) => {
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phoneNumber: values.phone,
        dob: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
      };

      const url = API_URL.UPDATE_ADMIN.replace(":adminId", user._id);
      const res = (await axiosWrapper(
        "put",
        url,
        payload,
        token ?? undefined
      )) as { message?: string };

      dispatch(
        setUser({
          ...user,
          _id: user._id,
          name: values.name,
          email: values.email,
          phoneNumber: values.phone,
          dob: values.dateOfBirth || null,
        })
      );

      toast.success(res?.message || "Profile updated successfully!");
      setIsEditing(false);
      resetForm({ values });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        enableReinitialize
      >
        {({ values, errors, touched, resetForm, isSubmitting }) => (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 md:px-8 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#306A64]" />
                  Personal Information
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your personal details and contact info.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    resetForm();
                    setIsEditing(false);
                  } else {
                    setIsEditing(true);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isEditing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white hover:shadow-lg"
                  }`}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" /> Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" /> Edit
                  </>
                )}
              </button>
            </div>

            {/* Form Fields */}
            <Form className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400" /> Name
                  </label>
                  <Field
                    type="text"
                    name="name"
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${!isEditing
                      ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      : errors.name && touched.name
                        ? "bg-white border-red-500 focus:ring-2 focus:ring-red-200"
                        : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                      }`}
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Date of Birth
                  </label>
                  <Field
                    type="date"
                    name="dateOfBirth"
                    disabled={!isEditing}
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${!isEditing
                      ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      : errors.dateOfBirth && touched.dateOfBirth
                        ? "bg-white border-red-500 focus:ring-2 focus:ring-red-200"
                        : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                      }`}
                  />
                  <ErrorMessage name="dateOfBirth" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                  </label>
                  <Field
                    type="text"
                    name="phone"
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${!isEditing
                      ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      : errors.phone && touched.phone
                        ? "bg-white border-red-500 focus:ring-2 focus:ring-red-200"
                        : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                      }`}
                  />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> Email Address
                  </label>
                  <Field
                    type="email"
                    name="email"
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${!isEditing
                      ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      : errors.email && touched.email
                        ? "bg-white border-red-500 focus:ring-2 focus:ring-red-200"
                        : "bg-white border-gray-300 focus:border-[#306A64] focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                      }`}
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1 font-medium" />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-3 animate-in slide-in-from-top-2 duration-300">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white rounded-lg hover:shadow-lg text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </Form>
          </>
        )}
      </Formik>
    </div>
  );
};

export default PersonalInformation;