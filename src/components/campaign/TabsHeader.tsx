"use client";
import { tabs } from "@/components/campaign/tab";


interface TabsHeaderProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export const TabsHeader = ({ activeTab, setActiveTab }: TabsHeaderProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-50 p-2 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-3 cursor-pointer rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
            activeTab === tab.id
              ? "bg-[#1C1C1C] text-white shadow-lg"
              : "bg-white text-[#1C1C1C] hover:bg-gray-100 border border-[#E0E0E0]"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabsHeader;
