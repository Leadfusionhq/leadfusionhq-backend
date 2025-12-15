"use client";
import React, { useState } from 'react';
import { Edit2, Settings, Check, X, Shield } from 'lucide-react';


const AccountSetting = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [accountData, setAccountData] = useState({
    status: 'Active',
    monthlyBudget: 'No',
    cooldown: '-',
    wtCooldown: '-',
    homeProposal: '(N/A)',
    authorizedUser: 'Participant'
  });

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: string, value: string) => {
    setAccountData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 md:px-8 border-b border-gray-100 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#306A64]" />
            Account Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account configuration and preferences.
          </p>
        </div>

        <button
          onClick={handleEdit}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isEditing
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
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

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Status</label>
            {isEditing ? (
              <div className="relative">
                <select
                  value={accountData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20 appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${accountData.status === 'Active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${accountData.status === 'Active' ? "bg-green-500" : "bg-red-500"}`} />
                  {accountData.status}
                </span>
              </div>
            )}
          </div>

          {/* Monthly Budget */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Set a Monthly Budget?</label>
            <div className={`w-full px-4 py-2.5 rounded-lg border flex items-center gap-6 ${isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"}`}>
              {['Yes', 'No'].map((option) => (
                <label key={option} className={`flex items-center gap-2 cursor-pointer ${!isEditing && "pointer-events-none opacity-80"}`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${accountData.monthlyBudget === option
                      ? "border-[#306A64]"
                      : "border-gray-300"
                    }`}>
                    {accountData.monthlyBudget === option && (
                      <div className="w-2 h-2 rounded-full bg-[#306A64]" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="monthlyBudget"
                    value={option}
                    checked={accountData.monthlyBudget === option}
                    onChange={(e) => handleInputChange('monthlyBudget', e.target.value)}
                    disabled={!isEditing}
                    className="hidden"
                  />
                  <span className="text-sm font-medium text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cooldown */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Cooldown (mins)</label>
            <input
              type="text"
              value={accountData.cooldown}
              disabled={!isEditing}
              onChange={(e) => handleInputChange('cooldown', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${!isEditing
                ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                }`}
            />
          </div>

          {/* WT Cooldown */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">WT Cooldown (mins)</label>
            <input
              type="text"
              value={accountData.wtCooldown}
              disabled={!isEditing}
              onChange={(e) => handleInputChange('wtCooldown', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${!isEditing
                ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                }`}
            />
          </div>

          {/* Home Proposal */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Home 2nd Proposal (days)</label>
            <input
              type="text"
              value={accountData.homeProposal}
              disabled={!isEditing}
              onChange={(e) => handleInputChange('homeProposal', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${!isEditing
                ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white border-gray-300 focus:border-[#306A64] focus:ring-2 focus:ring-[#306A64]/20"
                }`}
            />
          </div>

          {/* Authorized User */}
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" /> Authorized User Role
            </label>
            <div className={`w-full px-4 py-2.5 rounded-lg border flex flex-wrap items-center gap-6 ${isEditing ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200"}`}>
              {['Admin', 'Viewer', 'Participant'].map((role) => (
                <label key={role} className={`flex items-center gap-2 cursor-pointer ${!isEditing && "pointer-events-none opacity-80"}`}>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${accountData.authorizedUser === role
                      ? "border-[#306A64]"
                      : "border-gray-300"
                    }`}>
                    {accountData.authorizedUser === role && (
                      <div className="w-2 h-2 rounded-full bg-[#306A64]" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="authorizedUser"
                    value={role}
                    checked={accountData.authorizedUser === role}
                    onChange={(e) => handleInputChange('authorizedUser', e.target.value)}
                    disabled={!isEditing}
                    className="hidden"
                  />
                  <span className="text-sm font-medium text-gray-700">{role}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end animate-in slide-in-from-top-2 duration-300">
            <button
              onClick={handleSave}
              className="px-8 py-2.5 bg-gradient-to-r from-[#306A64] to-[#204D9D] text-white rounded-lg hover:shadow-lg text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSetting;