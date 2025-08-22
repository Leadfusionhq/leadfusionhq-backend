import { Metadata } from "next";
import LocationTable from "@/components/admin-dashboard/location/Locations";

export default function Locations() {

  return (
    <div className="locations-container">
      <LocationTable />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Locations | Leadfeausion',
  description: 'Locations Management where you manage all your locations.'
};
