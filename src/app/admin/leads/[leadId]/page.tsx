import { Metadata } from "next";
import EditLeads from "@/components/admin-dashboard/leads/EditLeads";

export default function Leads() {

  return (
    <div className="leads-container">
      <EditLeads />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'leads | Leadfeausion',
  description: 'leads Management where you manage all your leads.'
};
