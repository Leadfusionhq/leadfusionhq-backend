'use client'
import React, { useEffect } from "react";
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
  countiesList: County[];
  isLoadingCounties: boolean;
  loadStates: (inputValue: string, callback: (options: CountyOption[]) => void) => void;
  isEditMode?: boolean;
  isAdmin?: boolean;
  formKey?: number;
}

const CampaignGeography: React.FC<GeographyProps> = ({
  values,
  setFieldValue,
  countiesList,
  isLoadingCounties,
  loadStates,
  isEditMode = false,
  isAdmin = false,
  formKey
}) => {
  const loadCounties = (inputValue: string, callback: (options: CountyOption[]) => void) => {
    const filtered = countiesList
      .filter((county) => county.name.toLowerCase().includes(inputValue.toLowerCase()))
      .map((county) => ({ label: county.name, value: county._id }));
    callback(filtered);
  };

  const isLocked = false;

  // Reset geography fields when form is reset (formKey changes)
  useEffect(() => {
    if (!isEditMode && formKey) {
      // This effect ensures that when we have a fresh form, all geography fields are properly reset
      console.log('Geography form reset detected, formKey:', formKey);
    }
  }, [formKey, isEditMode]);

  return (
    <div className="space-y-6">
      <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Geography Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomFormikAsyncSelect
          key={`state-${formKey}`}
          name="geography.state"
          label="State *"
          loadOptions={loadStates}
          placeholder="Search and select a state"
          isDisabled={isLocked}
          onChange={() => {
            if (!isLocked) {
              setFieldValue("geography.coverage.partial.counties", []);
              setFieldValue("utilities.include_some", []);
              setFieldValue("utilities.exclude_some", []);
            }
          }}
        />
        <div>
          <label className="block text-[#1C1C1C] text-lg mb-2">Coverage *</label>
          <div className="flex items-center space-x-6">
            <FormikRadio
              key={`full-state-${formKey}`}
              name="geography.coverage.type"
              value="FULL_STATE"
              label="Full State"
              disabled={isLocked}
              onChange={() => {
                if (!isLocked) {
                  setFieldValue("geography.coverage.type", "FULL_STATE");
                  setFieldValue("geography.coverage.partial.counties", []);
                  setFieldValue("geography.coverage.partial.radius", "");
                  setFieldValue("geography.coverage.partial.zipcode", "");
                  setFieldValue("geography.coverage.partial.zip_codes", "");
                }
              }}
            />
            <FormikRadio
              key={`partial-${formKey}`}
              name="geography.coverage.type"
              value="PARTIAL"
              label="Partial"
              disabled={isLocked}
              onChange={() => {
                if (!isLocked) {
                  setFieldValue("geography.coverage.type", "PARTIAL");
                }
              }}
            />
          </div>
          <ErrorMessage
            name="geography.coverage.type"
            component="div"
            className="text-red-500 text-xs mt-1"
          />
        </div>
      </div>

      {values.geography.coverage.type === "PARTIAL" && (
        <>
          <p className="text-center text-[#666666] text-sm italic">
            Please enter a Zip, a list of Zip codes, a selection of Counties, or any combination of these
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormikInput
              key={`zipcode-${formKey}`}
              name="geography.coverage.partial.zipcode"
              type="text"
              placeholder="90210"
              label="Center Zip Code"
              disabled={isLocked}
            />

            {isLoadingCounties ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading counties...</span>
              </div>
            ) : (
              <div className="w-full">
                <CustomFormikAsyncSelect
                  key={`counties-${formKey}`}
                  isMulti
                  name="geography.coverage.partial.counties"
                  label="Counties"
                  loadOptions={loadCounties}
                  placeholder="Search and select counties"
                  isDisabled={isLocked}
                />
              </div>
            )}

            <FormikTextarea
              key={`zip-codes-${formKey}`}
              name="geography.coverage.partial.zip_codes"
              label="ZIP Codes (separated by |)"
              placeholder="#####|#####|#####..."
              rows={3}
              disabled={isLocked}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignGeography;