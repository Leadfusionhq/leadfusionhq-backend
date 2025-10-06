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

  // 🔥 FIX: Handle coordinates properly
  const coordinates = values.address?.coordinates?.lat && values.address?.coordinates?.lng
    ? {
        lat: Number(values.address.coordinates.lat),
        lng: Number(values.address.coordinates.lng),
      }
    : undefined;

  // 🔥 FIX: Handle place_id properly
  const placeId = values.address?.place_id && values.address.place_id.trim() !== ''
    ? values.address.place_id
    : undefined;

  console.log('🧹 cleanLeadValues - Coordinates:', coordinates);
  console.log('🧹 cleanLeadValues - Place ID:', placeId);
  
  return {
    // Required fields
    campaign_id: typeof values.campaign_id === 'object'
      ? (values.campaign_id as { _id: string })._id
      : values.campaign_id,

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
    
    // 🔥 FIXED: Address object with coordinates and place_id
    address: {
      full_address: values.address.full_address,
      street: values.address.street,
      city: values.address.city,
      state: stateValue,
      zip_code: values.address.zip_code,
      ...(values.address.zip && { zip: values.address.zip }),
      
      // 🔥 CRITICAL: Include coordinates if valid
      ...(coordinates && { coordinates }),
      
      // 🔥 CRITICAL: Include place_id if exists
      ...(placeId && { place_id: placeId }),
    },
    
    // Additional information
    ...(values.note && { note: values.note }),
    status: values.status || 'active',
    source: values.source || 'manual'
  };
};