"use client";
import { Formik, Form } from "formik";
import { toast } from "react-toastify";
import { LeadValidationSchema } from "@/request-schemas/lead-schema";
import { initialLeadValues } from "@/constants/initialLeadValues";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { LEADS_API } from "@/utils/apiUrl";
import { FormikInput, FormikTextarea } from "@/components/form";

const LeadForm = ({ campaignId }: { campaignId: string }) => {
  const token = useSelector((state: RootState) => state.auth.token);

  const handleSubmit = async (values: typeof initialLeadValues, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }) => {
    try {
      setSubmitting(true);

      const response = await axiosWrapper(
        "post",
        LEADS_API.CREATE_LEAD,
        values,
        token ?? undefined
      ) as { message?: string };

      toast.success(response?.message || "Lead added successfully!");

      // Reset the form after successful submission
      resetForm();
    } catch (err) {
      console.error("Error adding lead:", err);
      toast.error("An error occurred while adding the lead.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{ ...initialLeadValues, campaign_id: campaignId }}
      validationSchema={LeadValidationSchema}
      onSubmit={handleSubmit}
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
            <FormikInput
              name="address.state"
              label="State"
              placeholder="Enter state"
              errorMessage={touched?.address?.state && errors?.address?.state}
            />
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
              disabled={isSubmitting}
              className={`px-8 py-3 bg-[#1C1C1C] text-white text-[18px] font-semibold rounded-lg border-none cursor-pointer transition hover:bg-[#333333] ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                "Add Lead"
              )}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LeadForm;
