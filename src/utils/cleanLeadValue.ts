"use client";
import { initialLeadValues } from "@/constants/initialLeadValues";

export const cleanLeadValues = (values: typeof initialLeadValues) => {
  return {
    campaign_id: values.campaign_id,
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email,
    phone: values.phone,
    address: {
      street: values.address.street,
      city: values.address.city,
      state: values.address.state ? values.address.state.value : "",
      zip_code: values.address.zip_code,
    },
    note: values.note,
  };
};
