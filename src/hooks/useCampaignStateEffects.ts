"use client";

import { useEffect } from "react";
import { County, Utility, StateOption } from "@/types/campaign";
import { LOCATION_API, UITILITIES_API } from "@/utils/apiUrl";
import { toast } from "react-toastify";
import axiosWrapper from "@/utils/api";

interface CampaignStateEffectsProps {
  selectedState: StateOption | null;
  coverageType: string | undefined;
  token: string | null;
  setCountiesList: (counties: County[]) => void;
  setIsLoadingCounties: (loading: boolean) => void;
  setUtilitiesList: (utilities: Utility[]) => void;
  setIsLoadingUtilities: (loading: boolean) => void;
}

export const StateEffectsHandler = ({
  selectedState,
  coverageType,
  token,
  setCountiesList,
  setIsLoadingCounties,
  setUtilitiesList,
  setIsLoadingUtilities,
}: CampaignStateEffectsProps) => {
  useEffect(() => {
    if (selectedState && coverageType === "PARTIAL") {
      const fetchCounties = async () => {
        setIsLoadingCounties(true);
        setCountiesList([]);
        try {
          const url = LOCATION_API.GET_COUNTIES_BY_STATE.replace(":stateId", selectedState.value);
          const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: County[] };
          setCountiesList(response.data);
        } catch (err) {
          console.error("Failed to load County:", err);
          toast.error("Could not load County list");
        } finally {
          setIsLoadingCounties(false);
        }
      };
      fetchCounties();
    } else {
      setCountiesList([]);
      setIsLoadingCounties(false);
    }
  }, [selectedState?.value, coverageType, token]);

  useEffect(() => {
    if (selectedState) {
      const fetchUtilities = async () => {
        setIsLoadingUtilities(true);
        setUtilitiesList([]);
        try {
          const url = UITILITIES_API.GET_UITILITIES_BY_STATE.replace(":stateId", selectedState.value);
          const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: Utility[] };
          setUtilitiesList(response.data);
        } catch (err) {
          console.error("Failed to load utilities:", err);
          toast.error("Could not load utility list");
        } finally {
          setIsLoadingUtilities(false);
        }
      };
      fetchUtilities();
    } else {
      setUtilitiesList([]);
      setIsLoadingUtilities(false);
    }
  }, [selectedState?.value, token]);

  return null; // ✅ This makes it a valid JSX component
};
