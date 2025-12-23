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
      "name", "status", "lead_type", "exclusivity", "language",
      "poc_phone", "company_contact_phone", "company_contact_email", "bid_price"
    ],
    geography: [
      "geography.state", "geography.coverage.type",
      "geography.coverage.partial.counties", "geography.coverage.partial.zipcode", "geography.coverage.partial.zip_codes"
    ],
    delivery: [
      "delivery.method", "delivery.email.addresses", "delivery.email.subject",
      "delivery.phone.numbers", "delivery.crm.instructions",
      "delivery.schedule.days", "delivery.other.homeowner_count"
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
    <div className="w-full mb-4 sm:mb-6 md:mb-8">
      {/* Segmented control style tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-1 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const hasError = idx < currentIndex && hasErrorsInTab(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 min-w-[70px] sm:min-w-[100px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className={`hidden sm:flex w-5 h-5 items-center justify-center rounded-full text-[10px] font-bold
                  ${isActive ? "bg-gray-900 text-white" : hasError ? "bg-red-500 text-white" : "bg-gray-300 text-gray-600"}`}>
                  {hasError ? "!" : idx + 1}
                </span>
                {tab.label}
              </span>
              {/* Error indicator on mobile */}
              {hasError && (
                <span className="sm:hidden absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress dots for mobile */}
      <div className="flex sm:hidden justify-center gap-1.5 mt-3">
        {tabs.map((tab, idx) => (
          <div
            key={tab.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                ? "w-6 bg-gray-900"
                : idx < currentIndex
                  ? "w-1.5 bg-gray-600"
                  : "w-1.5 bg-gray-300"
              }`}
          />
        ))}
      </div>
    </div>
  );
};
