// app/test-google-address/page.tsx
'use client';
import React, { useState } from 'react';
import GoogleAddressAutocomplete from '@/components/common/GoogleAddressAutocomplete';
import GoogleBillingAddressAutocomplete from '@/components/common/GoogleBillingAddressAutocomplete';

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

const TestGoogleAddressPage: React.FC = () => {
  const [address1, setAddress1] = useState('');
  const [address1Details, setAddress1Details] = useState<PlaceDetails | null>(null);
  const [billingAddress, setBillingAddress] = useState('');
  const [billingDetails, setBillingDetails] = useState<PlaceDetails | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🇺🇸 Google Maps Address Autocomplete Test
          </h1>
          
          <div className="space-y-8">
            {/* Test 1: Basic Address Input */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 1: Basic Address Input</h2>
              
              <GoogleAddressAutocomplete
                value={address1}
                onChange={(value, details) => {
                  setAddress1(value);
                  setAddress1Details(details || null);
                }}
                label="Home Address"
                placeholder="Type your US address (e.g., 123 Main St, New York, NY)"
                showCurrentLocation={true}
              />

              {address1Details && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">✅ Address Details Captured:</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div><strong>Full Address:</strong> {address1Details.formattedAddress}</div>
                    <div><strong>Street:</strong> {address1Details.addressComponents.streetNumber} {address1Details.addressComponents.streetName}</div>
                    <div><strong>City:</strong> {address1Details.addressComponents.city}</div>
                    <div><strong>State:</strong> {address1Details.addressComponents.state}</div>
                    <div><strong>ZIP:</strong> {address1Details.addressComponents.zipCode}</div>
                    <div><strong>County:</strong> {address1Details.addressComponents.county}</div>
                    <div><strong>Coordinates:</strong> {address1Details.coordinates.lat}, {address1Details.coordinates.lng}</div>
                    <div><strong>Place ID:</strong> {address1Details.placeId}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Test 2: Billing Address */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 2: Billing Address Component</h2>
              
              <GoogleBillingAddressAutocomplete
                value={billingAddress}
                onChange={(value, details) => {
                  setBillingAddress(value);
                  setBillingDetails(details || null);
                }}
                showCurrentLocation={true}
              />

              {billingDetails && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Billing Address Details:</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <div><strong>Address:</strong> {billingDetails.formattedAddress}</div>
                    <div><strong>Components:</strong> {JSON.stringify(billingDetails.addressComponents, null, 2)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-800 mb-3">🧪 How to Test:</h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li><strong>1. Type Test:</strong> Start typing "123 Main" and see US suggestions appear</li>
                <li><strong>2. Current Location:</strong> Click the location icon to get your precise address</li>
                <li><strong>3. Keyboard Navigation:</strong> Use arrow keys to navigate suggestions, Enter to select</li>
                <li><strong>4. US Only:</strong> Try typing international addresses - they won't appear</li>
                <li><strong>5. Accuracy Test:</strong> Compare current location result with your actual address</li>
              </ul>
            </div>

            {/* Status Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3">📊 Component Status:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Google Maps API Integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>US-Only Address Filtering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>High-Accuracy Location Detection</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Address Component Parsing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Keyboard Navigation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Formik Integration Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestGoogleAddressPage;
