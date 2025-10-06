// request-schemas/lead-schema.ts

import * as Yup from 'yup';

// Define an interface for the state object
interface StateObject {
  value?: string;
  // Add other possible properties if needed
  label?: string;
  name?: string;
  abbreviation?: string;
  _id?: string;
}


export const LeadValidationSchema = Yup.object().shape({
  // Lead identification
  lead_id: Yup.string()
    .trim()
    .max(50, 'Lead ID must be at most 50 characters'),
  
  status: Yup.string()
    .oneOf(['active', 'inactive', 'contacted', 'converted', 'invalid'], 'Invalid status')
    .default('active'),
  
  // Personal information - Required fields
  first_name: Yup.string()
    .trim()
    .required('First name is required')
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name must be at most 50 characters'),
    
  last_name: Yup.string()
    .trim()
    .required('Last name is required')
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must be at most 50 characters'),
    
  // Personal information - Optional fields
  middle_name: Yup.string()
    .trim()
    .max(50, 'Middle name must be at most 50 characters'),
    
  suffix: Yup.string()
    .trim()
    .max(10, 'Suffix must be at most 10 characters'),
    
  gender: Yup.string()
    .oneOf(['M', 'F', 'Male', 'Female', 'Other', ''], 'Invalid gender selection'),
    
  age: Yup.number()
    .nullable()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return null;
      }
      return value;
    })
    .min(0, 'Age must be at least 0')
    .max(150, 'Age must be at most 150')
    .integer('Age must be a whole number'),
    
  // Contact information - Required fields
  phone_number: Yup.string()
    .trim()
    .required('Phone number is required'),
    
  // Contact information - Optional fields
  phone: Yup.string()
    .trim(),
    
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .lowercase()
    .transform((value, originalValue) => {
      // Convert empty strings to null
      return originalValue === '' ? null : value;
    })
    .nullable()
    .default(null),
    
  // Property information - Optional fields
  homeowner_desc: Yup.string()
    .trim(),
    
  dwelltype: Yup.string()
    .trim(),
    
  house: Yup.string()
    .trim(),
    
  // Address components - Optional fields
  predir: Yup.string()
    .trim()
    .max(10, 'Pre-direction must be at most 10 characters'),
    
  strtype: Yup.string()
    .trim()
    .max(20, 'Street type must be at most 20 characters'),
    
  postdir: Yup.string()
    .trim()
    .max(10, 'Post-direction must be at most 10 characters'),
    
  apttype: Yup.string()
    .trim()
    .max(20, 'Apartment type must be at most 20 characters'),
    
  aptnbr: Yup.string()
    .trim()
    .max(20, 'Apartment number must be at most 20 characters'),
    
  // Main address - Required and optional fields
  address: Yup.object().shape({
    full_address: Yup.string()
      .trim()
      // .required('Full address is required')
      .min(1, 'Full address must be at least 1 character')
      .max(500, 'Full address must be at most 500 characters'),
      
    street: Yup.string()
      .trim()
      .required('Street address is required')
      .min(1, 'Street address must be at least 1 character')
      .max(200, 'Street address must be at most 200 characters'),
      
    city: Yup.string()
      .trim()
      .required('City is required')
      .min(1, 'City must be at least 1 character')
      .max(100, 'City must be at most 100 characters'),
      
      state: Yup.mixed()
      .required('State is required')
      .test('is-valid-state', 'Please select a valid state', (value) => {
        // If it's an object, check if it has value property
        if (value && typeof value === 'object' && value !== null) {
          // Type assertion to access the value property safely
          const stateObj = value as StateObject;
          return !!(stateObj.value || stateObj._id);
        }
        // If it's a string, check if it's not empty
        if (typeof value === 'string') {
          return value.length > 0;
        }
        return false;
      }),
      
    zip_code: Yup.string()
      .trim()
      .required('Zip code is required')
      .min(5, 'Zip code must be at least 5 characters')
      .max(10, 'Zip code must be at most 10 characters')
      .matches(/^[0-9-]*$/, 'Zip code must contain only numbers and dashes'),
      
    zip: Yup.string()
      .trim()
      .min(5, 'Zip must be at least 5 characters')
      .max(10, 'Zip must be at most 10 characters')
      .matches(/^[0-9-]*$/, 'Zip must contain only numbers and dashes'),
          // 🔥 ADD: Coordinates validation
      coordinates: Yup.object()
        .shape({
          lat: Yup.number()
            .min(-90, 'Latitude must be between -90 and 90')
            .max(90, 'Latitude must be between -90 and 90')
            .required('Latitude is required when coordinates are provided'),
          lng: Yup.number()
            .min(-180, 'Longitude must be between -180 and 180')
            .max(180, 'Longitude must be between -180 and 180')
            .required('Longitude is required when coordinates are provided'),
        })
        .nullable()
        .optional()
        .default(undefined),

      // 🔥 ADD: Place ID validation
      place_id: Yup.string()
        .trim()
        .nullable()
        .optional()
        .default(undefined),
    }),

  
  // Additional information - Optional fields
  note: Yup.string()
    .trim()
    .max(1000, 'Note must be at most 1000 characters'),
    
  source: Yup.string()
    .oneOf(['manual', 'csv_upload', 'api', 'import'], 'Invalid source')
    .default('manual')
});

