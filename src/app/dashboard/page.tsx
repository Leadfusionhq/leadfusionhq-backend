import { Metadata } from "next";
import ViewDashboard from "@/components/user-dashboard/dashboard/ViewDashboard";

export default function ViewUserDashboard() {
  return (
    <div className="locations-container">
          <ViewDashboard />
    </div>
  );
}
export const metadata: Metadata = {
  title: 'User Dashboard | Lead Management Platform',
  description: 'User Dashboard where you manage all your leads and settings.'
};
