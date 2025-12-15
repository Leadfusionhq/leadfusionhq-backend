"use client";

import React, { useState } from "react";
import UserHeader from "@/components/admin-dashboard/setting-support/UserHeader";
import PersonalInformation from "@/components/admin-dashboard/setting-support/PersonalInformation";
import AddressSettings from "@/components/admin-dashboard/setting-support/AddressSettings";
import SecuritySettings from "@/components/admin-dashboard/setting-support/SecuritySettings";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { User, Lock, MapPin } from "lucide-react";

type Tab = 'profile' | 'address' | 'security';

const SettingsSupport = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  if (!user) return null;

  const tabs = [
    { id: 'profile', label: 'Basic Information', icon: User },
    { id: 'address', label: 'Address Details', icon: MapPin },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1 mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings & Support</h1>
        <p className="text-sm text-gray-500">Manage your profile, address, and security preferences.</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Navigation & Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">

            {/* Top: Navigation Menu */}
            <div className="p-4 space-y-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                // Custom Logic for Icon Colors based on image
                const iconColor = tab.id === 'profile' ? "text-purple-600" : tab.id === 'address' ? "text-pink-500" : "text-amber-500";
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-300 group relative ${isActive
                      ? "bg-gradient-to-r from-[#2F6662] to-[#204969] text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-white" : iconColor}`} />
                    <span className={`font-semibold text-sm ${isActive ? "text-white" : "text-gray-700"}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-4" />

            {/* Bottom: User Profile */}
            <div className="p-6">
              <UserHeader user={user} />
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'profile' && <PersonalInformation user={user} />}
            {activeTab === 'address' && <AddressSettings />}
            {activeTab === 'security' && <SecuritySettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSupport;
