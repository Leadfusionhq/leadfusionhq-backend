"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Upload, Check, AlertCircle, X } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { LEADS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { toast } from "react-toastify";
// Types
type Campaign = {
  _id: string;
  campaign_id: string;
  name: string;
  status: string;
};

type ColumnMapping = {
  [csvColumn: string]: string;
};

type DatabaseColumn = {
  key: string;
  label: string;
  required: boolean;
};

type ApiResponse = {
  success: boolean;
  data?: any;
  message: string;
};

// const DATABASE_COLUMNS: DatabaseColumn[] = [
//   { key: 'lead_id', label: 'Lead ID', required: true },
//   { key: 'campaign_id', label: 'Campaign ID', required: true },
//   { key: 'first_name', label: 'First Name', required: true },
//   { key: 'last_name', label: 'Last Name', required: true },
//   { key: 'email', label: 'Email', required: true },
//   { key: 'phone', label: 'Phone', required: false },
//   { key: 'street_address', label: 'Street Address', required: true },
//   { key: 'city', label: 'City', required: true },
//   { key: 'state', label: 'State', required: true },
//   { key: 'zip_code', label: 'Zip Code', required: true },
//   { key: 'note', label: 'Note', required: false }
// ];

const DATABASE_COLUMNS: DatabaseColumn[] = [
  { key: 'lead_id', label: 'Lead ID', required: true },
  { key: 'campaign_id', label: 'Campaign ID', required: true },
  { key: 'note', label: 'Note', required: false },

  // Required CSV fields
  { key: 'phone_number', label: 'Phone Number', required: true },
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'middle_name', label: 'Middle Name', required: false },
  { key: 'last_name', label: 'Last Name', required: true },
  { key: 'suffix', label: 'Suffix', required: false },
  { key: 'homeowner_desc', label: 'Homeowner Description', required: false },
  { key: 'gender', label: 'Gender', required: false },
  { key: 'age', label: 'Age', required: false },
  { key: 'dwelltype', label: 'Dwell Type', required: false },
  { key: 'house', label: 'House', required: false },
  { key: 'predir', label: 'Pre-direction', required: false },
  { key: 'strtype', label: 'Street Type', required: false },
  { key: 'postdir', label: 'Post-direction', required: false },
  { key: 'apttype', label: 'Apt Type', required: false },
  { key: 'aptnbr', label: 'Apt Number', required: false },
  { key: 'address.full_address', label: 'Full Address', required: true },
  { key: 'address.street', label: 'Street', required: true },
  { key: 'address.city', label: 'City', required: true },
  { key: 'address.state', label: 'State', required: true },
  { key: 'address.zip', label: 'Zip Code', required: true }
];


export default function CSVUploadComponent() {
  const token = useSelector((state: RootState) => state.auth.token);

  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    processed?: number;
    errors?: number;
    errorDetails?: string[];
    totalRows?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search campaigns using API



  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSVHeaders(selectedFile);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  // Parse CSV headers
  const parseCSVHeaders = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const lines = csvText.split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(header => header.trim().replace(/['"]/g, ''));
        setCsvHeaders(headers);
        initializeMapping(headers);
        setShowMapping(true);
      }
    };
    reader.readAsText(file);
  };

  // Initialize mapping with smart matching
  const initializeMapping = (headers: string[]) => {
    const mapping: ColumnMapping = {};

  headers.forEach(header => {
    const lowerHeader = header.toLowerCase();

    if (lowerHeader.includes('lead') && lowerHeader.includes('id')) {
      mapping[header] = 'lead_id';
    } else if (lowerHeader.includes('campaign') && lowerHeader.includes('id')) {
      mapping[header] = 'campaign_id';
    } else if (lowerHeader.includes('note')) {
      mapping[header] = 'note';
    } else if (lowerHeader.includes('phone')) {
      mapping[header] = 'phone_number';
    } else if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
      mapping[header] = 'first_name';
    } else if (lowerHeader.includes('middle') && lowerHeader.includes('name')) {
      mapping[header] = 'middle_name';
    } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
      mapping[header] = 'last_name';
    } else if (lowerHeader.includes('suffix')) {
      mapping[header] = 'suffix';
    } else if (lowerHeader.includes('homeowner')) {
      mapping[header] = 'homeowner_desc';
    } else if (lowerHeader.includes('gender')) {
      mapping[header] = 'gender';
    } else if (lowerHeader.includes('age')) {
      mapping[header] = 'age';
    } else if (lowerHeader.includes('dwell')) {
      mapping[header] = 'dwelltype';
    } else if (lowerHeader === 'house') {
      mapping[header] = 'house';
    } else if (lowerHeader === 'predir' || lowerHeader.includes('pre') && lowerHeader.includes('dir')) {
      mapping[header] = 'predir';
    } else if (lowerHeader.includes('street') && !lowerHeader.includes('type')) {
      mapping[header] = 'address.street';
    } else if (lowerHeader.includes('street') && lowerHeader.includes('type')) {
      mapping[header] = 'strtype';
    } else if (lowerHeader === 'postdir' || (lowerHeader.includes('post') && lowerHeader.includes('dir'))) {
      mapping[header] = 'postdir';
    } else if (lowerHeader.includes('apt') && lowerHeader.includes('type')) {
      mapping[header] = 'apttype';
    } else if (lowerHeader.includes('apt') && (lowerHeader.includes('nbr') || lowerHeader.includes('number') || lowerHeader.includes('no'))) {
      mapping[header] = 'aptnbr';
    } else if (lowerHeader.includes('full') && lowerHeader.includes('address')) {
      mapping[header] = 'address.full_address';
    } else if (lowerHeader.includes('city')) {
      mapping[header] = 'address.city';
    } else if (lowerHeader.includes('state')) {
      mapping[header] = 'address.state';
    } else if (lowerHeader.includes('zip')) {
      mapping[header] = 'address.zip';
    }
  });


    setColumnMapping(mapping);
  };

  // Validate mapping
  const validateMapping = (): { valid: boolean; missingRequired: string[] } => {
    const requiredColumns = DATABASE_COLUMNS.filter(col => col.required);
    const mappedDbColumns = Object.values(columnMapping);
    const missingRequired = requiredColumns
      .filter(col => !mappedDbColumns.includes(col.key))
      .map(col => col.label);

    return {
      valid: missingRequired.length === 0,
      missingRequired
    };
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a campaign and upload a CSV file');
      return;
    }

    const validation = validateMapping();
    if (!validation.valid) {
      alert(`Missing required columns: ${validation.missingRequired.join(', ')}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('column_mapping', JSON.stringify(columnMapping));

      const response = await axiosWrapper(
        'post',
        LEADS_API.UPLOAD_CSV,
        formData,
        token ?? undefined,
        true
      ) as ApiResponse;

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data) {
        
        const result = response.data;
        setUploadResult({
          success: true,
          message: response.message || `CSV uploaded successfully!`,
          processed: result.processed || 0,
          errors: result.errors || 0,
          errorDetails: result.errorDetails || [],
          totalRows: result.totalRows || 0
        });
        toast.info(response.message || 'CSV uploaded successfully!');

      } else {
        setUploadResult({
          success: false,
          message: response.message || 'Upload failed. Please try again.',
          errorDetails: []
        });
      }

    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed. Please try again.',
        errorDetails: [error.message || 'Network error occurred']
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFile(null);
    setCsvHeaders([]);
    setShowMapping(false);
    setColumnMapping({});
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Upload</h1>
        <p className="text-gray-600">Upload leads by using CSV file</p>
      </div>


      {/* Step 2: File Upload */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
          Upload CSV File
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
          <p className="text-lg font-medium text-gray-900 mb-2">Choose CSV file</p>
          <p className="text-sm text-gray-500 mb-4">
            File should contain: first_name, last_name, email, phone, street_address, city, state, zip_code, note
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Select File
          </label>
        </div>

        {file && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-blue-500 mr-2"/>
              <span className="text-blue-800">{file.name}</span>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setCsvHeaders([]);
                setShowMapping(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="h-4 w-4"/>
            </button>
          </div>
        )}
      </div>

      {/* Step 3: Column Mapping */}
      {showMapping && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
            Map CSV Columns to Database Columns
          </h2>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">
              Match your CSV column names with our database columns. Required fields are marked with *.
            </p>
          </div>

          <div className="space-y-4">
            {csvHeaders.map((csvHeader, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CSV Column: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{csvHeader}</span>
                  </label>
                </div>
                <div className="flex-1">
                  <select
                    value={columnMapping[csvHeader] || ''}
                    onChange={(e) => {
                      setColumnMapping(prev => ({
                        ...prev,
                        [csvHeader]: e.target.value
                      }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Database Column --</option>
                    {DATABASE_COLUMNS.map((dbCol) => (
                      <option key={dbCol.key} value={dbCol.key}>
                        {dbCol.label}{dbCol.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Mapping validation */}
          <div className="mt-4">
            {(() => {
              const validation = validateMapping();
              if (!validation.valid) {
                return (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2"/>
                    <span className="text-red-700">
                      Missing required columns: {validation.missingRequired.join(', ')}
                    </span>
                  </div>
                );
              } else {
                return (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2"/>
                    <span className="text-green-700">All required columns are mapped!</span>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* Upload Button & Progress */}
      <div className="mb-8">
        <button
          onClick={handleUpload}
          disabled={ !file || !showMapping || !validateMapping().valid || isUploading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            !file || !showMapping || !validateMapping().valid || isUploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black hover:bg-black/80 text-white'
          }`}
        >
          {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload CSV'}
        </button>

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`p-4 rounded-lg mb-4 ${
          uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`flex items-center mb-2 ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {uploadResult.success ? (
              <Check className="h-5 w-5 mr-2"/>
            ) : (
              <AlertCircle className="h-5 w-5 mr-2"/>
            )}
            <span className="font-medium">{uploadResult.message}</span>
          </div>

          {uploadResult.success && (
            <div className="text-green-700 space-y-1">
              {uploadResult.processed !== undefined && (
                <p>✅ Successfully processed: {uploadResult.processed} records</p>
              )}
              {uploadResult.errors !== undefined && uploadResult.errors > 0 && (
                <p>⚠️ Errors encountered: {uploadResult.errors} records</p>
              )}
              {uploadResult.totalRows !== undefined && (
                <p>📊 Total rows in CSV: {uploadResult.totalRows}</p>
              )}
            </div>
          )}

          {uploadResult.errorDetails && uploadResult.errorDetails.length > 0 && (
            <div className="mt-2">
              <p className="text-red-700 font-medium">Error Details:</p>
              <div className="text-red-600 text-sm max-h-40 overflow-y-auto">
                <ul className="list-disc list-inside">
                  {uploadResult.errorDetails.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {uploadResult.errorDetails.length > 10 && (
                    <li>... and {uploadResult.errorDetails.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={resetForm}
            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
}