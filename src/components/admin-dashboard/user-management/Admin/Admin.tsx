"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { API_URL } from '@/utils/apiUrl';
import axiosWrapper from '@/utils/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Image from 'next/image';
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
} from "@tanstack/react-table";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  MoreHorizontal,
  Trash2,
  Edit2
} from "lucide-react";
import { toast } from 'react-toastify';
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Menu, MenuItem, IconButton } from "@mui/material";
import { getErrorMessage } from '@/utils/getErrorMessage';
import useDebounce from '@/hooks/useDebounce';

// --- Types ---
type User = {
  _id: string;
  name: string;
  createdAt: string;
  email: string;
  isActive: boolean;
  companyName?: string;
  phoneNumber?: string;
  zipCode?: string;
  image?: string;
};

type ApiResponse = {
  data: User[];
  page: number;
  limit: number;
  totalCount?: number;
  total?: number;
  totalPages: number;
  message?: string;
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

// Mobile Admin Card Component
const MobileAdminCard = ({
  admin,
  onEdit,
  onDelete
}: {
  admin: User;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative h-10 w-10 min-w-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
          <Image
            src={admin.image || "/images/icons/User.svg"}
            alt={admin.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{admin.name}</p>
          <p className="text-xs text-gray-500 truncate">{admin.email}</p>
        </div>
        <StatusBadge isActive={admin.isActive} />
      </div>

      {/* Info */}
      <div className="text-[10px] text-gray-500 mb-3">
        <p className="text-gray-400">Joined</p>
        <p className="font-medium text-gray-700">
          {new Date(admin.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 py-3 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-h-[36px]"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[36px]"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default function AdminTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination State
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState<number>(0);

  // Sorting & Filtering State
  // Sorting & Filtering State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();

  const fetchUsers = useCallback(
    async (pageNumber: number, pageSize: number, search?: string) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
        });

        if (search) {
          params.append('search', search);
        }

        const response = (await axiosWrapper(
          "get",
          `${API_URL.GET_ALL_ADMINS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        const fetchedUsers = Array.isArray(response.data) ? response.data : [];
        setUsers(fetchedUsers);
        setTotalRows(response.totalCount || response.total || 0);
      }
      catch (err) {
        console.error("Unable to get admins:", err);
        setError("Failed to fetch admins");
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
      fetchUsers(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter, fetchUsers]);

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const url = API_URL.DELETE_ADMIN_BY_ID.replace(':adminId', selectedUser._id);
      await axiosWrapper('delete', url, {}, token ?? undefined);
      toast.success(`${selectedUser.name} deleted successfully`);
      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
      setTotalRows(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete admin:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Admin Profile",
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
            <span className="text-xs text-gray-500">{row.original.email}</span>
          </div>
        </div>
      ),
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
            hour: '2-digit',
            minute: '2-digit'
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
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <ActionMenu
            user={user}
            onEdit={() => router.push(`/admin/user-management/admin/${user._id}/edit`)}
            onDelete={() => { setSelectedUser(user); setConfirmOpen(true); }}
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

      {/* --- Stats Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Admins"
          value={totalRows}
          icon={ShieldCheck}
          color="text-white bg-black"
        />
        <StatCard
          title="Active Admins"
          value={Array.isArray(users) ? users.filter(u => u.isActive).length : 0}
          icon={ShieldCheck}
          color="text-emerald-600 bg-emerald-100"
        />
        {/* Quick Action - Add Admin */}
        <div className="bg-gradient-to-br from-black to-gray-800 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push('/admin/user-management/admin/add')}>
          <div className="z-10">
            <p className="text-gray-300 text-sm font-medium">Quick Action</p>
            <h3 className="text-2xl font-bold mt-1">Add New Admin</h3>
          </div>
          <div className="z-10 mt-4 flex items-center text-sm font-medium text-gray-200 group-hover:text-white group-hover:translate-x-1 transition-all">
            Create Admin <ChevronRight size={16} className="ml-1" />
          </div>
          <UserCog className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white opacity-5 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* --- Mobile Cards View --- */}
      <div className="md:hidden space-y-3">
        {/* Mobile Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search admins..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all shadow-sm"
          />
        </div>

        {/* Admin Cards */}
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
            </div>
          ))
        ) : users.length ? (
          users.map(admin => (
            <MobileAdminCard
              key={admin._id}
              admin={admin}
              onEdit={() => router.push(`/admin/user-management/admin/${admin._id}/edit`)}
              onDelete={() => { setSelectedUser(admin); setConfirmOpen(true); }}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
            <UserCog className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">No admins found</p>
            <p className="text-sm text-gray-500">Try a different search</p>
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

        {/* Controls */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Admin List</h2>
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
            <input
              type="text"
              placeholder="Search admins..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all"
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
                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
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
                      <p className="text-lg font-medium text-gray-900">No admins found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Reuse logic */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">Rows per page</span>
            <select
              value={pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="block w-20 py-1.5 px-2 text-sm border-gray-300 rounded-lg border bg-gray-50 focus:outline-none focus:ring-black"
            >
              {[10, 20, 30].map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
            <div className="h-4 w-px bg-gray-200 mx-2"></div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{(totalRows > 0 ? (pagination.pageIndex * pagination.pageSize) + 1 : 0)}</span> - <span className="font-medium text-gray-900">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)}</span> of <span className="font-medium text-gray-900">{totalRows}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Admin"
        message={`Are you sure you want to delete ${selectedUser?.name}?`}
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}


const ActionMenu = ({ user, onEdit, onDelete }: { user: User, onEdit: () => void, onDelete: () => void }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={handleClick} size="small" className="text-gray-400 hover:text-gray-600">
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
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
            mt: 1,
            borderRadius: '12px',
            border: '1px solid #f3f4f6'
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { onEdit(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
          <Edit2 size={16} /> Edit Admin
        </MenuItem>
        <MenuItem onClick={() => { onDelete(); handleClose(); }} disableRipple className="text-sm font-medium text-red-600 gap-2">
          <Trash2 size={16} /> Delete Admin
        </MenuItem>
      </Menu>
    </>
  );
};
