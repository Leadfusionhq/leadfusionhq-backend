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

interface MappingErrorResponse {
  message: string;
  missingColumns: string[];
  csvHeaders?: string[];
  dbHeaders?: string[];
}

type UploadResponse = UploadSuccessResponse | MappingErrorResponse;
type Mapping = Record<string, string>;

interface SourceData {
  source_name: string;
  source_code: string;
}

function UploadStep({
  fileInputRef,
  onFileChange,
  onUpload,
  isLoading,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Upload CSV</h2>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
      />
      <button
        onClick={onUpload}
        disabled={isLoading}
        className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
          isLoading
            ? "bg-black/60 cursor-not-allowed"
            : "bg-black hover:bg-black/80"
        }`}
      >
        {isLoading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}

function MappingStep({
  message,
  missingColumns,
  csvHeaders,
  mapping,
  onMappingChange,
  onSubmit,
  isLoading,
}: {
  message: string;
  missingColumns: string[];
  csvHeaders: string[];
  mapping: Mapping;
  onMappingChange: (newMapping: Mapping) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  useEffect(() => {
    const autoMapping: Mapping = {};
    csvHeaders.forEach((csvCol) => {
      if (missingColumns.includes(csvCol) && !mapping[csvCol]) {
        autoMapping[csvCol] = csvCol;
      }
    });

    if (Object.keys(autoMapping).length > 0) {
      onMappingChange({ ...mapping, ...autoMapping });
    }
  }, [csvHeaders, missingColumns, mapping, onMappingChange]);

  const isMappingComplete = csvHeaders.every((col) => mapping[col]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">
        Match Missing Columns
      </h2>
      {message && (
        <div className="text-red-600 font-semibold bg-red-50 p-3 rounded-lg">
          {message}
        </div>
      )}
      <p className="text-gray-600">
        These CSV columns dont match the database. Please map them:
      </p>
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
              {missingColumns.map((dbCol) => (
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

  const [step, setStep] = useState<"upload" | "mapping">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");

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
            source_code: `${row["Source Id"]}-${index + 1}`,
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
    setStep("upload");
    setFile(null);
    setCsvHeaders([]);
    setMissingColumns([]);
    setMapping({});
    setSelectedSourceId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warn("Please select a CSV file to upload");
      return;
    }
    if (!selectedSourceId) {
      toast.warn("Please select a source before uploading");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("data_source_id", selectedSourceId);

    try {
      setIsLoading(true);
      const res = (await axiosWrapper(
        "post",
        CSV_API.IMPORT_CSV,
        formData as any,
        NEXT_PUBLIC_CSV_API_TOKEN,
        true
      )) as UploadResponse;

      toast.success(res.message || "CSV uploaded successfully!");
      resetState();
    } catch (err: any) {
      if (err?.missingColumns) {
        setCsvHeaders(err.csvHeaders || []);
        setMissingColumns(err.missingColumns);
        setStep("mapping");
        toast.info("Some CSV columns are missing. Please map them.");
      } else {
        toast.error(err?.error || err?.message || "Upload failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingSubmit = async () => {
    if (!file) {
      toast.warn("No CSV file available for mapping");
      return;
    }
    if (!selectedSourceId) {
      toast.warn("Please select a source before uploading");
      return;
    }

    const isMappingComplete = csvHeaders.every((col) => mapping[col]);
    if (!isMappingComplete) {
      toast.warn("Please complete all column mappings");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    formData.append("data_source_id", selectedSourceId);

    try {
      setIsLoading(true);
      const res = (await axiosWrapper(
        "post",
        CSV_API.IMPORT_MAPPED_CSV,
        formData as any,
        NEXT_PUBLIC_CSV_API_TOKEN,
        true
      )) as UploadSuccessResponse;

      toast.success(res.message || "CSV uploaded successfully!");
      resetState();
    } catch (err: any) {
      toast.error(err?.error || err?.message || "Mapping failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl w-full bg-white rounded-lg shadow-md space-y-6">
      {/* 👇 Source Dropdown */}
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

      {step === "upload" && (
        <UploadStep
          fileInputRef={fileInputRef}
          onFileChange={setFile}
          onUpload={handleUpload}
          isLoading={isLoading}
        />
      )}
      {step === "mapping" && (
        <MappingStep
          message="Please map the missing columns"
          missingColumns={missingColumns}
          csvHeaders={csvHeaders}
          mapping={mapping}
          onMappingChange={setMapping}
          onSubmit={handleMappingSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
