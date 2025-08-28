import { Metadata } from "next";
import UserTable from "@/components/admin-dashboard/user-management/User/Users";
import AdminTable from "@/components/admin-dashboard/user-management/Admin/Admin";
export default function UserManagement() {

  return (
    <div className="user-management-container">
      <UserTable />
      <AdminTable />
    </div>
  );
}


export const metadata: Metadata = {
  title: 'Settings & Support | Lead Management Platform',
  description: 'Adjust your user settings and find help with our support resources to get the most out of your account.'
};