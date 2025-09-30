import { Metadata } from "next";
import ViewLeads from "@/components/user-dashboard/leads/UserViewLeads";

export default function LeadDetailsPage() {
  return (
    <div className="lead-details-container">
      <ViewLeads />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Lead Details | Leadfeausion',
  description: 'View detailed information about a specific lead.'
};