'use client'

import React from 'react';
import { FormikInput, FormikRadio, FormikTextarea, FormikCheckbox } from '@/components/form';

interface DeliveryValues {
  delivery: any;
}

interface CampaignDeliveryProps {
  values: DeliveryValues;
  setFieldValue: (field: string, value: any) => void;
  activeDeliveryTab: 'method' | 'schedule' | 'other';
  setActiveDeliveryTab: (tab: 'method' | 'schedule' | 'other') => void;
  isEditMode?: boolean;
  formKey?: number; // Add formKey prop
}

const CampaignDelivery: React.FC<CampaignDeliveryProps> = ({
  values,
  setFieldValue,
  activeDeliveryTab,
  setActiveDeliveryTab,
  isEditMode = false,
  formKey // Receive formKey
}) => {
  const tabs = ["method", "schedule", "other"] as const;

  // Remove the problematic useEffect that was clearing fields on tab navigation
  // The form reset is handled by Formik's key prop and enableReinitialize

  // Handle delivery method checkbox change
  const handleDeliveryMethodChange = (method: string, isChecked: boolean) => {
    const currentMethods = values.delivery.method || [];
    
    if (isChecked) {
      // Add method if checked
      setFieldValue('delivery.method', [...currentMethods, method]);
    } else {
      // Remove method if unchecked
      setFieldValue('delivery.method', currentMethods.filter((m: string) => m !== method));
      
      // Clear related fields when method is deselected
      if (method === 'email') {
        setFieldValue('delivery.email.addresses', '');
        setFieldValue('delivery.email.subject', '');
      } else if (method === 'phone') {
        setFieldValue('delivery.phone.numbers', '');
      } else if (method === 'crm') {
        setFieldValue('delivery.crm.instructions', '');
      }
    }
  };

  // Check if a method is selected
  const isMethodSelected = (method: string) => {
    return (values.delivery.method || []).includes(method);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Delivery Settings</h3>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveDeliveryTab(tab)}
            className={`py-2 px-4 font-medium text-sm ${
              activeDeliveryTab === tab
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Method Tab */}
      {activeDeliveryTab === "method" && (
        <div className="space-y-8">
          <div className="border border-[#E0E0E0] rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Delivery Method(s) *</h4>
            <p className="text-sm text-gray-500 mb-4">Select one or more delivery methods</p>
            <div className="flex flex-col gap-3">
              <FormikCheckbox 
                key={`email-${formKey}`} // Add key to force re-render
                name="delivery.method.email" 
                checked={isMethodSelected('email')}
                label="Email Delivery"
                onChange={(e) => handleDeliveryMethodChange('email', e.target.checked)}
              />
              <FormikCheckbox 
                key={`phone-${formKey}`} // Add key to force re-render
                name="delivery.method.phone" 
                checked={isMethodSelected('phone')}
                label="Phone Delivery"
                onChange={(e) => handleDeliveryMethodChange('phone', e.target.checked)}
              />
              <FormikCheckbox 
                key={`crm-${formKey}`} // Add key to force re-render
                name="delivery.method.crm" 
                checked={isMethodSelected('crm')}
                label="CRM Integration"
                onChange={(e) => handleDeliveryMethodChange('crm', e.target.checked)}
              />
            </div>
          </div>

          {/* Conditional Fields */}
          {isMethodSelected('email') && (
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <h4 className="text-lg font-medium mb-4">Email Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormikInput
                  name="delivery.email.addresses"
                  label="Email Address(es) *"
                  placeholder="recipient1@example.com, recipient2@example.com"
                  required
                />
                <FormikInput
                  name="delivery.email.subject"
                  label="Subject Line *"
                  placeholder="New leads available"
                  required
                />
              </div>
            </div>
          )}

          {isMethodSelected('phone') && (
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <h4 className="text-lg font-medium mb-4">Phone Configuration</h4>
              <FormikInput
                name="delivery.phone.numbers"
                label="Phone Number(s) *"
                placeholder="123-456-7890, 987-654-3210"
                required
              />
            </div>
          )}

          {isMethodSelected('crm') && (
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <h4 className="text-lg font-medium mb-4">CRM Configuration</h4>
              <FormikTextarea
                name="delivery.crm.instructions"
                label="CRM Post Instructions *"
                rows={4}
                placeholder="Enter detailed CRM integration instructions..."
                required
              />
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeDeliveryTab === "schedule" && (
        <div className="space-y-6">
          <h4 className="text-lg font-medium">Weekly Schedule</h4>
          <div className="space-y-4">
            {values.delivery.schedule.days.map((day: any, index: number) => (
              <div
                key={day.day}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 border border-[#E0E0E0] rounded-lg"
              >
                <div className="font-medium text-[#1C1C1C]">{day.day}</div>
                <FormikCheckbox name={`delivery.schedule.days.${index}.active`} label="Active" />
                <FormikInput 
                  name={`delivery.schedule.days.${index}.start_time`} 
                  type="time" 
                  label="Start" 
                  disabled={!day.active}
                />
                <FormikInput 
                  name={`delivery.schedule.days.${index}.end_time`} 
                  type="time" 
                  label="End"
                  disabled={!day.active}
                />
                <FormikInput 
                  name={`delivery.schedule.days.${index}.cap`} 
                  type="number" 
                  label="Cap"
                  min="0"
                  disabled={!day.active}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Tab */}
      {activeDeliveryTab === "other" && (
        <div className="space-y-6">
          <h4 className="text-lg font-medium">Other Settings</h4>
          <div className="border border-[#E0E0E0] rounded-lg p-6">
            <FormikInput
              name="delivery.other.homeowner_count"
              type="number"
              min="0"
              placeholder="0"
              label="Homeowner 2nd Proposal Request (days)"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDelivery;