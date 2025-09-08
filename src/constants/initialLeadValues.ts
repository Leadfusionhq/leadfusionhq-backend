"use client";
import { StateOption } from "@/types/campaign";

// constants/initialLeadValues.ts

export const initialLeadValues = {
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
    zip: '' // Legacy field, synced with zip_code
  },
  
  // Additional information
  note: '',
  source: 'manual'
};