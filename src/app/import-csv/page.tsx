"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import CSVImport from "@/components/import-csv/import-csv";
import Sidebar from "@/components/Layout/Sidebar/Sidebar";
import MainPanel from '@/components/Layout/Dashboard/MainPanel/MainPanel';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget'; 

export default function CSVImportPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { collapsed } = useSelector((state: RootState) => state.theme);
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
    <div className="layout_admin flex">
      <Sidebar />
      <div
        className={`relative transition-all duration-300 z-9 w-full 
          ${collapsed ? "lg:ml-[6%] lg:w-[94%]" : "lg:ml-[17%] lg:w-[83%]"}`}
      >
        <MainPanel />
        <main className="bg-gray-100 w-full min-h-[calc(100vh-97px)] flex items-center justify-center px-6 py-6">
          {/* Centered CSV Import */}
          <CSVImport />
        </main>
        <FloatingChatWidget />
      </div>
    </div>
  );
}
