"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { CAMPAIGNS_API } from "@/utils/apiUrl";
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
  Plus,
  Rocket,
  PauseCircle,
  PlayCircle,
  MoreHorizontal,
  Edit2,
  Eye,
  Trash2,
  Calendar,
  Clock
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, MenuItem, IconButton, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";

// --- Types ---
type Campaign = {
  _id: string;
  name: string;
  status: string;
  lead_type: string;
  exclusivity: string;
  language: string;
  geography: {
    state: string | { name: string; abbreviation: string }[];
    coverage: {
      type: string;
      partial?: {
        zip_codes?: string[];
        zipcode?: string;
      };
    };
  };
  delivery: {
    method: string[] | string;
    email?: {
      addresses: string;
    };
    phone?: {
      numbers: string;
    };
  };
  note?: string;
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

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const safeStatus = String(status || "DRAFT");

  const statusConfig: { [key: string]: { bg: string; text: string; icon?: any } } = {
    'ACTIVE': { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: PlayCircle },
    'INACTIVE': { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', icon: PauseCircle },
    'PAUSED': { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: PauseCircle },
    'PENDING': { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', icon: Clock },
    'DRAFT': { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-600', icon: Edit2 },
  };

  const config = statusConfig[safeStatus.toUpperCase()] || statusConfig['DRAFT'];
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

export default function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchCampaigns = useCallback(
    async (pageNumber: number, pageSize: number, search?: string) => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
        });

        if (search) {
          params.append('search', search); // Ensure backend supports this or implement client-side filtering if small data
        }

        const response = (await axiosWrapper(
          "get",
          `${CAMPAIGNS_API.GET_ALL_CAMPAIGNS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        setCampaigns(response.data || []);
        // Check if meta exists, otherwise fallback or calculate
        setTotalRows(response.meta?.total || 0);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        toast.error("Failed to load campaigns");
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
      fetchCampaigns(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter, fetchCampaigns]);


  const columns: ColumnDef<Campaign>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Campaign Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.original.name || "Untitled Campaign"}</span>
          <span className="text-xs text-gray-500">ID: {(row.original._id || "").slice(-6).toUpperCase()}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status || "DRAFT"} />,
    },
    {
      accessorKey: "geography.coverage",
      header: "Coverage",
      cell: ({ row }) => {
        const geography = row.original.geography;
        const stateData = geography?.state;
        const partialData = geography?.coverage?.partial;

        let displayState = "N/A";
        let isZipCodes = false;
        let zipCodes: string[] = [];

        if (Array.isArray(stateData) && stateData.length > 0) {
          displayState = stateData.map((s: any) => s.name || s).join(", ");
        } else if (typeof stateData === 'string' && stateData.trim() !== '') {
          displayState = stateData;
        } else if (stateData && typeof stateData === 'object' && 'name' in stateData) {
          displayState = (stateData as any).name;
        } else {
          // Fallback to Zip Codes if state is missing
          if (partialData?.zip_codes && Array.isArray(partialData.zip_codes) && partialData.zip_codes.length > 0) {
            isZipCodes = true;
            zipCodes = partialData.zip_codes;
            displayState = `${zipCodes.length} Zip ${zipCodes.length === 1 ? 'Code' : 'Codes'}`;
          } else if (partialData?.zipcode) {
            isZipCodes = true;
            zipCodes = [partialData.zipcode];
            displayState = partialData.zipcode;
          }
        }

        if (isZipCodes) {
          return (
            <Tooltip title={zipCodes.join(", ")} arrow placement="top">
              <span className="text-sm text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap cursor-help border border-blue-100">
                {displayState}
              </span>
            </Tooltip>
          );
        }

        return (
          <span className="text-sm text-gray-700 font-medium bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] inline-block" title={displayState}>
            {displayState}
          </span>
        );
      },
    },
    {
      accessorKey: "lead_type",
      header: "Lead Type",
      cell: ({ row }) => {
        const leadType = String(row.original.lead_type || "N/A");
        return (
          <span className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 text-xs font-medium border border-gray-100 uppercase tracking-wide">
            {leadType.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: "delivery.method",
      header: "Delivery",
      cell: ({ row }) => {
        const delivery = row.original.delivery;
        const methods = Array.isArray(delivery?.method)
          ? delivery.method
          : typeof delivery?.method === 'string'
            ? [delivery.method]
            : [];

        const hasEmail = methods.some(m => m.toLowerCase().includes('email'));
        const hasPhone = methods.some(m => m.toLowerCase().includes('phone') || m.toLowerCase().includes('call'));

        return (
          <div className="flex items-center gap-3">
            {hasEmail && (
              <Tooltip title={delivery?.email?.addresses || "No email provided"} arrow placement="top">
                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center cursor-help hover:bg-blue-100 transition-colors">
                  <Mail size={14} />
                </div>
              </Tooltip>
            )}
            {hasPhone && (
              <Tooltip title={delivery?.phone?.numbers || "No phone provided"} arrow placement="top">
                <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center cursor-help hover:bg-purple-100 transition-colors">
                  <Phone size={14} />
                </div>
              </Tooltip>
            )}
            {!hasEmail && !hasPhone && (
              <span className="text-xs text-gray-400 italic">No delivery set</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const dateStr = row.original.createdAt;
        const date = dateStr ? new Date(dateStr) : null;
        const isValidDate = date && !isNaN(date.getTime());

        return (
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} />
            <span className="text-sm">
              {isValidDate ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionMenu
          onView={() => router.push(`/dashboard/campaigns/${row.original._id}`)}
          onEdit={() => router.push(`/dashboard/campaigns/${row.original._id}/edit`)}
        />
      ),
    }
  ], [router]);

  const table = useReactTable({
    data: campaigns,
    columns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter, // Use debounced value for internal state consistency
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    // onGlobalFilterChange handled by separate state
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2">

      {/* --- Header & Stats --- */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track your lead campaigns</p>
          </div>
          <Link
            href="/dashboard/campaigns/add"
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all transform hover:scale-[1.02] shadow-sm"
          >
            <Plus size={18} />
            <span>Create Campaign</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Campaigns"
            value={totalRows}
            icon={Rocket}
            color="text-white bg-black"
          />
          <StatCard
            title="Active Campaigns"
            value={campaigns.filter(c => c.status?.toUpperCase() === 'ACTIVE').length}
            icon={PlayCircle}
            color="text-emerald-600 bg-emerald-100"
          />
          <StatCard
            title="Pending Campaigns"
            value={campaigns.filter(c => c.status?.toUpperCase() === 'PENDING').length}
            icon={Clock}
            color="text-blue-600 bg-blue-100"
          />
        </div>
      </div>

      {/* --- Table Container --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Controls */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            All Campaigns
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
              {totalRows}
            </span>
          </h2>
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all shadow-sm group-hover:bg-white"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-28 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="group hover:bg-gray-50/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
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
                        <Search className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No campaigns found</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Try adjusting your search filters or create a new campaign to get started.</p>
                      <Link
                        href="/dashboard/campaigns/add"
                        className="mt-4 text-sm font-medium text-black hover:underline"
                      >
                        + Create New Campaign
                      </Link>
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
              {[10, 20, 30, 50].map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
            <div className="h-4 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            <p className="text-sm text-gray-600 hidden sm:block">
              Showing <span className="font-medium text-gray-900">{(totalRows > 0 ? (pagination.pageIndex * pagination.pageSize) + 1 : 0)}</span> - <span className="font-medium text-gray-900">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)}</span> of <span className="font-medium text-gray-900">{totalRows}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:hover:bg-white disabled:hover:border-gray-200"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:hover:bg-white disabled:hover:border-gray-200"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const ActionMenu = ({ onView, onEdit }: { onView: () => void, onEdit: () => void }) => {
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
        <MenuItem onClick={() => { onEdit(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2 hover:bg-gray-50 py-2">
          <Edit2 size={16} className="text-gray-400" /> Edit Campaign
        </MenuItem>
      </Menu>
    </>
  );
};