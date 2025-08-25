// User Header Component
"use client";
import React, { useState } from 'react';
import { Edit, Camera } from 'lucide-react';

const UserHeader = ({ user, onEdit }) => {
  return (
    <div className="flex items-center justify-between mb-8 p-4 bg-white rounded shadow-sm">
      {/* Left side: Avatar + Info */}
      <div className="flex items-center">
        {/* Avatar with Camera */}
        <div className="relative w-20 h-20 rounded-full mr-4">
          <img 
            src="/images/icons/User.svg"
            alt="Profile"
            className="w-full h-full object-cover rounded-full"
          />
          <div className="absolute bottom-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow">
            <Camera className="w-3 h-3 text-gray-500" />
          </div>
        </div>
        {/* User Info */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
          <p className="text-gray-600 text-sm">{user.role}</p>
          <p className="text-gray-500 text-sm">{user.location}</p>
        </div>
      </div>

      {/* Right side: Edit button */}
      <button
        onClick={onEdit}
        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 flex items-center space-x-1"
      >
        <Edit className="w-3 h-3" />
        <span>Edit</span>
      </button>
    </div>
  );
};

export default UserHeader;
