"use client";
import { initialValues } from "@/constants/initialCampaign"; 

// export const cleanCampaignValues = (values: typeof initialValues) => {
//   return {
//     ...values,
//     geography: {
//       ...values.geography,
//       state: values.geography.state ? values.geography.state.value : "",
//       coverage: {
//         ...values.geography.coverage,
//         partial: {
//           ...values.geography.coverage.partial,
//           counties: values.geography.coverage.partial.counties.map((c) => c.value),
//           radius: values.geography.coverage.partial.radius ? Number(values.geography.coverage.partial.radius) : 0,
//           zipcode: values.geography.coverage.partial.zipcode || "",
//           zip_codes: values.geography.coverage.partial.zip_codes
//             ? values.geography.coverage.partial.zip_codes.split("|").filter((code) => code.trim() !== "")
//             : [],
//         },
//       },
//     },
//     utilities: {
//       ...values.utilities,
//       include_some: values.utilities.include_some.filter((util) => util.trim() !== ""),
//       exclude_some: values.utilities.exclude_some.filter((util) => util.trim() !== ""),
//     },
//   };
// };






export const cleanCampaignValues = (values: typeof initialValues) => {
  return {
    // ...values,
    name: values.name || "",
    status: values.status,
    lead_type: values.lead_type,
    exclusivity: values.exclusivity,
    bid_price: values.bid_price,
    language: values.language,
    payment_type: values.payment_type || "",
    poc_phone: values.poc_phone || '',
    company_contact_phone: values.company_contact_phone || '',
    company_contact_email: values.company_contact_email || '',
    geography: {
      ...values.geography,
      state: values.geography.state ? values.geography.state.value : "",
      coverage: {
        ...values.geography.coverage,
        type:values.geography.coverage.type,
        full_state: values.geography.coverage?.type === 'FULL_STATE',
        partial: {
          ...values.geography.coverage.partial,
          counties: values.geography.coverage.partial.counties.map((c) => c.value),
          radius: values.geography.coverage.partial.radius ? Number(values.geography.coverage.partial.radius) : 0,
          zipcode: values.geography.coverage.partial.zipcode,
          zip_codes: values.geography.coverage.partial.zip_codes
            ? values.geography.coverage.partial.zip_codes.split("|").filter((code) => code.trim() !== "")
            : [],
        },
      },
    },
    utilities: {
      ...values.utilities,
      mode:values.utilities.mode,
      include_all:values.utilities?.mode === 'INCLUDE_ALL',
      include_some: values.utilities.include_some.filter((util) => util.trim() !== ""),
      exclude_some: values.utilities.exclude_some.filter((util) => util.trim() !== ""),
    },
    delivery: {
      ...values.delivery,
      method: values.delivery.method || [],
    //   schedule: {
    //     ...values.geography.coverage,
    
    //   },
      other : {
        // ...values.delivery.other,
        homeowner_count:values.delivery.other.homeowner_count,
        second_pro_call_request:true,
        homeowner:true,
      },
    },
    note :values.note || "",
    
  };
};
