import { Metadata } from "next";
import EditCampaigns from "@/components/user-dashboard/campaigns/EditCampaigns";
export default function updateCampaigns() {

  return (
    <div className="update-campaigns-container">
      <EditCampaigns />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'updateCampaigns | Lead Management Platform',
  description: 'updateCampaigns where you manage all your leads and settings.'
};
