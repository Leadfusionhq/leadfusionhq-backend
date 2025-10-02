// app/test-lead-form/page.tsx
'use client';
import React from 'react';
import { Formik, Form } from 'formik';
import FormikGoogleAddressInput from '@/components/common/FormikGoogleAddressInput';
import FormikInput from '@/components/form/FormikInput';

const TestLeadFormPage: React.FC = () => {
  const initialValues = {
    address: {
      full_address: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      coordinates: null,
      place_id: ''
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🧪 Test Google Auto-Fill in Lead Form
          </h1>
          
          <Formik
            initialValues={initialValues}
            onSubmit={(values) => {
              console.log('Form submitted:', values);
            }}
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-6">
                {/* Google Address Input with Auto-Fill */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Section</h3>
                  
                  <FormikGoogleAddressInput
                    name="address.full_address"
                    label="Full Address (Google Auto-Fill Test)"
                    placeholder="Start typing your US address..."
                    showCurrentLocation={true}
                    autoFillFields={{
                      street: 'address.street',
                      city: 'address.city',
                      state: 'address.state',
                      zipCode: 'address.zip_code',
                      coordinates: 'address.coordinates',
                      placeId: 'address.place_id'
                    }}
                    onAddressSelect={(addressData) => {
                      if (addressData) {
                        console.log('🎯 Address selected:', addressData);
                        console.log('🎯 Address components:', addressData.addressComponents);
                      }
                    }}
                  />

                  {/* Auto-filled fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <FormikInput
                      name="address.street"
                      label="Street Address (Should Auto-Fill)"
                      placeholder="Watch this fill automatically"
                    />
                    <FormikInput
                      name="address.city"
                      label="City (Should Auto-Fill)"
                      placeholder="Watch this fill automatically"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <FormikInput
                      name="address.state"
                      label="State (Should Auto-Fill)"
                      placeholder="Watch this fill automatically"
                    />
                    <FormikInput
                      name="address.zip_code"
                      label="ZIP Code (Should Auto-Fill)"
                      placeholder="Watch this fill automatically"
                    />
                  </div>
                </div>

                {/* Debug Section */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-4">🔍 Debug: Current Form Values</h4>
                  <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-60">
                    {JSON.stringify(values, null, 2)}
                  </pre>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-3">🧪 Testing Instructions:</h3>
                  <ol className="text-sm text-blue-700 space-y-2">
                    <li><strong>1.</strong> Type "123 Main St, New York" in the address field</li>
                    <li><strong>2.</strong> Select an address from Google suggestions</li>
                    <li><strong>3.</strong> Watch the fields below auto-fill with street, city, state, ZIP</li>
                    <li><strong>4.</strong> Check the debug section to see the complete data</li>
                    <li><strong>5.</strong> Open browser console to see detailed logs</li>
                  </ol>
                </div>

                {/* Results */}
                {values.address.coordinates && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-semibold text-green-800 mb-3">✅ Auto-Fill Working!</h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <div><strong>Full Address:</strong> {values.address.full_address}</div>
                      <div><strong>Street:</strong> {values.address.street}</div>
                      <div><strong>City:</strong> {values.address.city}</div>
                      <div><strong>State:</strong> {values.address.state}</div>
                      <div><strong>ZIP:</strong> {values.address.zip_code}</div>
                      <div><strong>Coordinates:</strong> {JSON.stringify(values.address.coordinates)}</div>
                      <div><strong>Place ID:</strong> {values.address.place_id}</div>
                    </div>
                  </div>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default TestLeadFormPage;
