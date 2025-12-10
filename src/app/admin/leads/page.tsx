import { Metadata } from "next";
import LeadsTable from "@/components/admin-dashboard/leads/Leads";
import ReturnLeadsTable from "@/components/admin-dashboard/leads/ReturnLeadsTable";

export default function Leads() {
  return (
    <div className="leads-container">
      <LeadsTable />
      {/* <ReturnLeadsTable /> */}
    </div>
  );
}

export const metadata: Metadata = {
  title: 'leads | Leadfeausion',
  description: 'leads Management where you manage all your leads.'
};