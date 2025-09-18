"use client";
import { LEAD_TYPE, EXCLUSIVITY, STATUS, DAYS_OF_WEEK, LANGUAGE, UTILITIES,PAYMENT_TYPE } from "@/constants/enums";
import { DaySchedule, UtilityMode  ,CountyOption ,StateOption, } from "@/types/campaign";


export const initialValues = {
    name: "",
    status: "ACTIVE" as keyof typeof STATUS,
    lead_type: "SOLAR_RESIDENTIAL" as keyof typeof LEAD_TYPE,
    exclusivity: "EXCLUSIVE" as keyof typeof EXCLUSIVITY,
    bid_price: 0,
    language: "en",
    poc_phone: "", // Added for WARM_TRANSFER
    company_contact_phone: "", // Added for APPOINTMENT
    company_contact_email: "", // Added for APPOINTMENT
    payment_type: PAYMENT_TYPE.PREPAID,
    geography: {
      state: null as StateOption | null,
      coverage: {
        type: "FULL_STATE" as "FULL_STATE" | "PARTIAL",
        partial: {
          counties: [] as CountyOption[],
          radius: "",
          zipcode: "",
          zip_codes: "",
          countries: ["US"],
        },
      },
    },
    utilities: {
      mode: UTILITIES.INCLUDE_ALL as UtilityMode,
      exclude_some: [] as string[],
      include_some: [] as string[],
    },
    delivery: {
      method: [] as string[], 
      email: {
        addresses: "",
        subject: "",
      },
      phone: {
        numbers: "",
      },
      crm: {
        instructions: "",
      },
      other: {
        homeowner_count: 0,
      },
      schedule: {
        days: DAYS_OF_WEEK.map((day) => ({
          day,
          active: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(day),
          start_time: "09:00",
          end_time: day === "FRIDAY" ? "16:00" : "17:00",
          cap: 1000,
        })) as DaySchedule[],
      },
    },
    note: "",
  };