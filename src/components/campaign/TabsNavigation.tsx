"use client";
import { tabs } from "@/components/campaign/tab";

interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isSubmitting: boolean;
}

export const TabsNavigation = ({ activeTab, setActiveTab, isSubmitting }: TabsNavigationProps) => {
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const isLastTab = currentIndex === tabs.length - 1;
  
  // Debug logging
  // console.log("Debug TabsNavigation:", {
  //   activeTab,
  //   currentIndex,
  //   tabsLength: tabs.length,
  //   isLastTab,
  //   condition: currentIndex < tabs.length - 1
  // });

  return (
    <div className="flex justify-between items-center">
      <button
        type="button"
        onClick={() => {
          if (currentIndex > 0) {
            console.log("Going to previous tab:", tabs[currentIndex - 1].id);
            setActiveTab(tabs[currentIndex - 1].id);
          }
        }}
        className={`px-6 py-3 rounded-lg border transition ${
          currentIndex === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-[#1C1C1C] border-[#E0E0E0] hover:bg-gray-50 cursor-pointer"
        }`}
        disabled={currentIndex === 0}
      >
        ← Previous
      </button>

      <div className="flex gap-4">
        {currentIndex < tabs.length - 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault(); // Prevent any form submission
              e.stopPropagation(); // Stop event bubbling
              console.log("Next button clicked, going to:", tabs[currentIndex + 1].id);
              setActiveTab(tabs[currentIndex + 1].id);
            }}
            className="px-6 py-3 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#333333]"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            onClick={() => console.log("Submit button clicked")}
            className="px-8 py-3 bg-[#1C1C1C] text-white text-[18px] font-semibold rounded-lg border-none cursor-pointer transition hover:bg-[#333333]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Campaign..." : "Create Campaign"}
          </button>
        )}
      </div>
      
      {/* Debug info */}
      <div className="text-xs text-gray-500 absolute top-0 right-0 bg-yellow-100 p-2">
        Tab: {activeTab} | Index: {currentIndex} | Total: {tabs.length} | Last: {isLastTab ? 'YES' : 'NO'}
      </div>
    </div>
  );
};

export default TabsNavigation;