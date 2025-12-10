"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { LEADS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography
} from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Phone,
  Undo2,
  Info,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter
} from "lucide-react";
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Menu, MenuItem, IconButton, Popover } from "@mui/material";

type ReturnLead = {
  _id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_number?: string;
  address: {
    street: string;
    city: string;
    state: {
      abbreviation: string;
      _id: string;
      name: string;
    } | any;
    zip_code: string;
  };
  campaign_id: {
    _id: string;
    name: string;
    lead_type: string;
  } | string;
  note: string;
  return_reason?: string;
  return_comments?: string;
  return_status: string;
  return_attempts?: number;
  returned_by?: {
    _id: string;
    name: string;
  } | string;
  createdAt: string;
  updatedAt: string;
  returned_at?: string;
  max_return_attempts?: number;
};

type ApiResponse = {
  data: ReturnLead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

const RETURN_REASON_LABELS: { [key: string]: string } = {
  'invalid_contact': 'Invalid Contact',
  'duplicate': 'Duplicate Lead',
  'not_interested': 'Not Interested',
  'wrong_location': 'Wrong Location',
  'poor_quality': 'Poor Quality',
  'other': 'Other',
};

// --- Styling Helpers ---
const StatusBadge = ({ status }: { status: string }) => {
  let colorClass = "bg-gray-100 text-gray-600 border-gray-200";

  if (status === 'Pending') colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  else if (status === 'Approved') colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  else if (status === 'Rejected') colorClass = "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize whitespace-nowrap ${colorClass}`}>
      {status}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, active }: { title: string, value: string | number, icon: any, color: string, subtext?: string, onClick?: () => void, active?: boolean }) => {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-all duration-200 cursor-pointer 
      ${active ? 'ring-2 ring-black shadow-md scale-[1.01]' : 'hover:scale-[1.01] hover:shadow-md bg-white border-gray-100'}`}
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className={`w-6 h-6`} />
      </div>
      <div>
        <p className={`text-sm font-medium text-gray-500`}>{title}</p>
        <h3 className={`text-2xl font-bold mt-0.5 text-gray-900`}>{value}</h3>
        {subtext && <p className={`text-xs mt-1 text-gray-400`}>{subtext}</p>}
      </div>
    </div>
  );
};

export default function ReturnLeadsTable() {
  const [returnLeads, setReturnLeads] = useState<ReturnLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filter State
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Dialogs
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<ReturnLead | null>(null);
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; lead: ReturnLead | null }>({ open: false, lead: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; lead: ReturnLead | null }>({ open: false, lead: null });

  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchReturnLeads = useCallback(
    async (pageNumber: number, pageSize: number) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: (pageNumber + 1).toString(),
          limit: pageSize.toString(),
          ...(statusFilter && { status: statusFilter }),
        });

        const response = (await axiosWrapper(
          "get",
          `${LEADS_API.GET_RETURN_LEADS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        setReturnLeads(response.data || []);
        setTotalRows(response.meta?.total || 0);
      } catch (err) {
        console.error("Failed to fetch return leads:", err);
        setError("Failed to fetch return leads");
      } finally {
        setLoading(false);
      }
    },
    [token, statusFilter]
  );

  useEffect(() => {
    if (token) {
      fetchReturnLeads(pagination.pageIndex, pagination.pageSize);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, statusFilter, fetchReturnLeads]);


  // Actions
  const handleApprove = (row: ReturnLead) => setApproveDialog({ open: true, lead: row });
  const handleReject = (row: ReturnLead) => setRejectDialog({ open: true, lead: row });
  const handleViewDetails = (row: ReturnLead) => {
    setSelectedLeadDetail(row);
    setDetailDialogOpen(true);
  };

  const confirmApprove = async () => {
    if (!approveDialog.lead) return;
    try {
      await axiosWrapper("patch", LEADS_API.APPROVE_RETURN_LEAD, { lead_id: approveDialog.lead._id, return_status: 'Approved' }, token ?? undefined);
      toast.success("Return approved");
      setApproveDialog({ open: false, lead: null });
      fetchReturnLeads(pagination.pageIndex, pagination.pageSize);
    } catch (err: any) { toast.error(err?.message || "Failed to approve return"); }
  };

  const confirmReject = async () => {
    if (!rejectDialog.lead) return;
    try {
      await axiosWrapper("patch", LEADS_API.REJECT_RETURN_LEAD, { lead_id: rejectDialog.lead._id, return_status: 'Rejected' }, token ?? undefined);
      toast.success("Return rejected");
      setRejectDialog({ open: false, lead: null });
      fetchReturnLeads(pagination.pageIndex, pagination.pageSize);
    } catch (err: any) { toast.error(err?.message || "Failed to reject return"); }
  };


  const columns: ColumnDef<ReturnLead>[] = useMemo(() => [
    {
      accessorKey: "lead_id",
      header: "Lead Info",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{row.original.lead_id}</span>
          <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-1">
            <span className="truncate max-w-[120px]">{typeof row.original.campaign_id === 'object' ? row.original.campaign_id.name : ''}</span>
          </div>
        </div>
      ),
      size: 140
    },
    {
      accessorKey: "first_name",
      header: "Lead Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{row.original.first_name} {row.original.last_name}</span>
          <span className="text-xs text-gray-500">{row.original.email}</span>
        </div>
      ),
      size: 180
    },
    {
      accessorKey: "return_reason",
      header: "Return Reason",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
            {RETURN_REASON_LABELS[row.original.return_reason || ''] || row.original.return_reason || 'N/A'}
          </span>
          {row.original.return_comments && (
            <button
              onClick={() => handleViewDetails(row.original)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
              title="View Comments"
            >
              <Info size={16} className="text-blue-500" />
            </button>
          )}
        </div>
      ),
      size: 160
    },
    {
      header: "Requested",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </span>
      ),
      size: 120
    },
    {
      accessorKey: "return_status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.return_status} />,
      size: 120
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionMenu
          lead={row.original}
          onApprove={() => handleApprove(row.original)}
          onReject={() => handleReject(row.original)}
          onViewDetails={() => handleViewDetails(row.original)}
        />
      ),
      size: 60
    }
  ], []);

  const table = useReactTable({
    data: returnLeads,
    columns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Requests"
          value={totalRows}
          subtext="All Return Requests"
          icon={Undo2}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          title="Pending Review"
          value={returnLeads.filter(l => l.return_status === 'Pending').length}
          subtext="On this page"
          icon={AlertCircle}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Return Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage lead return requests.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${Boolean(filterAnchorEl) || statusFilter
              ? "bg-black text-white border-black shadow-md"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium hidden sm:inline">Filters</span>
            {statusFilter && (
              <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {table.getHeaderGroups().map(headerGroup => (
                  headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: header.column.getSize() }}>
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
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group hover:bg-gray-50/80 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-24 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Undo2 className="h-12 w-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium text-gray-900">No return requests</p>
                      <p className="text-sm text-gray-500">All caught up!</p>
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
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { p: 0, width: 280, borderRadius: '16px' } }}
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Filter Returns</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border-gray-200 text-sm"
            >
              <option value="">All Statuses</option>
              {["Pending", "Approved", "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => { setStatusFilter(""); setFilterAnchorEl(null); }}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={() => { setFilterAnchorEl(null); }}
            className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </Popover>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={approveDialog.open}
        title="Approve Return Request"
        message={`Are you sure you want to approve the return request for ${approveDialog.lead?.first_name}?`}
        onConfirm={confirmApprove}
        onCancel={() => setApproveDialog({ open: false, lead: null })}
      />
      <ConfirmDialog
        open={rejectDialog.open}
        title="Reject Return Request"
        message={`Are you sure you want to reject the return request for ${rejectDialog.lead?.first_name}?`}
        onConfirm={confirmReject}
        onCancel={() => setRejectDialog({ open: false, lead: null })}
      />

      {/* Return Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #E5E7EB', padding: '20px 24px' }}>
          <h3 className="text-lg font-semibold text-gray-900">Return Request Details</h3>
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          {selectedLeadDetail && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lead Information</h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-400 block">Lead ID</span>
                    <span className="text-sm font-medium text-gray-900">{selectedLeadDetail.lead_id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Name</span>
                    <span className="text-sm font-medium text-gray-900">{selectedLeadDetail.first_name} {selectedLeadDetail.last_name}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Return Information</h4>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-3">
                  <div>
                    <span className="text-xs text-amber-600 block font-medium">Return Reason</span>
                    <span className="text-sm font-medium text-amber-900">
                      {RETURN_REASON_LABELS[selectedLeadDetail.return_reason || ''] || selectedLeadDetail.return_reason || 'N/A'}
                    </span>
                  </div>
                  {selectedLeadDetail.return_comments && (
                    <div>
                      <span className="text-xs text-amber-600 block font-medium">Comments</span>
                      <p className="text-sm text-amber-800 mt-1 bg-white/50 p-2 rounded border border-amber-100">
                        {selectedLeadDetail.return_comments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
          <Button onClick={() => setDetailDialogOpen(false)} variant="outlined" color="inherit" sx={{ borderRadius: '8px', textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const ActionMenu = ({ lead, onApprove, onReject, onViewDetails }: { lead: ReturnLead, onApprove: () => void, onReject: () => void, onViewDetails: () => void }) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <div className="text-right">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" className="text-gray-400 hover:text-gray-600 hover:bg-gray-50">
          <MoreHorizontal className="h-5 w-5" />
        </IconButton>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          elevation: 0,
          sx: {
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
            mt: 0.5,
            borderRadius: '12px',
            border: '1px solid #f3f4f6'
          },
        }}
      >
        <MenuItem onClick={() => { router.push(`/admin/leads/${lead._id}`); setAnchorEl(null); }} className="text-sm">View Lead</MenuItem>

        {lead.return_comments && (
          <MenuItem onClick={() => { onViewDetails(); setAnchorEl(null); }} className="text-sm">View Request Details</MenuItem>
        )}

        <MenuItem onClick={() => { onApprove(); setAnchorEl(null); }} className="text-sm text-green-600">Approve Return</MenuItem>
        <MenuItem onClick={() => { onReject(); setAnchorEl(null); }} className="text-sm text-red-600">Reject Return</MenuItem>
      </Menu>
    </>
  )
}
