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
}

const CampaignDelivery: React.FC<CampaignDeliveryProps> = ({
  values,
  setFieldValue,
  activeDeliveryTab,
  setActiveDeliveryTab,
}) => {
  const tabs = ["method", "schedule", "other"] as const;

  return (
    <div className="space-y-6">
      <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Delivery Settings</h3>

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

      {activeDeliveryTab === "method" && (
        <div className="space-y-8">
          {/* Delivery Method */}
          <div className="border border-[#E0E0E0] rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4">Delivery Method</h4>
            <div className="flex flex-col gap-3">
              <FormikRadio name="delivery.method" value="email" label="Email Delivery" />
              <FormikRadio name="delivery.method" value="phone" label="Phone Delivery" />
              <FormikRadio name="delivery.method" value="crm" label="CRM Integration" />
            </div>
          </div>

          {/* Email */}
          <div className="border border-[#E0E0E0] rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center gap-2">Email Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput
                name="delivery.email.addresses"
                label="Email Address(es)"
                placeholder="recipient1@example.com, recipient2@example.com"
              />
              <FormikInput
                name="delivery.email.subject"
                label="Subject Line"
                placeholder="New leads available"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="border border-[#E0E0E0] rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center gap-2">Phone Configuration</h4>
            <div className="grid grid-cols-1 gap-6">
              <FormikInput
                name="delivery.phone.numbers"
                label="Phone Number(s)"
                placeholder="123-456-7890, 987-654-3210"
              />
            </div>
          </div>

          {/* CRM */}
          <div className="border border-[#E0E0E0] rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center gap-2">CRM Configuration</h4>
            <div>
              <FormikTextarea
                name="delivery.crm.instructions"
                label="CRM Post Instructions"
                rows={4}
                placeholder="Enter detailed CRM integration instructions..."
              />
            </div>
          </div>
        </div>
      )}

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
                <FormikInput name={`delivery.schedule.days.${index}.start_time`} type="time" label="Start" />
                <FormikInput name={`delivery.schedule.days.${index}.end_time`} type="time" label="End" />
                <FormikInput name={`delivery.schedule.days.${index}.cap`} type="number" label="Cap" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeDeliveryTab === "other" && (
        <div className="space-y-6">
          <h4 className="text-lg font-medium">Other Settings</h4>
          <div className="border border-[#E0E0E0] rounded-lg p-6">
            <div className="grid grid-cols-1 gap-6">
              <FormikInput
                name="delivery.other.homeowner_count"
                type="number"
                min="0"
                placeholder="0"
                label="Homeowner 2nd Proposal Request (days)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDelivery;
