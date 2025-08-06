import { Metadata } from "next";

export default function UserDashboard() {
  return (
    <div>
      <h1>Campaigns</h1>
      <p>Browse to the campaigns data!</p>
    </div>
  );
}
export const metadata: Metadata = {
  title: 'Campaigns | Lead Management Platform',
  description: 'Campaigns'
};
