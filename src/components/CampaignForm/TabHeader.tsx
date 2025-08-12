'use client'
import { useState } from "react";

const tabs = [
  { id: "basic", label: "Basic Info", icon: "📋" },
  { id: "geography", label: "Geography", icon: "🌍" },
  { id: "utilities", label: "Utilities", icon: "⚡" },
  { id: "delivery", label: "Delivery", icon: "📧" },
  { id: "notes", label: "Notes", icon: "📝" },
];
interface Tab {
  id: string;
  label: string;
}

interface TabHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: Tab[];
}

const TabHeader = ({ 
  activeTab, 
  setActiveTab,
  tabs 
}: TabHeaderProps) => (
  <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-50 p-2 rounded-lg">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => setActiveTab(tab.id)}
        className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
          activeTab === tab.id
            ? "bg-[#1C1C1C] text-white shadow-lg"
            : "bg-white text-[#1C1C1C] hover:bg-gray-100 border border-[#E0E0E0]"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
export default TabHeader;