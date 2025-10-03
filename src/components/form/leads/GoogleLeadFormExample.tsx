// components/form/leads/GoogleLeadFormExample.tsx
// This is an example showing how to replace your existing address input with Google-powered one

import React from 'react';
import { Formik, Form } from 'formik';
import FormikGoogleAddressInput from '@/components/common/FormikGoogleAddressInput';
import FormikInput from '@/components/form/FormikInput'; // Your existing input component

interface LeadFormValues {
  // ... your other form fields
  address: {
    full_address: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    county?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    place_id?: string;
  };
}

const GoogleLeadFormExample: React.FC = () => {
  const initialValues: LeadFormValues = {
    address: {
      full_address: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      county: '',
      coordinates: undefined,
      place_id: ''
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => {
        console.log('Form submitted with Google address data:', values);
      }}
    >
      {({ errors, touched, values }) => (
        <Form>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Address (Google Powered)</h3>
            
            {/* 🚀 NEW: Google-powered address input with auto-fill */}
            <FormikGoogleAddressInput
              name="address.full_address"
              label="Full Address"
              placeholder="Start typing your US address..."
              errorMessage={
                touched?.address?.full_address ? errors?.address?.full_address : undefined
              }
              showCurrentLocation={true}
              autoFillFields={{
                street: 'address.street',
                city: 'address.city',
                state: 'address.state',
                zipCode: 'address.zip_code',
                county: 'address.county',
                coordinates: 'address.coordinates',
                placeId: 'address.place_id'
              }}
              onAddressSelect={(addressData) => {
                if (addressData) {
                  console.log('✅ Address selected with details:', addressData);
                  // You can perform additional actions here
                }
              }}
            />

            {/* These fields will be auto-filled when address is selected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormikInput
                name="address.street"
                label="Street Address *"
                placeholder="Auto-filled from address selection"
                errorMessage={touched?.address?.street && errors?.address?.street}
              />
              <FormikInput
                name="address.city"
                label="City *"
                placeholder="Auto-filled from address selection"
                errorMessage={touched?.address?.city && errors?.address?.city}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormikInput
                name="address.state"
                label="State *"
                placeholder="Auto-filled (e.g., CA, NY, TX)"
                errorMessage={touched?.address?.state && errors?.address?.state}
              />
              <FormikInput
                name="address.zip_code"
                label="ZIP Code *"
                placeholder="Auto-filled from address"
                errorMessage={touched?.address?.zip_code && errors?.address?.zip_code}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormikInput
                name="address.county"
                label="County"
                placeholder="Auto-filled from address"
                errorMessage={touched?.address?.county && errors?.address?.county}
              />
            </div>

            {/* Debug info - remove in production */}
            {values.address.coordinates && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">✅ Google Address Data Captured:</h4>
                <div className="text-xs text-green-700 space-y-1">
                  <div><strong>Coordinates:</strong> {values.address.coordinates.lat}, {values.address.coordinates.lng}</div>
                  <div><strong>Place ID:</strong> {values.address.place_id}</div>
                  <div><strong>County:</strong> {values.address.county || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Lead with Google Address
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default GoogleLeadFormExample;
