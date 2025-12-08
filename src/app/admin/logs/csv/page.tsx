"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { LOGS_API } from "@/utils/apiUrl";
import {
  Download,
  Search,
  Filter,
  X,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

// Types
interface LogItem {
  id: number;
  log_type: string;
  message: string;
  source?: string | null;
  source_type?: string;
  metadata?: any;
  stack?: string | null;
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const NEXT_PUBLIC_CSV_API_TOKEN = process.env.NEXT_PUBLIC_CSV_API_TOKEN;

export default function CsvLogsPage() {
  const { token } = useSelector((state: RootState) => state.auth);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);

  const [search, setSearch] = useState<string>("");
  const [logType, setLogType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [logsTotal, setLogsTotal] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = { page, limit };
      const res = await axios.get<PaginatedResponse<LogItem>>(
        `${LOGS_API.GET_LOGS}?sourceType=csv`,
        {
          params,
          headers: NEXT_PUBLIC_CSV_API_TOKEN
            ? { Authorization: `Bearer ${NEXT_PUBLIC_CSV_API_TOKEN}` }
            : undefined,
        }
      );

      const payload = res.data;
      const list = Array.isArray(payload?.data) ? payload.data : [];
      const total =
        typeof payload?.total === "number" ? payload.total : list.length;
      const pages =
        typeof payload?.totalPages === "number"
          ? payload.totalPages
          : list.length / (payload.pageSize || 1);

      setLogs(list);
      setDisplayedLogs(list);
      setLogsTotal(total);
      setTotalPages(pages);
      setPage(page || 1);
    } catch (e: any) {
      setError(e?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  const handleApplyFilters = () => {
    const filters: any = {};
    if (search) filters.search = search;
    if (logType) filters.logType = logType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    setDisplayedLogs(
      logs.filter((log) => {
        if (
          filters.search &&
          !log.message.toLowerCase().includes(filters.search.toLowerCase())
        )
          return false;
        if (filters.logType && log.log_type !== filters.logType) return false;
        if (
          filters.startDate &&
          dayjs(log.created_at).isBefore(filters.startDate)
        )
          return false;
        if (filters.endDate && dayjs(log.created_at).isAfter(filters.endDate))
          return false;
        return true;
      })
    );
    setPage(1);
    setTotalPages(logs.length / limit);
  };

  const clearFilters = () => {
    setSearch("");
    setLogType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    fetchLogs();
  };

  const exportToCSV = () => {
    const csvRows: any[] = [];

    csvRows.push(
      ["ID", "Timestamp", "Log Type", "Source", "Message", "Metadata"]
        .map((h) => `"${h}"`)
        .join(",")
    );

    // Data rows
    displayedLogs.forEach((log) => {
      const row = [
        log.id,
        dayjs(log.created_at).format("YYYY-MM-DD HH:mm:ss"),
        log.log_type,
        log.source || "",
        log.message.replace(/"/g, '""'),
        log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : "",
      ]
        .map((cell) => `"${cell}"`)
        .join(",");

      csvRows.push(row);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `csv_logs_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const exportMetadataToCSV = (metadata: any, logId: number): void => {
    if (!metadata) return;

    const { headers, rows } = prepareCSVData(metadata);
    if (!headers.length || !rows.length) return;

    const csvContent = buildCSVContent(headers, rows);
    downloadCSV(csvContent, logId);
  };
  const flattenObject = (
    obj: Record<string, any>,
    prefix = ""
  ): Record<string, any> => {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const flatKey = prefix ? `${prefix}.${key}` : key;

      const isNestedObject =
        value && typeof value === "object" && !Array.isArray(value);

      if (isNestedObject) {
        Object.assign(flattened, flattenObject(value, flatKey));
      } else {
        flattened[flatKey] = value;
      }
    }

    return flattened;
  };

  const prepareCSVData = (
    metadata: any
  ): { headers: string[]; rows: any[][] } => {
    // Case 1: Array of objects
    if (isArrayOfObjects(metadata)) {
      const headers = Object.keys(metadata[0]);
      const rows = metadata.map((item: any) =>
        headers.map((header) => item[header] ?? "")
      );
      return { headers, rows };
    }

    // Case 2: Single object (
    if (typeof metadata === "object") {
      const flattened = flattenObject(metadata);
      const headers = Object.keys(flattened);
      const rows = [headers.map((header) => flattened[header] ?? "")];
      return { headers, rows };
    }

    // Case 3: Unsupported type
    return { headers: [], rows: [] };
  };
  const isArrayOfObjects = (value: any): boolean => {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object" &&
      value[0] !== null
    );
  };
  const buildCSVContent = (headers: string[], rows: any[][]): string => {
    const csvRows: string[] = [];

    csvRows.push(headers.map(escapeCSVValue).join(","));
    for (const row of rows) {
      const rowString = row.map(formatCSVCell).join(",");
      csvRows.push(rowString);
    }

    return csvRows.join("\n");
  };
  const formatCSVCell = (value: any): string => {
    if (Array.isArray(value)) {
      const joined = value.join("; ");
      return escapeCSVValue(joined);
    }

    return escapeCSVValue(String(value ?? ""));
  };

  const escapeCSVValue = (value: string): string => {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const downloadCSV = (csvContent: string, logId: number): void => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `metadata_log_${logId}_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv`;
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    URL.revokeObjectURL(url);
  };

  const getLogTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      error: "bg-red-100 text-red-800 border-red-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
      success: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      colors[type.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const activeFiltersCount = [search, logType, startDate, endDate].filter(
    Boolean
  ).length;

  return (
    <div className="bg-gradient-to-br  from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="flex flex-col max-w-7xl mx-auto h- overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                CSV Logs
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and analyze your CSV processing logs
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium relative"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <button
                onClick={exportToCSV}
                disabled={displayedLogs.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Logs</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Message or source..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Log Type
                </label>
                <input
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  placeholder="e.g., error, info..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 relative">
          {/* Stats Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {displayedLogs.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">{logsTotal}</span>{" "}
                total logs
              </div>
              <div className="text-sm text-gray-600">
                Page {page} of {Math.max(1, totalPages)}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="h-[40vh] overflow-y-scroll">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 font-medium">
                          Loading logs...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : displayedLogs.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-600 font-medium text-lg">
                          No logs found
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Try adjusting your filters or check back later
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {dayjs(log.created_at).format("MMM DD, YYYY")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dayjs(log.created_at).format("HH:mm:ss")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getLogTypeColor(
                            log.log_type
                          )}`}
                        >
                          {log.log_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-mono">
                          {log.source || (
                            <span className="text-gray-400">No source</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md break-words">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.metadata ? (
                          <div>
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                View Details
                              </summary>
                              <div className="mt-2 space-y-2">
                                <pre className="max-h-64 overflow-auto bg-gray-900 text-gray-100 p-3 rounded-lg text-xs leading-relaxed">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportMetadataToCSV(log.metadata, log.id);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors font-medium"
                                >
                                  <Download className="w-3 h-3" />
                                  Export Metadata CSV
                                </button>
                              </div>
                            </details>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            No metadata
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 border-t  absolute left-0 bottom-0 w-full flex items-center justify-between  border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">
                  Rows per page:
                </label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </button>
                <div className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {page}
                </div>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading || displayedLogs.length < limit}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
