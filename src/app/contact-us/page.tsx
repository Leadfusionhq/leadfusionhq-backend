'use client';
import BannerHome from "@/components/Layout/BannerHome/BannerHome";
import Contact from "@/components/Contactus/Contact";
import ContactForm from "@/components/Contactus/Contact-form";


import Term from "@/components/Termcondition/Term";

import Image from "next/image";
import Link from "next/link";

export default function term() {
  return (
   <>
   <BannerHome
      title="From Lead to Close — We’re With You"
      description="Whether you're exploring our lead delivery services, need help with your dashboard, or want to scale your outreach, our team is here to support you at every stage — from your first inquiry to your final conversion."
      buttonText=""
      backgroundImage="/images/contact-bg.png"
    />
    <Contact />

    <ContactForm />

   </>
  );
}
