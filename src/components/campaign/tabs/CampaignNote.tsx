'use client'
import React from "react";
import { Field, ErrorMessage } from "formik";

interface Props {
  values: any;
  setFieldValue: (field: string, value: any) => void;
}

const CampaignNote: React.FC<Props> = ({ values, setFieldValue }) => {
  const maxChars = 500;
  const note = values?.note || "";

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    // Limit to 500 characters
    if (value.length > maxChars) {
      value = value.slice(0, maxChars);
    }

    setFieldValue("note", value);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Basic Information</h3>

      <textarea
        name="note"
        rows={8}
        placeholder="High-quality solar leads for residential customers in premium California zip codes"
        value={note}
        onChange={handleChange}
        className="w-full border border-[#E0E0E0] rounded-[8px] px-5 py-3 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition resize-vertical"
      />

      {/* Character counter */}
      <div className="text-right text-sm text-gray-500">
        {note.length}/{maxChars} characters
      </div>

      <ErrorMessage name="note" component="div" className="text-red-500 text-xs mt-1" />
    </div>
  );
};

export default CampaignNote;
