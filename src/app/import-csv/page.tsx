"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import CSVImport from "@/components/import-csv/import-csv";
import Sidebar from "@/components/Layout/Sidebar/Sidebar";

export default function CSVImportPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role;

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, role, router]);

  if (!user || role !== "ADMIN") {
    return null;
  }

  return (
    <div className="layout_user flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <CSVImport />
        </div>
      </div>
    </div>
  );
}
