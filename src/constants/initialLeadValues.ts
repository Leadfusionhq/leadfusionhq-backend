"use client";
import { StateOption } from "@/types/campaign";

export const initialLeadValues = {
  campaign_id: "",    
  first_name: "",      
  last_name: "",
  email: "",          
  phone: "",         
  address: {
    street: "",       
    city: "",          
     state: null as StateOption | null,      
    zip_code: "",   
  },
  note: "",           
};
