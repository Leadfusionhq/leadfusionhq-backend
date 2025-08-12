import * as Yup from 'yup';
import { CampaignFormValues } from '@/types/campaign';
import { LEAD_TYPE, EXCLUSIVITY, STATUS, DAYS_OF_WEEK, LANGUAGE, UTILITIES } from "@/constants/enums";

export const initialValues: CampaignFormValues = {
  name: '',
  status: 'ACTIVE',
  lead_type: 'SOLAR_RESIDENTIAL',
  exclusivity: 'EXCLUSIVE',
  bid_price: 0,
  language: 'en',
  poc_phone: '',
  company_contact_phone: '',
  company_contact_email: '',
  geography: {
    state: null,
    coverage: {
      type: 'FULL_STATE',
      partial: {
        counties: [],
        radius: '',
        zipcode: '',
        zip_codes: '',
        countries: ['US']
      }
    }
  },
  utilities: {
    mode: 'INCLUDE_ALL',
    exclude_some: [],
    include_some: []
  },
  delivery: {
    method: 'email',
    email: {
      addresses: '',
      subject: ''
    },
    phone: {
      numbers: ''
    },
    crm: {
      instructions: ''
    },
    other: {
      homeowner_count: 0
    },
    schedule: {
      days: DAYS_OF_WEEK.map(day => ({
        day,
        active: ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'].includes(day),
        start_time: '09:00',
        end_time: day === 'FRIDAY' ? '16:00' : '17:00',
        cap: 1000
      }))
    }
  },
  note: ''
};

export const validationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  status: Yup.string().oneOf(Object.values(STATUS)).required('Required'),
  lead_type: Yup.string().oneOf(Object.values(LEAD_TYPE)).required('Required'),
  exclusivity: Yup.string().oneOf(Object.values(EXCLUSIVITY)).required('Required'),
  bid_price: Yup.number().min(0).required('Required'),
  geography: Yup.object().shape({
    state: Yup.object().required('State is required'),
    coverage: Yup.object().shape({
      type: Yup.string().oneOf(['FULL_STATE', 'PARTIAL']).required('Required'),
      partial: Yup.object().shape({
          counties: Yup.array(),
          radius: Yup.string(),
          zipcode: Yup.string().matches(/^\d{5}$/, "ZIP code must be exactly 5 digits"),
          zip_codes: Yup.string().matches(
            /^(\d{5})(\|\d{5})*$/,
            "ZIPs must be 5-digit numbers separated by '|'"
          ),
          countries: Yup.array().of(Yup.string()),
        }),
    })
  }),
  // ... other validations
});