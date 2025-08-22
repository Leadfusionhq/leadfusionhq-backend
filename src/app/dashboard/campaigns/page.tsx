import { Metadata } from "next";
import CampaignTable from "@/components/user-dashboard/campaigns/Campaigns";

export default function CampaignsDashboard() {
  return (
    <div className="locations-container">
      <CampaignTable />
    </div>
  );
}
export const metadata: Metadata = {
  title: 'Campaigns | Lead Management Platform',
  description: 'Campaigns'
};
