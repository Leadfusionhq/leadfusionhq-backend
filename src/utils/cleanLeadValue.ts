// utils/cleanLeadValue.ts
import { initialLeadValues } from "@/constants/initialLeadValues";

// Define a type for the state option
interface StateOption {
  value?: string;
  _id?: string;
  label?: string;
  name?: string;
  abbreviation?: string;
}

export const cleanLeadValues = (values: typeof initialLeadValues) => {
  // Ensure phone_number is set correctly
  const phoneNumber = values.phone_number || values.phone || '';
  
  // Safely extract state value
  const stateValue = values.address.state 
    ? typeof values.address.state === 'object' 
      ? (values.address.state as StateOption).value || (values.address.state as StateOption)._id || ""
      : values.address.state
    : "";
  
  return {
    // Required fields
    campaign_id: values.campaign_id,
    first_name: values.first_name,
    last_name: values.last_name,
    phone_number: phoneNumber,
    
    // Optional personal fields
    ...(values.middle_name && { middle_name: values.middle_name }),
    ...(values.suffix && { suffix: values.suffix }),
    ...(values.gender && { gender: values.gender }),
    ...(values.age && { age: Number(values.age) }),
    
    // Contact information
    ...(values.email && { email: values.email }),
    ...(values.phone && { phone: values.phone }),
    
    // Property information
    ...(values.homeowner_desc && { homeowner_desc: values.homeowner_desc }),
    ...(values.dwelltype && { dwelltype: values.dwelltype }),
    ...(values.house && { house: values.house }),
    
    // Address components
    ...(values.predir && { predir: values.predir }),
    ...(values.strtype && { strtype: values.strtype }),
    ...(values.postdir && { postdir: values.postdir }),
    ...(values.apttype && { apttype: values.apttype }),
    ...(values.aptnbr && { aptnbr: values.aptnbr }),
    
    // Address object
    address: {
      full_address: values.address.full_address,
      street: values.address.street,
      city: values.address.city,
      state: stateValue,
      zip_code: values.address.zip_code,
      ...(values.address.zip && { zip: values.address.zip }),
    },
    
    // Additional information
    ...(values.note && { note: values.note }),
    status: values.status || 'active',
    source: values.source || 'manual'
  };
};