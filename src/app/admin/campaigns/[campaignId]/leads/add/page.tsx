import { Metadata } from "next";
import AddLeads from "@/components/admin-dashboard/leads/AddLeads";
export default function addLeads() {

  return (
    <div className="add-lead-container">
      <AddLeads />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'add leads | Lead Management Platform',
  description: 'add leads where you manage all your leads and settings.'
};
