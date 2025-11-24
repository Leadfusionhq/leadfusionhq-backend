"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { CSV_API } from "@/utils/apiUrl";
import Papa from "papaparse";
import axiosWrapper from "@/utils/api";

const NEXT_PUBLIC_CSV_API_TOKEN = process.env.NEXT_PUBLIC_CSV_API_TOKEN;

interface UploadSuccessResponse {
  message: string;
  inserted?: any[];
}

interface StartMultipartResponse {
  uploadId: string;
  key: string;
  presignedUrls: string[];
  chunkSize: number;
}

type Mapping = Record<string, string>;

interface SourceData {
  source_name: string;
  source_code: string;
}

export const REQUIRED_COLUMNS = [
  "phone_number",
  "first_name",
  "middle_name",
  "last_name",
  "homeowner_desc",
  "house_age",
  "gender",
  "age",
  "house",
  "street",
  "address",
  "city",
  "State",
  "Zip",
  "not_import",
];

// Actual required columns (excluding "not_import" which is just a placeholder)
const ACTUAL_REQUIRED_COLUMNS = REQUIRED_COLUMNS.filter(
  (col) => col !== "not_import"
);

const regexList: RegExp[] = [
  /(phone|mobile|contact|number)/i,
  /(first|fname|f_name|given|name)/i,
  /(mid|middle|mname|m_name|name)/i,
  /(last|surname|lname|l_name|name)/i,
  /(homeowner|owner|resident|desc|description)/i,
  /(houseage|homeAge|house_age|HA|house_dur)/i,
  /(gender|sex)/i,
  /(age|years?)/i,
  /(house|unit|apartment|flat)/i,
  /(street|avenue)/i,
  /(address|addr|location)/i,
  /(city|town)/i,
  /(state|province|region)/i,
  /(zip|postal|postcode|pincode)/i,
];

function MappingStep({
  message,
  csvHeaders,
  mapping,
  onMappingChange,
  onSubmit,
  isLoading,
}: {
  message: string;
  csvHeaders: string[];
  mapping: Mapping;
  onMappingChange: (newMapping: Mapping) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const isMappingComplete = csvHeaders.every(
    (col) => mapping[col] && mapping[col] !== ""
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">
        Map CSV Columns to DB
      </h2>
      {message && (
        <div className="text-red-600 font-semibold bg-red-50 p-3 rounded-lg">
          {message}
        </div>
      )}
      <p className="text-gray-600">Map your CSV columns to database columns:</p>
      <div className="space-y-4">
        {csvHeaders.map((csvCol) => (
          <div key={csvCol} className="flex items-center justify-between gap-4">
            <span className="font-mono text-gray-700">{csvCol}</span>
            <select
              className="border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={mapping[csvCol] || ""}
              onChange={(e) =>
                onMappingChange({
                  ...mapping,
                  [csvCol]: e.target.value,
                })
              }
            >
              <option value="">-- Select DB Column --</option>
              {REQUIRED_COLUMNS.map((dbCol) => (
                <option key={dbCol} value={dbCol}>
                  {dbCol}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={isLoading || !isMappingComplete}
        className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
          isLoading || !isMappingComplete
            ? "bg-black/60 cursor-not-allowed"
            : "bg-black hover:bg-black/80"
        }`}
      >
        {isLoading ? "Submitting..." : "Submit Mapping"}
      </button>
    </div>
  );
}

export default function CSVImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [showMapping, setShowMapping] = useState(false);

  const getCSVHeaders = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const firstLine = text.split(/\r?\n/)[0];
          const headers = firstLine.split(",").map((h) => h.trim());
          resolve(headers);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      const blob = file.slice(0, 1024);
      reader.readAsText(blob);
    });
  };

  useEffect(() => {
    async function fetchSheetData() {
      try {
        const csvText = (await axiosWrapper(
          "get",
          CSV_API.IMPORT_SHEET_CSV,
          undefined,
          NEXT_PUBLIC_CSV_API_TOKEN
        )) as string;

        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
        });

        const mappedSources: SourceData[] = (parsed.data as any[]).map(
          (row, index) => ({
            source_name: row["Source Name"],
            source_code: `${row["Source Id"]}`,
            id: `${index + 1}`,
          })
        );

        setSources(mappedSources);
      } catch (error) {
        console.error("Error fetching Google Sheet:", error);
      }
    }

    fetchSheetData();
  }, []);

  const resetState = () => {
    setFile(null);
    setCsvHeaders([]);
    setMapping({});
    setSelectedSourceId("");
    setShowMapping(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadMultipart = async (
    file: File,
    presignedUrls: string[],
    chunkSize: number
  ) => {
    const numParts = presignedUrls.length;
    const uploadedParts: { ETag: string; PartNumber: number }[] = [];

    const CONCURRENCY = 6; // tune (4-10)
    let nextIndex = 0;

    const worker = async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= numParts) return;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);

        const url = presignedUrls[i];
        if (!url) throw new Error("Missing presigned URL for part " + (i + 1));

        const res = await fetch(url, {
          method: "PUT",
          body: blob,
        });

        if (!res.ok)
          throw new Error(`Failed to upload part ${i + 1}: ${res.statusText}`);

        const eTag = res.headers.get("ETag")?.replace(/"/g, "") || "";
        uploadedParts.push({ ETag: eTag, PartNumber: i + 1 });
      }
    };

    // start workers
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    // sort by part number
    return uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
  };

 const handleSubmit = async (providedMapping?: Mapping) => {
  if (!file) {
    toast.warn("Please select a CSV file");
    return;
  }
  if (!selectedSourceId) {
    toast.warn("Please select a source");
    return;
  }

  try {
    setIsLoading(true);

    // 1️⃣ Read CSV headers & normalize
    const headersInCSV = (await getCSVHeaders(file)).map((h) =>
      h.trim().toLowerCase()
    );
    setCsvHeaders(headersInCSV);

    // 2️⃣ Build mapping (either use providedMapping from the UI,
    // or auto-generate a mapping if this is the first pass)
    let finalMapping: Mapping;
    if (providedMapping) {
      // Use the mapping user submitted from MappingStep
      finalMapping = providedMapping;

      // Ensure the provided mapping covers all CSV headers (and none are empty)
      const missingFromProvided = headersInCSV.filter((h) => !(h in finalMapping));
      if (missingFromProvided.length > 0) {
        // unexpected, but show mapping UI
        setShowMapping(true);
        toast.info(`Please map the CSV columns: ${missingFromProvided.join(", ")}`);
        setIsLoading(false);
        return;
      }

      const stillUnmapped = headersInCSV.some(
        (h) => !finalMapping[h] || finalMapping[h] === ""
      );
      if (stillUnmapped) {
        setShowMapping(true);
        toast.info("Please finish mapping all CSV columns before continuing.");
        setIsLoading(false);
        return;
      }

      // Validate that at least some required columns are mapped (not just "not_import")
      const mappedRequiredColumns = Object.values(finalMapping).filter(
        (v) => v && v !== "" && v !== "not_import"
      );
      if (mappedRequiredColumns.length === 0) {
        setShowMapping(true);
        toast.warn(
          "Please map at least some required columns (not just 'not_import') before importing."
        );
        setIsLoading(false);
        return;
      }
    } else {
      // Auto-build mapping
      finalMapping = headersInCSV.reduce((acc: Mapping, csvCol) => {
        const exactMatch = REQUIRED_COLUMNS.find(
          (dbCol) => dbCol.toLowerCase() === csvCol
        );

        if (exactMatch) {
          // Auto map exact matches
          acc[csvCol] = exactMatch;
        } else {
          // If any regex matches -> require manual selection
          const isPartial = regexList.some((regex) => regex.test(csvCol));
          if (isPartial) {
            acc[csvCol] = ""; // force user to pick in MappingStep
          } else {
            acc[csvCol] = "not_import"; // auto exclude extras
          }
        }
        return acc;
      }, {});
      // push prefilled mapping into state so MappingStep shows those values
      setMapping(finalMapping);

      // Check if any mapping entries are blank (""), requiring manual mapping
      const needsManual = Object.values(finalMapping).some((v) => v === "");
      
      // Check if any actual required columns are mapped (not just "not_import")
      const mappedRequiredColumns = Object.values(finalMapping).filter(
        (v) => v && v !== "" && v !== "not_import"
      );
      const hasRequiredColumns = mappedRequiredColumns.length > 0;

      // If no required columns are mapped, force user to map them
      if (!hasRequiredColumns) {
        setShowMapping(true);
        toast.warn(
          "No required columns found in CSV. Please map at least some required columns before importing."
        );
        setIsLoading(false);
        return;
      }

      // If any mapping entries are blank (""), we must show the mapping UI and let user finish mapping
      if (needsManual) {
        setShowMapping(true);
        toast.info("Some CSV columns look like matches — please confirm mappings.");
        setIsLoading(false);
        return; // wait for user to map and call handleSubmit(mapping)
      }
    }

    // If we reached here -> mapping is complete (either auto or user-provided)
    // Proceed with multipart upload flow

    // 3️⃣ Request multipart upload
    toast.info("Requesting multipart upload...");
    const startResp = (await axiosWrapper(
      "post",
      CSV_API.CREATE_MULTIPART_UPLOAD,
      { fileName: file.name, fileSize: file.size },
      NEXT_PUBLIC_CSV_API_TOKEN
    )) as StartMultipartResponse;

    const { uploadId, key: fileKey, presignedUrls, chunkSize } = startResp;

    // 4️⃣ Upload parts in parallel
    toast.info("Uploading parts...");
    const parts = await uploadMultipart(file, presignedUrls, chunkSize);

    // 5️⃣ Complete multipart upload
    toast.info("Completing multipart upload...");
    await axiosWrapper(
      "post",
      CSV_API.COMPLETE_MULTIPART_UPLOAD,
      { key: fileKey, uploadId, parts },
      NEXT_PUBLIC_CSV_API_TOKEN
    );

    // 6️⃣ Tell backend to process file
    toast.info("Processing CSV in background...");
    const res = (await axiosWrapper(
      "post",
      CSV_API.IMPORT_MAPPED_CSV,
      {
        s3Key: fileKey,
        data_source_id: selectedSourceId,
        mapping: finalMapping,
      },
      NEXT_PUBLIC_CSV_API_TOKEN
    )) as UploadSuccessResponse;

    toast.success(res.message || "CSV queued for processing!");
    resetState();
  } catch (err: any) {
    console.error(err);
    toast.error(err?.error || err?.message || "CSV upload failed");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="p-6 max-w-2xl w-full bg-white rounded-lg shadow-md space-y-6">
      {/* Source Dropdown */}
      <div>
        <h2 className="text-xl font-bold mb-4">Select Source</h2>
        {sources.length > 0 ? (
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select a Source --</option>
            {sources.map((src, i) => (
              <option key={i} value={src.source_code}>
                {src.source_name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-gray-500">Loading sources...</p>
        )}
      </div>

      {/* File Input */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Upload CSV</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
        />
      </div>

      {/* Mapping Step */}
      {showMapping && csvHeaders.length > 0 && (
        <MappingStep
          message="Please map unmatched CSV columns"
          csvHeaders={csvHeaders}
          mapping={mapping}
          onMappingChange={setMapping}
          onSubmit={() => handleSubmit(mapping)}
          isLoading={isLoading}
        />
      )}

      {/* Submit Button if mapping UI not needed */}
      {!showMapping && (
        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || !file}
          className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
            isLoading || !file
              ? "bg-black/60 cursor-not-allowed"
              : "bg-black hover:bg-black/80"
          }`}
        >
          {isLoading ? "Processing..." : "Process CSV"}
        </button>
      )}
    </div>
  );
}
