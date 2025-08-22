import { Metadata } from "next";
import LeadsTable from "@/components/user-dashboard/leads/Leads";

export default function Leads() {

  return (
    <div className="leads-container">
      <LeadsTable />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'leads | Leadfeausion',
  description: 'leads Management where you manage all your leads.'
};
