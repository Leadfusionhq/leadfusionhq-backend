import { Metadata } from "next";
import UpdateAdmin from "@/components/admin-dashboard/user-management/Admin/UpdateAdmin";
export default function updateUser() {

  return (
    <div className="user-management-container">
      <UpdateAdmin />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Update Admin | Lead Management Platform',
  description: 'User Management where you manage all your leads and settings.'
};
