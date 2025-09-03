import { Metadata } from "next";
import UploadCSVFile from "@/components/admin-dashboard/upload-csv/upload-csv";

export default function UploadCSV() {

  return (
    <div className="upload-csv-container">
      <UploadCSVFile />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Upload CSV | Leadfeausion',
  description: 'You can upload CSV file to add multiple leads at once.',
};
