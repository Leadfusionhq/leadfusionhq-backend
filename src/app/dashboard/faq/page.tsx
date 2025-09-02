import { Metadata } from "next";
import FAQPage from "@/components/user-dashboard/faq/FAQPage";

export default function Leads() {

  return (
    <div className="leads-container">
         <FAQPage />
    </div>
  );
}

export const metadata: Metadata = {
    title: 'Frequently Asked Questions | Lead Management',
    description: 'Find quick answers to common questions about user management, lead tracking, and platform settings.'
};