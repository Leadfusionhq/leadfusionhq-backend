import { Metadata } from "next";
import UserManagementClient from "@/components/admin-dashboard/user-management/UserManagementClient";

export const metadata: Metadata = {
  title: 'Settings & Support | Lead Management Platform',
  description: 'Adjust your user settings and find help with our support resources to get the most out of your account.'
};

export default function UserManagement() {
  return <UserManagementClient />;
}