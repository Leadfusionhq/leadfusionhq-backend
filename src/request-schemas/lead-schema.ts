"use client";
import * as Yup from "yup";

export const LeadValidationSchema = Yup.object().shape({
  campaign_id: Yup.string().required("Campaign ID is required"),

  first_name: Yup.string()
    .min(2, "First Name must be at least 2 characters")
    .max(50, "First Name must be less than 50 characters")
    .required("First Name is required"),

  last_name: Yup.string()
    .min(2, "Last Name must be at least 2 characters")
    .max(50, "Last Name must be less than 50 characters")
    .required("Last Name is required"),

  email: Yup.string()
    .email("Please enter a valid email address")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please enter a valid email address"
    )
    .required("Email is required"),

  phone: Yup.string()
    .matches(
      /^(?:\+?(\d{1,3}))?(\d{3})(\d{3})(\d{4})$/,
      "Phone number must be a valid 10-digit number"
    )
    .nullable()  // Allows empty values, since phone is not mandatory
    .notRequired(),

  address: Yup.object().shape({
    street: Yup.string()
      .min(3, "Street must be at least 3 characters")
      .max(100, "Street must be less than 100 characters")
      .required("Street Address is required"),

    city: Yup.string()
      .min(2, "City must be at least 2 characters")
      .max(100, "City must be less than 100 characters")
      .required("City is required"),

    state: Yup.mixed()
        .test("is-object", "State is required", (value) => value !== null)
        .required("State is required"),
        
    zip_code: Yup.string()
      .matches(
        /^[0-9]{5}(-[0-9]{4})?$/,
        "Zip Code must be a valid 5-digit or 9-digit ZIP code"
      )
      .required("Zip Code is required"),
  }),

  note: Yup.string().max(500, "Note must be less than 500 characters"),
});
