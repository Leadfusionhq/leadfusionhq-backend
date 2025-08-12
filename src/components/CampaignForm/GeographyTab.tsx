'use client'
import { useState } from 'react';
import { useCountySearch } from '@/hooks/useCountySearch';
import { useStateSearch } from '@/hooks/useStateSearch';
import { CustomFormikAsyncSelect, FormikInput, FormikRadio, FormikTextarea } from '@/components/form';
import { CampaignFormValues } from '@/types/campaign';

interface GeographyTabProps {
  values: CampaignFormValues;
}

const GeographyTab = ({ values }: GeographyTabProps) => {
  const stateId = values.geography.state?.value ?? null;
  const { searchCounties, loading: countiesLoading } = useCountySearch(stateId);
  const { searchStates, loading: statesLoading } = useStateSearch();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium mb-4">Geography Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomFormikAsyncSelect
          name="geography.state"
          label="State *"
          loadOptions={searchStates}
          placeholder={statesLoading ? 'Loading states...' : 'Search states...'}
          // isLoading={statesLoading}
        />

        <div>
          <label className="block text-gray-900 mb-2">Coverage *</label>
          <div className="flex space-x-4">
            <FormikRadio 
              name="geography.coverage.type" 
              value="FULL_STATE" 
              label="Full State" 
            />
            <FormikRadio 
              name="geography.coverage.type" 
              value="PARTIAL" 
              label="Partial" 
            />
          </div>
        </div>
      </div>

      {values.geography.coverage.type === 'PARTIAL' && (
        <>
          <p className="text-sm text-gray-500 italic text-center">
            Provide at least one: Radius+Zip, Zip codes, or Counties
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <FormikInput
              name="geography.coverage.partial.radius"
              type="number"
              label="Radius (miles)"
              placeholder="25"
              min="0"
            />

            <FormikInput
              name="geography.coverage.partial.zipcode"
              label="Center Zip Code"
              placeholder="90210"
              pattern="^\d{5}$"
            />

            <div className="md:col-span-2">
              <CustomFormikAsyncSelect
                isMulti
                name="geography.coverage.partial.counties"
                label="Counties"
                loadOptions={searchCounties}
                placeholder={countiesLoading ? 'Loading counties...' : 'Search counties...'}
                // isLoading={countiesLoading}
                // isDisabled={!stateId}
              />
            </div>

            <div className="md:col-span-2">
              <FormikTextarea
                name="geography.coverage.partial.zip_codes"
                label="ZIP Codes (separated by |)"
                placeholder="90210|90001|90002"
                rows={3}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GeographyTab;