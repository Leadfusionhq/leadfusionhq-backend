"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import LeadForm from "@/components/form/leads/LeadForm";
import axiosWrapper from "@/utils/api";
import { LEADS_API, LOCATION_API } from "@/utils/apiUrl";
import { RootState } from "@/redux/store";
import { initialLeadValues } from "@/constants/initialLeadValues";
import { cleanLeadValues } from "@/utils/cleanLeadValue";
import { State, StateOption } from "@/types/campaign";
import SpinnerLoader from "@/components/common/SpinnerLoader"

const EditLeadPage = () => {
  const { leadId } = useParams();
  const leadIdString = Array.isArray(leadId) ? leadId[0] : leadId;
  const token = useSelector((state: RootState) => state.auth.token);

  const [leadData, setLeadData] = useState<typeof initialLeadValues | null>(null);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingLead, setIsLoadingLead] = useState(true);


  useEffect(() => {
    const fetchStates = async () => {
      try {
        setIsLoadingStates(true);
        const response = await axiosWrapper("get", LOCATION_API.GET_STATES, {}, token ?? undefined) as {
          data: State[];
        };

        if (response?.data) {
          const options = response.data.map((state) => ({
            label: `${state.name} (${state.abbreviation})`,
            value: state._id,
            name: state.name,
            abbreviation: state.abbreviation,
          }));
          setStateOptions(options);
        }
      } catch (err) {
        console.error("Failed to load states:", err);
        toast.error("Could not load state list");
      } finally {
        setIsLoadingStates(false);
      }
    };

    if (token) fetchStates();
  }, [token]);

  // Fetch Lead Details
  useEffect(() => {
    const fetchLead = async () => {
      if (!leadIdString || !token) return;

      try {
        setIsLoadingLead(true);
        const response = await axiosWrapper(
          "get",
          LEADS_API.GET_LEAD.replace(":leadId", leadIdString),
          {},
          token
        ) as { data: any };

        const lead = response?.data;
        console.log("Lead data:", lead);

        if (lead) {
          const stateObj = lead.address?.state;

          const formattedLead: typeof initialLeadValues = {
            ...initialLeadValues,
            ...lead,
            address: {
              ...initialLeadValues.address,
              ...lead.address,
              state: stateObj
                ? {
                    label: `${stateObj.name} (${stateObj.abbreviation})`,
                    value: stateObj._id,
                    name: stateObj.name,
                    abbreviation: stateObj.abbreviation
                  }
                : "",
            },
          };

          setLeadData(formattedLead);
        }
      } catch (err) {
        console.error("Failed to fetch lead data:", err);
        toast.error("Could not fetch lead data.");
      } finally {
        setIsLoadingLead(false);
      }
    };

    fetchLead();
  }, [leadIdString, token]);

  const handleSubmit = async (
      values: typeof initialLeadValues,
      { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
    ) => {
    const cleanedValues = cleanLeadValues(values);
      console.log("Submitting cleanedValues:", cleanedValues);
    if (!leadIdString || !token) return;
    try {
      setSubmitting(true);

      const response = await axiosWrapper(
        "put",
        `${LEADS_API.UPDATE_LEAD.replace(":leadId", leadIdString)}`,
        cleanedValues,
        token ?? undefined
      ) as { message?: string };

      toast.success(response?.message || "Lead updated successfully!");
    } catch (err) {
      console.error("Error updating lead:", err);
      toast.error("An error occurred while updating the lead.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!leadIdString) return <p>Lead ID is missing!</p>;
  if (isLoadingLead) return <SpinnerLoader variant="dots" color="gray" message="Loading lead data..." />;
  if (!leadData) return <p className="text-center py-6 text-red-600">Lead not found.</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold text-center mb-6">Edit Lead</h1>
      <LeadForm
        campaignId={leadData.campaign_id}
        initialValues={leadData}
        onSubmit={handleSubmit}
        stateOptions={stateOptions}
        isLoadingStates={isLoadingStates}
      />


    </div>
  );
};

export default EditLeadPage;
