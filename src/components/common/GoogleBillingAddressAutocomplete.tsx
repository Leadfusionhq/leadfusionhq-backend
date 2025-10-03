// components/common/GoogleBillingAddressAutocomplete.tsx
'use client';
import React from 'react';
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

interface GoogleBillingAddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: PlaceDetails) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  showCurrentLocation?: boolean;
  disabled?: boolean;
  className?: string;
}

const GoogleBillingAddressAutocomplete: React.FC<GoogleBillingAddressAutocompleteProps> = ({
  value,
  onChange,
  label = "Billing Address",
  placeholder = "Start typing your US billing address...",
  errorMessage,
  showCurrentLocation = true,
  disabled = false,
  className = ""
}) => {
  const handleAddressChange = (newValue: string, details?: PlaceDetails) => {
    onChange(newValue, details);
    
    if (details) {
      console.log('✅ Billing address selected:', {
        address: newValue,
        components: details.addressComponents,
        coordinates: details.coordinates,
        placeId: details.placeId
      });
    }
  };

  return (
    <GoogleAddressAutocomplete
      value={value}
      onChange={handleAddressChange}
      label={label}
      placeholder={placeholder}
      errorMessage={errorMessage}
      showCurrentLocation={showCurrentLocation}
      disabled={disabled}
      className={className}
    />
  );
};

export default GoogleBillingAddressAutocomplete;
