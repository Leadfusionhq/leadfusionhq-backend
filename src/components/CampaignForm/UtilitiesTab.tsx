'use client'
import { useEffect ,useState} from 'react';
import axiosWrapper from '@/utils/api';
import { UITILITIES_API } from '@/utils/apiUrl';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Field, useFormikContext } from 'formik';
import { CampaignFormValues, Utility } from '@/types/campaign';
import { FormikRadio } from '@/components/form';
interface UtilitiesTabProps {
  values: CampaignFormValues;
}
const UtilitiesTab = ({ values }: UtilitiesTabProps) => {
  
  const token = useSelector((state: RootState) => state.auth.token);

  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUtilities = async () => {
      if (!values.geography.state?.value) return;
      
      try {
        setLoading(true);
        const stateId = values.geography.state.value;
        const url = UITILITIES_API.GET_UITILITIES_BY_STATE.replace(":stateId", stateId as string);
        const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: Utility[] };
        
        setUtilities(response.data);
      } catch (error) {
        console.error('Failed to load utilities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUtilities();
  }, [values.geography.state?.value, token]);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Utility Settings</h3>

      <div className="space-y-4">
        <FormikRadio 
          name="utilities.mode" 
          value="INCLUDE_ALL" 
          label="Include All Utilities" 
        />
        <FormikRadio 
          name="utilities.mode" 
          value="EXCLUDE_SOME" 
          label="Exclude Specific Utilities" 
        />
        <FormikRadio 
          name="utilities.mode" 
          value="INCLUDE_SOME" 
          label="Include Only Selected Utilities" 
        />
      </div>

      {values.utilities.mode !== 'INCLUDE_ALL' && (
        <div className="border rounded-lg p-4 mt-4">
          <h4 className="font-medium mb-3">
            {values.utilities.mode === 'EXCLUDE_SOME' 
              ? 'Select Utilities to Exclude' 
              : 'Select Utilities to Include'}
          </h4>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : utilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {utilities.map((utility) => (
                <div key={utility._id} className="flex items-center">
                  <Field
                    type="checkbox"
                    name={
                      values.utilities.mode === 'EXCLUDE_SOME' 
                        ? 'utilities.exclude_some' 
                        : 'utilities.include_some'
                    }
                    value={utility._id}
                    id={`utility-${utility._id}`}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor={`utility-${utility._id}`} className="ml-2">
                    {utility.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {values.geography.state 
                ? 'No utilities found for this state' 
                : 'Please select a state first'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UtilitiesTab;