"use client";

import React, { useState } from 'react';
import UserHeader from "@/components/admin-dashboard/setting-support/UserHeader";
import PersonalInformation from "@/components/admin-dashboard/setting-support/PersonalInformation";
import AccountSetting from "@/components/admin-dashboard/setting-support/AccountSetting";

const SettingsSupport = () => {
    const [user] = useState({
      name: 'John Doe',
      role: 'Participate',
      location: 'Leeds, United Kingdom'
    });
  
    const handleUserEdit = () => {
      console.log('Edit user profile');
    };
  
    const handleMainSave = () => {
      console.log('Save all changes');
    };
  
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <UserHeader user={user} onEdit={handleUserEdit} />
        <PersonalInformation />
        <AccountSetting />
        
        <button 
          onClick={handleMainSave}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm font-medium"
        >
          Save
        </button>
      </div>
    );
  };
  
  export default SettingsSupport;