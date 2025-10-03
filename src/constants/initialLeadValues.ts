"use client";
import { StateOption } from "@/types/campaign";

// constants/initialLeadValues.ts

type Coordinates = { lat: number; lng: number };

type LeadAddressInitial = {
  full_address: string;
  street: string;
  city: string;
  state: StateOption | null;
  zip_code: string;
  zip: string;
  coordinates: Coordinates | null | undefined;
  place_id: string | undefined;
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
  phone: '', // Legacy field, can be synced with phone_number
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
    state: null, // * (ObjectId reference)
    zip_code: '', // *
    zip: '', // Legacy field, synced with zip_code
    coordinates: null, // Google Maps coordinates { lat, lng }
    place_id: '' // Google Places API place ID
  },
  
  // Additional information
  note: '',
  source: 'manual'
};