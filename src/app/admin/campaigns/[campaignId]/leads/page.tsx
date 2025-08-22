import { Metadata } from "next";
import ViewCampaign from "@/components/admin-dashboard/campaigns/ViewCampaign";
export default function viewCampaign() {

  return (
    <div className="add-lead-container">
      <ViewCampaign />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'view campaign | Lead Management Platform',
  description: 'view campaign where you manage all your leads and settings.'
};
