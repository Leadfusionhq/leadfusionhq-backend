import { Metadata } from "next";
import UpdateUser from "@/components/admin-dashboard/user-management/User/UpdateUser";
export default function updateUser() {

  return (
    <div className="user-management-container">
      <UpdateUser />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Update User | Lead Management Platform',
  description: 'User Management where you manage all your leads and settings.'
};
