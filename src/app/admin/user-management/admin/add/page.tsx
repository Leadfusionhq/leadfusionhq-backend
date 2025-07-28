import { Metadata } from "next";
import AddNewAdmin from "@/components/admin-dashboard/user-management/Admin/AddNewAdmin";
export default function addAdmin() {

  return (
    <div className="user-management-container">
      <AddNewAdmin />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Add New Admin | User Management',
  description: 'User Management where you manage all your leads and settings.'
};
