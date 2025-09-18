"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { toast } from "react-toastify";
import { useEffect, useState, useCallback } from "react";

import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API, LOCATION_API } from "@/utils/apiUrl";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import { validationSchema } from '@/request-schemas/campaign-schema';
import { initialValues } from '@/constants/freshInitialCampaign';
import { Utility, StateOption, County, State } from "@/types/campaign";

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
  
  // State management
  const [activeTab, setActiveTab] = useState("basic");
  const [statesList, setStatesList] = useState<State[]>([]);
  const [countiesList, setCountiesList] = useState<County[]>([]);
  const [isLoadingCounties, setIsLoadingCounties] = useState(false);
  const [utilitiesList, setUtilitiesList] = useState<Utility[]>([]);
  const [isLoadingUtilities, setIsLoadingUtilities] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<"method" | "schedule" | "other">("method");
  const [formKey, setFormKey] = useState(Date.now());
  const [isEditMode, setIsEditMode] = useState(false);

  // Fresh initial values for each form instance
  const [currentInitialValues, setCurrentInitialValues] = useState(() => {
    return JSON.parse(JSON.stringify(initialValues)); // Deep clone
  });

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

  // Reset form to fresh state when switching to add mode
  const resetToAddMode = useCallback(() => {
    console.log("Resetting to add mode");
    setIsEditMode(false);
    setActiveTab("basic");
    setActiveDeliveryTab("method");
    
    // Create fresh initial values
    const freshInitialValues = JSON.parse(JSON.stringify(initialValues));
    console.log("Initial Values:", initialValues);

    setCurrentInitialValues(freshInitialValues);
    console.log("Fresh Initial Values:", freshInitialValues);
    // Clear all related state
    setCountiesList([]);
    setUtilitiesList([]);
    setIsLoadingCounties(false);
    setIsLoadingUtilities(false);
    
    // Force form remount with new key
    setFormKey(Date.now());
  }, []);

  // Call resetToAddMode when component mounts (for fresh add campaigns)
  useEffect(() => {
    // Only reset if we're not in edit mode and this is a fresh mount
    if (!isEditMode) {
      resetToAddMode();
    }
  }, []); // Empty dependency array for mount only

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
    { setSubmitting, resetForm, setTouched, validateForm, setFieldError }: { 
      setSubmitting: (isSubmitting: boolean) => void; 
      resetForm: () => void;
      setTouched: (touched: any) => void;
      validateForm: () => Promise<any>;
      setFieldError: (field: string, message: string) => void;
    }
  ) => {
    try {
      setSubmitting(true);
      
      // Validate all fields first
      const errors = await validateForm();
      
      if (Object.keys(errors).length > 0) {
        console.log("Validation errors:", errors);
        
        const touchedFields = {};
        const markAllFieldsTouched = (obj: any, prefix = '') => {
          Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              markAllFieldsTouched(obj[key], fullKey);
            } else {
              touchedFields[fullKey] = true;
            }
          });
        };
        markAllFieldsTouched(initialValues);
        setTouched(touchedFields);
        
        const firstErrorField = Object.keys(errors)[0];
        const tabWithError = getTabForField(firstErrorField);
        setActiveTab(tabWithError);
        
        toast.error("Please fix the validation errors and try again.");
        
        setTimeout(() => {
          const headerEl = document.querySelector(".tabs-header");
          if (headerEl) {
            headerEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }

          setTimeout(() => {
            const errorElement = document.querySelector(`[name="${firstErrorField}"]`) ||
                               document.querySelector(`input[name="${firstErrorField}"]`) ||
                               document.querySelector(`select[name="${firstErrorField}"]`) ||
                               document.querySelector(`textarea[name="${firstErrorField}"]`);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
              if (errorElement instanceof HTMLElement && 'focus' in errorElement) {
                errorElement.focus();
              }
            }
          }, 200);
        }, 150);
        
        setSubmitting(false);
        return;
      }
      
      // Delivery method validation
      if (!values.delivery.method || values.delivery.method.length === 0) {
        setFieldError('delivery.method', 'Please select at least one delivery method');
        setActiveTab('delivery');
        toast.error("Please select at least one delivery method");
        setSubmitting(false);
        return;
      }

      // Validate delivery method specific fields
      if (values.delivery.method.includes('email')) {
        if (!values.delivery.email.addresses) {
          setFieldError('delivery.email.addresses', 'Email addresses are required');
          setActiveTab('delivery');
          toast.error("Email addresses are required for email delivery");
          setSubmitting(false);
          return;
        }
        if (!values.delivery.email.subject) {
          setFieldError('delivery.email.subject', 'Email subject is required');
          setActiveTab('delivery');
          toast.error("Email subject is required for email delivery");
          setSubmitting(false);
          return;
        }
      }

      if (values.delivery.method.includes('phone')) {
        if (!values.delivery.phone.numbers) {
          setFieldError('delivery.phone.numbers', 'Phone numbers are required');
          setActiveTab('delivery');
          toast.error("Phone numbers are required for phone delivery");
          setSubmitting(false);
          return;
        }
      }

      if (values.delivery.method.includes('crm')) {
        if (!values.delivery.crm.instructions) {
          setFieldError('delivery.crm.instructions', 'CRM instructions are required');
          setActiveTab('delivery');
          toast.error("CRM instructions are required for CRM delivery");
          setSubmitting(false);
          return;
        }
      }

      const cleanedValues = cleanCampaignValues(values);
      console.log("Cleaned Values:", cleanedValues);

      const response = (await axiosWrapper("post", CAMPAIGNS_API.CREATE_CAMPAIGN, cleanedValues, token ?? undefined)) as {
        message?: string;
        details?: { message: string }[];
      };
      
      console.log("Campaign created successfully:", response);
      toast.success(response?.message || "Campaign added successfully!");
      
      // Reset form and state completely after successful submission
      resetForm();
      resetToAddMode(); // This will reset everything to fresh state
      
    } catch (err) {
      console.error("Error saving campaign:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getTabForField = (fieldName: string): string => {
    if (fieldName.includes('name') || fieldName.includes('status') || 
        fieldName.includes('lead_type') || fieldName.includes('exclusivity') ||
        fieldName.includes('language') || fieldName.includes('poc_phone') ||
        fieldName.includes('company_contact') || fieldName.includes('bid_price')) {
      return 'basic';
    } else if (fieldName.includes('geography')) {
      return 'geography';
    } else if (fieldName.includes('delivery')) {
      return 'delivery';
    } else if (fieldName.includes('note')) {
      return 'notes';
    }
    return 'basic';
  };

  return (
    <div className="container min-h-screen flex flex-col mx-auto items-center md:px-0 py-8">
      <h2 className="text-[24px] font-[500] text-[#1C1C1C] text-center mb-6">Add New Campaign</h2>

      <Formik 
        key={formKey}
        initialValues={currentInitialValues}
        validationSchema={validationSchema} 
        enableReinitialize={false} // Changed to false to prevent unwanted reinitializations
        onSubmit={handleSubmit}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ isSubmitting, values, setFieldValue, validateForm, setTouched, setFieldTouched, errors, touched, setFieldError, submitForm }) => {
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

              <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} errors={errors} />

              <Form className="space-y-8" noValidate>
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
                    isEditMode,
                    isAdmin,
                    formKey
                  )}
                </div>

                <TabsNavigation
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isSubmitting={isSubmitting}
                  validateForm={validateForm}
                  setTouched={setTouched}
                  setFieldTouched={setFieldTouched}
                  values={values}
                  errors={errors}
                  getTabForField={getTabForField}
                  submitForm={submitForm}
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