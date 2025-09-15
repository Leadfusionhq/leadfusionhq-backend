"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { toast } from "react-toastify";
import { useEffect, useState, useCallback } from "react";

import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API, LOCATION_API } from "@/utils/apiUrl";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import  {validationSchema}  from '@/request-schemas/campaign-schema';
import  {initialValues}  from '@/constants/initialCampaign';
import { Utility ,StateOption , County , State} from "@/types/campaign";

import { renderTabContent } from "@/components/campaign/TabContentRenderer";
import { StateEffectsHandler } from "@/hooks/useCampaignStateEffects";
import { TabsNavigation } from "@/components/campaign/TabsNavigation";
import { TabsHeader } from "@/components/campaign/TabsHeader";
import { cleanCampaignValues } from "@/utils/cleanCampaignValues";
import { getErrorMessage } from '@/utils/getErrorMessage';

const AddNewCampaign = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const userRole = useSelector((state: RootState) => state.auth.user?.role); 
  const isAdmin = userRole === 'admin' || userRole === 'ADMIN';
  const [activeTab, setActiveTab] = useState("basic");
  const [statesList, setStatesList] = useState<State[]>([]);
  const [countiesList, setCountiesList] = useState<County[]>([]);
  const [isLoadingCounties, setIsLoadingCounties] = useState(false);
  const [utilitiesList, setUtilitiesList] = useState<Utility[]>([]);
  const [isLoadingUtilities, setIsLoadingUtilities] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<"method" | "schedule" | "other">("method");

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = (await axiosWrapper("get", LOCATION_API.GET_STATES, {}, token ?? undefined)) as {
          data: State[];
        };
        if (response?.data) {
          setStatesList(response.data);
        }
      } catch (err) {
        console.error("Failed to load states:", err);
        toast.error("Could not load state list");
      }
    };

    fetchStates();
  }, [token]);

  const loadStates = (inputValue: string, callback: (options: StateOption[]) => void) => {
    const filteredOptions = statesList
      .filter(
        (state) =>
          state.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          state.abbreviation.toLowerCase().includes(inputValue.toLowerCase())
      )
      .map((state) => ({
        label: `${state.name} (${state.abbreviation})`,
        value: state._id,
        name: state.name,
        abbreviation: state.abbreviation,
      }));

    callback(filteredOptions);
  };

  // Updated handleSubmit to validate and scroll to errors
  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting, resetForm, setTouched, validateForm }: { 
      setSubmitting: (isSubmitting: boolean) => void; 
      resetForm: () => void;
      setTouched: (touched: any) => void;
      validateForm: () => Promise<any>;
    }
  ) => {
    try {
      // Validate all fields first
      const errors = await validateForm();
      
      // If there are errors, show them and scroll to the first one
      if (Object.keys(errors).length > 0) {
        // Mark all fields as touched to show errors
        const allTouched = {};
        Object.keys(initialValues).forEach(key => {
          allTouched[key] = true;
        });
        setTouched(allTouched);
        
        // Find the tab with the first error and switch to it
        const firstError = Object.keys(errors)[0];
        const tabWithError = getTabForField(firstError);
        setActiveTab(tabWithError);
        
        // Scroll to the error after a small delay to allow tab switch
        setTimeout(() => {
          const errorElement = document.querySelector(`[name="${firstError}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        // Scroll to header after switching tab
        setTimeout(() => {
          const headerEl = document.querySelector(".tabs-header"); // 👈 add a className to TabsHeader wrapper
          if (headerEl) {
            headerEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }

          // Existing scroll to field
          const errorElement = document.querySelector(`[name="${firstError}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);

        
        setSubmitting(false);
        return; // Don't submit if there are errors
      }
      
      setSubmitting(true);
      const cleanedValues = cleanCampaignValues(values);
      console.log("Cleaned Values:", cleanedValues);

      const response = (await axiosWrapper("post", CAMPAIGNS_API.CREATE_CAMPAIGN, cleanedValues, token ?? undefined)) as {
        message?: string;
        details?: { message: string }[];
      };
      
      console.warn(response);
      toast.success(response?.message || "Campaign added successfully!");
      resetForm();
    } catch (err) {
      console.error("Error saving campaign:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to determine which tab contains a field
  const getTabForField = (fieldName: string): string => {
    if (fieldName.includes('name') || fieldName.includes('status') || 
        fieldName.includes('lead_type') || fieldName.includes('exclusivity') ||
        fieldName.includes('language') || fieldName.includes('poc_phone') ||
        fieldName.includes('company_contact')) {
      return 'basic';
    } else if (fieldName.includes('geography')) {
      return 'geography';
    } else if (fieldName.includes('delivery')) {
      return 'delivery';
    } else if (fieldName.includes('note')) {
      return 'notes';
    }
    return 'basic'; // default
  };

  return (
    <div className="container min-h-screen flex flex-col mx-auto items-center md:px-0 py-8">
      <h2 className="text-[24px] font-[500] text-[#1C1C1C] text-center mb-6">Add New Campaign</h2>

      <Formik 
        initialValues={initialValues} 
        validationSchema={validationSchema} 
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, setFieldValue, validateForm, setTouched, errors }) => {
          return (
            <div className="w-full max-w-[1200px]">
              <StateEffectsHandler
                selectedState={values.geography.state}
                coverageType={values.geography.coverage?.type}
                token={token}
                setCountiesList={setCountiesList}
                setIsLoadingCounties={setIsLoadingCounties}
                setUtilitiesList={setUtilitiesList}
                setIsLoadingUtilities={setIsLoadingUtilities}
              />

              {/* Pass errors to TabsHeader */}
              <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} errors={errors} />

              <Form className="space-y-8">
                <div className="bg-white p-8 rounded-lg border border-[#E0E0E0] min-h-[500px]">
                  {renderTabContent(
                    activeTab,
                    values,
                    setFieldValue,
                    countiesList,
                    isLoadingCounties,
                    loadStates,
                    utilitiesList,
                    isLoadingUtilities,
                    activeDeliveryTab,
                    setActiveDeliveryTab,
                    false,
                    isAdmin,
                  )}
                </div>

                {/* Pass validateForm, setTouched, and values to TabsNavigation */}
                <TabsNavigation
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isSubmitting={isSubmitting}
                  isEditMode={false}
                  validateForm={validateForm}
                  setTouched={setTouched}
                  values={values}
                />
              </Form>
            </div>
          );
        }}
      </Formik>
    </div>
  );
};

export default AddNewCampaign;