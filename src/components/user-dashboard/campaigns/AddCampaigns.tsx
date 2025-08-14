"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useEffect, useState, useCallback } from "react";

import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API, LOCATION_API, UITILITIES_API } from "@/utils/apiUrl";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { LEAD_TYPE, EXCLUSIVITY, STATUS, DAYS_OF_WEEK, LANGUAGE, UTILITIES } from "@/constants/enums";

import CustomFormikAsyncSelect from "@/components/form/CustomFormikAsyncSelect";
import { FormikInput, FormikSelect, FormikCheckbox, FormikRadio, FormikTextarea } from "@/components/form";
import { SafeValue } from '@/types/types';
import  {validationSchema}  from '@/request-schemas/campaign-schema';
import  {initialValues}  from '@/constants/initialCampaign';
import { DaySchedule, UtilityMode ,Utility ,CountyOption ,StateOption , County , State} from "@/types/campaign";
import CampaignBasicInfo from "@/components/campaign/tabs/CampaignBasicInfo";
import CampaignNote from "@/components/campaign/tabs/CampaignNote";
import CampaignGeography from "@/components/campaign/tabs/CampaignGeography";
import CampaignDelivery from "@/components/campaign/tabs/CampaignDelivery";
import CampaignUtility from "@/components/campaign/tabs/CampaignUtility";
import { renderTabContent } from "@/components/campaign/TabContentRenderer";
import { tabs } from "@/components/campaign/tab";
import { StateEffectsHandler } from "@/hooks/useCampaignStateEffects";
import { TabsNavigation } from "@/components/campaign/TabsNavigation";

// const StateEffectsHandler = ({ 
//   selectedState, 
//   coverageType, 
//   token,
//   setCountiesList,
//   setIsLoadingCounties,
//   setUtilitiesList,
//   setIsLoadingUtilities 
// }: {
//   selectedState: StateOption | null;
//   coverageType: string | undefined;
//   token: string | null;
//   setCountiesList: (counties: County[]) => void;
//   setIsLoadingCounties: (loading: boolean) => void;
//   setUtilitiesList: (utilities: Utility[]) => void;
//   setIsLoadingUtilities: (loading: boolean) => void;
// }) => {
//   // Effect for loading counties when state changes and coverage is partial
//   useEffect(() => {
//     if (selectedState && coverageType === "PARTIAL") {
//       const fetchCounties = async () => {
//         setIsLoadingCounties(true);
//         setCountiesList([]);
//         try {
//           const url = LOCATION_API.GET_COUNTIES_BY_STATE.replace(":stateId", selectedState.value);
//           const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: County[] };
//           setCountiesList(response.data);
//         } catch (err) {
//           console.error("Failed to load County:", err);
//           toast.error("Could not load County list");
//         } finally {
//           setIsLoadingCounties(false);
//         }
//       };

//       fetchCounties();
//     } else {
//       // Clear counties if not partial coverage or no state selected
//       setCountiesList([]);
//       setIsLoadingCounties(false);
//     }
//   }, [selectedState?.value, coverageType, token, setCountiesList, setIsLoadingCounties]);

//   // Effect for loading utilities when state changes
//   useEffect(() => {
//     if (selectedState) {
//       console.warn(selectedState);
//       const fetchUtilities = async () => {
//         setIsLoadingUtilities(true);
//         setUtilitiesList([]);
//         try {
//           const url = UITILITIES_API.GET_UITILITIES_BY_STATE.replace(":stateId", selectedState.value);
//           const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: Utility[] };
//           setUtilitiesList(response.data);
//         } catch (err) {
//           console.error("Failed to load utilities:", err);
//           toast.error("Could not load utility list");
//         } finally {
//           setIsLoadingUtilities(false);
//         }
//       };

//       fetchUtilities();
//     } else {
//       // Clear utilities if no state selected
//       setUtilitiesList([]);
//       setIsLoadingUtilities(false);
//     }
//   }, [selectedState?.value, token, setUtilitiesList, setIsLoadingUtilities]);

//   return null; // This component doesn't render anything
// };

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

  // const tabs = [
  //   { id: "basic", label: "Basic Info", icon: "📋" },
  //   { id: "geography", label: "Geography", icon: "🌍" },
  //   { id: "utilities", label: "Utilities", icon: "⚡" },
  //   { id: "delivery", label: "Delivery", icon: "📧" },
  //   { id: "notes", label: "Notes", icon: "📝" },
  // ];


  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    try {
      setSubmitting(true);

      const cleanedValues = {
        ...values,
        geography: {
          ...values.geography,
          state: values.geography.state ? values.geography.state.value : "",
          coverage: {
            ...values.geography.coverage,
            partial: {
              ...values.geography.coverage.partial,
              counties: values.geography.coverage.partial.counties.map((c) => c.value),
              radius: values.geography.coverage.partial.radius ? Number(values.geography.coverage.partial.radius) : 0,
              zipcode: values.geography.coverage.partial.zipcode || "",
              zip_codes: values.geography.coverage.partial.zip_codes
                ? values.geography.coverage.partial.zip_codes.split("|").filter((code) => code.trim() !== "")
                : [],
            },
          },
        },
        utilities: {
          ...values.utilities,
          include_some: values.utilities.include_some.filter((util) => util.trim() !== ""),
          exclude_some: values.utilities.exclude_some.filter((util) => util.trim() !== ""),
        },
      };

      console.log("Cleaned Values:", cleanedValues);
      // toast.warning("We're still working on this feature. It's not available yet.");

      // Remove this return false when ready to submit
      // return false;

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

  

  // const renderTabContent = (values: typeof initialValues, setFieldValue: (field: string, value: SafeValue ) => void) => {
  
  //   switch (activeTab) {
  //     case "basic":
  //       return <CampaignBasicInfo values={values} setFieldValue={setFieldValue} />;
  //     case "geography":
   
  //       return <CampaignGeography
  //               values={values}
  //               setFieldValue={setFieldValue}
  //               countiesList={countiesList}
  //               isLoadingCounties={isLoadingCounties}
  //               loadStates={loadStates}
  //             />;
  //     case "utilities":
  //       return <CampaignUtility
  //                 values={values}
  //                 utilitiesList={utilitiesList}
  //                 isLoadingUtilities={isLoadingUtilities}
  //               />;
  //     case "delivery":
  //       return <CampaignDelivery
  //                 values={values}
  //                 setFieldValue={setFieldValue}
  //                 activeDeliveryTab={activeDeliveryTab}
  //                 setActiveDeliveryTab={setActiveDeliveryTab}
  //               />
  //               ;
  //     case "notes":
  //       return <CampaignNote values={values} setFieldValue={setFieldValue} />;
  //     default:
  //       return null;
  //   }
  // };
 
  return (
    <div className="container min-h-screen flex flex-col mx-auto items-center md:px-0 py-8">
      <h2 className="text-[24px] font-[500] text-[#1C1C1C] text-center mb-6">Add New Campaign</h2>

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, values, setFieldValue }) => {
          return (
            <div className="w-full max-w-[1200px]">
              {/* State Effects Handler Component */}
              <StateEffectsHandler
                selectedState={values.geography.state}
                coverageType={values.geography.coverage?.type}
                token={token}
                setCountiesList={setCountiesList}
                setIsLoadingCounties={setIsLoadingCounties}
                setUtilitiesList={setUtilitiesList}
                setIsLoadingUtilities={setIsLoadingUtilities}
              />

              <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-50 p-2 rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 cursor-pointer rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-[#1C1C1C] text-white shadow-lg"
                        : "bg-white text-[#1C1C1C] hover:bg-gray-100 border border-[#E0E0E0]"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

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
                  {/* {renderTabContent(values, setFieldValue)} */}
                </div>

                {/* <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1].id);
                      }
                    }}
                    className={`px-6 py-3 rounded-lg border transition ${
                      tabs.findIndex((tab) => tab.id === activeTab) === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-[#1C1C1C] border-[#E0E0E0] hover:bg-gray-50 cursor-pointer"
                    }`}
                    disabled={tabs.findIndex((tab) => tab.id === activeTab) === 0}
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-4">
                    {tabs.findIndex((tab) => tab.id === activeTab) < tabs.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
                          if (currentIndex < tabs.length - 1) {
                            setActiveTab(tabs[currentIndex + 1].id);
                          }
                        }}
                        className="px-6 py-3 bg-[#1C1C1C] cursor-pointer text-white rounded-lg hover:bg-[#333333] transition"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-8 py-3 bg-[#1C1C1C] text-white text-[18px] font-semibold rounded-lg border-none cursor-pointer transition hover:bg-[#333333]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating Campaign..." : "Create Campaign"}
                      </button>
                    )}
                  </div>
                </div> */}
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