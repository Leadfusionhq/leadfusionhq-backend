import { DAYS_OF_WEEK, LEAD_TYPE, EXCLUSIVITY, STATUS, LANGUAGE, UTILITIES } from "@/constants/enums";

// Types for day schedules
export type DaySchedule = {
  day: typeof DAYS_OF_WEEK[number];
  active: boolean;
  start_time: string;
  end_time: string;
  cap: number;
};

// API response types
interface State {
  name: string;
  abbreviation: string;
  _id: string;
}

interface County {
  name: string;
  _id: string;
}

interface Utility {
  _id: string;
  name: string;
}

// Form option types
export type StateOption = { 
  value: string; 
  label: string; 
  name: string; 
  abbreviation: string 
};

export type CountyOption = { 
  value: string; 
  label: string 
};

export type UtilityMode = keyof typeof UTILITIES;

// Complete form values type
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

export type { State, County, Utility };