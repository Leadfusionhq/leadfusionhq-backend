"use client";
import CampaignBasicInfo from "@/components/campaign/tabs/CampaignBasicInfo";
import CampaignNote from "@/components/campaign/tabs/CampaignNote";
import CampaignGeography from "@/components/campaign/tabs/CampaignGeography";
import CampaignDelivery from "@/components/campaign/tabs/CampaignDelivery";
import CampaignUtility from "@/components/campaign/tabs/CampaignUtility";
import  {initialValues}  from '@/constants/initialCampaign';
import { Utility ,County } from "@/types/campaign";

export const renderTabContent = (
  activeTab: string,
  values: typeof initialValues,
  setFieldValue: (field: string, value: any) => void,
  countiesList: County[],
  isLoadingCounties: boolean,
  loadStates: (input: string, cb: (options: any[]) => void) => void,
  // utilitiesList: Utility[],
  // isLoadingUtilities: boolean,
  activeDeliveryTab: "method" | "schedule" | "other",
  setActiveDeliveryTab: (tab: "method" | "schedule" | "other") => void,
  isEditMode: boolean,
  isAdmin: boolean,
  formKey?: number, // Add formKey parameter
) => {
  switch (activeTab) {
    case "basic":
      return <CampaignBasicInfo values={values} setFieldValue={setFieldValue} isEditMode={isEditMode} isAdmin={isAdmin} />;
    case "geography":
      return (
        <CampaignGeography
          values={values}
          setFieldValue={setFieldValue}
          // countiesList={countiesList}
          // isLoadingCounties={isLoadingCounties}
          loadStates={loadStates}
          isEditMode={isEditMode} 
          isAdmin={isAdmin}
          formKey={formKey} // Pass formKey
        />
      );
    // case "utilities":
    //   return <CampaignUtility values={values} utilitiesList={utilitiesList} isLoadingUtilities={isLoadingUtilities} />;
    case "delivery":
      return (
        <CampaignDelivery
          values={values}
          setFieldValue={setFieldValue}
          activeDeliveryTab={activeDeliveryTab}
          setActiveDeliveryTab={setActiveDeliveryTab}
          isEditMode={isEditMode} 
          formKey={formKey} // Pass formKey
        />
      );
    case "notes":
      return <CampaignNote values={values} setFieldValue={setFieldValue} />;
    default:
      return null;
  }
};