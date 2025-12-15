"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { LEADS_API, BILLING_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import useDebounce from '@/hooks/useDebounce';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Eye,
  MoreHorizontal,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  MapPin,
  RefreshCcw,
  FileText,
  Mail,
  Phone,
  CreditCard
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { Menu, MenuItem, IconButton, Tooltip, Chip } from "@mui/material";
import { toast } from "react-toastify";
import ReturnFeedbackModal from "@/components/common/ReturnFeedbackModal";

// --- Types ---

type Lead = {
  _id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: {
      abbreviation: string;
      _id: string;
      name: string;
    } | any; // Handle mixed types safely
    zip_code: string;
  };
  campaign_id: {
    _id: string;
    name: string;
    lead_type: string;
    exclusivity?: string;
    language?: string;
    geography?: string;
    delivery?: string;
  } | string;
  transaction_id?: {
    _id: string;
    amount: number;
  } | string | null;
  original_cost?: number;
  note: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  return_status: 'Not Returned' | 'Pending' | 'Approved' | 'Rejected';
  return_attempts: number;
  max_return_attempts: number;
  return_reason?: string;
  return_comments?: string;
  payment_status?: "paid" | "payment_pending" | "failed" | "refunded";
};

type ApiResponse = {
  data: Lead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

// --- Components ---

const StatusBadge = ({ status, type = 'status' }: { status: string, type?: 'status' | 'return' }) => {
  const safeStatus = String(status || (type === 'return' ? 'Not Returned' : 'N/A'));

  // Status mapping for Lead Status
  const leadStatusConfig: { [key: string]: { bg: string; text: string; icon?: any } } = {
    'ACTIVE': { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    'INACTIVE': { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', icon: XCircle },
    'PENDING': { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: Clock },
    'QUALIFIED': { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', icon: CheckCircle },
    'CONVERTED': { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', icon: DollarSign },
    'REJECTED': { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-600', icon: XCircle },
  };

  // Status mapping for Return Status
  const returnStatusConfig: { [key: string]: { bg: string; text: string; icon?: any } } = {
    'Not Returned': { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-500', icon: null },
    'Pending': { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: Clock },
    'Approved': { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    'Rejected': { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', icon: AlertCircle },
  };

  const config = type === 'return'
    ? (returnStatusConfig[safeStatus] || returnStatusConfig['Not Returned'])
    : (leadStatusConfig[safeStatus.toUpperCase()] || leadStatusConfig['ACTIVE']);

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
      {Icon && <Icon size={12} className="mr-1.5" />}
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1).toLowerCase().replace(/_/g, ' ')}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => {
  const isBlack = color.includes('bg-black');
  return (
    <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${isBlack ? "bg-black border-black text-white" : "bg-white border-gray-100"}`}>
      <div className={`p-3 rounded-xl ${isBlack ? "bg-gray-800 text-white" : color}`}>
        <Icon className={`w-6 h-6`} />
      </div>
      <div>
        <p className={`text-sm font-medium ${isBlack ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
        <h3 className={`text-2xl font-bold mt-0.5 ${isBlack ? "text-white" : "text-gray-900"}`}>{value}</h3>
      </div>
    </div>
  );
};

export default function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [downloadingCSV, setDownloadingCSV] = useState<boolean>(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  // --- Fetch Leads ---
  const fetchLeads = useCallback(
    async (pageNumber: number, pageSize: number, search?: string) => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
        });

        if (search) {
          params.append('search', search);
        }

        const response = (await axiosWrapper(
          "get",
          `${LEADS_API.GET_ALL_LEADS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        setLeads(response.data || []);
        setTotalRows(response.meta?.total || 0);
      } catch (err) {
        console.error("Failed to fetch leads:", err);
        toast.error("Failed to load leads");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [debouncedGlobalFilter]);

  useEffect(() => {
    if (token) {
      fetchLeads(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter, fetchLeads]);

  // --- Helpers ---
  const isLeadReturnable = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 5;
  };

  const handleReturnClick = (row: Lead) => {
    const currentStatus = (row.return_status || 'Not Returned').trim();

    if ((row.return_attempts || 0) >= (row.max_return_attempts || 2)) {
      toast.warning("You have reached the maximum return attempts for this lead.");
      return;
    }

    if (currentStatus !== 'Not Returned' && currentStatus !== 'Rejected') {
      toast.warning("This lead has already been marked for return.");
      return;
    }

    setSelectedLead(row);
    setReturnModalOpen(true);
  };

  const handleReturnConfirm = async (leadId: string, reason: string, comments: string) => {
    try {
      setLoading(true);
      const payload = {
        lead_id: leadId,
        return_status: 'Pending',
        return_reason: reason,
        return_comments: comments,
      };

      await axiosWrapper(
        "post",
        LEADS_API.RETURN_LEAD,
        payload,
        token ?? undefined
      );

      // Refresh
      fetchLeads(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter);
      toast.success("Lead return request submitted successfully!");
    } catch (err: any) {
      console.error("Failed to return lead:", err);
      const message = err?.response?.data?.message || err?.message || "Failed to submit return request.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayLead = async (leadId: string) => {
    try {
      setLoading(true);
      const url = BILLING_API.CHARGE_SINGLE_LEAD.replace(':leadId', leadId);

      await axiosWrapper(
        "post",
        url,
        {},
        token ?? undefined
      );

      // Refresh
      fetchLeads(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter);
      toast.success("Lead payment processed successfully!");
    } catch (err: any) {
      console.error("Failed to pay for lead:", err);
      const message = err?.response?.data?.message || err?.message || "Failed to process payment.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // --- CSV Download ---
  // (Keeping logic mostly same but refactored slightly)
  const convertToCSV = (data: Lead[]): string => {
    if (!data || data.length === 0) return '';

    const headers = [
      'Lead ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Street', 'City', 'State',
      'State Abbreviation', 'Zip Code', 'Campaign Name', 'Lead Type', 'Exclusivity', 'Language',
      'Original Cost', 'Note', 'Status', 'Return Status', 'Return Reason',
      'Return Comments', 'Return Attempts', 'Created Date'
    ];

    const rows = data.map(lead => {
      const campaignName = typeof lead.campaign_id === 'object' && lead.campaign_id !== null ? lead.campaign_id.name : 'N/A';
      const leadType = typeof lead.campaign_id === 'object' && lead.campaign_id !== null ? (lead.campaign_id.lead_type || 'N/A') : 'N/A';
      const exclusivity = typeof lead.campaign_id === 'object' && lead.campaign_id !== null ? (lead.campaign_id.exclusivity || 'N/A') : 'N/A';
      const language = typeof lead.campaign_id === 'object' && lead.campaign_id !== null ? (lead.campaign_id.language || 'N/A') : 'N/A';

      return [
        lead.lead_id || '',
        lead.first_name || '',
        lead.last_name || '',
        lead.email || '',
        lead.phone || '',
        lead.address?.street || '',
        lead.address?.city || '',
        lead.address?.state?.name || '',
        lead.address?.state?.abbreviation || '',
        lead.address?.zip_code || '',
        campaignName,
        leadType,
        exclusivity,
        language,
        lead.original_cost?.toString() || '0',
        (lead.note || '').replace(/"/g, '""'),
        lead.status || '',
        lead.return_status || 'Not Returned',
        (lead.return_reason || '').replace(/"/g, '""'),
        (lead.return_comments || '').replace(/"/g, '""'),
        lead.return_attempts?.toString() || '0',
        lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''
      ].map(field => `"${field}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloadingCSV(true);
      toast.info("Preparing CSV download...");

      // Fetch all for export
      const params = new URLSearchParams({ page: '1', limit: totalRows.toString() });
      const response = (await axiosWrapper("get", `${LEADS_API.GET_ALL_LEADS}?${params.toString()}`, {}, token ?? undefined)) as ApiResponse;
      const allLeads = response.data || [];

      if (allLeads.length === 0) {
        toast.warning("No leads available to download");
        return;
      }

      const csvContent = convertToCSV(allLeads);
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${allLeads.length} leads!`);
    } catch (err) {
      console.error("Failed to download CSV:", err);
      toast.error("Failed to download CSV.");
    } finally {
      setDownloadingCSV(false);
    }
  };

  // --- Columns ---
  const columns: ColumnDef<Lead>[] = useMemo(() => [
    {
      accessorKey: "lead_id",
      header: "Lead Info",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{row.original.lead_id}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <Calendar size={12} />
              {new Date(row.original.createdAt).toLocaleDateString()}
            </div>
            {row.original.note && (
              <Tooltip title={row.original.note} arrow placement="top">
                <div className="group flex items-center gap-1 cursor-help bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 transition-colors hover:bg-yellow-100">
                  <FileText size={10} className="text-yellow-600" />
                  <span className="text-[10px] font-medium text-yellow-700">Note</span>
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      ),
      size: 140,
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[180px]">
          <span className="text-sm font-medium text-gray-900 truncate">
            {row.original.first_name} {row.original.last_name}
          </span>
          <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500">
            <div className="flex items-center gap-1.5 truncate">
              <Mail size={11} className="text-gray-400" />
              <a href={`mailto:${row.original.email}`} className="truncate hover:text-blue-600 hover:underline transition-colors">
                {row.original.email}
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-gray-400" />
              {row.original.phone ? (
                <a href={`tel:${row.original.phone}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {row.original.phone}
                </a>
              ) : "--"}
            </div>
          </div>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }) => {
        const addr = row.original.address;
        const st = addr?.state;
        const stateName = typeof st === 'object' && st !== null ? (st.abbreviation || st.name) : st || '';
        // Use full_address from API if available, otherwise construct it
        const fullAddr = (addr as any).full_address || `${addr?.street || ''}, ${addr?.city || ''}, ${stateName} ${addr?.zip_code || ''}`;
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;

        return (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 group transition-colors">
            <MapPin size={14} className="text-gray-400 group-hover:text-blue-500" />
            <span className="text-sm border-b border-transparent group-hover:border-blue-200">{addr?.city || 'N/A'}, {stateName}</span>
          </a>
        );
      },
      size: 150,
    },
    {
      accessorKey: "campaign_id",
      header: "Campaign",
      cell: ({ row }) => {
        const camp = row.original.campaign_id;
        const name = typeof camp === 'object' && camp !== null ? camp.name : camp || "N/A";
        const cost = row.original.original_cost || 0;

        return (
          <div className="flex flex-col">
            <span className="text-sm text-gray-700 font-medium">{name}</span>
            {(cost > 0) && (
              <span className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center gap-0.5">
                Cost: <span className="text-gray-900">${cost}</span>
              </span>
            )}
          </div>
        );
      },
      size: 150,
    },
    {
      id: "status_group",
      header: "Status (Lead | Return | Pay)",
      cell: ({ row }) => {
        const leadSt = row.original.status || "New";
        const retLabel = row.original.return_status === 'Not Returned' ? 'Active' : row.original.return_status;
        const payLabel = row.original.payment_status || "Paid";

        // Helper for colors (inline to avoid massive refactor of helper functions outside)
        const getStatusColor = (s: string, type: 'lead' | 'return' | 'payment') => {
          const str = s?.toString().replace(/_/g, " ").toLowerCase();
          if (type === 'lead') {
            if (str === 'new') return "text-blue-700";
            if (str === 'contacted') return "text-purple-700";
            if (str === 'qualified') return "text-green-700";
            if (str === 'converted') return "text-emerald-700";
            if (str === 'rejected') return "text-red-700";
            return "text-gray-600";
          }
          if (type === 'return') {
            if (str === 'not returned') return "text-gray-400";
            if (str === 'pending') return "text-amber-700";
            if (str === 'approved') return "text-red-700";
            if (str === 'rejected') return "text-green-700";
            return "text-gray-500";
          }
          if (type === 'payment') {
            if (str === 'paid') return "text-emerald-700";
            if (str?.includes('pending')) return "text-amber-700";
            if (str === 'failed') return "text-red-700";
            return "text-gray-500";
          }
          return "text-gray-500";
        };

        return (
          <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50/50 px-3 py-1.5 shadow-sm">
            <Tooltip title="Lead Status">
              <span className={`text-[11px] font-semibold uppercase tracking-wide cursor-help ${getStatusColor(leadSt, 'lead')}`}>
                {leadSt.replace(/_/g, " ")}
              </span>
            </Tooltip>

            <span className="mx-2 text-gray-300 text-[10px]">|</span>

            <Tooltip title="Return Status">
              <span className={`text-[11px] font-medium cursor-help ${getStatusColor(row.original.return_status, 'return')} whitespace-nowrap`}>
                {row.original.return_status === 'Not Returned' ? (
                  <span className="text-gray-400 font-normal">No Return</span>
                ) : (
                  <span>{row.original.return_status}</span>
                )}
              </span>
            </Tooltip>

            <span className="mx-2 text-gray-300 text-[10px]">|</span>

            <Tooltip title="Payment Status">
              <span className={`text-[11px] font-medium cursor-help ${getStatusColor(payLabel, 'payment')} uppercase tracking-wide`}>
                {payLabel}
              </span>
            </Tooltip>
          </div>
        );
      },
      size: 240,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionMenu
          row={row.original}
          onView={() => router.push(`/dashboard/leads/${row.original._id}`)}
          onReturn={() => handleReturnClick(row.original)}
          onPay={() => handlePayLead(row.original._id)}
          canReturn={isLeadReturnable(row.original.createdAt) &&
            (row.original.return_status === "Not Returned" || row.original.return_status === "Rejected") &&
            row.original.return_attempts < (row.original.max_return_attempts || 2)}
          canPay={Boolean(row.original.payment_status && row.original.payment_status.toLowerCase().includes('pending'))}
        />
      ),
      size: 60,
    }
  ], [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const table = useReactTable({
    data: leads,
    columns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2">

      {/* Header & Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your acquired leads</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCSV}
              disabled={downloadingCSV || leads.length === 0}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm disabled:opacity-50"
            >
              {downloadingCSV ? <RefreshCcw size={18} className="animate-spin" /> : <Download size={18} />}
              <span>{downloadingCSV ? "Exporting..." : "Export CSV"}</span>
            </button>
            <Link
              href="/dashboard/campaigns/add"
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
            >
              <FileText size={18} />
              <span>Buy Leads (Campaigns)</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Leads"
            value={totalRows}
            icon={User}
            color="text-white bg-black"
          />
          <StatCard
            title="Leads Returned"
            value={leads.filter(l => l.return_status === 'Approved').length} // Note: This is page-level stat only, ideally should come from backend meta
            icon={RotateCcw}
            color="text-rose-600 bg-rose-100"
          />
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
            <div className="z-10">
              <p className="text-blue-100 text-sm font-medium">Return Policy</p>
              <h3 className="text-xl font-bold mt-1">5-Day Guarantee</h3>
              <p className="text-xs text-blue-100 mt-2 opacity-80">You can return bad leads within 5 days of purchase.</p>
            </div>
            <CheckCircle className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white opacity-10" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Controls */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            All Leads
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{totalRows}</span>
          </h2>
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            <input
              type="text"
              placeholder="Search leads..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all shadow-sm group-hover:bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {table.getHeaderGroups().map(headerGroup => (
                  headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-32 bg-gray-100 rounded-md" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-32 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group hover:bg-gray-50/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-24 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No leads found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search or buy new leads.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">Rows per page</span>
            <select
              value={pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="block w-20 py-1.5 px-2 text-sm border-gray-300 rounded-lg border bg-gray-50 focus:outline-none focus:ring-black transition-shadow"
            >
              {[10, 25, 50, 100].map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">
              Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of <span className="font-medium">{table.getPageCount()}</span>
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      <ReturnFeedbackModal
        open={returnModalOpen}
        leadId={selectedLead?._id || ''}
        leadName={selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : ''}
        onConfirm={handleReturnConfirm}
        onCancel={() => setReturnModalOpen(false)}
      />

    </div>
  );
}

// --- Action Menu Component ---
const ActionMenu = ({ row, onView, onReturn, onPay, canReturn, canPay }: { row: Lead, onView: () => void, onReturn: () => void, onPay: () => void, canReturn: boolean, canPay: boolean }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={handleClick} size="small" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100">
        <MoreHorizontal className="h-5 w-5" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.08))',
            mt: 1,
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
            minWidth: '140px'
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { onView(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2 hover:bg-gray-50 py-2">
          <Eye size={16} className="text-gray-400" /> View Details
        </MenuItem>

        {canPay && (
          <MenuItem onClick={() => { onPay(); handleClose(); }} disableRipple className="text-sm font-medium text-emerald-600 gap-2 hover:bg-emerald-50 py-2">
            <CreditCard size={16} className="text-emerald-500" /> Pay Now
          </MenuItem>
        )}

        {canReturn && (
          <MenuItem onClick={() => { onReturn(); handleClose(); }} disableRipple className="text-sm font-medium text-rose-600 gap-2 hover:bg-rose-50 py-2">
            <RotateCcw size={16} className="text-rose-500" /> Return Lead
          </MenuItem>
        )}
      </Menu>
    </>
  );
};