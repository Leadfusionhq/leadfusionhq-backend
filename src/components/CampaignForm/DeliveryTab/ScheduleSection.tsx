'use client'
import { FormikInput, FormikCheckbox } from '@/components/form';
import { useFormikContext } from 'formik';
import { CampaignFormValues } from '@/types/campaign';

interface ScheduleSectionProps {
  values: CampaignFormValues;
}

const ScheduleSection = ({ values }: ScheduleSectionProps) => (

    <div className="space-y-4">
      <h4 className="text-lg font-medium">Delivery Schedule</h4>
      {values.delivery.schedule.days.map((day, index) => (
        <div 
          key={day.day} 
          className="grid grid-cols-5 gap-4 items-center p-4 border rounded-lg"
        >
          <span className="font-medium">{day.day}</span>
          <FormikCheckbox 
            name={`delivery.schedule.days.${index}.active`} 
            label="Active" 
          />
          <FormikInput
            name={`delivery.schedule.days.${index}.start_time`}
            type="time"
            label="Start"
          />
          <FormikInput
            name={`delivery.schedule.days.${index}.end_time`}
            type="time"
            label="End"
          />
          <FormikInput
            name={`delivery.schedule.days.${index}.cap`}
            type="number"
            label="Daily Cap"
            min="0"
          />
        </div>
      ))}
    </div>
    
);

export default ScheduleSection;
