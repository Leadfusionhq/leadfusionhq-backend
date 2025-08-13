// components/CampaignForm/DeliveryTab/index.tsx
'use client'
import MethodSection from './MethodSection';
import ScheduleSection from './ScheduleSection';
import OtherSection from './OtherSection';
import { CampaignFormValues } from '@/types/campaign';
import { FC } from 'react';

interface DeliveryTabProps {
  activeTab: string;
  values: CampaignFormValues;
}

const DeliveryTab: FC<DeliveryTabProps> = ({ activeTab, values }) => {
  const components = {
    method: MethodSection,
    schedule: ScheduleSection,
    other: OtherSection
  };

  const SelectedComponent = components[activeTab as keyof typeof components];
  if (!SelectedComponent) return null;

  return (
    <div className="space-y-6">
      <SelectedComponent values={values} />
    </div>
  );
};

export default DeliveryTab;