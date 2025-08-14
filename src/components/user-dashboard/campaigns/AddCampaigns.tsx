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

const AddNewCampaign = () => {
  const token = useSelector((state: RootState) => state.auth.token);
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


  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    try {
      setSubmitting(true);
      const cleanedValues = cleanCampaignValues(values);
      console.log("Cleaned Values:", cleanedValues);

      const response = (await axiosWrapper("post", CAMPAIGNS_API.CREATE_CAMPAIGN, cleanedValues, token ?? undefined)) as {
        message?: string;
      };
      console.warn(response);
      toast.success(response?.message || "Campaign added successfully!");
      resetForm();
    } catch (err) {
      console.error("Error saving campaign:", err);
      toast.error("Failed to save campaign");
    } finally {
      setSubmitting(false);
    }
  };

  

  return (
    <div className="container min-h-screen flex flex-col mx-auto items-center md:px-0 py-8">
      <h2 className="text-[24px] font-[500] text-[#1C1C1C] text-center mb-6">Add New Campaign</h2>

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, values, setFieldValue }) => {
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

              
              <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

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
                    setActiveDeliveryTab
                  )}
                </div>

                <TabsNavigation
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isSubmitting={isSubmitting}
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