'use client'
import { useState, useCallback } from "react";
import { useFormik } from "formik";
import { CampaignFormValues } from "@/types/campaign";
import { initialValues, validationSchema } from "@/utils/validationSchemas";
import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API } from "@/utils/apiUrl";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export const useCampaignForm = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [activeTab, setActiveTab] = useState("basic");
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<"method" | "schedule" | "other">("method");

  const handleSubmit = useCallback(async (values: CampaignFormValues) => {
    try {
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
                ? values.geography.coverage.partial.zip_codes.split("|").filter(Boolean)
                : [],
            },
          },
        },
        utilities: {
          ...values.utilities,
          include_some: values.utilities.include_some.filter(Boolean),
          exclude_some: values.utilities.exclude_some.filter(Boolean),
        },
      };

      await axiosWrapper("post", CAMPAIGNS_API.CREATE_CAMPAIGN, cleanedValues, token ?? undefined);
      toast.success("Campaign created successfully!");
      return true;
    } catch (error) {
      toast.error("Failed to create campaign");
      return false;
    }
  }, [token]);

  const formik = useFormik<CampaignFormValues>({
    initialValues,
    validationSchema,
    onSubmit: handleSubmit,
  });

  return { 
    formik, 
    activeTab, 
    setActiveTab, 
    activeDeliveryTab, 
    setActiveDeliveryTab 
  };
};