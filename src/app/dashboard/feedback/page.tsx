import { Metadata } from "next";

import FeedbackForm from "@/components/user-dashboard/feedback/FeedbackForm";
export default function Feedback() {

  return (
    <div className="leads-container">
         <FeedbackForm />
    </div>
  );
}

export const metadata: Metadata = {
    title: 'Feedback | Lead Management',
    description: 'Share your thoughts and suggestions to help us improve your experience with our platform.'
};

