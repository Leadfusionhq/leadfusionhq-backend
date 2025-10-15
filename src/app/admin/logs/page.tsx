import { Metadata } from "next";
import Logs from "@/components/admin-dashboard/logs/Log";

export const metadata: Metadata = {
  title: 'Admin Dashboard | System Logs & Monitoring',
  description:
    'Access detailed system logs and error reports in the admin dashboard. Monitor application events, track errors, and review activity statistics in real time for better performance insights.',
};

const LogsPage = () => {
  return <Logs />;
};

export default LogsPage;
