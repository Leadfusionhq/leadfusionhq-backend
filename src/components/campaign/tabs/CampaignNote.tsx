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
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-base sm:text-lg md:text-[20px] font-[500] text-[#1C1C1C] mb-2 sm:mb-4">Notes (Optional)</h3>

      <textarea
        name="note"
        rows={6}
        placeholder="High-quality solar leads for residential customers in premium California zip codes"
        value={note}
        onChange={handleChange}
        className="w-full border border-[#E0E0E0] rounded-lg px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition resize-vertical min-h-[120px] sm:min-h-[150px]"
      />

      {/* Character counter */}
      <div className="text-right text-xs sm:text-sm text-gray-500">
        {note.length}/{maxChars} characters
      </div>

      <ErrorMessage name="note" component="div" className="text-red-500 text-[10px] sm:text-xs mt-1" />
    </div>
  );
};

export default CampaignNote;
