'use client';

import React from 'react';
import { Field, ErrorMessage } from 'formik';

interface Utility {
  _id: string;
  name: string;
}

interface UtilitySettingsProps {
  values: any; 
  utilitiesList: Utility[];
  isLoadingUtilities: boolean;
}

const UtilitySettings: React.FC<UtilitySettingsProps> = ({
  values,
  utilitiesList,
  isLoadingUtilities,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Utility Settings</h3>

      <div className="flex gap-3 mb-6">
        <Field type="radio" name="utilities.mode" value="INCLUDE_ALL" id="include_all" />
        <label htmlFor="include_all" className="cursor-pointer">Include All Utilities</label>

        <Field type="radio" name="utilities.mode" value="EXCLUDE_SOME" id="exclude_some" />
        <label htmlFor="exclude_some" className="cursor-pointer">Exclude Some Utilities</label>

        <Field type="radio" name="utilities.mode" value="INCLUDE_SOME" id="include_some" />
        <label htmlFor="include_some" className="cursor-pointer">Include Some Utilities</label>
      </div>

      {values.utilities.mode === 'INCLUDE_ALL' && (
        <div className="border border-[#E0E0E0] rounded-lg p-4">
          All utilities will be included.
        </div>
      )}

      {(values.utilities.mode === 'EXCLUDE_SOME' || values.utilities.mode === 'INCLUDE_SOME') && (
        <div className="border border-[#E0E0E0] rounded-lg p-4">
          <h4 className="text-lg font-medium mb-3">
            {values.utilities.mode === 'EXCLUDE_SOME'
              ? 'Select Utilities to Exclude'
              : 'Select Utilities to Include'}
          </h4>

          {isLoadingUtilities ? (
            <div className="flex justify-center py-4">
              <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></span>
            </div>
          ) : utilitiesList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {utilitiesList.map((utility) => (
                <div key={utility._id} className="flex items-center">
                  <Field
                    type="checkbox"
                    name={
                      values.utilities.mode === 'EXCLUDE_SOME'
                        ? 'utilities.exclude_some'
                        : 'utilities.include_some'
                    }
                    value={utility._id}
                    id={`${values.utilities.mode === 'EXCLUDE_SOME' ? 'exclude' : 'include'}-${utility._id}`}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label
                    htmlFor={`${values.utilities.mode === 'EXCLUDE_SOME' ? 'exclude' : 'include'}-${utility._id}`}
                    className="ml-2 text-[#333333] cursor-pointer"
                  >
                    {utility.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {values.geography.state ? 'No utilities found for this state' : 'Select a state first'}
            </p>
          )}

          <ErrorMessage
            name={values.utilities.mode === 'EXCLUDE_SOME' ? 'utilities.exclude_some' : 'utilities.include_some'}
            component="div"
            className="text-red-500 text-xs mt-1"
          />
        </div>
      )}
    </div>
  );
};

export default UtilitySettings;
