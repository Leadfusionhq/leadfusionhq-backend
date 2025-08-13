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

interface DaySchedule {
  day: typeof DAYS_OF_WEEK[number];
  active: boolean;
  start_time: string;
  end_time: string;
  cap: number;
}

type State = {
  name: string;
  abbreviation: string;
  _id: string;
};

type County = {
  name: string;
  _id: string;
};

interface StateOption {
  value: string;
  label: string;
  name: string;
  abbreviation: string;
}

interface CountyOption {
  value: string;
  label: string;
}

interface Utility {
  _id: string;
  name: string;
}

type UtilityMode = keyof typeof UTILITIES;

// Component to handle state-dependent effects
const StateEffectsHandler = ({ 
  selectedState, 
  coverageType, 
  token,
  setCountiesList,
  setIsLoadingCounties,
  setUtilitiesList,
  setIsLoadingUtilities 
}: {
  selectedState: StateOption | null;
  coverageType: string | undefined;
  token: string | null;
  setCountiesList: (counties: County[]) => void;
  setIsLoadingCounties: (loading: boolean) => void;
  setUtilitiesList: (utilities: Utility[]) => void;
  setIsLoadingUtilities: (loading: boolean) => void;
}) => {
  // Effect for loading counties when state changes and coverage is partial
  useEffect(() => {
    if (selectedState && coverageType === "PARTIAL") {
      const fetchCounties = async () => {
        setIsLoadingCounties(true);
        setCountiesList([]);
        try {
          const url = LOCATION_API.GET_COUNTIES_BY_STATE.replace(":stateId", selectedState.value);
          const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: County[] };
          setCountiesList(response.data);
        } catch (err) {
          console.error("Failed to load County:", err);
          toast.error("Could not load County list");
        } finally {
          setIsLoadingCounties(false);
        }
      };

      fetchCounties();
    } else {
      // Clear counties if not partial coverage or no state selected
      setCountiesList([]);
      setIsLoadingCounties(false);
    }
  }, [selectedState?.value, coverageType, token, setCountiesList, setIsLoadingCounties]);

  // Effect for loading utilities when state changes
  useEffect(() => {
    if (selectedState) {
      console.warn(selectedState);
      const fetchUtilities = async () => {
        setIsLoadingUtilities(true);
        setUtilitiesList([]);
        try {
          const url = UITILITIES_API.GET_UITILITIES_BY_STATE.replace(":stateId", selectedState.value);
          const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: Utility[] };
          setUtilitiesList(response.data);
        } catch (err) {
          console.error("Failed to load utilities:", err);
          toast.error("Could not load utility list");
        } finally {
          setIsLoadingUtilities(false);
        }
      };

      fetchUtilities();
    } else {
      // Clear utilities if no state selected
      setUtilitiesList([]);
      setIsLoadingUtilities(false);
    }
  }, [selectedState?.value, token, setUtilitiesList, setIsLoadingUtilities]);

  return null; // This component doesn't render anything
};

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

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "📋" },
    { id: "geography", label: "Geography", icon: "🌍" },
    { id: "utilities", label: "Utilities", icon: "⚡" },
    { id: "delivery", label: "Delivery", icon: "📧" },
    { id: "notes", label: "Notes", icon: "📝" },
  ];

  const initialValues = {
    name: "",
    status: "ACTIVE" as keyof typeof STATUS,
    lead_type: "SOLAR_RESIDENTIAL" as keyof typeof LEAD_TYPE,
    exclusivity: "EXCLUSIVE" as keyof typeof EXCLUSIVITY,
    bid_price: 0,
    language: "en",
    poc_phone: "", // Added for WARM_TRANSFER
    company_contact_phone: "", // Added for APPOINTMENT
    company_contact_email: "", // Added for APPOINTMENT
    geography: {
      state: null as StateOption | null,
      coverage: {
        type: "FULL_STATE" as "FULL_STATE" | "PARTIAL",
        partial: {
          counties: [] as CountyOption[],
          radius: "",
          zipcode: "",
          zip_codes: "",
          countries: ["US"],
        },
      },
    },
    utilities: {
      mode: UTILITIES.INCLUDE_ALL as UtilityMode,
      exclude_some: [] as string[],
      include_some: [] as string[],
    },
    delivery: {
      method: "email",
      email: {
        addresses: "",
        subject: "",
      },
      phone: {
        numbers: "",
      },
      crm: {
        instructions: "",
      },
      other: {
        homeowner_count: 0,
      },
      schedule: {
        days: DAYS_OF_WEEK.map((day) => ({
          day,
          active: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(day),
          start_time: "09:00",
          end_time: day === "FRIDAY" ? "16:00" : "17:00",
          cap: 1000,
        })) as DaySchedule[],
      },
    },
    note: "",
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Campaign name is required"),
    status: Yup.string().oneOf(Object.values(STATUS)).required("Status is required"),
    lead_type: Yup.string().oneOf(Object.values(LEAD_TYPE)).required("Lead type is required"),
    exclusivity: Yup.string().oneOf(Object.values(EXCLUSIVITY)).required("Exclusivity is required"),
    bid_price: Yup.number().min(0, "Bid price must be positive").required("Bid price is required"),
    language: Yup.string().required("Language is required"),
    poc_phone: Yup.string().when("exclusivity", {
      is: "WARM_TRANSFER",
      then: (schema) =>
        schema
          .matches(/^\d{3}-\d{3}-\d{4}$/, "POC Phone must be in format XXX-XXX-XXXX")
          .required("POC Phone is required for Warm Transfer"),
      otherwise: (schema) => schema.notRequired(),
    }),
    company_contact_phone: Yup.string().when("exclusivity", {
      is: "APPOINTMENT",
      then: (schema) =>
        schema
          .matches(/^\d{3}-\d{3}-\d{4}$/, "Company Contact Phone must be in format XXX-XXX-XXXX")
          .required("Company Contact Phone is required for Appointment"),
      otherwise: (schema) => schema.notRequired(),
    }),
    company_contact_email: Yup.string().when("exclusivity", {
      is: "APPOINTMENT",
      then: (schema) =>
        schema
          .email("Invalid email address")
          .required("Company Contact Email is required for Appointment"),
      otherwise: (schema) => schema.notRequired(),
    }),
    geography: Yup.object().shape({
      state: Yup.mixed()
        .test("is-object", "State is required", (value) => value !== null)
        .required("State is required"),
      coverage: Yup.object().shape({
        type: Yup.string().oneOf(["FULL_STATE", "PARTIAL"]).required("Coverage type is required"),
        partial: Yup.object().shape({
          counties: Yup.array(),
          radius: Yup.string(),
          zipcode: Yup.string().matches(/^\d{5}$/, "ZIP code must be exactly 5 digits"),
          zip_codes: Yup.string().matches(
            /^(\d{5})(\|\d{5})*$/,
            "ZIPs must be 5-digit numbers separated by '|'"
          ),
          countries: Yup.array().of(Yup.string()),
        }),
      }),
    }),
    utilities: Yup.object().shape({
      mode: Yup.string().oneOf(Object.values(UTILITIES)).required("Mode is required"),
      exclude_some: Yup.array(), // Not required
      include_some: Yup.array(), // Not required
    }),
    delivery: Yup.object().shape({
      method: Yup.string().oneOf(["email", "phone", "crm"]).required("Method is required"),
      email: Yup.object().shape({
        addresses: Yup.string().matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\s*,\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/,
          "Enter valid comma separated emails"
        ),
        subject: Yup.string(),
      }),
      phone: Yup.object().shape({
        numbers: Yup.string().matches(
          /^(\d{3}-\d{3}-\d{4})(\s*,\s*\d{3}-\d{3}-\d{4})*$/,
          "Enter valid comma separated phone numbers (e.g., 123-456-7890)"
        ),
      }),
      crm: Yup.object().shape({
        instructions: Yup.string(),
      }),
      other: Yup.object().shape({
        homeowner_count: Yup.number().min(0, "Must be positive"),
      }),
      schedule: Yup.object(),
    }),
    note: Yup.string(),
  });

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
      toast.warning("We're still working on this feature. It's not available yet.");

      // Remove this return false when ready to submit
      return false;

      const response = (await axiosWrapper("post", CAMPAIGNS_API.CREATE_CAMPAIGN, cleanedValues, token ?? undefined)) as {
        message?: string;
      };
      toast.success(response?.message || "Campaign added successfully!");
      resetForm();
    } catch (err) {
      console.error("Error saving campaign:", err);
      toast.error("Failed to save campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTabContent = (values: typeof initialValues, setFieldValue: (field: string, value: SafeValue ) => void) => {
  
    switch (activeTab) {
      case "basic":
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput name="name" placeholder="Campaign Name" label="Campaign Name *" />
              <FormikSelect
                name="status"
                label="Status *"
                options={Object.entries(STATUS).map(([key, value]) => ({ value, label: key.replace("_", " ") }))}
              />
              <FormikSelect
                name="lead_type"
                label="Lead Type *"
                options={Object.entries(LEAD_TYPE).map(([key, value]) => ({ value, label: key.replace("_", " ") }))}
              />
              <FormikSelect
                name="exclusivity"
                label="Exclusivity *"
                options={Object.entries(EXCLUSIVITY).map(([key, value]) => ({ value, label: key.replace("_", " ") }))}
              />
              <FormikInput name="bid_price" min="0" type="number" placeholder="0" label="Bid Price ($) *" />
              <FormikSelect
                name="language"
                label="Language *"
                options={Object.entries(LANGUAGE).map(([key, value]) => ({ value, label: key.replace("_", " ") }))}
              />
              {values.exclusivity === "WARM_TRANSFER" && (
                <FormikInput
                  name="poc_phone"
                  type="text"
                  placeholder="123-456-7890"
                  label="POC Phone *"
                />
              )}
              {values.exclusivity === "APPOINTMENT" && (
                <>
                  <div className="col-span-2">
                    <h4 className="text-lg font-medium mb-4">Your Company Contact Info for Homeowners</h4>
                  </div>
                  <FormikInput
                    name="company_contact_phone"
                    type="text"
                    placeholder="123-456-7890"
                    label="Company Contact Phone *"
                  />
                  <FormikInput
                    name="company_contact_email"
                    type="email"
                    placeholder="contact@company.com"
                    label="Company Contact Email *"
                  />
                </>
              )}
            </div>
          </div>
        );

      case "geography":
        const loadCounties = (inputValue: string, callback: (options: CountyOption[]) => void) => {
          const filtered = countiesList
            .filter((county) => county.name.toLowerCase().includes(inputValue.toLowerCase()))
            .map((county) => ({ label: county.name, value: county._id }));
          callback(filtered);
        };

        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Geography Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomFormikAsyncSelect
                name="geography.state"
                label="State *"
                loadOptions={loadStates}
                placeholder="Search and select a state"
                // onChange={(selectedOption: StateOption | null) => {
                //   setFieldValue("geography.state", selectedOption);
                //   setFieldValue("geography.coverage.partial.counties", []);
                //   setFieldValue("utilities.include_some", []);
                //   setFieldValue("utilities.exclude_some", []);
                // }}
                onChange={() => {
                  setFieldValue("geography.coverage.partial.counties", []);
                  setFieldValue("utilities.include_some", []);
                  setFieldValue("utilities.exclude_some", []);
                }}

              />
              <div>
                <label className="block text-[#1C1C1C] text-lg mb-2">Coverage *</label>
                <div className="flex items-center space-x-6">
                  <FormikRadio 
                    name="geography.coverage.type" 
                    value="FULL_STATE" 
                    label="Full State" 
                    onChange={() => {
                      setFieldValue("geography.coverage.type", "FULL_STATE");
                      // Clear partial coverage fields when switching to full state
                      setFieldValue("geography.coverage.partial.counties", []);
                      setFieldValue("geography.coverage.partial.radius", "");
                      setFieldValue("geography.coverage.partial.zipcode", "");
                      setFieldValue("geography.coverage.partial.zip_codes", "");
                    }}
                  />
                  <FormikRadio 
                    name="geography.coverage.type" 
                    value="PARTIAL" 
                    label="Partial" 
                    onChange={() => {
                      setFieldValue("geography.coverage.type", "PARTIAL");
                    }}
                  />
                </div>
                <ErrorMessage name="geography.coverage.type" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>

            {values.geography.coverage.type === "PARTIAL" && (
              <>
                <p className="text-center text-[#666666] text-sm italic">
                  Please enter a Radius & Zip, a list of Zip codes, a selection of Counties, or any combination of these
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormikInput
                    name="geography.coverage.partial.radius"
                    type="number"
                    placeholder="25"
                    label="Radius (miles)"
                  />
                  <FormikInput
                    name="geography.coverage.partial.zipcode"
                    type="text"
                    placeholder="90210"
                    label="Center Zip Code"
                  />

                  {isLoadingCounties ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Loading counties...</span>
                    </div>
                  ) : (
                    <div className="w-full">
                      <CustomFormikAsyncSelect
                        isMulti
                        name="geography.coverage.partial.counties"
                        label="Counties"
                        loadOptions={loadCounties}
                        placeholder="Search and select counties"
                      />
                    </div>
                  )}

                  <FormikTextarea
                    name="geography.coverage.partial.zip_codes"
                    label="ZIP Codes (separated by |)"
                    placeholder="#####|#####|#####..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        );

      case "utilities":
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Utility Settings</h3>

            <div className="flex flex-col gap-4 mb-6">
              <FormikRadio name="utilities.mode" value="INCLUDE_ALL" label="Include All Utilities" />
              <FormikRadio name="utilities.mode" value="EXCLUDE_SOME" label="Exclude Some Utilities" />
              <FormikRadio name="utilities.mode" value="INCLUDE_SOME" label="Include Some Utilities" />
            </div>
            {values.utilities.mode === "INCLUDE_ALL" && (
              <div className="border border-[#E0E0E0] rounded-lg p-4">
                All utilities will be included.
              </div>
            )}
            {values.utilities.mode === "EXCLUDE_SOME" && (
              <div className="border border-[#E0E0E0] rounded-lg p-4">
                <h4 className="text-lg font-medium mb-3">Select Utilities to Exclude</h4>
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
                          name="utilities.exclude_some"
                          value={utility._id}
                          id={`exclude-${utility._id}`}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`exclude-${utility._id}`} className="ml-2 text-[#333333]">
                          {utility.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    {values.geography.state ? "No utilities found for this state" : "Select a state first"}
                  </p>
                )}
                <ErrorMessage name="utilities.exclude_some" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            )}

            {values.utilities.mode === "INCLUDE_SOME" && (
              <div className="border border-[#E0E0E0] rounded-lg p-4">
                <h4 className="text-lg font-medium mb-3">Select Utilities to Include</h4>
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
                          name="utilities.include_some"
                          value={utility._id}
                          id={`include-${utility._id}`}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`include-${utility._id}`} className="ml-2 text-[#333333]">
                          {utility.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    {values.geography.state ? "No utilities found for this state" : "Select a state first"}
                  </p>
                )}
                <ErrorMessage name="utilities.include_some" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            )}
          </div>
        );

      case "delivery":
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Delivery Settings</h3>

            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => setActiveDeliveryTab("method")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeDeliveryTab === "method"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Method
              </button>
              <button
                type="button"
                onClick={() => setActiveDeliveryTab("schedule")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeDeliveryTab === "schedule"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => setActiveDeliveryTab("other")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeDeliveryTab === "other"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Other
              </button>
            </div>

            {activeDeliveryTab === "method" && (
              <div className="space-y-8">
                <div className="border border-[#E0E0E0] rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">Delivery Method</h4>
                  <div className="flex flex-col gap-3">
                    <FormikRadio name="delivery.method" value="email" label="Email Delivery" />
                    <FormikRadio name="delivery.method" value="phone" label="Phone Delivery" />
                    <FormikRadio name="delivery.method" value="crm" label="CRM Integration" />
                  </div>
                </div>

                <div className="border border-[#E0E0E0] rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Email Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormikInput
                      name="delivery.email.addresses"
                      label="Email Address(es)"
                      placeholder="recipient1@example.com, recipient2@example.com"
                    />
                    <FormikInput
                      name="delivery.email.subject"
                      label="Subject Line"
                      placeholder="New leads available"
                    />
                  </div>
                </div>

                <div className="border border-[#E0E0E0] rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Phone Configuration
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    <FormikInput
                      name="delivery.phone.numbers"
                      label="Phone Number(s)"
                      placeholder="123-456-7890, 987-654-3210"
                    />
                  </div>
                </div>

                <div className="border border-[#E0E0E0] rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    CRM Configuration
                  </h4>
                  <div>
                    <FormikTextarea
                      name="delivery.crm.instructions"
                      label="CRM Post Instructions"
                      rows={4}
                      placeholder="Enter detailed CRM integration instructions..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeDeliveryTab === "schedule" && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium">Weekly Schedule</h4>
                <div className="space-y-4">
                  {values.delivery.schedule.days.map((day, index) => (
                    <div
                      key={day.day}
                      className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 border border-[#E0E0E0] rounded-lg"
                    >
                      <div className="font-medium text-[#1C1C1C]">{day.day}</div>
                      <FormikCheckbox name={`delivery.schedule.days.${index}.active`} label="Active" />
                      <FormikInput name={`delivery.schedule.days.${index}.start_time`} type="time" label="Start" />
                      <FormikInput name={`delivery.schedule.days.${index}.end_time`} type="time" label="End" />
                      <FormikInput name={`delivery.schedule.days.${index}.cap`} type="number" label="Cap" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDeliveryTab === "other" && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium">Other Settings</h4>
                <div className="border border-[#E0E0E0] rounded-lg p-6">
                  <div className="grid grid-cols-1 gap-6">
                    <FormikInput
                      name="delivery.other.homeowner_count"
                      type="number"
                      min="0"
                      placeholder="0"
                      label="Homeowner 2nd Proposal Request (days)"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "notes":
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Campaign Notes</h3>
            <Field
              name="note"
              as="textarea"
              rows={8}
              placeholder="High-quality solar leads for residential customers in premium California zip codes"
              className="w-full border border-[#E0E0E0] rounded-[8px] px-5 py-3 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition resize-vertical"
            />
            <ErrorMessage name="note" component="div" className="text-red-500 text-xs mt-1" />
          </div>
        );

      default:
        return null;
    }
  };

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
                  {renderTabContent(values, setFieldValue)}
                </div>

                <div className="flex justify-between items-center">
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
                </div>
              </Form>
            </div>
          );
        }}
      </Formik>
    </div>
  );
};

export default AddNewCampaign;