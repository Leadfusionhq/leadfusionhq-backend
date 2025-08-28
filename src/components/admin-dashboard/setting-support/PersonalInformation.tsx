"use client";
import { useState } from "react";
import { Formik, Form, Field ,ErrorMessage} from "formik";
import { Edit } from "lucide-react";
import { toast } from "react-toastify";
import axiosWrapper from "@/utils/api";
import { API_URL } from "@/utils/apiUrl";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getErrorMessage } from '@/utils/getErrorMessage';
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/auth/authSlice";
import * as Yup from "yup";
interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string; 
  address?: string;
  role: string;
  dob?: string;
}

const PersonalInformation = ({ user }) => {
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
    address: user?.address || "",
    userRole: user?.role || "USER",
  };

  // ✅ Validation schema
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
    address: Yup.string()
      .required("address is required"),
    
  });

  const handleSubmit = async (values: typeof initialValues, { resetForm }: any) => {
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phoneNumber: values.phone,
        address: values.address,
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
          id: user._id,
          name: values.name,
          email: values.email,
          phoneNumber: values.phone,
          address: values.address,
          dob: values.dateOfBirth || null,
        })
      );

      toast.success(res?.message || "Profile updated successfully!");
      setIsEditing(false);
      resetForm({ values }); // ✅ keep updated values in form after save
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
   
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          enableReinitialize
        >
          {({ values, errors, touched, resetForm }) => (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Personal Information
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      resetForm(); // ✅ now works correctly
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded hover:bg-gray-800 flex items-center space-x-1"
                >
                  <Edit className="w-3 h-3" />
                  <span>{isEditing ? "Close" : "Edit"}</span>
                </button>
              </div>
    
              {/* Form */}
              <div className="px-6 py-6">
                <Form>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Name
                      </label>
                      {isEditing ? (
                        <>
                          <Field
                            type="text"
                            name="name"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 ${
                              errors.name && touched.name
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage
                            name="name"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </>
                      ) : (
                        <p className="text-gray-900 font-medium">{values.name}</p>
                      )}
                    </div>
    
                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <>
                          <Field
                            type="date"
                            name="dateOfBirth"
                            max={new Date().toISOString().split("T")[0]} // ✅ prevent future selection
                            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 ${
                              errors.dateOfBirth && touched.dateOfBirth
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage
                            name="dateOfBirth"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </>
                      ) : (
                        <p className="text-gray-900 font-medium">
                          {values.dateOfBirth
                            ? new Date(values.dateOfBirth).toLocaleDateString(
                                "en-GB"
                              )
                            : "—"}
                        </p>
                      )}
                    </div>
    
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Email Address
                      </label>
                      {isEditing ? (
                        <>
                          <Field
                            type="email"
                            name="email"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 ${
                              errors.email && touched.email
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage
                            name="email"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </>
                      ) : (
                        <p className="text-gray-900 font-medium">{values.email}</p>
                      )}
                    </div>
    
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <>
                          <Field
                            type="text"
                            name="phone"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 ${
                              errors.phone && touched.phone
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage
                            name="phone"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </>
                      ) : (
                        <p className="text-gray-900 font-medium">{values.phone}</p>
                      )}
                    </div>
    
                   
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Address
                      </label>
                      {isEditing ? (
                        <>
                          <Field
                            type="text"
                            name="address"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 ${
                              errors.address && touched.address
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage
                            name="address"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </>
                      ) : (
                        <p className="text-gray-900 font-medium">{values.address}</p>
                      )}
                    </div>

    
                    {/* User Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        User Role
                      </label>
                      {isEditing ? (
                        <Field
                          type="text"
                          name="userRole"
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{values.userRole}</p>
                      )}
                    </div>
                  </div>
    
                  {/* Buttons */}
                  {isEditing && (
                    <div className="mt-6 flex space-x-3">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetForm(); // ✅ works fine
                          setIsEditing(false);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </Form>
              </div>
            </>
          )}
        </Formik>
      </div>
  );
};

export default PersonalInformation;