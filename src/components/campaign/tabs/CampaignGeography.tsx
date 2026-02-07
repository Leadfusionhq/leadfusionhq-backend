'use client'
import React, { useEffect, useRef } from "react";
import { ErrorMessage } from "formik";
import { FormikInput, FormikRadio, FormikTextarea, CustomFormikAsyncSelect } from "@/components/form";

type CountyOption = { label: string; value: string };

interface County {
  _id: string;
  name: string;
}

interface GeographyProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  loadStates: (inputValue: string, callback: (options: CountyOption[]) => void) => void;
  isEditMode?: boolean;
  isAdmin?: boolean;
  formKey?: number;
}

const CampaignGeography: React.FC<GeographyProps> = ({
  values,
  setFieldValue,
  loadStates,
  isEditMode = false,
  isAdmin = false,
  formKey
}) => {
  const previousZipData = useRef({
    zipcode: "",
    zip_codes: "",
  });

  const isLocked = false;

  const handleFullStateSelect = () => {
    if (!isLocked) {
      // Cache ZIP data before clearing
      previousZipData.current = {
        zipcode: values.geography.coverage.partial.zipcode || "",
        zip_codes: values.geography.coverage.partial.zip_codes || "",
      };

      setFieldValue("geography.coverage.type", "FULL_STATE");
      setFieldValue("geography.coverage.partial.counties", []);
      setFieldValue("geography.coverage.partial.radius", "");
      setFieldValue("geography.coverage.partial.zipcode", "");
      setFieldValue("geography.coverage.partial.zip_codes", "");
    }
  };

  const handlePartialSelect = () => {
    if (!isLocked) {
      setFieldValue("geography.coverage.type", "PARTIAL");

      // ✅ Clear state to avoid saving old data
      setFieldValue("geography.state", []);

      // Restore cached ZIP data
      if (previousZipData.current.zip_codes) {
        setFieldValue("geography.coverage.partial.zipcode", previousZipData.current.zipcode);
        setFieldValue("geography.coverage.partial.zip_codes", previousZipData.current.zip_codes);
      }
    }
  };




  useEffect(() => {
    if (!isEditMode && formKey) {
      console.log('Geography form reset detected, formKey:', formKey);
    }
  }, [formKey, isEditMode]);

  // Determine required fields based on coverage type
  const isStateRequired = values.geography.coverage?.type === "FULL_STATE";
  const isZipRequired = values.geography.coverage?.type === "PARTIAL";

  return (
    <div className="space-y-5 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Geography Settings</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* State Field */}
        {/* State Field – only show when FULL_STATE is selected */}
        {values.geography.coverage.type === "FULL_STATE" && (
          <CustomFormikAsyncSelect
            key={`state-${formKey}`}
            name="geography.state"
            label={`State ${isStateRequired ? '*' : '(Optional)'}`}
            isMulti
            loadOptions={loadStates}
            placeholder="Search and select a state"
            isDisabled={isLocked}
            isClearable={!isStateRequired}
            onChange={(option) => {
              if (!isLocked) {
                setFieldValue("geography.state", option || []);
                setFieldValue("utilities.include_some", []);
                setFieldValue("utilities.exclude_some", []);
              }
            }}
          />
        )}


        {/* Coverage Type */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-[#1C1C1C] text-sm sm:text-base md:text-lg mb-2">Coverage *</label>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <FormikRadio
              key={`full-state-${formKey}`}
              name="geography.coverage.type"
              value="FULL_STATE"
              label="Full State"
              disabled={isLocked}
              onChange={handleFullStateSelect}
            />
            <FormikRadio
              key={`partial-${formKey}`}
              name="geography.coverage.type"
              value="PARTIAL"
              label="Partial"
              disabled={isLocked}
              onChange={handlePartialSelect}
            />
          </div>
          <ErrorMessage
            name="geography.coverage.type"
            component="div"
            className="text-red-500 text-xs mt-1"
          />
        </div>
      </div>

      {/* ZIP Codes Field for PARTIAL */}
      {values.geography.coverage.type === "PARTIAL" && (
        <>
          <p className="text-center text-[#666666] text-xs sm:text-sm italic px-2">
            Please enter ZIP codes separated by | (e.g., 90210|10001|33101)
          </p>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <FormikTextarea
              key={`zip-codes-${formKey}`}
              name="geography.coverage.partial.zip_codes"
              label={`ZIP Codes (separated by |) ${isZipRequired ? '*' : ''}`}
              placeholder="#####|#####|#####..."
              rows={3}
              disabled={isLocked}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setFieldValue("geography.coverage.partial.zip_codes", e.target.value.replace(/\s/g, ""));
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignGeography;