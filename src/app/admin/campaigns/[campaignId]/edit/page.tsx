import { Metadata } from "next";
import EditCampaigns from "@/components/admin-dashboard/campaigns/EditCampaigns";
export default function editCampaign() {

  return (
    <div className="edit-campaign-container">
      <EditCampaigns />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'edit campaign | Lead Management Platform',
  description: 'edit campaign where you manage all your leads and settings.'
};
