'use client'
import { Formik } from 'formik';
import { CampaignForm } from '@/components/CampaignForm/CampaignMain';
import { initialValues, validationSchema } from '@/utils/validationSchemas';

export default function AddCampaignPage() {
  return (
  <div className="container min-h-screen flex flex-col mx-auto items-center md:px-0 py-8">
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        console.log('Form submitted:', values);
        // Add your submission logic here
      }}
    >
      <CampaignForm />
    </Formik>
  </div>
  );
}