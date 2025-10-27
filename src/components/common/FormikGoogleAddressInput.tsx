// components/common/FormikGoogleAddressInput.tsx
'use client';
import React from 'react';
import { useFormikContext } from 'formik';
import GoogleAddressAutocomplete from './GoogleAddressAutocomplete';

interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  addressComponents: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    fullAddress?: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  types: string[];
}

interface FormikGoogleAddressInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  showCurrentLocation?: boolean;
  onAddressSelect?: (addressData: PlaceDetails | null) => void;
  autoFillFields?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    coordinates?: string;
    placeId?: string;
  };
  disabled?: boolean;
  className?: string;
}

const FormikGoogleAddressInput: React.FC<FormikGoogleAddressInputProps> = ({
  name,
  label,
  placeholder = "Start typing your US address...",
  errorMessage,
  showCurrentLocation = true,
  onAddressSelect,
  autoFillFields,
  className = ""
}) => {
  const formik = useFormikContext<any>();

  // Get nested value helper
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Set nested value helper
  const setNestedValue = (path: string, value: any) => {
    formik.setFieldValue(path, value);
  };

  const fieldValue = getNestedValue(formik.values, name) || '';

  const handleAddressChange = (value: string, details?: PlaceDetails) => {
    // Set the main address field
    formik.setFieldValue(name, value);

    if (details && autoFillFields) {
      console.log('🔧 Auto-filling fields with:', details.addressComponents);
      
      // Auto-fill street address - handle different formats
      if (autoFillFields.street) {
        let streetAddress = '';
        
        // Method 1: Street number + street name
        if (details.addressComponents.streetNumber && details.addressComponents.streetName) {
          streetAddress = `${details.addressComponents.streetNumber} ${details.addressComponents.streetName}`;
        }
        // Method 2: Use the first part of formatted address (before first comma)
        else if (details.formattedAddress) {
          const addressParts = details.formattedAddress.split(',');
          streetAddress = addressParts[0]?.trim() || '';
        }
        
        if (streetAddress) {
          setNestedValue(autoFillFields.street, streetAddress);
          console.log('✅ Auto-filled street:', streetAddress);
        }
      }

      if (autoFillFields.city && details.addressComponents.city) {
        setNestedValue(autoFillFields.city, details.addressComponents.city);
        console.log('✅ Auto-filled city:', details.addressComponents.city);
      }

      if (autoFillFields.state && details.addressComponents.state) {
        setNestedValue(autoFillFields.state, details.addressComponents.state);
        console.log('✅ Auto-filled state:', details.addressComponents.state);
      }

      if (autoFillFields.zipCode && details.addressComponents.zipCode) {
        setNestedValue(autoFillFields.zipCode, details.addressComponents.zipCode);
        console.log('✅ Auto-filled ZIP:', details.addressComponents.zipCode);
      }

      if (autoFillFields.county && details.addressComponents.county) {
        setNestedValue(autoFillFields.county, details.addressComponents.county);
        console.log('✅ Auto-filled county:', details.addressComponents.county);
      }

      if (autoFillFields.coordinates && details.coordinates) {
        setNestedValue(autoFillFields.coordinates, details.coordinates);
        console.log('✅ Auto-filled coordinates:', details.coordinates);
      }

      if (autoFillFields.placeId && details.placeId) {
        setNestedValue(autoFillFields.placeId, details.placeId);
        console.log('✅ Auto-filled place ID:', details.placeId);
      }
    }

    // Call the optional callback
    if (onAddressSelect) {
      onAddressSelect(details || null);
    }

    console.log('✅ Address updated:', {
      mainField: value,
      details: details,
      autoFilledFields: autoFillFields
    });
  };

  return (
    <GoogleAddressAutocomplete
      value={fieldValue}
      onChange={handleAddressChange}
      label={label}
      placeholder={placeholder}
      errorMessage={errorMessage}
      showCurrentLocation={showCurrentLocation}
      disabled={formik.isSubmitting}
      className={className}
    />
  );
};

export default FormikGoogleAddressInput;
