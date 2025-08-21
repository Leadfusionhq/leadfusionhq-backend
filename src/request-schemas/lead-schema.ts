"use client";
import * as Yup from "yup";
export const LeadValidationSchema = Yup.object().shape({
  firstName: Yup.string()
    .required("First name is required")
    .min(2, "First name should be at least 2 characters"),
  
  lastName: Yup.string()
    .required("Last name is required")
    .min(2, "Last name should be at least 2 characters"),
  
  email: Yup.string()
    .required("Email is required")
    .email("Invalid email format"),
  
  street: Yup.string().required("Street address is required"),
  
  city: Yup.string().required("City is required"),
  
  state: Yup.string().required("State is required"),
  
  zipCode: Yup.string()
    .required("Zip code is required")
    .matches(/^\d{5}$/, "Zip code must be exactly 5 digits"),
  
  note: Yup.string().optional(),
  
  cost: Yup.number()
    .required("Cost is required")
    .min(0, "Cost cannot be negative")
});
