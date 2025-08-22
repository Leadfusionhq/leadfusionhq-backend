"use client";
import * as Yup from "yup";
import { LEAD_TYPE, EXCLUSIVITY, STATUS, DAYS_OF_WEEK, LANGUAGE, UTILITIES } from "@/constants/enums";

export const validationSchema = Yup.object().shape({
    name: Yup.string().required("Campaign name is required"),
    status: Yup.string().oneOf(Object.values(STATUS)).required("Status is required"),
    lead_type: Yup.string().oneOf(Object.values(LEAD_TYPE)).required("Lead type is required"),
    exclusivity: Yup.string().oneOf(Object.values(EXCLUSIVITY)).required("Exclusivity is required"),
    bid_price: Yup.number().min(0, "Bid price must be positive").required("Bid price is required"),
    language: Yup.string().required("Language is required"),
    poc_phone: Yup.string().when("exclusivity", {
      is: "WARM_TRANSFER",
      then: (schema) =>
        schema
          .matches(/^\d{3}-\d{3}-\d{4}$/, "POC Phone must be in format XXX-XXX-XXXX")
          .required("POC Phone is required for Warm Transfer"),
      otherwise: (schema) => schema.notRequired(),
    }),
    company_contact_phone: Yup.string().when("exclusivity", {
      is: "APPOINTMENT",
      then: (schema) =>
        schema
          .matches(/^\d{3}-\d{3}-\d{4}$/, "Company Contact Phone must be in format XXX-XXX-XXXX")
          .required("Company Contact Phone is required for Appointment"),
      otherwise: (schema) => schema.notRequired(),
    }),
    company_contact_email: Yup.string().when("exclusivity", {
      is: "APPOINTMENT",
      then: (schema) =>
        schema
          .email("Invalid email address")
          .required("Company Contact Email is required for Appointment"),
      otherwise: (schema) => schema.notRequired(),
    }),
    geography: Yup.object().shape({
      state: Yup.mixed()
        .test("is-object", "State is required", (value) => value !== null)
        .required("State is required"),
      coverage: Yup.object().shape({
        type: Yup.string().oneOf(["FULL_STATE", "PARTIAL"]).required("Coverage type is required"),
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
      }),
    }),
    utilities: Yup.object().shape({
      mode: Yup.string().oneOf(Object.values(UTILITIES)).required("Mode is required"),
      exclude_some: Yup.array(), // Not required
      include_some: Yup.array(), // Not required
    }),
    delivery: Yup.object().shape({
      method: Yup.string()
        .oneOf(["email", "phone", "crm"])
        .required("Method is required"),

      email: Yup.object().shape({
        addresses: Yup.string().when("$delivery.method", {
          is: "email",
          then: (schema) =>
            schema
              .required("Email addresses are required")
              .matches(
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\s*,\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/,
                "Enter valid comma separated emails"
              ),
          otherwise: (schema) => schema.notRequired(),
        }),
        subject: Yup.string(),
      }),

      phone: Yup.object().shape({
        numbers: Yup.string().when("$delivery.method", {
          is: "phone",
          then: (schema) =>
            schema
              .required("Phone numbers are required")
              .matches(
                /^(\d{3}-\d{3}-\d{4})(\s*,\s*\d{3}-\d{3}-\d{4})*$/,
                "Enter valid comma separated phone numbers (e.g., 123-456-7890)"
              ),
          otherwise: (schema) => schema.notRequired(),
        }),
      }),

      crm: Yup.object().shape({
        instructions: Yup.string().when("$delivery.method", {
          is: "crm",
          then: (schema) => schema.required("Instructions are required for CRM"),
          otherwise: (schema) => schema.notRequired(),
        }),
      }),

      // optional
      other: Yup.object().shape({
        homeowner_count: Yup.number().min(0, "Must be positive"),
      }),

      schedule: Yup.object(),
    }),

    note: Yup.string(),
  });