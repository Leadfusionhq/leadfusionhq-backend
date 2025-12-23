// tabs/TabsNavigation.tsx
"use client";
import { tabs } from "@/components/campaign/tab";
import { toast } from "react-toastify";

interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
  validateForm?: any;
  setTouched?: any;
  setFieldTouched?: (field: string, touched?: boolean, shouldValidate?: boolean) => void;
  setFieldError?: (field: string, message?: string) => void;
  values?: any;
  errors?: any;
  getTabForField?: (fieldName: string) => string;
  submitForm?: () => Promise<any>;
}

export const TabsNavigation = ({
  activeTab,
  setActiveTab,
  isSubmitting,
  isEditMode = false,
  validateForm,
  setFieldTouched,
  values,

  errors,
  getTabForField,
  submitForm,
}: TabsNavigationProps) => {
  const tabIds = tabs.map(t => t.id);
  const currentIndex = tabIds.indexOf(activeTab);

  if (currentIndex === -1) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[TabsNavigation] activeTab not found in tabs list:', activeTab, tabIds);
    }
    setActiveTab(tabIds[0]);
    return null;
  }

  const flattenErrors = (obj: any, prefix = ""): Record<string, string> => {
    const out: Record<string, string> = {};
    if (obj == null) return out;
    if (typeof obj === "string") {
      out[prefix] = obj;
      return out;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        const child = flattenErrors(item, prefix ? `${prefix}.${idx}` : `${idx}`);
        Object.assign(out, child);
      });
      return out;
    }
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "string") {
        out[newKey] = value;
      } else {
        Object.assign(out, flattenErrors(value, newKey));
      }
    });
    return out;
  };

  const getCurrentTabFields = (tabId: string): string[] => {
    const map: Record<string, string[]> = {
      basic: ['name', 'status', 'lead_type', 'exclusivity', 'language', 'poc_phone', 'company_contact_phone', 'company_contact_email', 'bid_price'],
      geography: ['geography.state', 'geography.coverage.type', 'geography.coverage.partial.counties', 'geography.coverage.partial.zipcode', 'geography.coverage.partial.zip_codes'],
      delivery: [
        'delivery.method',
        'delivery.email.addresses',
        'delivery.email.subject',
        'delivery.phone.numbers',
        'delivery.crm.instructions',
        'delivery.schedule.days',
        'delivery.other.homeowner_count'
      ],
      notes: ['note']
    };
    return map[tabId] || [];
  };

  const handleNext = async () => {
    if (!validateForm || !setFieldTouched) {
      const safeNextIndex = Math.min(currentIndex + 1, tabIds.length - 1);
      setActiveTab(tabIds[safeNextIndex]);
      return;
    }

    try {
      const formErrors = await validateForm();
      const flatErrors = flattenErrors(formErrors);
      const currentTabFields = getCurrentTabFields(activeTab);

      // Mark touched fields for current tab only
      currentTabFields.forEach(field => {
        if (flatErrors[field]) {
          try {
            setFieldTouched(field, true, true);
          } catch (e) {
            console.warn('setFieldTouched failed for', field, e);
          }
        }
      });

      // Delivery-specific runtime checks (without toast)
      if (activeTab === 'delivery') {
        const method = values?.delivery?.method || [];

        if (!method || method.length === 0) setFieldTouched('delivery.method', true, true);

        if (method.includes('email')) {
          if (!values?.delivery?.email?.addresses) setFieldTouched('delivery.email.addresses', true, true);
          if (!values?.delivery?.email?.subject) setFieldTouched('delivery.email.subject', true, true);
        }

        if (method.includes('phone') && !values?.delivery?.phone?.numbers) {
          setFieldTouched('delivery.phone.numbers', true, true);
        }

        if (method.includes('crm') && !values?.delivery?.crm?.instructions) {
          setFieldTouched('delivery.crm.instructions', true, true);
        }
      }

      // Move to the next tab regardless of errors
      const safeNextIndex = Math.min(currentIndex + 1, tabIds.length - 1);
      setActiveTab(tabIds[safeNextIndex]);

    } catch (err) {
      console.error('Error during validation', err);
      const safeNextIndex = Math.min(currentIndex + 1, tabIds.length - 1);
      setActiveTab(tabIds[safeNextIndex]);
    }
  };


  const handleSubmitClick = async () => {
    if (!validateForm || !submitForm) return;

    const formErrors = await validateForm();

    if (formErrors && Object.keys(formErrors).length > 0) {
      toast.error("Please complete all required fields before submitting.");
      return;
    }

    await submitForm();
  };


  return (
    <div className="flex justify-between items-center relative">
      <button
        type="button"
        onClick={() => { if (currentIndex > 0) setActiveTab(tabIds[currentIndex - 1]); }}
        className={`px-6 py-3 rounded-lg border transition ${currentIndex === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-[#1C1C1C] border-[#E0E0E0] hover:bg-gray-50 cursor-pointer"}`}
        disabled={currentIndex === 0}
      >
        ← Previous
      </button>

      <div className="flex gap-4">
        {currentIndex < tabIds.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#333333] transition"
            disabled={isSubmitting}
          >
            Next →
          </button>
        ) : (
          <button
            type={submitForm ? "button" : "submit"}
            onClick={submitForm ? handleSubmitClick : undefined}
            className="px-8 py-3 bg-[#1C1C1C] text-white text-[18px] font-semibold rounded-lg border-none cursor-pointer transition hover:bg-[#333333]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEditMode ? "Saving Campaign..." : "Creating Campaign...") : (isEditMode ? "Save Campaign" : "Create Campaign")}
          </button>
        )}
      </div>

      {/* {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 absolute -top-8 right-0 bg-yellow-100 p-2 rounded">
          Tab: {activeTab} | Index: {currentIndex} | Tabs: {tabIds.join(', ')}
        </div>
      )} */}
    </div>
  );
};