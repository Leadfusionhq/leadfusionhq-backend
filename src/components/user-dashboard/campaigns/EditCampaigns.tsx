"use client";

import { Formik, Form } from "formik";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";

import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API, LOCATION_API } from "@/utils/apiUrl";
import { RootState } from "@/redux/store";

import { validationSchema } from "@/request-schemas/campaign-schema";
import { initialValues as defaultValues } from "@/constants/initialCampaign";
import { Utility, StateOption, County, State } from "@/types/campaign";

import { renderTabContent } from "@/components/campaign/TabContentRenderer";
import { StateEffectsHandler } from "@/hooks/useCampaignStateEffects";
import { TabsNavigation } from "@/components/campaign/TabsNavigation";
import { TabsHeader } from "@/components/campaign/TabsHeader";
import { cleanCampaignValues } from "@/utils/cleanCampaignValues";
import { getErrorMessage } from "@/utils/getErrorMessage";

// Transform backend data to match form structure
const transformBackendDataToFormData = (backendData: any, statesList: State[]) => {
  const formData = { ...defaultValues };

  try {
    // Basic fields
    if (backendData.name) formData.name = backendData.name;
    if (backendData.status) formData.status = backendData.status;
    if (backendData.lead_type) formData.lead_type = backendData.lead_type;
    if (backendData.exclusivity) formData.exclusivity = backendData.exclusivity;
    if (backendData.bid_price !== undefined) formData.bid_price = backendData.bid_price;
    if (backendData.language) formData.language = backendData.language;
    if (backendData.note) formData.note = backendData.note;
    if (backendData.payment_type) formData.payment_type = backendData.payment_type;


    // Contact fields
    if (backendData.poc_phone) formData.poc_phone = backendData.poc_phone;
    if (backendData.company_contact_phone) formData.company_contact_phone = backendData.company_contact_phone;
    if (backendData.company_contact_email) formData.company_contact_email = backendData.company_contact_email;

    // Geography
    if (backendData.geography) {
      if (backendData.geography.state && statesList.length > 0) {
        const stateData = statesList.find(state => state._id === backendData.geography.state);
        if (stateData) {
          formData.geography.state = {
            label: `${stateData.name} (${stateData.abbreviation})`,
            value: stateData._id,
            name: stateData.name,
            abbreviation: stateData.abbreviation,
          };
        }
      }

      if (backendData.geography.coverage) {
        formData.geography.coverage.type = backendData.geography.coverage.type || "FULL_STATE";
        if (backendData.geography.coverage.partial) {
          const partial = backendData.geography.coverage.partial;
          formData.geography.coverage.partial = {
            counties: Array.isArray(partial.countyDetails)
              ? partial.countyDetails.map((county: County) => ({
                  label: `${county.name}`,
                  value: county._id,
                }))
              : [],
            radius: partial.radius || "",
            zipcode: partial.zipcode || "",
            zip_codes: Array.isArray(partial.zip_codes) ? partial.zip_codes.join("|") : (partial.zip_codes || ""),
            countries: partial.countries || ["US"],
          };
        }
      }
    }

    // Utilities
    if (backendData.utilities) {
      formData.utilities.mode = backendData.utilities.mode || "INCLUDE_ALL";
      formData.utilities.exclude_some = backendData.utilities.exclude_some || [];
      formData.utilities.include_some = backendData.utilities.include_some || [];
    }

    // Delivery
    if (backendData.delivery) {
      formData.delivery.method = backendData.delivery.method || [];

      if (backendData.delivery.email) {
        formData.delivery.email.addresses = backendData.delivery.email.addresses || "";
        formData.delivery.email.subject = backendData.delivery.email.subject || "";
      }

      if (backendData.delivery.phone) {
        formData.delivery.phone.numbers = backendData.delivery.phone.numbers || "";
      }

      if (backendData.delivery.crm) {
        formData.delivery.crm.instructions = backendData.delivery.crm.instructions || "";
      }

      if (backendData.delivery.other) {
        formData.delivery.other.homeowner_count = backendData.delivery.other.homeowner_count || 0;
      }

      if (backendData.delivery.schedule && backendData.delivery.schedule.days) {
        formData.delivery.schedule.days = backendData.delivery.schedule.days.map((day: any) => ({
          day: day.day,
          active: day.active !== undefined ? day.active : true,
          start_time: day.start_time || "09:00",
          end_time: day.end_time || "17:00",
          cap: day.cap || 1000,
        }));
      }
    }

    return formData;
  } catch (error) {
    console.error("Error transforming backend data:", error);
    return formData;
  }
};

const EditCampaign = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const userRole = useSelector((state: RootState) => state.auth.user?.role); 
  const isAdmin = userRole === 'admin' || userRole === 'ADMIN';
  const { campaignId } = useParams();

  const [activeTab, setActiveTab] = useState("basic");
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<"method" | "schedule" | "other">("method");

  const [statesList, setStatesList] = useState<State[]>([]);
  const [countiesList, setCountiesList] = useState<County[]>([]);
  const [isLoadingCounties, setIsLoadingCounties] = useState(false);
  const [utilitiesList, setUtilitiesList] = useState<Utility[]>([]);
  const [isLoadingUtilities, setIsLoadingUtilities] = useState(false);

  const [formInitialValues, setFormInitialValues] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axiosWrapper("get", LOCATION_API.GET_STATES, {}, token ?? undefined) as { data?: State[] };
        if (res?.data) setStatesList(res.data);
      } catch (err) {
        console.error("Failed to load states:", err);
        toast.error("Could not load state list");
      }
    };
    if (token) fetchStates();
  }, [token]);

  useEffect(() => {
    if (dataReady) {
      setActiveTab("basic"); // or you can set based on first error if editing
      setActiveDeliveryTab("method");
    }
  }, [dataReady]);
  

  useEffect(() => {
    const fetchCampaign = async () => {
      const id = Array.isArray(campaignId) ? campaignId[0] : campaignId;
      if (!id || statesList.length === 0) return;

      try {
        setLoading(true);
        const res = await axiosWrapper(
          "get",
          CAMPAIGNS_API.GET_CAMPAIGN.replace(":campaignId", id),
          {},
          token ?? undefined
        ) as { data?: any };
        console.log("Backend campaign data:", res);


        if (res?.data) {
          const transformedData = transformBackendDataToFormData(res.data, statesList);
          console.log("Transformed Data:", transformedData);
          setFormInitialValues(transformedData);
          setDataReady(true);
        } else {
          toast.error("Failed to load campaign data.");
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (campaignId && statesList.length > 0) fetchCampaign();
  }, [campaignId, token, statesList]);

  const loadStates = (inputValue: string, callback: (options: StateOption[]) => void) => {
    const filteredOptions = statesList
      .filter(s => s.name.toLowerCase().includes(inputValue.toLowerCase()) || s.abbreviation.toLowerCase().includes(inputValue.toLowerCase()))
      .map(s => ({ label: `${s.name} (${s.abbreviation})`, value: s._id, name: s.name, abbreviation: s.abbreviation }));
    callback(filteredOptions);
  };

  const getTabForField = (fieldName: string): string => {
    if (fieldName.includes('name') || fieldName.includes('status') ||
        fieldName.includes('lead_type') || fieldName.includes('exclusivity') ||
        fieldName.includes('language') || fieldName.includes('poc_phone') ||
        fieldName.includes('company_contact')) return 'basic';
    else if (fieldName.includes('geography')) return 'geography';
    else if (fieldName.includes('delivery')) return 'delivery';
    else if (fieldName.includes('note')) return 'notes';
    return 'basic';
  };

  const handleSubmit = async (
    values: typeof defaultValues,
    { setSubmitting, setTouched, validateForm, setFieldError }: { 
      setSubmitting: (isSubmitting: boolean) => void;
      setTouched: (touched: any) => void;
      validateForm: () => Promise<any>;
      setFieldError: (field: string, message: string) => void;
    }
  ) => {
    try {
      setSubmitting(true);
      const errors = await validateForm();

      if (Object.keys(errors).length > 0) {
        const touchedFields: any = {};
        Object.keys(defaultValues).forEach(k => { touchedFields[k] = true; });
        setTouched(touchedFields);

        const firstError = Object.keys(errors)[0];
        setActiveTab(getTabForField(firstError));

        setTimeout(() => {
          const errorElement = document.querySelector(`[name="${firstError}"]`);
          if (errorElement) errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        toast.error("Please fix the validation errors and try again.");
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

      if (values.delivery.method.includes('phone') && !values.delivery.phone.numbers) {
        setFieldError('delivery.phone.numbers', 'Phone numbers are required');
        setActiveTab('delivery');
        toast.error("Phone numbers are required for phone delivery");
        setSubmitting(false);
        return;
      }

      if (values.delivery.method.includes('crm') && !values.delivery.crm.instructions) {
        setFieldError('delivery.crm.instructions', 'CRM instructions are required');
        setActiveTab('delivery');
        toast.error("CRM instructions are required for CRM delivery");
        setSubmitting(false);
        return;
      }

      const cleanedValues = cleanCampaignValues(values);
      const id = Array.isArray(campaignId) ? campaignId[0] : campaignId;
      if (!id) return;

      const res = await axiosWrapper(
        "put",
        CAMPAIGNS_API.UPDATE_CAMPAIGN.replace(":campaignId", id),
        cleanedValues,
        token ?? undefined
      ) as { message?: string };

      toast.success(res?.message || "Campaign updated successfully!");
    } catch (err) {
      console.error("Error updating campaign:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const loadCounties = (inputValue: string, callback: (options: { label: string; value: string }[]) => void) => {
    const filteredOptions = countiesList
      .filter(c => c.name.toLowerCase().includes(inputValue.toLowerCase()))
      .map(c => ({ label: c.name, value: c._id }));
    callback(filteredOptions);
  };

  if (loading || !dataReady) {
    return (
      <div className="container min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen flex flex-col mx-auto items-center md:px-0 py-8">
      <h2 className="text-[24px] font-[500] text-[#1C1C1C] text-center mb-6">Edit Campaign</h2>

      <Formik
        enableReinitialize={true}
        initialValues={formInitialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, setFieldValue, validateForm, setTouched, setFieldError, errors, submitForm }) => (
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
                  true,
                  isAdmin,
                
                )}
              </div>

              <TabsNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isSubmitting={isSubmitting}
                isEditMode={true}
                validateForm={validateForm}
                setTouched={setTouched}
                values={values}
                errors={errors}
                setFieldError={setFieldError}
                submitForm={submitForm}
              />
            </Form>
          </div>
        )}
      </Formik>
    </div>
  );
};

export default EditCampaign;
