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
    UserX,
    UserPlus,
    Mail,
    MoreHorizontal,
    Trash2,
    RefreshCcw,
    CheckCircle2,
    ShieldAlert,
    Check
} from "lucide-react";
import { toast } from 'react-toastify';
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Menu, MenuItem, IconButton } from "@mui/material";
import { getErrorMessage } from "@/utils/getErrorMessage";
import useDebounce from '@/hooks/useDebounce';

// --- Types (Reusing User type structure) ---
type User = {
    _id: string;
    name: string;
    createdAt: string;
    email: string;
    isActive: boolean;
    isEmailVerified: boolean; // Crucial for this table
    companyName?: string;
    phoneNumber?: string;
    image?: string;
    balance?: number;
};

type ApiResponse = {
    data: User[];
    page: number;
    limit: number;
    totalCount?: number;
    total?: number;
    totalPages: number;
};

// --- Components ---

const UnverifiedBadge = () => (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <ShieldAlert size={12} className="mr-1" />
        Unverified
    </span>
);

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

export default function UnverifiedUsersTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Pagination State
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [totalRows, setTotalRows] = useState<number>(0);

    // Sorting & Filtering State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const debouncedGlobalFilter = useDebounce(globalFilter, 300);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const token = useSelector((state: RootState) => state.auth.token);
    const router = useRouter();

    // --- API Actions ---

    const fetchUnverifiedUsers = useCallback(
        async (pageNumber: number, pageSize: number, search?: string) => {
            try {
                setLoading(true);

                const params = new URLSearchParams({
                    page: pageNumber.toString(),
                    limit: pageSize.toString(),
                    isEmailVerified: 'false' // Request server to filter
                });

                if (search) {
                    params.append('search', search);
                }

                const url = `${API_URL.GET_ALL_USERS}?${params.toString()}`;
                const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as ApiResponse;

                // Trust backend to filter by isEmailVerified=false as requested in params
                setUsers(response.data || []);

                setTotalRows(response.totalCount || response.total || 0);

            } catch (err) {
                console.error("Unable to get unverified users:", err);
                toast.error("Failed to fetch unverified users");
            } finally {
                setLoading(false);
            }
        },
        [token]
    );

    // Reset pagination when search changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [debouncedGlobalFilter]);

    // Fetch Data
    useEffect(() => {
        if (token) {
            fetchUnverifiedUsers(pagination.pageIndex + 1, pagination.pageSize, debouncedGlobalFilter);
        }
    }, [token, pagination.pageIndex, pagination.pageSize, debouncedGlobalFilter, fetchUnverifiedUsers]);


    const handleResendVerification = async (row: User) => {
        const toastId = toast.loading(`Sending email to ${row.email}...`);
        try {
            await axiosWrapper("post", API_URL.RESEND_VERIFICATION_EMAIL, { userId: row._id }, token ?? undefined);
            toast.update(toastId, { render: "Verification email sent!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err: any) {
            toast.update(toastId, { render: getErrorMessage(err), type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    const confirmDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            setLoading(true);
            const url = API_URL.DELETE_USER_BY_ID.replace(':userId', selectedUser._id);
            await axiosWrapper('delete', url, {}, token ?? undefined);
            toast.success(`${selectedUser.name} rejected successfully`);
            setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
            setTotalRows(prev => Math.max(0, prev - 1));
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
            setConfirmOpen(false);
            setSelectedUser(null);
        }
    };

    const handleApproveUser = async (user: User) => {
        const toastId = toast.loading(`Approving ${user.name}...`);
        try {
            const url = API_URL.VERIFY_EMAIL_BY_ADMIN.replace(':userId', user._id);
            const response = await axiosWrapper('post', url, {}, token ?? undefined) as { message: string };
            toast.update(toastId, { render: response?.message || "User approved successfully", type: "success", isLoading: false, autoClose: 3000 });
            // Remove from list since it's no longer unverified
            setUsers((prev) => prev.filter((u) => u._id !== user._id));
            setTotalRows(prev => Math.max(0, prev - 1));
        } catch (err: any) {
            toast.update(toastId, { render: getErrorMessage(err), type: "error", isLoading: false, autoClose: 3000 });
        }
    };


    // --- Table Setup ---

    const columns: ColumnDef<User>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "User Profile",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 min-w-10 rounded-full overflow-hidden border border-amber-100 shadow-sm">
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
            id: "status",
            header: "Status",
            cell: () => <UnverifiedBadge />
        },
        {
            accessorKey: "companyName",
            header: "Company",
            cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.companyName || "—"}</span>,
        },
        {
            accessorKey: "createdAt",
            header: "Joined",
            cell: ({ row }) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.original.createdAt).toLocaleDateString()}
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
                        onResend={() => handleResendVerification(user)}
                        onApprove={() => handleApproveUser(user)}
                        // Reuse edit route from main user/admin? Assuming yes.
                        onEdit={() => router.push(`/admin/user-management/user/${user._id}/edit`)}
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

            {/* Stats for Unverified */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Unverified Users"
                    value={totalRows}
                    icon={UserX}
                    color="text-amber-600 bg-amber-100"
                />
                {/* Could add more specific stats here if available */}
                <div className="md:col-span-2 bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col justify-center">
                    <h4 className="text-lg font-bold text-gray-900">Need to Verify?</h4>
                    <p className="text-sm text-gray-500 mt-1">
                        These users signed up but haven't verified their email. Resend verification emails or remove spam accounts to keep your database clean.
                    </p>
                </div>
            </div>


            {/* --- Table Container --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Controls */}
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Unverified Queue</h2>
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
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
                                        <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="group hover:bg-amber-50/30 transition-colors">
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
                                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">All Clear!</p>
                                            <p className="text-sm text-gray-500 mt-1">No unverified users found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Reuse */}
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
                title="Reject User"
                message={`Are you sure you want to reject ${selectedUser?.name}? This action cannot be undone.`}
                onConfirm={confirmDeleteUser}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}


const ActionMenu = ({ onResend, onEdit, onDelete, onApprove }: { onResend: () => void, onEdit: () => void, onDelete: () => void, onApprove: () => void }) => {
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
                <MenuItem onClick={() => { onApprove(); handleClose(); }} disableRipple className="text-sm font-medium text-emerald-600 gap-2">
                    <Check size={16} /> Approve User
                </MenuItem>
                <MenuItem onClick={() => { onResend(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
                    <Mail size={16} /> Resend Verification
                </MenuItem>
                <MenuItem onClick={() => { onEdit(); handleClose(); }} disableRipple className="text-sm font-medium text-gray-700 gap-2">
                    <RefreshCcw size={16} /> Edit User
                </MenuItem>
                <MenuItem onClick={() => { onDelete(); handleClose(); }} disableRipple className="text-sm font-medium text-red-600 gap-2">
                    <Trash2 size={16} /> Reject User
                </MenuItem>
            </Menu>
        </>
    );
};
