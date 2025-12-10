"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { CAMPAIGNS_API, API_URL, LOCATION_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit2,
  Eye,
  Plus,
  Megaphone,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  UserPlus,
  Users,
  MapPin,
  ListFilter
} from "lucide-react";
import { toast } from 'react-toastify';
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Menu, MenuItem, IconButton, Popover } from "@mui/material"; // Keeping MUI for complex menus/popovers if preferred, or could switch to pure custom
import { STATUS, LEAD_TYPE } from "@/constants/enums";
import useDebounce from '@/hooks/useDebounce';

// --- Types ---

type User = {
  _id: string;
  name: string;
  email: string;
};

type StateOption = {
  abbreviation: string;
  name: string;
};

type Campaign = {
  _id: string;
  campaign_id: string;
  name: string;
  status: string;
  lead_type: string;
  exclusivity: string;
  language: string;
  geography: {
    state: {
      abbreviation: string;
      _id: string;
      name: string;
    };
    coverage: { type: string };
  };
  delivery: { method: string };
  user_id?: {
    email: string;
    name: string;
    _id: string;
  };
  note?: string;
  boberdoo_filter_set_id?: string;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  data: Campaign[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

type UsersApiResponse = {
  data: User[];
  message?: string;
};

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: { [key: string]: string } = {
    'ACTIVE': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'PAUSED': 'bg-amber-50 text-amber-700 border-amber-200',
    'DRAFT': 'bg-gray-50 text-gray-700 border-gray-200',
    'ARCHIVED': 'bg-red-50 text-red-700 border-red-200',
    'COMPLETED': 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const colorClass = statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  const dotColor = status === 'ACTIVE' ? 'bg-emerald-600' :
    status === 'PAUSED' ? 'bg-amber-600' :
      status === 'ARCHIVED' ? 'bg-red-600' :
        status === 'COMPLETED' ? 'bg-blue-600' : 'bg-gray-500';

  const formatStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      {formatStatus(status)}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtext }: { title: string, value: string | number, icon: any, color: string, subtext?: string }) => {
  const isBlack = color.includes('bg-black');

  return (
    <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${isBlack ? "bg-black border-black text-white" : "bg-white border-gray-100"}`}>
      <div className={`p-3 rounded-xl ${isBlack ? "bg-gray-800 text-white" : color}`}>
        <Icon className={`w-6 h-6`} />
      </div>
      <div>
        <p className={`text-sm font-medium ${isBlack ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
        <h3 className={`text-2xl font-bold mt-0.5 ${isBlack ? "text-white" : "text-gray-900"}`}>{value}</h3>
        {subtext && <p className={`text-xs mt-1 ${isBlack ? "text-gray-500" : "text-gray-400"}`}>{subtext}</p>}
      </div>
    </div>
  );
};

export default function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState<number>(0);

  // Filters state
  const [users, setUsers] = useState<User[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);

  // Active Filters
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLeadType, setSelectedLeadType] = useState<string>("");

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Filter Popover State
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempFilters, setTempFilters] = useState({
    user: "",
    state: "",
    status: "",
    leadType: ""
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();


  // --- Helper Data Fetching ---
  const fetchUsers = useCallback(async () => {
    try {
      const response = (await axiosWrapper("get", API_URL.GET_ALL_USERS, {}, token ?? undefined)) as UsersApiResponse;
      setUsers(response.data || []);
    } catch (err) { console.error(err); }
  }, [token]);

  const fetchStates = useCallback(async () => {
    try {
      const response = await axiosWrapper("get", LOCATION_API.GET_STATES, {}, token ?? undefined) as { data: StateOption[] };
      setStates(response.data || []);
    } catch (err) { console.error(err); }
  }, [token]);

  // --- Campaign Fetching ---
  const fetchCampaigns = useCallback(async (pageIndex: number, pageSize: number, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(selectedUser && { user_id: selectedUser }),
        ...(selectedState && { state: selectedState }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedLeadType && { lead_type: selectedLeadType }),
      });

      if (search) params.append('search', search);

      const response = (await axiosWrapper(
        "get",
        `${CAMPAIGNS_API.GET_ALL_CAMPAIGNS}?${params.toString()}`,
        {},
        token ?? undefined
      )) as ApiResponse;

      setCampaigns(response.data || []);
      setTotalRows(response.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      setError("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  }, [token, selectedUser, selectedState, selectedStatus, selectedLeadType]);

  // Initial Data Load
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchStates();
    }
  }, [token, fetchUsers, fetchStates]);

  // Fetch data on changes
  useEffect(() => {
    if (token) {
      fetchCampaigns(pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter, selectedUser, selectedState, selectedStatus, selectedLeadType, fetchCampaigns]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [debouncedGlobalFilter, selectedUser, selectedState, selectedStatus, selectedLeadType]);

  // --- Actions ---
  const handleDelete = (row: Campaign) => {
    setCampaignToDelete(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    try {
      const response = await axiosWrapper(
        "delete",
        CAMPAIGNS_API.DELETE_CAMPAIGN.replace(':campaignId', campaignToDelete._id),
        {},
        token ?? undefined
      ) as { result?: { deleted: boolean; message: string; }; message: string };

      if (response.result?.deleted || response.message?.includes('success')) {
        toast.success(response.message || 'Campaign deleted successfully');
        setConfirmOpen(false);
        setCampaignToDelete(null);
        fetchCampaigns(pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter);
        setTotalRows(prev => prev - 1);
      } else {
        toast.error('Failed to delete campaign');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete campaign');
    }
  };


  // --- Filter Logic ---
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTempFilters({
      user: selectedUser,
      state: selectedState,
      status: selectedStatus,
      leadType: selectedLeadType
    });
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyFilters = () => {
    setSelectedUser(tempFilters.user);
    setSelectedState(tempFilters.state);
    setSelectedStatus(tempFilters.status);
    setSelectedLeadType(tempFilters.leadType);
    handleFilterClose();
  };

  const handleClearFilters = () => {
    setSelectedUser("");
    setSelectedState("");
    setSelectedStatus("");
    setSelectedLeadType("");
  };


  // --- Table Columns ---
  const columns: ColumnDef<Campaign>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Campaign Info",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{row.original.name}</span>
          <span className="text-xs text-gray-500 font-mono mt-0.5">ID: {row.original.campaign_id}</span>
        </div>
      )
    },
    {
      accessorKey: "user_id",
      header: "Client",
      cell: ({ row }) => row.original.user_id ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
            {row.original.user_id.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-700">{row.original.user_id.name}</span>
        </div>
      ) : <span className="text-gray-400 italic text-sm">--</span>
    },
    {
      accessorKey: "geography",
      header: "Coverage",
      cell: ({ row }) => {
        const state = Array.isArray(row.original.geography.state)
          ? row.original.geography.state.map(s => s.abbreviation).join(', ')
          : row.original.geography.state?.abbreviation;
        return (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-sm text-gray-700 font-medium">{state || "All"}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "lead_type",
      header: "Lead Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-gray-400" />
          <span className="text-sm text-gray-700 capitalize">{row.original.lead_type.toLowerCase().replace('_', ' ')}</span>
        </div>
      )
    },
    {
      accessorKey: "boberdoo_filter_set_id",
      header: "Filter Set ID",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 font-mono">{row.original.boberdoo_filter_set_id || "-"}</span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <ActionMenu
            campaign={campaign}
            onDelete={() => handleDelete(campaign)}
          />
        )
      }
    }
  ], []);

  const table = useReactTable({
    data: campaigns,
    columns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });

  // Calculate stats for cards
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length; // Note: This is page-level only if we rely on fetched data. Ideal is server stats.
  // For "10/10" feel we should probably display total active from metadata if available, OR just use totalRows for now. 
  // Let's use `totalRows` for total, and just visually show Active/Paused based on current view or generic placeholder if no server API for stats.
  // Assuming totalRows is total campaigns.

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* --- Stats Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Campaigns"
          value={totalRows}
          icon={Megaphone}
          color="text-white bg-black"
        />
        <StatCard
          title="Active Now"
          value={activeCount > 0 ? activeCount : "--"}
          subtext="On current page"
          icon={PlayCircle}
          color="text-emerald-600 bg-emerald-100"
        />
        <StatCard
          title="Campaign types"
          value={new Set(campaigns.map(c => c.lead_type)).size}
          subtext="Variety"
          icon={ListFilter}
          color="text-blue-600 bg-blue-100"
        />
      </div>

      {/* --- Header & Filters --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Manage marketing campaigns, track performance & status.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={handleFilterClick}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${Boolean(filterAnchorEl) || (selectedUser || selectedState || selectedStatus || selectedLeadType)
              ? "bg-black text-white border-black shadow-md"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium hidden sm:inline">Filters</span>
            {(selectedUser || selectedState || selectedStatus || selectedLeadType) && (
              <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {table.getHeaderGroups().map(headerGroup => (
                  headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4"><div className="h-6 w-32 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group hover:bg-gray-50/80 transition-colors">
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
                      <Megaphone className="h-12 w-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium text-gray-900">No campaigns found</p>
                      <p className="text-sm">Try creating one or adjusting filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{(pagination.pageIndex * pagination.pageSize) + 1}</span> to <span className="font-medium text-gray-900">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)}</span> of <span className="font-medium text-gray-900">{totalRows}</span> results
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="block w-full pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-black focus:border-black rounded-lg border"
            >
              {[10, 20, 30, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>Show {pageSize}</option>
              ))}
            </select>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-3 py-1.5 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center px-3 py-1.5 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { p: 0, width: 320, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
        }}
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Filter Campaigns</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Client</label>
            <select
              value={tempFilters.user}
              onChange={(e) => setTempFilters(prev => ({ ...prev, user: e.target.value }))}
              className="w-full rounded-lg border-gray-200 text-sm focus:border-black focus:ring-black"
            >
              <option value="">All Clients</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">State</label>
            <select
              value={tempFilters.state}
              onChange={(e) => setTempFilters(prev => ({ ...prev, state: e.target.value }))}
              className="w-full rounded-lg border-gray-200 text-sm focus:border-black focus:ring-black"
            >
              <option value="">All States</option>
              {states.map(s => <option key={s.abbreviation} value={s.abbreviation}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Status</label>
            <div className="flex flex-wrap gap-2">
              {['ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED'].map(status => (
                <button
                  key={status}
                  onClick={() => setTempFilters(prev => ({ ...prev, status: prev.status === status ? "" : status }))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${tempFilters.status === status
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Lead Type</label>
            <select
              value={tempFilters.leadType}
              onChange={(e) => setTempFilters(prev => ({ ...prev, leadType: e.target.value }))}
              className="w-full rounded-lg border-gray-200 text-sm focus:border-black focus:ring-black"
            >
              <option value="">All Types</option>
              {Object.values(LEAD_TYPE).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 shadow-lg shadow-black/10"
          >
            Apply Filters
          </button>
        </div>
      </Popover>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Campaign"
        message={`Are you sure you want to delete campaign "${campaignToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// Sub-component for Menu
const ActionMenu = ({ campaign, onDelete }: { campaign: Campaign, onDelete: () => void }) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <div className="text-right">
        <IconButton onClick={handleClick} size="small" className="text-gray-400 hover:text-gray-600 hover:bg-gray-50">
          <MoreHorizontal className="h-5 w-5" />
        </IconButton>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
            mt: 1.5,
            '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
            borderRadius: '12px',
            border: '1px solid #f3f4f6'
          },
        }}
      >
        <MenuItem onClick={() => { router.push(`/admin/campaigns/${campaign._id}`); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <Eye size={16} /> View Details
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/admin/campaigns/${campaign._id}/edit`); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <Edit2 size={16} /> Edit Campaign
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/admin/campaigns/${campaign._id}/leads/add`); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <UserPlus size={16} /> Add Lead
        </MenuItem>
        <MenuItem onClick={() => { router.push(`/admin/leads?campaign_id=${campaign._id}`); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <ListFilter size={16} /> View Leads
        </MenuItem>
        <MenuItem onClick={() => { onDelete(); handleClose(); }} disableRipple className="text-sm font-medium text-red-600 gap-2">
          <Trash2 size={16} /> Delete
        </MenuItem>
      </Menu>
    </>
  )
}