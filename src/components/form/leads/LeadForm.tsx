// components/form/leads/LeadForm.tsx
import { Formik, Form } from "formik";
import { toast } from "react-toastify";
import { LeadValidationSchema } from "@/request-schemas/lead-schema";
import { initialLeadValues } from "@/constants/initialLeadValues";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { LEADS_API } from "@/utils/apiUrl";
import { FormikInput, FormikTextarea } from "@/components/form";  // Import custom FormikInput and FormikTextarea

const LeadForm = ({ campaignId }: { campaignId: string }) => {
  const token = useSelector((state: RootState) => state.auth.token);

  const handleSubmit = async (values: typeof initialLeadValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      setSubmitting(true);
      
      const response = await axiosWrapper(
        "post",
        `${LEADS_API.CREATE_LEAD}`,
        values,
        token ?? undefined
      ) ;

      toast.success(response?.message || "Lead added successfully!");
    } catch (err) {
      console.error("Error adding lead:", err);
      toast.error("An error occurred while adding the lead.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialLeadValues}
      validationSchema={LeadValidationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form className="space-y-6 bg-white p-8 rounded-lg border border-gray-300 shadow-lg max-w-4xl mx-auto">
        

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormikInput
              name="firstName"
              label="First Name"
              placeholder="Enter first name"
              errorMessage={touched.firstName && errors.firstName}
            />
            <FormikInput
              name="lastName"
              label="Last Name"
              placeholder="Enter last name"
              errorMessage={touched.lastName && errors.lastName}
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
            name="street"
            label="Street Address"
            placeholder="Enter street address"
            errorMessage={touched.street && errors.street}
          />

          <FormikInput
            name="city"
            label="City"
            placeholder="Enter city"
            errorMessage={touched.city && errors.city}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormikInput
              name="state"
              label="State"
              placeholder="Enter state"
              errorMessage={touched.state && errors.state}
            />
            <FormikInput
              name="zipCode"
              label="Zip Code"
              placeholder="Enter zip code"
              errorMessage={touched.zipCode && errors.zipCode}
            />
          </div>

          <FormikTextarea
            name="note"
            label="Note"
            placeholder="Enter additional details"
            errorMessage={touched.note && errors.note}
          />

          <FormikInput
            name="cost"
            type="number"
            label="Cost"
            placeholder="Enter lead cost"
            errorMessage={touched.cost && errors.cost}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
