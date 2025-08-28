"use client";
import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import axiosWrapper from "@/utils/api";
import { API_URL } from "@/utils/apiUrl";
import { setUser,updateAvatar } from "@/redux/auth/authSlice";
import { Formik, Form } from "formik";
import Image from "next/image";

const UserHeader = ({ user }) => {
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

          // Send request
          const res = (await axiosWrapper(
            "patch",
            url,
            formData,
            token ?? undefined,
            true
          )) as { user: typeof user; message?: string };

          console.log(res,res.user);
          // ✅ Update Redux with new avatar WITHOUT touching token or isLoggedIn
          dispatch(setUser(res.user));
          // directly use the backend response


          // ✅ Show success toast
          toast.success(res.message || "Avatar updated successfully!");

          resetForm();
          setPreview(null);
        } catch (err: any) {
          // Only show error if really failed
          toast.error(err?.message || "Failed to upload avatar");
        } finally {
          setSubmitting(false);
        }
      }}
    >

      {({ setFieldValue, isSubmitting }) => (
        <Form className="flex items-center justify-between mb-8 p-4 bg-white rounded shadow-sm">
          {/* Left side: Avatar + Info */}
          <div className="flex items-center">
            {/* Avatar with Camera */}
            <div className="relative w-20 h-20 rounded-full mr-4">
            <Image
              src={
                preview
                  ? preview
                  : user?.avatar
                  ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${user.avatar}`
                  : "/images/icons/User.svg"
              }
              alt="Profile"
              width={100} // set width
              height={100} // set height
              className="w-full h-full object-cover rounded-full"
            />




              {/* Camera icon overlay */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer absolute bottom-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-100"
              >
                <Camera className="w-3 h-3 text-gray-500" />
              </div>

              {/* Hidden File Input */}
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

            {/* User Info */}
            <div>
            <h1 className="text-xl font-semibold text-gray-900">{user?.name || "No Name"}</h1>
            <p className="text-gray-600 text-sm">{user?.role || "No Role"}</p>
            <p className="text-gray-500 text-sm">{user?.address || "No Address"}</p>

            </div>
          </div>

          {/* ✅ Show Save button only when preview available */}
          {preview && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded hover:bg-gray-800 flex items-center space-x-1"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default UserHeader;
