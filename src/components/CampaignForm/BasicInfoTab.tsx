'use client'

import { FormikInput, FormikSelect, FormikRadio } from "@/components/form";
import { STATUS, LEAD_TYPE, EXCLUSIVITY, LANGUAGE } from "@/constants/enums";
import { CampaignFormValues } from "@/types/campaign";

const BasicInfoTab = ({ values }: { values: CampaignFormValues }) => (
  <div className="space-y-6">
    <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Basic Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormikInput name="name" placeholder="Campaign Name" label="Campaign Name *" />
      <FormikSelect
        name="status"
        label="Status *"
        options={Object.entries(STATUS).map(([key, value]) => ({ 
          value, 
          label: key.replace("_", " ") 
        }))}
      />
      <FormikSelect
        name="lead_type"
        label="Lead Type *"
        options={Object.entries(LEAD_TYPE).map(([key, value]) => ({ 
          value, 
          label: key.replace("_", " ") 
        }))}
      />
      <FormikSelect
        name="exclusivity"
        label="Exclusivity *"
        options={Object.entries(EXCLUSIVITY).map(([key, value]) => ({ 
          value, 
          label: key.replace("_", " ") 
        }))}
      />
      <FormikInput 
        name="bid_price" 
        type="number" 
        min="0" 
        placeholder="0" 
        label="Bid Price ($) *" 
      />
      <FormikSelect
        name="language"
        label="Language *"
        options={Object.entries(LANGUAGE).map(([key, value]) => ({ 
          value, 
          label: key.replace("_", " ") 
        }))}
      />
      {values.exclusivity === "WARM_TRANSFER" && (
        <FormikInput
          name="poc_phone"
          type="tel"
          placeholder="123-456-7890"
          label="POC Phone *"
          pattern="^\d{3}-\d{3}-\d{4}$"
        />
      )}
      {values.exclusivity === "APPOINTMENT" && (
        <>
          <div className="col-span-2">
            <h4 className="text-lg font-medium mb-4">Company Contact Info</h4>
          </div>
          <FormikInput
            name="company_contact_phone"
            type="tel"
            placeholder="123-456-7890"
            label="Contact Phone *"
            pattern="^\d{3}-\d{3}-\d{4}$"
          />
          <FormikInput
            name="company_contact_email"
            type="email"
            placeholder="contact@company.com"
            label="Contact Email *"
          />
        </>
      )}
    </div>
  </div>
);
export default BasicInfoTab;
