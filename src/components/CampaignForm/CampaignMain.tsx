'use client'
import { 
  BasicInfoTab, 
  GeographyTab, 
  UtilitiesTab, 
  DeliveryTab, 
  NotesTab 
} from "./index";
import TabHeader from "./TabHeader";
import FormNavigation from "./FormNavigation";
import { useCampaignForm } from "../../hooks/useCampaignForm";
import { Form } from "formik";

const tabs = [
  { id: "basic", label: "Basic Info" },
  { id: "geography", label: "Geography" },
  { id: "utilities", label: "Utilities" },
  { id: "delivery", label: "Delivery" },
  { id: "notes", label: "Notes" }
];

export const CampaignForm = () => {
  const { 
    formik, 
    activeTab, 
    setActiveTab, 
    activeDeliveryTab, 
    setActiveDeliveryTab 
  } = useCampaignForm();

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic": 
        return <BasicInfoTab values={formik.values} />;
      case "geography": 
        return <GeographyTab values={formik.values} />;
      case "utilities": 
        return <UtilitiesTab values={formik.values} />;
      case "delivery": 
        return <DeliveryTab activeTab={activeDeliveryTab} values={formik.values} />;
      case "notes": 
        return <NotesTab />;
      default: 
        return null;
    }
  };

  return (
    <div className="container min-h-screen flex flex-col mx-auto items-center py-8">
      <h2 className="text-2xl font-medium text-center mb-6">Add New Campaign</h2>
      
      <TabHeader activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      
      <Form>
        <div className="bg-white p-8 rounded-lg border border-[#E0E0E0] min-h-[500px]">
          {renderTabContent()}
        </div>
        
        <FormNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isSubmitting={formik.isSubmitting}
          tabs={tabs}
        />
      </Form>
    </div>
  );
};