"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { API_URL } from '@/utils/apiUrl';
import axiosWrapper from '@/utils/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  VisibilityState,
} from "@tanstack/react-table";
import {
  MoreVertical,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  CreditCard,
  History,
  Trash2,
  RefreshCcw,
  Mail,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users as UsersIcon,
  UserPlus,
  UserCheck
} from "lucide-react";
import { toast } from 'react-toastify';
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Menu, MenuItem, IconButton, Tooltip, Popover, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, Chip } from "@mui/material";
import useDebounce from '@/hooks/useDebounce';

// --- Types ---
type PaymentMethod = {
  customerVaultId: string;
  cardLastFour: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
};

type User = {
  _id: string;
  name: string;
  createdAt: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
  companyName?: string;
  phoneNumber?: string;
  zipCode?: string;
  image?: string;
  balance?: number;
  payment_error?: boolean;
  integrations?: {
    boberdoo?: {
      external_id?: string | null;
      sync_status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'NOT_SYNCED';
      last_sync_at?: string | null;
      last_error?: string | null;
    };
  };
  paymentMethods?: PaymentMethod[];
};

type ApiResponse = {
  data: User[];
  page: number;
  limit: number;
  totalCount?: number;
  total?: number;
  totalPages: number;
};

type SyncBoberdooResponse = {
  message?: string;
  success?: boolean;
  externalId?: string;
  error?: string;
  data?: any;
  alreadySynced?: boolean;
  result?: {
    success?: boolean;
    error?: string;
    externalId?: string;
    data?: {
      response?: {
        result?: string;
        errors?: {
          error?: string | string[];
        };
      };
    };
  };
};

type WebhookResponse = {
  result?: {
    success?: boolean;
    error?: string;
  };
};

type ToggleStatusResponse = {
  message: string;
  success?: boolean;
};

type ResendVerificationResponse = {
  message: string;
  data?: any;
};

// --- Components ---

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isActive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-rose-50 text-rose-700 border-rose-200"
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-600" : "bg-rose-600"}`}></span>
    {isActive ? "Active" : "Inactive"}
  </span>
);

const VerificationBadge = ({ verified }: { verified: boolean }) => {
  if (verified) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 ml-2">
      Unverified
    </span>
  )
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => {

  const isBlack = color.includes('bg-black');

  return (
    <div className={`p-4 sm:p-6 rounded-2xl shadow-sm border flex items-center gap-3 sm:gap-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${isBlack ? "bg-black border-black text-white" : "bg-white border-gray-100"}`}>
      <div className={`p-2 sm:p-3 rounded-xl ${isBlack ? "bg-gray-800 text-white" : color}`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6`} />
      </div>
      <div>
        <p className={`text-xs sm:text-sm font-medium ${isBlack ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
        <h3 className={`text-xl sm:text-2xl font-bold mt-0.5 ${isBlack ? "text-white" : "text-gray-900"}`}>{value}</h3>
      </div>
    </div>
  );
};

// Mobile User Card Component
type MobileUserCardProps = {
  user: User;
  onEdit: () => void;
  onAddBalance: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onResendVerification: () => void;
};

const MobileUserCard = ({ user, onEdit, onAddBalance, onToggleStatus, onDelete, onResendVerification }: MobileUserCardProps) => {
  const defaultCard = user.paymentMethods?.find(pm => pm.isDefault) || user.paymentMethods?.[0];

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative h-10 w-10 min-w-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
          <Image
            src={user.image || "/images/icons/User.svg"}
            alt={user.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            {!user.isEmailVerified && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Unverified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <StatusBadge isActive={user.isActive} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 mb-3">
        <div>
          <p className="text-gray-400">Company</p>
          <p className="font-medium text-gray-700 truncate">{user.companyName || '--'}</p>
        </div>
        <div>
          <p className="text-gray-400">Balance</p>
          <p className={`font-medium ${(user.balance ?? 0) > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
            ${(user.balance ?? 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Card</p>
          <div className="flex items-center gap-1">
            <CardListPopover
              paymentMethods={user.paymentMethods || []}
              trigger={
                <button className="flex items-center gap-1 font-medium text-gray-700 hover:text-black transition-colors">
                  {defaultCard ? `${defaultCard.brand} •${defaultCard.cardLastFour}` : '--'}
                  {user.paymentMethods && user.paymentMethods.length > 1 && (
                    <span className="text-[9px] text-blue-600 font-bold">
                      (+{user.paymentMethods.length - 1})
                    </span>
                  )}
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 py-3 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[36px]"
        >
          <Shield size={14} />
          Edit
        </button>
        <button
          onClick={onAddBalance}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors min-h-[36px]"
        >
          <CreditCard size={14} />
          Balance
        </button>
        <button
          onClick={onToggleStatus}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors min-h-[36px] ${user.isActive
            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
            }`}
        >
          {user.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
          {user.isActive ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-2">
        {!user.isEmailVerified && (
          <button
            onClick={onResendVerification}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors min-h-[36px]"
          >
            <Mail size={14} />
            Verify
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[36px]"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Date */}
      <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState<number>(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const isFilterOpen = Boolean(filterAnchorEl);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();

  const fetchUsers = useCallback(
    async (pageNumber: number, pageSize: number, search?: string, status: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL') => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
          isEmailVerified: 'true'
        });

        if (search) {
          params.append('search', search);
        }

        if (status !== 'ALL') {
          params.append('isActive', status === 'ACTIVE' ? 'true' : 'false');
        }

        const response = (await axiosWrapper(
          "get",
          `${API_URL.GET_ALL_USERS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        setUsers(response.data || []);
        setTotalRows(response.totalCount || response.total || 0);
      }
      catch (err) {
        console.error("Unable to get users:", err);
        setError("Failed to fetch users");
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
      fetchUsers(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter, statusFilter);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter, statusFilter, fetchUsers]);


  const handleToggleUser = async (row: User) => {
    const toastId = toast.loading("Updating user status...");
    try {
      const url = API_URL.TOGGLE_USER_STATUS_BY_ID.replace(":userId", row._id);
      const response = await axiosWrapper("patch", url, {}, token ?? undefined) as ToggleStatusResponse;
      toast.update(toastId, { render: response?.message || "Status updated", type: "success", isLoading: false, autoClose: 2500 });
      fetchUsers(pagination.pageIndex + 1, pagination.pageSize, globalFilter, statusFilter);
    } catch (err: any) {
      toast.update(toastId, { render: err?.message || "Failed to update user status", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handleResendVerificationEmail = async (row: User) => {
    const toastId = toast.loading(`Sending verification email to ${row.email}...`);
    try {
      const response = await axiosWrapper("post", API_URL.RESEND_VERIFICATION_EMAIL, { userId: row._id }, token ?? undefined) as ResendVerificationResponse;
      toast.update(toastId, { render: response?.message || "Verification email sent successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err: any) {
      toast.update(toastId, { render: err?.message || "Failed to send verification email", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const url = API_URL.DELETE_USER_BY_ID.replace(':userId', selectedUser._id);
      await axiosWrapper('delete', url, {}, token ?? undefined);
      toast.success(`${selectedUser.name} deleted successfully`);
      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSyncBoberdoo = async (row: User) => {
    const toastId = toast.loading(`Syncing ${row.name} to Boberdoo...`);
    try {
      const url = API_URL.SYNC_BOMBERDO.replace(':userId', row._id);
      const response = await axiosWrapper('post', url, {}, token ?? undefined) as SyncBoberdooResponse;

      let errorMessage: string | null = null;
      if (response?.result?.data?.response?.errors?.error) {
        const errors = response.result.data.response.errors.error;
        errorMessage = Array.isArray(errors) ? errors.join('; ') : String(errors);
      }
      if (!errorMessage && response?.result?.error) errorMessage = response.result.error;
      if (response?.result?.success === false || errorMessage) throw new Error(errorMessage || response?.message || 'Sync failed');
      if (response?.success === false) throw new Error(response?.error || response?.message || 'Sync failed');

      if (response?.alreadySynced) {
        toast.update(toastId, { render: '✓ User is already synced to Boberdoo', type: 'info', isLoading: false, autoClose: 3000 });
        return;
      }

      if (response?.result?.externalId || response?.externalId) {
        toast.update(toastId, { render: response?.message || '✓ User synced to Boberdoo successfully!', type: 'success', isLoading: false, autoClose: 3000 });
        fetchUsers(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter, statusFilter);
        return;
      }

      toast.update(toastId, { render: response?.message || 'Sync completed with unknown status', type: 'warning', isLoading: false, autoClose: 3000 });
      fetchUsers(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter, statusFilter);

    } catch (err: any) {
      let errorMessage = 'Failed to sync user to Boberdoo';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.result?.data?.response?.errors?.error) {
        const errors = err.response.data.result.data.response.errors.error;
        errorMessage = Array.isArray(errors) ? errors.join('; ') : String(errors);
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      toast.update(toastId, {
        render: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Failed to sync to Boberdoo</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{errorMessage}</div>
          </div>
        ),
        type: 'error',
        isLoading: false,
        autoClose: 7000,
      });
    }
  };

  const handleSendTopUpWebhook = async (row: User) => {
    const toastId = toast.loading(`Sending webhook for ${row.email}...`);
    try {
      const url = API_URL.SEND_BALANCE_TOPUP_WEBHOOK.replace(':userId', row._id);
      const response = await axiosWrapper('post', url, {}, token ?? undefined) as WebhookResponse;
      if (!response?.result?.success) throw new Error(response?.result?.error || "Webhook failed");
      toast.update(toastId, { render: 'Webhook sent successfully', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err: any) {
      toast.update(toastId, { render: err.message || "Webhook failed", type: 'error', isLoading: false, autoClose: 5000 });
    }
  };


  // --- Table Setup ---

  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "User Profile",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 min-w-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
            <Image
              src={row.original.image || "/images/icons/User.svg"}
              alt={row.original.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{row.original.name}</span>
            <div className="flex items-center">
              <span className="text-xs text-gray-500">{row.original.email}</span>
              <VerificationBadge verified={row.original.isEmailVerified} />
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "integrations.boberdoo.external_id",
      header: "Partner ID",
      cell: ({ row }) => {
        const partnerId = row.original.integrations?.boberdoo?.external_id;
        return (
          <span className={`text-sm font-medium ${partnerId ? "text-gray-900" : "text-gray-400 italic"}`}>
            {partnerId || "--"}
          </span>
        );
      },
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => <span className="text-sm text-gray-700 font-medium">{row.original.companyName || "—"}</span>,
    },
    // --- NEW: Default Card Column ---
    {
      id: "defaultCard",
      header: "Payment Methods",
      cell: ({ row }) => {
        const paymentMethods = row.original.paymentMethods || [];
        const defaultCard = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];

        if (!defaultCard) {
          return <span className="text-xs text-gray-400 italic">No card linked</span>;
        }

        const otherCardsCount = paymentMethods.length - 1;

        return (
          <CardListPopover
            paymentMethods={paymentMethods}
            trigger={
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="p-1.5 bg-gray-50 rounded border border-gray-100 group-hover:bg-gray-100 transition-colors">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 uppercase">{defaultCard.brand}</span>
                    {otherCardsCount > 0 && (
                      <span className="px-1 py-0.5 bg-blue-50 text-[9px] font-bold text-blue-600 rounded border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        +{otherCardsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">•••• {defaultCard.cardLastFour}</span>
                </div>
              </div>
            }
          />
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {new Date(row.original.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => <StatusBadge isActive={row.original.isActive} />,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <span className={`text-sm font-semibold ${(row.original.balance ?? 0) > 0 ? "text-gray-900" : "text-gray-400"
          }`}>
          ${(row.original.balance ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <ActionMenu
            user={user}
            onEdit={() => router.push(`/admin/user-management/user/${user._id}/edit`)}
            onAddBalance={() => router.push(`/admin/user-management/user/${user._id}/addBalance`)}
            onAddCampaign={() => router.push(`/admin/campaigns/user/${user._id}/add`)}
            onDelete={() => { setSelectedUser(user); setConfirmOpen(true); }}
            onResendVerification={() => handleResendVerificationEmail(user)}
            onSyncBoberdoo={() => handleSyncBoberdoo(user)}
            onToggleStatus={() => handleToggleUser(user)}
            onSendWebhook={() => handleSendTopUpWebhook(user)}
          />
        )
      }
    }
  ], [router]);


  const table = useReactTable({
    data: users,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* --- Header Section --- */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={totalRows}
          icon={UsersIcon}
          color="text-white bg-black"
        />
        <StatCard
          title="Active Users"
          value={users.filter(u => u.isActive).length}
          icon={UserCheck}
          color="text-emerald-600 bg-emerald-100"
        />
        <div className="bg-gradient-to-br from-black to-gray-800 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push('/admin/user-management/user/add')}>
          <div className="z-10">
            <p className="text-gray-300 text-sm font-medium">Quick Action</p>
            <h3 className="text-2xl font-bold mt-1">Add New User</h3>
          </div>
          <div className="z-10 mt-4 flex items-center text-sm font-medium text-gray-200 group-hover:text-white group-hover:translate-x-1 transition-all">
            Create Account <ChevronRight size={16} className="ml-1" />
          </div>
          <UserPlus className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white opacity-5 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* --- Mobile Cards View --- */}
      <div className="md:hidden space-y-3">
        {/* Mobile Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all shadow-sm"
          />
        </div>

        {/* Mobile Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'INACTIVE', label: 'Inactive' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === tab.id
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg">{totalRows}</span>
        </div>

        {/* User Cards */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-gray-100 rounded"></div>
                  <div className="h-3 w-40 bg-gray-100 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="h-8 bg-gray-100 rounded"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))
        ) : users.length ? (
          users.map(user => (
            <MobileUserCard
              key={user._id}
              user={user}
              onEdit={() => router.push(`/admin/user-management/user/${user._id}/edit`)}
              onAddBalance={() => router.push(`/admin/user-management/user/${user._id}/addBalance`)}
              onToggleStatus={() => handleToggleUser(user)}
              onDelete={() => { setSelectedUser(user); setConfirmOpen(true); }}
              onResendVerification={() => handleResendVerificationEmail(user)}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <UsersIcon className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">No users found</p>
            <p className="text-sm text-gray-500">Try adjusting filters</p>
          </div>
        )}

        {/* Mobile Pagination */}
        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-sm mt-3">
            <p className="text-xs text-gray-600">
              {totalRows > 0 ? (pagination.pageIndex * pagination.pageSize) + 1 : 0}-{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)} of {totalRows}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                {pagination.pageIndex + 1}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Desktop Table Container --- */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Controls Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">User List</h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all"
              />
            </div>
            <button
              onClick={handleFilterClick}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${isFilterOpen || statusFilter !== 'ALL'
                ? 'bg-black text-white border-black shadow-sm ring-2 ring-black/10'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              title="Filter"
            >
              <Filter size={16} className={statusFilter !== 'ALL' ? 'fill-current' : ''} />
              <span className="text-sm font-medium hidden sm:inline">
                {statusFilter !== 'ALL' ? 'Filter: Active' : 'Filter'}
              </span>
              {statusFilter !== 'ALL' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">1</span>
              )}
            </button>
            <Menu
              anchorEl={filterAnchorEl}
              open={isFilterOpen}
              onClose={handleFilterClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: { width: 200, mt: 1, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
              }}
            >
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Filter by Status
              </div>
              <MenuItem onClick={() => { setStatusFilter('ALL'); handleFilterClose(); }} selected={statusFilter === 'ALL'} className="text-sm">
                All Users
              </MenuItem>
              <MenuItem onClick={() => { setStatusFilter('ACTIVE'); handleFilterClose(); }} selected={statusFilter === 'ACTIVE'} className="text-sm">
                Active Only
              </MenuItem>
              <MenuItem onClick={() => { setStatusFilter('INACTIVE'); handleFilterClose(); }} selected={statusFilter === 'INACTIVE'} className="text-sm">
                Inactive Only
              </MenuItem>
            </Menu>
          </div>
        </div>

        {/* Content */}
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
                // Skeleton Loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-blue-50/30 transition-colors"
                  >
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
                      <p className="text-lg font-medium text-gray-900">No users found</p>
                      <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                        We couldn't find any users matching your search. Try different keywords.
                      </p>
                      <button
                        onClick={() => setGlobalFilter("")}
                        className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Rows per page
              </span>
              <select
                value={pagination.pageSize}
                onChange={e => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="block w-20 py-1.5 px-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-lg border bg-gray-50"
              >
                {[10, 20, 30, 40, 50].map(pageSize => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <div className="h-4 w-px bg-gray-200 mx-2"></div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{(totalRows > 0 ? (pagination.pageIndex * pagination.pageSize) + 1 : 0)}</span> - <span className="font-medium text-gray-900">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)}</span> of <span className="font-medium text-gray-900">{totalRows}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Advanced Pagination Logic */}
                {(() => {
                  const pageCount = table.getPageCount();
                  const current = pagination.pageIndex;
                  const maxButtons = 5;
                  let start = Math.max(0, current - 2);
                  let end = Math.min(pageCount, start + maxButtons);

                  if (end - start < maxButtons) {
                    start = Math.max(0, end - maxButtons);
                  }

                  const pages: number[] = [];
                  for (let i = start; i < end; i++) {
                    pages.push(i);
                  }

                  return pages.map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => table.setPageIndex(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${pagination.pageIndex === pageNum
                        ? 'z-10 bg-black text-white border-black hover:bg-gray-800'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum + 1}
                    </button>
                  ));
                })()}

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete User Account"
        message={`Are you sure you want to delete ${selectedUser?.name || "this user"
          }? This will also remove their campaigns and related data.`}
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}


// Sub-component for Card List Popover
const CardListPopover = ({
  paymentMethods,
  trigger
}: {
  paymentMethods: PaymentMethod[];
  trigger: React.ReactNode
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event: React.MouseEvent<HTMLElement> | {}) => {
    if (event && 'stopPropagation' in event) event.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <div onClick={handleClick}>
        {trigger}
      </div>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: 280,
            mt: 1,
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            border: '1px solid #f3f4f6',
            overflow: 'hidden'
          }
        }}
      >
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <Typography className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <CreditCard size={14} /> Registered Cards
          </Typography>
        </div>
        <List className="py-0">
          {paymentMethods.map((pm, index) => (
            <div key={index}>
              <ListItem className="py-3 px-4 hover:bg-gray-50 transition-colors">
                <ListItemIcon className="min-w-[40px]">
                  <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 uppercase">{pm.brand}</span>
                      {pm.isDefault && (
                        <Chip label="Default" size="small" className="h-4 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100" />
                      )}
                    </div>
                  }
                  secondary={
                    <span className="text-xs text-gray-500 font-medium tracking-wider">•••• •••• •••• {pm.cardLastFour}</span>
                  }
                />
              </ListItem>
              {index < paymentMethods.length - 1 && <Divider className="opacity-50" />}
            </div>
          ))}
        </List>
      </Popover>
    </>
  );
};

// Sub-component for Menu to keep cleaner
const ActionMenu = ({
  user,
  onEdit,
  onAddBalance,
  onAddCampaign,
  onDelete,
  onResendVerification,
  onSyncBoberdoo,
  onToggleStatus,
  onSendWebhook
}: {
  user: User;
  onEdit: () => void;
  onAddBalance: () => void;
  onAddCampaign: () => void;
  onDelete: () => void;
  onResendVerification: () => void;
  onSyncBoberdoo: () => void;
  onToggleStatus: () => void;
  onSendWebhook: () => void;
}) => {
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
        <IconButton
          onClick={handleClick}
          size="small"
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        >
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
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            borderRadius: '12px',
            border: '1px solid #f3f4f6'
          },
        }}
      >
        <MenuItem onClick={() => { onAddBalance(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <CreditCard size={16} /> Add Balance
        </MenuItem>
        <MenuItem onClick={() => { onEdit(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <CheckCircle2 size={16} /> Edit Account
        </MenuItem>
        <MenuItem onClick={() => { onAddCampaign(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <Shield size={16} /> Add Campaign
        </MenuItem>

        {!user.isEmailVerified && (
          <MenuItem onClick={() => { onResendVerification(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
            <Mail size={16} /> Resend Verification
          </MenuItem>
        )}

        {!user.integrations?.boberdoo?.external_id && (
          <MenuItem onClick={() => { onSyncBoberdoo(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
            <RefreshCcw size={16} /> Sync to Boberdoo
          </MenuItem>
        )}

        <MenuItem onClick={() => { onToggleStatus(); handleClose(); }} disableRipple className={`text-sm font-medium gap-2 ${user.isActive ? 'text-amber-600' : 'text-green-600'}`}>
          {user.isActive ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {user.isActive ? "Deactivate User" : "Activate User"}
        </MenuItem>

        {/* <MenuItem onClick={() => { onDelete(); handleClose(); }} disableRipple className="text-sm font-medium text-red-600 gap-2">
          <Trash2 size={16} /> Delete User
        </MenuItem> */}
      </Menu>
    </>
  );
};
