"use client";
import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import axiosWrapper from "@/utils/api";
import { API_URL } from "@/utils/apiUrl";
import { setUser, User } from "@/redux/auth/authSlice";
import { Formik, Form } from "formik";
import Image from "next/image";

const UserHeader = ({ user }: { user: User }) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Formik
      initialValues={{ avatar: null }}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        if (!values.avatar) return;
        try {
          const formData = new FormData();
          formData.append("avatar", values.avatar);

          const url = API_URL.UPLOAD_AVATAR.replace(":adminId", user._id);

          const res = (await axiosWrapper(
            "patch",
            url,
            formData,
            token ?? undefined,
            true
          )) as { user: typeof user; message?: string };

          dispatch(setUser(res.user));
          toast.success(res.message || "Avatar updated successfully!");

          resetForm();
          setPreview(null);
        } catch (err: any) {
          toast.error(err?.message || "Failed to upload avatar");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ setFieldValue, isSubmitting }) => (
        <Form className="flex flex-col items-center text-center gap-4 w-full">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-inner overflow-hidden relative bg-gray-50">
              <Image
                src={
                  preview
                    ? preview
                    : user?.avatar
                      ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${user.avatar}`
                      : "/images/icons/User.svg"
                }
                alt="Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>

            {/* Camera Upload Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-1.5 bg-[#306A64] rounded-full shadow-md border-2 border-white cursor-pointer 
                         text-white hover:bg-[#204D9D] transition-all duration-200 group-hover:scale-110"
            >
              <Camera className="w-3.5 h-3.5" />
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFieldValue("avatar", file);
                  setPreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>

          {/* User Info Section */}
          <div className="w-full space-y-1">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-tight w-full">
              {user?.name || "Admin User"}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {user?.email || "admin@example.com"}
            </p>

            <div className="flex justify-center pt-2">
              <span className="inline-flex items-center px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                {user?.role || "USER"}
              </span>
            </div>

            {/* Save Button (Only visible when file selected) */}
            {preview && (
              <div className="h-8 flex justify-center w-full mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="animate-in fade-in slide-in-from-bottom-1 duration-200 inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 
                                transition-all font-medium text-xs shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Photo"}
                </button>
              </div>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default UserHeader;
