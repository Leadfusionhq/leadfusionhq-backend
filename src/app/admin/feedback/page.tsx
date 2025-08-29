import { Metadata } from "next";
import FeedbackTable from "@/components/admin-dashboard/feedback/FeedbackTable";

export default function Feedback() {

  return (
    <div className="feedback-container">
      <FeedbackTable />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Feedback | Leadfeausion',
  description: 'Feedback Management where you manage all user feedback.'
};