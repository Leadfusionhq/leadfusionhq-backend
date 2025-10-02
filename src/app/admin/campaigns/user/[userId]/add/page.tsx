import { Metadata } from "next";
import AddCampaigns from "@/components/admin-dashboard/campaigns/AddCampaigns";

export default function AddCampaign() {

  return (
    <div className="campaign-container">
      <AddCampaigns />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Campaigns | Leadfeausion',
  description: 'Campaigns Management where you manage all your Campaigns.'
};
