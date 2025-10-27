'use client'

import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { toast } from 'react-toastify';
import { Camera } from 'lucide-react';
import Image from 'next/image';
import { Formik, Form } from 'formik';
import BasicInformationSection from '@/components/user-dashboard/settings/BasicInformationSection';
import AddressSection from '@/components/user-dashboard/settings/AddressSection';
import PasswordChangeSection from '@/components/user-dashboard/settings/PasswordChangeSection';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';
import { setUser } from '@/redux/auth/authSlice';


const SettingsPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'password'>('basic');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: '👤' },
    { id: 'address', label: 'Address Details', icon: '📍' },
    { id: 'password', label: 'Security', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* User Info Card with Avatar Upload */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Formik
                  initialValues={{ avatar: null }}
                  onSubmit={async (values, { setSubmitting, resetForm }) => {
                    if (!values.avatar) return;
                    try {
                      const formData = new FormData();
                      formData.append('avatar', values.avatar);

                      const res = (await axiosWrapper(
                        'patch',
                        API_URL.UPLOAD_MY_AVATAR,
                        formData,
                        token ?? undefined,
                        true
                      )) as { user: typeof user; message?: string };

                      // Update Redux with new user data
                      if (res.user) {
                        dispatch(setUser(res.user));
                        toast.success(res.message || 'Avatar updated successfully!');
                      }
                      

                      toast.success(res.message || 'Avatar updated successfully!');
                      resetForm();
                      setPreview(null);
                    } catch (err: any) {
                      toast.error(err?.message || 'Failed to upload avatar');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ setFieldValue, isSubmitting }) => (
                    <Form className="text-center">
                      {/* Avatar with Camera Icon */}
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <Image
                          src={
                            preview
                              ? preview
                              : user?.avatar
                              ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${user.avatar}`
                              : '/images/icons/User.svg'
                          }
                          alt="Profile"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                        />

                        {/* Camera icon overlay */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer absolute bottom-0 right-0 w-7 h-7 bg-gradient-to-r from-[#306A64] to-[#204D9D] border-2 border-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                          <Camera className="w-4 h-4 text-white" />
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
                              setFieldValue('avatar', file);
                              setPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </div>

                      <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {user?.role || 'USER'}
                      </span>

                      {/* Save button - only show when preview available */}
                      {preview && (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="mt-3 w-full px-4 py-2 text-sm text-white bg-gradient-to-r from-[#306A64] to-[#204D9D] rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : '💾 Save Avatar'}
                        </button>
                      )}
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {activeTab === 'basic' && <BasicInformationSection />}
              {activeTab === 'address' && <AddressSection />}
              {activeTab === 'password' && <PasswordChangeSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;