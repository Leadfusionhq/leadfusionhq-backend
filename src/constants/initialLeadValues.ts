// constants/initialLeadValues.ts
"use client";
import { StateOption } from "@/types/campaign";

type Coordinates = { 
  lat: number | undefined; 
  lng: number | undefined; 
};

type LeadAddressInitial = {
  full_address: string;
  street: string;
  city: string;
  state: StateOption | string | null; // Allow string for API responses
  zip_code: string;
  zip: string;
  coordinates?: Coordinates | null; // Make it optional
  place_id?: string | null; // Make it optional
};

type LeadInitialValues = {
  campaign_id: string;
  lead_id: string;
  status: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  gender: string;
  age: string | number;
  phone_number: string;
  phone: string;
  email: string;
  homeowner_desc: string;
  dwelltype: string;
  house: string;
  predir: string;
  strtype: string;
  postdir: string;
  apttype: string;
  aptnbr: string;
  address: LeadAddressInitial;
  note: string;
  source: string;
};

export const initialLeadValues: LeadInitialValues = {
  // Lead identification
  campaign_id: '',
  lead_id: '',
  status: 'active',
  
  // Personal information (required fields marked with *)
  first_name: '', // *
  middle_name: '',
  last_name: '', // *
  suffix: '',
  gender: '',
  age: '',
  
  // Contact information
  phone_number: '', // *
  phone: '', // Legacy field
  email: '',
  
  // Property information
  homeowner_desc: '',
  dwelltype: '',
  house: '',
  
  // Address components
  predir: '',
  strtype: '',
  postdir: '',
  apttype: '',
  aptnbr: '',
  
  // Main address (required fields marked with *)
  address: {
    full_address: '', // *
    street: '', // *
    city: '', // *
    state: null, // * (ObjectId reference or StateOption)
    zip_code: '', // *
    zip: '', // Legacy field
    coordinates: undefined, // 🔥 Changed from null to undefined
    place_id: undefined // 🔥 Changed from '' to undefined
  },
  
  // Additional information
  note: '',
  source: 'manual'
};

export type { LeadInitialValues, LeadAddressInitial, Coordinates };