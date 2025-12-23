'use client'

import React from 'react';
import { FormikInput, FormikRadio, FormikTextarea, FormikCheckbox, FormikSelect } from '@/components/form';

interface DeliveryValues {
  delivery: any;
}

interface CampaignDeliveryProps {
  values: DeliveryValues;
  setFieldValue: (field: string, value: any) => void;
  activeDeliveryTab: 'method' | 'schedule' | 'other';
  setActiveDeliveryTab: (tab: 'method' | 'schedule' | 'other') => void;
  isEditMode?: boolean;
  formKey?: number;
}

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
];

const CampaignDelivery: React.FC<CampaignDeliveryProps> = ({
  values,
  setFieldValue,
  activeDeliveryTab,
  setActiveDeliveryTab,
  isEditMode = false,
  formKey
}) => {
  const tabs = ["method", "schedule"] as const;

  const handleDeliveryMethodChange = (method: string, isChecked: boolean) => {
    const currentMethods = values.delivery.method || [];

    if (isChecked) {
      setFieldValue('delivery.method', [...currentMethods, method]);
    } else {
      setFieldValue('delivery.method', currentMethods.filter((m: string) => m !== method));

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

  const isMethodSelected = (method: string) => {
    return (values.delivery.method || []).includes(method);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Delivery Settings</h3>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveDeliveryTab(tab)}
            className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${activeDeliveryTab === tab
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
        <div className="space-y-4 sm:space-y-8">
          <div className="border border-[#E0E0E0] rounded-lg p-4 sm:p-6">
            <h4 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Delivery Method(s) *</h4>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Select one or more delivery methods</p>
            <div className="flex flex-col gap-2 sm:gap-3">
              <FormikCheckbox
                key={`email-${formKey}`}
                name="delivery.method.email"
                checked={isMethodSelected('email')}
                label="Email Delivery"
                onChange={(e) => handleDeliveryMethodChange('email', e.target.checked)}
              />
              <FormikCheckbox
                key={`phone-${formKey}`}
                name="delivery.method.phone"
                checked={isMethodSelected('phone')}
                label="Phone Delivery"
                onChange={(e) => handleDeliveryMethodChange('phone', e.target.checked)}
              />
              <FormikCheckbox
                key={`crm-${formKey}`}
                name="delivery.method.crm"
                checked={isMethodSelected('crm')}
                label="CRM Integration"
                onChange={(e) => handleDeliveryMethodChange('crm', e.target.checked)}
              />
            </div>
          </div>

          {/* Conditional Fields (existing) */}
          {isMethodSelected('email') && (
            <div className="border border-[#E0E0E0] rounded-lg p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Email Configuration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <FormikInput
                  name="delivery.email.addresses"
                  label="Email Address(es) *"
                  placeholder="recipient1@example.com"
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
            <div className="border border-[#E0E0E0] rounded-lg p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Phone Configuration</h4>
              <FormikInput
                name="delivery.phone.numbers"
                label="Phone Number(s) *"
                placeholder="123-456-7890"
                required
              />
            </div>
          )}

          {isMethodSelected('crm') && (
            <div className="border border-[#E0E0E0] rounded-lg p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">CRM Configuration</h4>
              <FormikTextarea
                name="delivery.crm.instructions"
                label="CRM Post Instructions *"
                rows={4}
                placeholder="Enter CRM instructions..."
                required
              />
            </div>
          )}
        </div>
      )}

      {/* ✅ NEW Schedule Tab */}
      {activeDeliveryTab === "schedule" && (
        <div className="space-y-4 sm:space-y-6">
          <h4 className="text-base sm:text-lg font-medium">Delivery Schedule</h4>

          {/* ✅ Time Range + Timezone */}
          <div className="border border-[#E0E0E0] rounded-lg p-4 sm:p-6">
            <h5 className="text-sm sm:text-md font-medium mb-2 sm:mb-4">Operating Hours</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <FormikInput
                name="delivery.schedule.start_time"
                type="time"
                label="Start Time *"
                required
              />
              <FormikInput
                name="delivery.schedule.end_time"
                type="time"
                label="End Time *"
                required
              />
              <div className="sm:col-span-2 md:col-span-1">
                <FormikSelect
                  name="delivery.schedule.timezone"
                  label="Timezone *"
                  options={TIMEZONE_OPTIONS}
                  required
                />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Leads delivered during these hours ({values.delivery.schedule.timezone})
            </p>
          </div>

          {/* ✅ Active Days (no individual times) */}
          <div className="border border-[#E0E0E0] rounded-lg p-4 sm:p-6">
            <h5 className="text-sm sm:text-md font-medium mb-2 sm:mb-4">Active Days</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {values.delivery.schedule.days.map((day: any, index: number) => (
                <FormikCheckbox
                  key={day.day}
                  name={`delivery.schedule.days.${index}.active`}
                  label={day.day}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDelivery;