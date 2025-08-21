"use client";
import { useParams } from "next/navigation";
import LeadForm from "@/components/form/leads/LeadForm";

const AddLeadPage = () => {
  const { campaignId } = useParams();
  
  const campaignIdString = Array.isArray(campaignId) ? campaignId[0] : campaignId;
  
  if (!campaignIdString) {
    return <p>Campaign ID is missing!</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold text-center mb-6">Add Lead to Campaign</h1>
      <LeadForm campaignId={campaignIdString} />
    </div>
  );
};

export default AddLeadPage;
