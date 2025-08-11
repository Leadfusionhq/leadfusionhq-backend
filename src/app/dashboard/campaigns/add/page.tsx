import { Metadata } from "next";
import AddCampaigns from "@/components/user-dashboard/campaigns/AddCampaigns";

export default function CampaignsDashboard() {
  return (
    <div className="locations-container">
      <AddCampaigns />
    </div>
  );
}
export const metadata: Metadata = {
  title: 'Campaigns | Lead Management Platform',
  description: 'Campaigns'
};
