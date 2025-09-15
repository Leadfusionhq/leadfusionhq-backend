"use client";
import { tabs } from "@/components/campaign/tab";

interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
  validateForm: () => Promise<any>; // Add validateForm prop
  setTouched: (touched: any) => void; // Add setTouched prop
  values: any; // Add values prop
}

export const TabsNavigation = ({ 
  activeTab, 
  setActiveTab, 
  isSubmitting, 
  isEditMode = false, 
  validateForm, 
  setTouched,
  values 
}: TabsNavigationProps) => {
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const isLastTab = currentIndex === tabs.length - 1;
  
  // Function to validate current tab before navigation
  const validateCurrentTab = async () => {
    const errors = await validateForm();
    
    // Get only errors for current tab fields
    const tabFields = {
      'basic': ['name', 'status', 'lead_type', 'exclusivity', 'language', 'poc_phone', 'company_contact_phone', 'company_contact_email'],
      'geography': ['geography.state', 'geography.coverage.type', 'geography.coverage.partial.counties', 'geography.coverage.partial.zipcode', 'geography.coverage.partial.zip_codes'],
      'delivery': ['delivery.method', 'delivery.schedule.days', 'delivery.schedule.time', 'delivery.other.quantity', 'delivery.other.daily_cap'],
      'notes': ['note']
    };
    
    const currentTabErrors = Object.keys(errors).filter(key => 
      tabFields[activeTab]?.includes(key)
    );
    
    if (currentTabErrors.length > 0) {
      // Mark current tab fields as touched to show errors
      const touchedFields = {};
      tabFields[activeTab]?.forEach(field => {
        touchedFields[field] = true;
      });
      setTouched(touchedFields);
      
      // Scroll to first error
      const firstError = currentTabErrors[0];
      const errorElement = document.querySelector(`[name="${firstError}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return false;
    }
    
    return true;
  };
  
  const goToNextTab = async () => {
    const isValid = await validateCurrentTab();
    if (isValid && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };
  
  const goToPrevTab = () => {
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };
  
  return (
    <div className="flex justify-between items-center">
      <button
        type="button"
        onClick={goToPrevTab}
        disabled={currentIndex === 0}
        className={`px-6 py-3 rounded-lg border transition ${
          currentIndex === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-[#1C1C1C] border-[#E0E0E0] hover:bg-gray-50 cursor-pointer"
        }`}
      >
        ← Previous
      </button>

      <div className="flex gap-4">
        {currentIndex < tabs.length - 1 ? (
          <button
            type="button"
            onClick={goToNextTab}
            className="px-6 py-3 bg-[#1C1C1C] text-white rounded-lg hover:bg-[#333333]"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            className="px-8 py-3 bg-[#1C1C1C] text-white text-[18px] font-semibold rounded-lg border-none cursor-pointer transition hover:bg-[#333333]"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isEditMode ? "Save Campaign..." : "Save Campaign...")
              : (isEditMode ? "Save Campaign" : "Save Campaign")}
          </button>
        )}
      </div>
    </div>
  );
};

export default TabsNavigation;