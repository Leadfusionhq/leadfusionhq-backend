import { Metadata } from "next";
import AddCampaigns from "@/components/user-dashboard/campaigns/AddCampaigns";
// import  AddCampaignPage  from '@/components/user-dashboard/campaigns/add';

export default function CampaignsDashboard() {
  return (
    <div className="locations-container">
      <AddCampaigns />
      {/* <AddCampaignPage /> */}
    </div>
  );
}
export const metadata: Metadata = {
  title: 'Campaigns | Lead Management Platform',
  description: 'Campaigns'
};
