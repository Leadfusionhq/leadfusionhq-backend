"use client";
import { Formik, Form } from "formik";
import { FormikInput, FormikTextarea, CustomFormikAsyncSelect, FormikSelect } from "@/components/form";
import { LeadValidationSchema } from "@/request-schemas/lead-schema";
import { StateOption } from "@/types/campaign";
import { initialLeadValues } from "@/constants/initialLeadValues";
import FormikGoogleAddressInput from '@/components/common/FormikGoogleAddressInput';


type LeadFormProps = {
  campaignId: string;
  initialValues: typeof initialLeadValues;
  onSubmit: (
    values: typeof initialLeadValues,
    formikHelpers: {

      setSubmitting: (isSubmitting: boolean) => void;
      resetForm: () => void;
    }
  ) => void;
  stateOptions: StateOption[];
  isLoadingStates: boolean;
};

// Gender options based on model enum
const genderOptions = [
  { value: '', label: 'Select Gender' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
];

// Status options based on model enum
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'invalid', label: 'Invalid' }
];

// Source options based on model enum
const sourceOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'csv_upload', label: 'CSV Upload' },
  { value: 'api', label: 'API' },
  { value: 'import', label: 'Import' }
];


const LeadForm = ({
  campaignId,
  initialValues,
  onSubmit,
  stateOptions,
  isLoadingStates,
}: LeadFormProps) => {
  // Async filter function for states dropdown
  const loadStates = (inputValue: string, callback: (options: StateOption[]) => void) => {
    if (!inputValue || inputValue.trim() === "") {
      callback(stateOptions.slice(0, 50));
      return;
    }
    
    const filteredOptions = stateOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.abbreviation.toLowerCase().includes(inputValue.toLowerCase())
    );

    callback(filteredOptions);
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      validationSchema={LeadValidationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, errors, touched ,values,setFieldValue,}) => (

        <>

        {/* <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h4 className="font-bold text-blue-800">ALL FORM VALUES:</h4>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(values, null, 2)}
          </pre>
        </div> */}


        <Form className="space-y-6 bg-white p-8 rounded-lg border border-gray-300 shadow-lg max-w-6xl mx-auto">
          {/* Lead Identification Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Lead Information {values.lead_id ? `- ID: ${values.lead_id}` : ''}
            </h3>
            <FormikSelect
              name="status"
              label="Status"
              options={statusOptions}
              errorMessage={touched.status && errors.status}
            />
          </div>

          {/* Personal Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormikInput
                name="first_name"
                label="First Name *"
                placeholder="Enter first name"
                errorMessage={touched.first_name && errors.first_name}
              />
              <FormikInput
                name="middle_name"
                label="Middle Name"
                placeholder="Enter middle name"
                errorMessage={touched.middle_name && errors.middle_name}
              />
              <FormikInput
                name="last_name"
                label="Last Name *"
                placeholder="Enter last name"
                errorMessage={touched.last_name && errors.last_name}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <FormikInput
                name="suffix"
                label="Suffix"
                placeholder="Jr., Sr., III, etc."
                errorMessage={touched.suffix && errors.suffix}
              />
              <FormikSelect
                name="gender"
                label="Gender"
                options={genderOptions}
                errorMessage={touched.gender && errors.gender}
              />
              <FormikInput
                name="age"
                type="number"
                label="Age"
                placeholder="Enter age"
                errorMessage={touched.age && errors.age}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput
                name="phone_number"
                label="Phone Number *"
                placeholder="Enter phone number"
                errorMessage={touched.phone_number && errors.phone_number}
              />
              <FormikInput
                name="email"
                type="email"
                label="Email"
                placeholder="Enter email address"
                errorMessage={touched.email && errors.email}
              />
            </div>
          </div>

          {/* Property Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormikInput
                name="dwelltype"
                label="Dwelling Type"
                placeholder="Single Family, Condo, Apartment, etc."
                errorMessage={touched.dwelltype && errors.dwelltype}
              />
              <FormikInput
                name="house"
                label="Year Build"
                placeholder="Enter Year Build"
                errorMessage={touched.house && errors.house}
              />
              <FormikInput
                name="homeowner_desc"
                label="Homeowner Description"
                placeholder="Owner, Renter, etc."
                errorMessage={touched.homeowner_desc && errors.homeowner_desc}
              />
            </div>
          </div>

          {/* Address Components Section */}
          {/* <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormikInput
                name="predir"
                label="Pre-Direction"
                placeholder="N, S, E, W, etc."
                errorMessage={touched.predir && errors.predir}
              />
               <FormikInput
                  name="strtype"
                  label="Street Type"
                  placeholder="St, Ave, Blvd, etc."
                  errorMessage={touched.strtype && errors.strtype}
                />
              <FormikInput
                name="postdir"
                label="Post-Direction"
                placeholder="N, S, E, W, etc."
                errorMessage={touched.postdir && errors.postdir}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormikInput
                name="apttype"
                label="Apartment Type"
                placeholder="Apt, Unit, Suite, etc."
                errorMessage={touched.apttype && errors.apttype}
              />
              <FormikInput
                name="aptnbr"
                label="Apartment Number"
                placeholder="Enter apartment number"
                errorMessage={touched.aptnbr && errors.aptnbr}
              />
            </div>
          </div> */}

          {/* Main Address Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Address</h3>
            
            {/* <FormikInput
              name="address.full_address"
              label="Full Address *"
              placeholder="Enter complete address"
              errorMessage={touched?.address?.full_address && errors?.address?.full_address}
            /> */}


        <FormikGoogleAddressInput
          name="address.full_address"
          label="Full Address (Google Auto-Fill)"
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
            coordinates: 'address.coordinates',
            placeId: 'address.place_id'
          }}
          onAddressSelect={(addressData) => {
            if (addressData) {
              console.log('✅ Google address selected with components:', addressData);
              
              // Auto-select state in dropdown
              const selectedState = stateOptions.find(
                state => state.abbreviation === addressData.addressComponents.state ||
                         state.name.toLowerCase() === addressData.addressComponents.state?.toLowerCase()
              );
              
              if (selectedState) {
                setFieldValue('address.state', selectedState);
                console.log('✅ Auto-selected state:', selectedState);
              }
            }
          }}
        />


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormikInput
                name="address.street"
                label="Street Address * (Auto-filled)"
                placeholder="Will be auto-filled from Google address"
                errorMessage={touched?.address?.street && errors?.address?.street}
              />
              <FormikInput
                name="address.city"
                label="City * (Auto-filled)"
                placeholder="Will be auto-filled from Google address"
                errorMessage={touched?.address?.city && errors?.address?.city}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                {isLoadingStates ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    <span className="ml-2">Loading states...</span>
                  </div>
                ) : (
                  <CustomFormikAsyncSelect
                    name="address.state"
                    label="State * (Auto-selected)"
                    loadOptions={loadStates}
                    defaultOptions={stateOptions.slice(0, 50)}
                    placeholder="Will be auto-selected from Google address"
                    cacheOptions={true}
                  />
                )}
              </div>

              <FormikInput
                name="address.zip_code"
                label="Zip Code * (Auto-filled)"
                placeholder="Will be auto-filled from Google address"
                errorMessage={touched?.address?.zip_code && errors?.address?.zip_code}
              />
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            
            <FormikTextarea
              name="note"
              label="Note"
              placeholder="Enter additional details"
              errorMessage={touched.note && errors.note}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
              <FormikSelect
                name="source"
                label="Source"
                options={sourceOptions}
                errorMessage={touched.source && errors.source}
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingStates}
              className={`px-8 py-3 bg-[#1C1C1C] text-white text-[18px] font-semibold rounded-lg border-none cursor-pointer transition hover:bg-[#333333] ${
                isSubmitting || isLoadingStates ? "bg-gray-400 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                "Save Lead"
              )}
            </button>
          </div>
        </Form>
        </>
      )}
    </Formik>
  );
};

export default LeadForm;