import { Metadata } from "next";
import LocationTable from "@/components/user-dashboard/campaigns/Campaigns";

export default function CampaignsDashboard() {
  return (
    <div className="locations-container">
      {/* <LocationTable /> */}
      <h1>Campaigns</h1>
    </div>
  );
}
export const metadata: Metadata = {
  title: 'Campaigns | Lead Management Platform',
  description: 'Campaigns'
};
