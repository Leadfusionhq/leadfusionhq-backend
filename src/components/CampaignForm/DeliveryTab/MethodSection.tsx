'use client'
import { FormikRadio, FormikInput, FormikTextarea } from '@/components/form';
import { CampaignFormValues } from '@/types/campaign';

interface MethodSectionProps {
  values: CampaignFormValues;
}
const MethodSection = ({ values }: MethodSectionProps) => (
  <div className="space-y-6">
    <div className="border rounded-lg p-6">
      <h4 className="text-lg font-medium mb-4">Delivery Method</h4>
      <div className="space-y-3">
        <FormikRadio name="delivery.method" value="email" label="Email" />
        <FormikRadio name="delivery.method" value="phone" label="Phone" />
        <FormikRadio name="delivery.method" value="crm" label="CRM Integration" />
      </div>
    </div>

    <div className="border rounded-lg p-6">
      <h4 className="text-lg font-medium mb-4">Email Configuration</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormikInput
          name="delivery.email.addresses"
          label="Recipient Emails"
          placeholder="user1@example.com, user2@example.com"
        />
        <FormikInput
          name="delivery.email.subject"
          label="Email Subject"
          placeholder="New leads available"
        />
      </div>
    </div>

    <div className="border rounded-lg p-6">
      <h4 className="text-lg font-medium mb-4">Phone Configuration</h4>
      <FormikInput
        name="delivery.phone.numbers"
        label="Phone Numbers"
        placeholder="123-456-7890, 987-654-3210"
      />
    </div>

    <div className="border rounded-lg p-6">
      <h4 className="text-lg font-medium mb-4">CRM Configuration</h4>
      <FormikTextarea
        name="delivery.crm.instructions"
        label="Integration Instructions"
        rows={4}
      />
    </div>
  </div>
);
export default MethodSection;
