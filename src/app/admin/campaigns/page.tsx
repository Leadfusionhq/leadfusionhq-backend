import { Metadata } from "next";
import CampaignTable from "@/components/admin-dashboard/campaigns/Campaigns";

export default function Locations() {

  return (
    <div className="campaign-container">
      <CampaignTable />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Campaigns | Leadfeausion',
  description: 'Campaigns Management where you manage all your Campaigns.'
};
