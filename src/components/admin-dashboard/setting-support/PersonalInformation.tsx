"use client";
import React, { useState } from 'react';
import { Edit } from 'lucide-react';

const PersonalInformation = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [personalData, setPersonalData] = useState({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '11-07-1990',
      email: 'info@johndoe.com',
      phone: '(+62)821 525-9583',
      userRole: 'Participate'
    });
  
    const handleEdit = () => {
      setIsEditing(!isEditing);
    };
  
    const handleInputChange = (field, value) => {
      setPersonalData(prev => ({
        ...prev,
        [field]: value
      }));
    };
  
    const handleSave = () => {
      setIsEditing(false);
    };
  
    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
          <button 
            onClick={handleEdit}
            className="px-3 py-1.5 text-sm text-white bg-gray-900 rounded hover:bg-gray-800 flex items-center space-x-1"
          >
            <Edit className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>
        
        <div className="px-6 py-6">
          <div className="grid grid-cols-3 gap-x-8 gap-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={personalData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{personalData.firstName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={personalData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{personalData.lastName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value="1990-07-11"
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    const formatted = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                    handleInputChange('dateOfBirth', formatted);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{personalData.dateOfBirth}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={personalData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{personalData.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={personalData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{personalData.phone}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">User Role</label>
              {isEditing ? (
                <select
                  value={personalData.userRole}
                  onChange={(e) => handleInputChange('userRole', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Participate">Participate</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              ) : (
                <p className="text-gray-900 font-medium">{personalData.userRole}</p>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
};
  
export default PersonalInformation; 