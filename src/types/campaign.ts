"use client";
import { DAYS_OF_WEEK, LEAD_TYPE, EXCLUSIVITY, STATUS, LANGUAGE, UTILITIES } from "@/constants/enums";

export interface DaySchedule {
  day: typeof DAYS_OF_WEEK[number];
  active: boolean;
  start_time: string;
  end_time: string;
  cap: number;
}

export type State = {
  name: string;
  abbreviation: string;
  _id: string;
};

export type County = {
  name: string;
  _id: string;
};

export interface StateOption {
  value: string;
  label: string;
  name: string;
  abbreviation: string;
}

export interface CountyOption {
  value: string;
  label: string;
}

export interface Utility {
  _id: string;
  name: string;
}

export type UtilityMode = keyof typeof UTILITIES;

// ✅ Complete form values type
export interface CampaignFormValues {
  name: string;
  status: keyof typeof STATUS;
  lead_type: keyof typeof LEAD_TYPE;
  exclusivity: keyof typeof EXCLUSIVITY;
  bid_price: number;
  language: string;
  poc_phone: string;
  company_contact_phone: string;
  company_contact_email: string;
  geography: {
    state: StateOption | null;
    coverage: {
      type: "FULL_STATE" | "PARTIAL";
      partial: {
        counties: CountyOption[];
        radius: string;
        zipcode: string;
        zip_codes: string;
        countries: string[];
      };
    };
  };
  utilities: {
    mode: UtilityMode;
    exclude_some: string[];
    include_some: string[];
  };
  delivery: {
    method: "email" | "phone" | "crm";
    email: { addresses: string; subject: string };
    phone: { numbers: string };
    crm: { instructions: string };
    other: { homeowner_count: number };
    schedule: { days: DaySchedule[] };
  };
  note: string;
}


interface Campaign {
  id: number;
  name: string;
  description?: string;
  state?: string;
  contactCount?: number;
  created_at?: string;
  [key: string]: unknown;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
export interface CampaignResponse {
  data: never[];
  pagination: null;
  campaigns: {
    data: Campaign[];
    pagination: Pagination;
  };
}