"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Sidebar from "@/components/Layout/Sidebar/Sidebar";
import MainPanel from '@/components/Layout/Dashboard/MainPanel/MainPanel';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget'; 
import SupabaseCampaigns from "@/components/admin-dashboard/supabasecampaigns/supabasecampaigns";
export default function Search() {

  const { collapsed } = useSelector((state: RootState) => state.theme);

  return (
    <div className="layout_admin flex">
      <Sidebar />
      <div
        className={`relative transition-all duration-300 z-9 w-full 
          ${collapsed ? "lg:ml-[6%] lg:w-[94%]" : "lg:ml-[17%] lg:w-[83%]"}`}
      >
        <MainPanel />
        <main className="bg-gray-100 w-full min-h-[calc(100vh-97px)] flex items-center justify-center px-6 py-6">
          <SupabaseCampaigns/>
        </main>
        <FloatingChatWidget />
      </div>
    </div>
  );
}
