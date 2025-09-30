import { Metadata } from "next";
import AddBalance from "@/components/admin-dashboard/user-management/User/AddBalance";
export default function updateUser() {

  return (
    <div className="user-management-container">
      <AddBalance />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Update User Balance | Lead Management Platform',
  description: 'User Management where you manage all your leads and settings.'
};
