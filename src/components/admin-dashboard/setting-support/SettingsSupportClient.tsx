"use client";

import React from "react";
import UserHeader from "@/components/admin-dashboard/setting-support/UserHeader";
import PersonalInformation from "@/components/admin-dashboard/setting-support/PersonalInformation";
import AccountSetting from "@/components/admin-dashboard/setting-support/AccountSetting";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const SettingsSupport = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  // console.log(user);


  const handleUserEdit = () => {
    console.log("Edit user profile");
  };

  const handleMainSave = () => {
    console.log("Save all changes");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {user && (
        <>
          <UserHeader user={user} />
          <PersonalInformation user={user} />
          {/* <AccountSetting /> */}
  
          {/* <button
            onClick={handleMainSave}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm font-medium mt-4"
          >
            Save
          </button> */}
        </>
      )}
    </div>
  );
  
};

export default SettingsSupport;
