

"use client";

import { useEffect, useState, useCallback } from "react";
import { LOGS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import {
  Skeleton,
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Grid as Grid,
  Divider,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import RefreshIcon from "@mui/icons-material/Refresh";
import customStyles from "@/components/common/dataTableStyles";
import { toast } from "react-toastify";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { format } from "date-fns";

// Define Log type
type LogEntry = {
  _id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  
  meta?: Record<string, any>;
};

type ApiResponse = {
  success: boolean;
  data: LogEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

type StatsResponse = {
  success: boolean;
  data: {
    total: number;
    todayCount: number;
    errorCount24h: number;
    byLevel: {
      info?: number;
      warn?: number;
      error?: number;
      debug?: number;
    };
   
  };
};

const LOG_LEVELS = ["INFO", "WARN", "ERROR", "DEBUG", "SUCCESS"];

export default function LogsTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [stats, setStats] = useState<StatsResponse["data"] | null>(null);

  // Filter states
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const [searchMessage, setSearchMessage] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Temp filter states (for popover)
  const [tempSelectedLevel, setTempSelectedLevel] = useState<string>("");

  const [tempSearchMessage, setTempSearchMessage] = useState<string>("");
  const [tempStartDate, setTempStartDate] = useState<string>("");
  const [tempEndDate, setTempEndDate] = useState<string>("");

  // UI states
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    log: LogEntry | null;
  }>({ open: false, log: null });
  const [clearDialog, setClearDialog] = useState(false);


  const token = useSelector((state: RootState) => state.auth.token);

  // Fetch logs statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = (await axiosWrapper(
        "get",
        LOGS_API.GET_STATS,
        {},
        token ?? undefined
      )) as StatsResponse;

      if (response.success) {
        setStats(response.data);
  
       
      
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [token]);

  // Fetch logs with filters
  const fetchLogs = useCallback(
    async (
      pageNumber: number,
      pageSize: number,
      level: string,
   
      message: string,
      start: string,
      end: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
          ...(level && { level }),
       
          ...(message && { message }),
          ...(start && { startDate: start }),
          ...(end && { endDate: end }),
        });

        console.log("Fetching logs with params:", params.toString());

        const response = (await axiosWrapper(
          "get",
          `${LOGS_API.GET_ALL_LOGS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        console.log("Logs response:", response);

        if (response.success) {
          setLogs(response.data || []);
          setTotalRows(response.meta?.total || 0);
        }
      } catch (err: any) {
        console.error("Failed to fetch logs:", err);
        setError(err?.message || "Failed to fetch logs");
        toast.error("Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Initial load
  useEffect(() => {
    if (token) {
      fetchStats();
      fetchLogs(
        pagination.page,
        pagination.limit,
        selectedLevel,

        searchMessage,
        startDate,
        endDate
      );
    }
  }, [
    token,
    pagination.page,
    pagination.limit,
    selectedLevel,
 
    searchMessage,
    startDate,
    endDate,
  ]);

  // Sync temp filters when popover opens
  useEffect(() => {
    if (anchorEl) {
      setTempSelectedLevel(selectedLevel);
 
      setTempSearchMessage(searchMessage);
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [anchorEl, selectedLevel, , searchMessage, startDate, endDate]);

  // Skeleton rows for loading state
  const skeletonRows: LogEntry[] = Array.from({ length: pagination.limit }).map(
    (_, i) => ({
      _id: `skeleton-${i}`,
      timestamp: "",
      level: "info",
      message: "",

    })
  );

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return timestamp;
    }
  };

  // Get level badge with proper styling
  const getLevelBadge = (level: string) => {
    const levelColors: { [key: string]: { bg: string; text: string } } = {
      info: { bg: "bg-blue-100", text: "text-blue-800" },
      warn: { bg: "bg-yellow-100", text: "text-yellow-800" },
      error: { bg: "bg-red-100", text: "text-red-800" },
      debug: { bg: "bg-gray-100", text: "text-gray-800" },
    };

    const colors = levelColors[level] || levelColors.debug;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${colors.bg} ${colors.text}`}
      >
        {level}
      </span>
    );
  };

  // Truncate message for table view
  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  // Table columns
  const columns: TableColumn<LogEntry>[] = [
    {
      name: "Timestamp",
      selector: (row) => row.timestamp,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={150} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600 font-mono">
            {formatTimestamp(row.timestamp)}
          </div>
        ),
      sortable: true,
      minWidth: "180px",
    },
    {
      name: "Level",
      selector: (row) => row.level,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={60} animation="wave" />
        ) : (
          getLevelBadge(row.level)
        ),
      sortable: true,
      minWidth: "100px",
    },
  
    {
      name: "Message",
      selector: (row) => row.message,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={300} animation="wave" />
        ) : (
          <div className="text-sm text-gray-700">
            {truncateMessage(row.message)}
          </div>
        ),
      minWidth: "350px",
      wrap: true,
    },
    {
      name: "Action",
      button: true,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="rectangular" width={40} height={30} />
        ) : (
          <IconButton
            size="small"
            onClick={() => handleViewDetail(row)}
            color="primary"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        ),
      minWidth: "80px",
      maxWidth: "100px",
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  // Handlers
  const handleViewDetail = (log: LogEntry) => {
    setDetailDialog({ open: true, log });
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleApplyFilters = () => {
    setSelectedLevel(tempSelectedLevel);

    setSearchMessage(tempSearchMessage);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setPagination((prev) => ({ ...prev, page: 1 }));
    handleFilterClose();
  };

  const handleClearFilters = () => {
    setSelectedLevel("");
 
    setSearchMessage("");
    setStartDate("");
    setEndDate("");
    setTempSelectedLevel("");

    setTempSearchMessage("");
    setTempStartDate("");
    setTempEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRemoveFilter = (filterType: string) => {
    switch (filterType) {
      case "level":
        setSelectedLevel("");
        break;
    
      case "message":
        setSearchMessage("");
        break;
      case "dateRange":
        setStartDate("");
        setEndDate("");
        break;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getFilterLabel = (type: string, value: string) => {
    switch (type) {
      case "level":
        return `Level: ${value.toUpperCase()}`;
 
      case "message":
        return `Search: "${value}"`;
      case "dateRange":
        return `Date Range: ${value}`;
      default:
        return "";
    }
  };

  const hasFilters =
    selectedLevel  || searchMessage || startDate || endDate;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePerRowsChange = (newLimit: number, page: number) => {
    setPagination({ page, limit: newLimit });
  };

  const handleRefresh = () => {
    fetchLogs(
      pagination.page,
      pagination.limit,
      selectedLevel,

      searchMessage,
      startDate,
      endDate
    );
    fetchStats();
    toast.success("Logs refreshed");
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const params = new URLSearchParams({
        format,
        ...(selectedLevel && { level: selectedLevel }),
  
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${LOGS_API.EXPORT_LOGS}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Logs exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export logs");
    }
  };

  const handleClearLogs = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedLevel && { level: selectedLevel }),
    
        ...(startDate && { beforeDate: endDate || new Date().toISOString() }),
      });

      const response = (await axiosWrapper(
        "delete",
        `${LOGS_API.CLEAR_LOGS}?${params.toString()}`,
        {},
        token ?? undefined
      )) as { success: boolean; deletedCount: number; message: string };

      if (response.success) {
        toast.success(response.message);
        setClearDialog(false);
        handleRefresh();
      }
    } catch (err: any) {
      console.error("Failed to clear logs:", err);
      toast.error(err?.response?.data?.message || "Failed to clear logs");
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? "filter-popover" : undefined;

  return (
    <>
      <Box sx={{ padding: 3 }}>
        {/* Header Section */}
        <div className="flex justify-between items-center pb-6">
          <div>
            <h3 className="text-2xl text-gray-900 font-semibold">
              System Logs
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Monitor and analyze application logs
            </p>
          </div>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              aria-label="refresh"
              onClick={handleRefresh}
              color="primary"
              size="small"
            >
              <RefreshIcon />
            </IconButton>
          
         
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setClearDialog(true)}
              disabled={!hasFilters}
            >
              Clear
            </Button>
            <IconButton 
              aria-label="filter" 
              onClick={handleFilterClick}
              size="small"
            >
              <FilterListIcon />
            </IconButton>
          </Stack>
        </div>

        {/* Statistics Cards - Fixed Grid */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    Total Logs
                  </Typography>
                  <Typography variant="h5" className="font-bold">
                    {stats.total.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    Today&apos;s Logs
                  </Typography>
                  <Typography variant="h5" className="font-bold text-blue-600">
                    {stats.todayCount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    Errors (24h)
                  </Typography>
                  <Typography variant="h5" className="font-bold text-red-600">
                    {stats.errorCount24h.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: '0.75rem', fontWeight: 500, mb: 1 }}
                  >
                    By Level
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {Object.entries(stats.byLevel).map(([level, count]) => (
                      <Chip
                        key={level}
                        label={`${level}: ${count}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: '24px' }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Active Filters */}
        {hasFilters && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            {selectedLevel && (
              <Chip
                label={getFilterLabel("level", selectedLevel)}
                onDelete={() => handleRemoveFilter("level")}
                deleteIcon={<ClearIcon />}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
           
            {searchMessage && (
              <Chip
                label={getFilterLabel("message", searchMessage)}
                onDelete={() => handleRemoveFilter("message")}
                deleteIcon={<ClearIcon />}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {(startDate || endDate) && (
              <Chip
                label={getFilterLabel(
                  "dateRange",
                  `${startDate || "Start"} - ${endDate || "End"}`
                )}
                onDelete={() => handleRemoveFilter("dateRange")}
                deleteIcon={<ClearIcon />}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            <Chip
              label="Clear All"
              onClick={handleClearFilters}
              color="default"
              variant="outlined"
              size="small"
            />
          </Stack>
        )}

        {/* Filter Popover */}
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: { p: 3, width: 450 },
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filter Logs
          </Typography>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="level-filter-label">Log Level</InputLabel>
              <Select
                labelId="level-filter-label"
                value={tempSelectedLevel}
                label="Log Level"
                onChange={(e) => setTempSelectedLevel(e.target.value as string)}
              >
                <MenuItem value="">
                  <em>All Levels</em>
                </MenuItem>
                {LOG_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    <span className="capitalize">{level}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

    

            <TextField
              fullWidth
              size="small"
              label="Search in Message"
              placeholder="Enter keywords..."
              value={tempSearchMessage}
              onChange={(e) => setTempSearchMessage(e.target.value)}
            />

            <Divider />

            <TextField
              fullWidth
              size="small"
              label="Start Date"
              type="datetime-local"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="End Date"
              type="datetime-local"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleFilterClose}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </Stack>
          </Stack>
        </Popover>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={loading ? skeletonRows : logs}
          customStyles={customStyles}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationDefaultPage={pagination.page}
          paginationPerPage={pagination.limit}
          paginationRowsPerPageOptions={[25, 50, 100, 200]}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePerRowsChange}
          highlightOnHover
          striped
          dense
          persistTableHead
          progressPending={false}
          noDataComponent={
            error ? (
              <Typography color="error" sx={{ py: 4, textAlign: "center" }}>
                ⚠️ {error}
              </Typography>
            ) : !loading && logs.length === 0 ? (
              <Typography sx={{ py: 4, textAlign: "center", color: "gray" }}>
                📝 No logs found. Try adjusting your filters!
              </Typography>
            ) : null
          }
        />
      </Box>

      {/* Log Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, log: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <span>Log Details</span>
            {detailDialog.log && getLevelBadge(detailDialog.log.level)}
          </div>
        </DialogTitle>
        <DialogContent dividers>
          {detailDialog.log && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Timestamp
                </Typography>
                <Typography variant="body1" className="font-mono">
                  {formatTimestamp(detailDialog.log.timestamp)}
                </Typography>
              </Box>

              <Divider />

         

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Level
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {getLevelBadge(detailDialog.log.level)}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Message
                </Typography>
                <Typography
                  variant="body1"
                  className="bg-gray-50 p-3 rounded mt-1"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {detailDialog.log.message}
                </Typography>
              </Box>

              {detailDialog.log.meta &&
                Object.keys(detailDialog.log.meta).length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                        Additional Metadata
                      </Typography>
                      <Box className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                        <pre>{JSON.stringify(detailDialog.log.meta, null, 2)}</pre>
                      </Box>
                    </Box>
                  </>
                )}

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Log ID
                </Typography>
                <Typography variant="body2" className="font-mono text-gray-600">
                  {detailDialog.log._id}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, log: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Logs Confirmation Dialog */}
      <ConfirmDialog
        open={clearDialog}
        title="Clear Logs"
        message={`Are you sure you want to clear logs with the current filters? This action cannot be undone.${
          !hasFilters
            ? " Please apply at least one filter to avoid clearing all logs."
            : ""
        }`}
        onConfirm={handleClearLogs}
        onCancel={() => setClearDialog(false)}
        confirmText="Clear Logs"
        cancelText="Cancel"
      />
    </>
  );
}