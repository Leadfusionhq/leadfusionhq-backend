import { Metadata } from "next";
import WalletDashboard from "@/components/user-dashboard/billing-control/WalletDashboard";



export default function billlingController() {

  return (
    <div className="leads-container">
         <WalletDashboard />
    </div>
  );
}
export const metadata: Metadata = {
  title: 'Billing Controller | Lead Management Platform',
  description: 'Billing Controller where you manage all your billing and settings.'
};
