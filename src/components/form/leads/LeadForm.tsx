"use client";
import { Formik, Form } from "formik";
import { FormikInput, FormikTextarea, CustomFormikAsyncSelect } from "@/components/form";
import { LeadValidationSchema } from "@/request-schemas/lead-schema";
import { StateOption } from "@/types/campaign";
import { initialLeadValues } from "@/constants/initialLeadValues";

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
      validationSchema={LeadValidationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form className="space-y-6 bg-white p-8 rounded-lg border border-gray-300 shadow-lg max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormikInput
              name="first_name"
              label="First Name"
              placeholder="Enter first name"
              errorMessage={touched.first_name && errors.first_name}
            />
            <FormikInput
              name="last_name"
              label="Last Name"
              placeholder="Enter last name"
              errorMessage={touched.last_name && errors.last_name}
            />
          </div>

          <FormikInput
            name="email"
            type="email"
            label="Email"
            placeholder="Enter email address"
            errorMessage={touched.email && errors.email}
          />

          <FormikInput
            name="phone"
            label="Phone"
            placeholder="Enter phone number"
            errorMessage={touched.phone && errors.phone}
          />

          <FormikInput
            name="address.street"
            label="Street Address"
            placeholder="Enter street address"
            errorMessage={touched?.address?.street && errors?.address?.street}
          />

          <FormikInput
            name="address.city"
            label="City"
            placeholder="Enter city"
            errorMessage={touched?.address?.city && errors?.address?.city}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {isLoadingStates ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  <span className="ml-2">Loading states...</span>
                </div>
              ) : (
                <CustomFormikAsyncSelect
                  name="address.state"
                  label="State *"
                  loadOptions={loadStates}
                  defaultOptions={stateOptions.slice(0, 50)}
                  placeholder="Search and select a state"
                  cacheOptions={true}
                />
              )}
            </div>

            <FormikInput
              name="address.zip_code"
              label="Zip Code"
              placeholder="Enter zip code"
              errorMessage={touched?.address?.zip_code && errors?.address?.zip_code}
            />
          </div>

          <FormikTextarea
            name="note"
            label="Note"
            placeholder="Enter additional details"
            errorMessage={touched.note && errors.note}
          />

          <div className="flex justify-end">
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
      )}
    </Formik>
  );
};

export default LeadForm;
