
import { Metadata } from "next";
import AdminDashboard from "@/components/admin-dashboard/dashboard/AdminDashboard";


export const metadata: Metadata = {
  title: 'Admin Dashboard | Lead Management Platform',
  description: 'View your admin dashboard with user statistics, revenue data, and lead management insights.'
};

const DashboardPage = () => {
  return <AdminDashboard />;
};
export default DashboardPage;
