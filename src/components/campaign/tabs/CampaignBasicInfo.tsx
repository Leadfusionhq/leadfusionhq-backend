import React from "react";
import { FormikInput, FormikSelect } from "@/components/form";
import { STATUS, LEAD_TYPE, EXCLUSIVITY, LANGUAGE } from "@/constants/enums";
import { Field, ErrorMessage } from "formik";
import { SafeValue } from '@/types/types';

interface Props {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  isEditMode?: boolean;
}

const CampaignBasicInfo: React.FC<Props> = ({ values, setFieldValue ,isEditMode = false}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormikInput name="name" placeholder="Campaign Name" label="Campaign Name *" />
        <FormikSelect
          name="status"
          label="Status *"
          options={Object.entries(STATUS).map(([key, value]) => ({
            value,
            label: key.replace("_", " "),
          }))}
        />
        <FormikSelect
          name="lead_type"
          label="Lead Type *"
          options={Object.entries(LEAD_TYPE).map(([key, value]) => ({
            value,
            label: key.replace("_", " "),
          }))}
          isDisabled={isEditMode}
        />
        <FormikSelect
          name="exclusivity"
          label="Exclusivity *"
          options={Object.entries(EXCLUSIVITY).map(([key, value]) => ({
            value,
            label: key.replace("_", " "),
          }))}
        />
        {/* <FormikInput name="bid_price" type="number" min="0" label="Bid Price *" placeholder="0" /> */}
        <FormikSelect
          name="language"
          label="Language *"
          options={Object.entries(LANGUAGE).map(([key, value]) => ({
            value,
            label: key.replace("_", " "),
          }))}
        />
        {values.exclusivity === "WARM_TRANSFER" && (
          <FormikInput name="poc_phone" label="POC Phone *" placeholder="123-456-7890" />
        )}
        {values.exclusivity === "APPOINTMENT" && (
          <>
            <div className="col-span-2">
              <h4 className="text-lg font-medium mb-4">Your Company Contact Info for Homeowners</h4>
            </div>
            <FormikInput
              name="company_contact_phone"
              placeholder="123-456-7890"
              label="Company Contact Phone *"
            />
            <FormikInput
              name="company_contact_email"
              placeholder="contact@company.com"
              label="Company Contact Email *"
              type="email"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignBasicInfo;
