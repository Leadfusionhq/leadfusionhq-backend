"use client";
import React, { useState } from 'react';
import { Edit } from 'lucide-react';


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
  
    const handleInputChange = (field, value) => {
      setAccountData(prev => ({
        ...prev,
        [field]: value
      }));
    };
  
    const handleSave = () => {
      setIsEditing(false);
    };
  
    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Account Setting</h2>
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
              <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
              {isEditing ? (
                <select
                  value={accountData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              ) : (
                <p className="text-gray-900 font-medium">{accountData.status}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Set a Monthly Budget?</label>
              {isEditing ? (
                <div className="flex items-center space-x-6 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="monthlyBudgetEdit"
                      value="Yes"
                      checked={accountData.monthlyBudget === 'Yes'}
                      onChange={(e) => handleInputChange('monthlyBudget', e.target.value)}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="monthlyBudgetEdit"
                      value="No"
                      checked={accountData.monthlyBudget === 'No'}
                      onChange={(e) => handleInputChange('monthlyBudget', e.target.value)}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center space-x-6 mt-2">
                  <label className="flex items-center">
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="monthlyBudget"
                      checked={accountData.monthlyBudget === 'No'}
                      readOnly
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Cooldown (mins)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={accountData.cooldown}
                  onChange={(e) => handleInputChange('cooldown', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{accountData.cooldown}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">WT Cooldown (mins)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={accountData.wtCooldown}
                  onChange={(e) => handleInputChange('wtCooldown', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{accountData.wtCooldown}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Home 2nd Proposal request (days)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={accountData.homeProposal}
                  onChange={(e) => handleInputChange('homeProposal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-gray-900 font-medium">{accountData.homeProposal}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Add New Authorized User</label>
              {isEditing ? (
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="authorizedUserEdit"
                      value="Admin"
                      checked={accountData.authorizedUser === 'Admin'}
                      onChange={(e) => handleInputChange('authorizedUser', e.target.value)}
                      className="mr-1 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Admin</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="authorizedUserEdit"
                      value="Viewer"
                      checked={accountData.authorizedUser === 'Viewer'}
                      onChange={(e) => handleInputChange('authorizedUser', e.target.value)}
                      className="mr-1 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Viewer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="authorizedUserEdit"
                      value="Participant"
                      checked={accountData.authorizedUser === 'Participant'}
                      onChange={(e) => handleInputChange('authorizedUser', e.target.value)}
                      className="mr-1 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Participant</span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <span className="text-sm text-gray-700">Admin</span>
                  </label>
                  <label className="flex items-center">
                    <span className="text-sm text-gray-700">Viewer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="authorizedUser"
                      checked={accountData.authorizedUser === 'Participant'}
                      readOnly
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700">Participant</span>
                  </label>
                </div>
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

  export default  AccountSetting;