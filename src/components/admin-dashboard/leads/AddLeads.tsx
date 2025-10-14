"use client";
import { useParams, useRouter } from "next/navigation";
import LeadForm from "@/components/form/leads/LeadForm";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import { LEADS_API, LOCATION_API } from "@/utils/apiUrl";
import { initialLeadValues } from "@/constants/initialLeadValues";
import { cleanLeadValues } from "@/utils/cleanLeadValue";
import { useEffect, useState } from "react";
import { State, StateOption } from "@/types/campaign";

const AddLeadPage = () => {
  const router = useRouter();
  const { campaignId } = useParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);

  const campaignIdString = Array.isArray(campaignId) ? campaignId[0] : campaignId;

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

    if (token) {
      fetchStates();
    }
  }, [token]);

  const handleSubmit = async (
    values: typeof initialLeadValues,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    const cleanedValues = cleanLeadValues(values);

    try {
      setSubmitting(true);

      const response = await axiosWrapper(
        "post",
        LEADS_API.CREATE_LEAD,
        cleanedValues,
        token ?? undefined
      ) as { message?: string };

      toast.success(response?.message || "Lead added successfully!");
      resetForm();
      router.push("/admin/leads");
    }catch (err: any) {
      console.error("Error adding lead:", err);
      
      // ✅ CORRECT: axiosWrapper already extracts response.data
      // So err = { error: true, message: "Insufficient funds..." }
      const errorMessage = err?.message || "An error occurred while adding the lead.";
      
      console.error("Displaying error:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!campaignIdString) {
    return <p>Campaign ID is missing!</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold text-center mb-6">Add Lead to Campaign</h1>
      <LeadForm
        campaignId={campaignIdString}
        stateOptions={stateOptions}
        isLoadingStates={isLoadingStates}
        onSubmit={handleSubmit}
        initialValues={{ ...initialLeadValues, campaign_id: campaignIdString }}
      />
    </div>
  );
};

export default AddLeadPage;
