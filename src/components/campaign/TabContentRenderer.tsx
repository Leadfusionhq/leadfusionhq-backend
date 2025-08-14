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
  utilitiesList: Utility[],
  isLoadingUtilities: boolean,
  activeDeliveryTab: "method" | "schedule" | "other",
  setActiveDeliveryTab: (tab: "method" | "schedule" | "other") => void
) => {
  switch (activeTab) {
    case "basic":
      return <CampaignBasicInfo values={values} setFieldValue={setFieldValue} />;
    case "geography":
      return (
        <CampaignGeography
          values={values}
          setFieldValue={setFieldValue}
          countiesList={countiesList}
          isLoadingCounties={isLoadingCounties}
          loadStates={loadStates}
        />
      );
    case "utilities":
      return <CampaignUtility values={values} utilitiesList={utilitiesList} isLoadingUtilities={isLoadingUtilities} />;
    case "delivery":
      return (
        <CampaignDelivery
          values={values}
          setFieldValue={setFieldValue}
          activeDeliveryTab={activeDeliveryTab}
          setActiveDeliveryTab={setActiveDeliveryTab}
        />
      );
    case "notes":
      return <CampaignNote values={values} setFieldValue={setFieldValue} />;
    default:
      return null;
  }
};
