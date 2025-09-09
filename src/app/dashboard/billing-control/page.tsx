import { Metadata } from "next";
import BillingControl from "@/components/user-dashboard/billing-control/BillingControl";

export default function billlingController() {
  return (
    <div className="leads-container">
         <BillingControl />
    </div>
  );
}
export const metadata: Metadata = {
  title: 'Billing Controller | Lead Management Platform',
  description: 'Billing Controller where you manage all your billing and settings.'
};
