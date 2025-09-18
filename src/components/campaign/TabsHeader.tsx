"use client";
import { tabs } from "@/components/campaign/tab";

interface TabsHeaderProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  errors?: any;
}

export const TabsHeader = ({ activeTab, setActiveTab, errors }: TabsHeaderProps) => {
  const flattenErrors = (obj: any, prefix = ""): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!obj) return out;

    if (typeof obj === "string") {
      if (prefix) out[prefix] = obj;
      return out;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        Object.assign(out, flattenErrors(item, prefix ? `${prefix}.${idx}` : `${idx}`));
      });
      return out;
    }

    Object.keys(obj).forEach((key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flattenErrors(obj[key], newKey));
    });

    return out;
  };

  const flatErrors = flattenErrors(errors);

  const tabFields: Record<string, string[]> = {
    basic: [
      "name","status","lead_type","exclusivity","language",
      "poc_phone","company_contact_phone","company_contact_email","bid_price"
    ],
    geography: [
      "geography.state","geography.coverage.type",
      "geography.coverage.partial.counties","geography.coverage.partial.zipcode","geography.coverage.partial.zip_codes"
    ],
    delivery: [
      "delivery.method","delivery.email.addresses","delivery.email.subject",
      "delivery.phone.numbers","delivery.crm.instructions",
      "delivery.schedule.days","delivery.other.homeowner_count"
    ],
    notes: ["note"],
  };

  const hasErrorsInTab = (tabId: string): boolean => {
    const fieldsToCheck = tabFields[tabId] || [];
    return fieldsToCheck.some((field) => field in flatErrors);
  };

  // find current index
  const tabIds = tabs.map(t => t.id);
  const currentIndex = tabIds.indexOf(activeTab);

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-50 p-2 rounded-lg tabs-header">
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-3 cursor-pointer rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 relative ${
            activeTab === tab.id
              ? "bg-[#1C1C1C] text-white shadow-lg"
              : "bg-white text-[#1C1C1C] hover:bg-gray-100 border border-[#E0E0E0]"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
          {/* 🔴 Only show dot if tab is BEFORE current and has errors */}
          {idx < currentIndex && hasErrorsInTab(tab.id) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      ))}
    </div>
  );
};
