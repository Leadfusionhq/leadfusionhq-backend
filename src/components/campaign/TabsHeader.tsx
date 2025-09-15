"use client";
import { tabs } from "@/components/campaign/tab";

interface TabsHeaderProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  errors?: any; // Add errors prop
}

export const TabsHeader = ({ activeTab, setActiveTab, errors }: TabsHeaderProps) => {
  // Function to check if a tab has errors
  const hasErrorsInTab = (tabId: string): boolean => {
    const tabFields = {
      'basic': ['name', 'status', 'lead_type', 'exclusivity', 'language', 'poc_phone', 'company_contact_phone', 'company_contact_email'],
      'geography': ['geography.state', 'geography.coverage.type', 'geography.coverage.partial.counties', 'geography.coverage.partial.zipcode', 'geography.coverage.partial.zip_codes'],
      'delivery': ['delivery.method', 'delivery.schedule.days', 'delivery.schedule.time', 'delivery.other.quantity', 'delivery.other.daily_cap'],
      'notes': ['note']
    };
    
    return tabFields[tabId]?.some(field => {
      // Check for nested field errors (e.g., geography.state)
      const fieldParts = field.split('.');
      let errorObj = errors;
      for (const part of fieldParts) {
        if (errorObj && errorObj[part]) {
          errorObj = errorObj[part];
        } else {
          return false;
        }
      }
      return !!errorObj;
    }) || false;
  };
  
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-50 p-2 rounded-lg tabs-header">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-3 cursor-pointer rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
            activeTab === tab.id
              ? "bg-[#1C1C1C] text-white shadow-lg"
              : "bg-white text-[#1C1C1C] hover:bg-gray-100 border border-[#E0E0E0]"
          } relative`} // Added relative for positioning
        >
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
          {hasErrorsInTab(tab.id) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabsHeader;