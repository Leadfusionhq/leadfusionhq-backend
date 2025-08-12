'use client'
import { FormikInput } from '@/components/form';
import { CampaignFormValues } from '@/types/campaign';

interface OtherSectionProps {
  values: CampaignFormValues;
}
const OtherSection = ({ values }: OtherSectionProps) => (
  <div className="space-y-6">
    <h4 className="text-lg font-medium">Additional Settings</h4>
    
    <div className="border rounded-lg p-6">
      <FormikInput
        name="delivery.other.homeowner_count"
        type="number"
        min="0"
        label="Homeowner Count"
        placeholder="Enter expected homeowner count"
      />
    </div>

    <div className="border rounded-lg p-6">
      <h5 className="font-medium mb-3">Special Instructions</h5>
      <FormikInput
        name="delivery.other.special_instructions"
        type="text"
        label=""
        placeholder="Any special delivery instructions"
      />
    </div>
  </div>
);
export default OtherSection;
