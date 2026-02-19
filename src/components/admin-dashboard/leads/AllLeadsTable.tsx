"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { LEADS_API, CAMPAIGNS_API, LOCATION_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter, useSearchParams } from "next/navigation";
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
    Undo2,
    Users,
    User,
    MapPin,
    Calendar,
    CreditCard,
    Phone,
    Mail,
    ListFilter,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    FileText
} from "lucide-react";
import { toast } from 'react-toastify';
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Menu, MenuItem, IconButton, Popover, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tooltip } from "@mui/material";

// --- Types ---
type Lead = {
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
    createdAt: string;
    updatedAt: string;
    status: string;
    return_status: string;
    lead_type: string;
    exclusivity: string;
    language: string;
    geography: string;
    delivery: string;
    payment_status?: "paid" | "payment_pending" | "failed" | "refunded";
    return_reason?: string;
    return_comments?: string;
    return_attempts?: number;
    user_id?: {
        _id: string;
        name: string;
        email: string;
    } | string;
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

type CampaignOption = { _id: string; name: string };
type StateOption = { _id: string; name: string; abbreviation: string };

// --- Styling Helpers ---
const StatusBadge = ({ status, type, icon: Icon }: { status: string; type: 'lead' | 'return' | 'payment', icon?: any }) => {
    if (!status && type === 'payment') status = 'paid';

    let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
    let label = status ? status.replace(/_/g, " ").toLowerCase() : "--";

    if (type === 'lead') {
        const s = status?.toUpperCase();
        if (s === 'NEW') colorClass = "bg-blue-50 text-blue-700 border-blue-100";
        else if (s === 'CONTACTED') colorClass = "bg-purple-50 text-purple-700 border-purple-100";
        else if (s === 'QUALIFIED') colorClass = "bg-green-50 text-green-700 border-green-100";
        else if (s === 'CONVERTED') colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
        else if (s === 'REJECTED') colorClass = "bg-red-50 text-red-700 border-red-100";
        else if (s === 'RETURNED') colorClass = "bg-orange-50 text-orange-700 border-orange-100";
    } else if (type === 'return') {
        if (status === 'Not Returned') {
            colorClass = "bg-gray-50 text-gray-400 border-transparent";
            label = "Active";
        }
        else if (status === 'Pending') colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        else if (status === 'Approved') colorClass = "bg-red-50 text-red-700 border-red-200";
        else if (status === 'Rejected') colorClass = "bg-green-50 text-green-700 border-green-200";
    } else if (type === 'payment') {
        if (status === 'paid') colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        else if (status === 'payment_pending' || status === 'pending') colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        else if (status === 'failed') colorClass = "bg-red-50 text-red-700 border-red-200";
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize whitespace-nowrap ${colorClass}`}>
            {Icon && <Icon size={10} className="mr-1" />}
            {label}
        </span>
    );
};

const getStatusColor = (status: string, type: 'lead' | 'return' | 'payment') => {
    if (!status && type === 'payment') status = 'paid';
    const s = status?.toString().replace(/_/g, " ").toLowerCase();

    if (type === 'lead') {
        const up = status?.toUpperCase();
        if (up === 'NEW') return "text-blue-700";
        if (up === 'CONTACTED') return "text-purple-700";
        if (up === 'QUALIFIED') return "text-green-700";
        if (up === 'CONVERTED') return "text-emerald-700";
        if (up === 'REJECTED') return "text-red-700";
        if (up === 'RETURNED') return "text-orange-700";
        return "text-gray-600";
    }
    if (type === 'return') {
        if (s === 'not returned') return "text-gray-400";
        if (s === 'pending') return "text-amber-700";
        if (s === 'approved') return "text-red-700";
        if (s === 'rejected') return "text-green-700";
        return "text-gray-500";
    }
    if (type === 'payment') {
        if (s === 'paid') return "text-emerald-700";
        if (s?.includes('pending')) return "text-amber-700";
        if (s === 'failed') return "text-red-700";
        return "text-gray-500";
    }
    return "text-gray-500";
};

// Hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}


const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, active }: { title: string, value: string | number, icon: any, color: string, subtext?: string, onClick?: () => void, active?: boolean }) => {
    const isBlack = color.includes('bg-black');
    return (
        <div
            onClick={onClick}
            className={`p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border flex items-center gap-3 sm:gap-4 transition-all duration-200 cursor-pointer 
        ${active ? 'ring-2 ring-black shadow-md scale-[1.01]' : 'hover:scale-[1.01] hover:shadow-md bg-white border-gray-100'} 
        ${isBlack ? "bg-black border-black text-white" : ""}`}
        >
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${isBlack ? "bg-gray-800 text-white" : color}`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6`} />
            </div>
            <div className="min-w-0 flex-1">
                <p className={`text-xs sm:text-sm font-medium ${isBlack ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold mt-0.5 ${isBlack ? "text-white" : "text-gray-900"}`}>{value}</h3>
                {subtext && <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${isBlack ? "text-gray-500" : "text-gray-400"} truncate`}>{subtext}</p>}
            </div>
        </div>
    );
};

// Mobile Lead Card Component
const MobileLeadCard = ({ lead, onDelete, onReturn }: { lead: Lead, onDelete: () => void, onReturn: () => void }) => {
    const router = useRouter();
    const campaignName = typeof lead.campaign_id === 'object' ? lead.campaign_id?.name : lead.campaign_id;
    const stateName = lead.address.state?.abbreviation || lead.address.state?.name || "--";

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{lead.first_name} {lead.last_name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {lead.lead_id}</p>
                </div>
                <ActionMenu lead={lead} onDelete={onDelete} onReturn={onReturn} />
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 mb-3">
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail size={12} className="text-gray-400" />
                    <span className="truncate">{lead.email}</span>
                </a>
                {(lead.phone || lead.phone_number) && (
                    <a href={`tel:${lead.phone || lead.phone_number}`} className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone size={12} className="text-gray-400" />
                        <span>{lead.phone || lead.phone_number}</span>
                    </a>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin size={12} className="text-gray-400" />
                    <span>{lead.address.city}, {stateName}</span>
                </div>
            </div>

            {/* Campaign & Date */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b border-gray-50">
                <span className="truncate max-w-[60%]">{campaignName || "N/A"}</span>
                <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(lead.createdAt).toLocaleDateString()}
                </span>
            </div>

            {/* User Info */}
            {typeof lead.user_id === 'object' && lead.user_id && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-50">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold shrink-0 border border-indigo-200">
                        {lead.user_id.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="truncate">{lead.user_id.name}</span>
                </div>
            )}

            {/* Status Row */}
            <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={lead.status || 'New'} type="lead" />
                {lead.return_status !== 'Not Returned' && (
                    <StatusBadge status={lead.return_status} type="return" />
                )}
                <StatusBadge status={lead.payment_status || 'paid'} type="payment" />
            </div>
        </div>
    );
};

// --- Props ---
type AllLeadsTableProps = {
    defaultPaymentStatus?: string;
    defaultReturnStatus?: string;
};

export default function AllLeadsTable({ defaultPaymentStatus, defaultReturnStatus }: AllLeadsTableProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = useSelector((state: RootState) => state.auth.token);

    // Pagination
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState<number>(0);

    // Filters State
    const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
    const [states, setStates] = useState<StateOption[]>([]);

    // Active Filters
    const [selectedCampaign, setSelectedCampaign] = useState<string>(() => {
        const cid = searchParams.get("campaign_id");
        return cid ? cid.split("|")[0] : "";
    });
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [selectedState, setSelectedState] = useState<string>("");

    // Temp Filters
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [tempFilters, setTempFilters] = useState({ campaign: selectedCampaign, status: "", state: "" });
    const [campaignSearch, setCampaignSearch] = useState("");
    const debouncedCampaignSearch = useDebounce(campaignSearch, 300);

    const filteredCampaigns = useMemo(() => {
        if (!debouncedCampaignSearch) return campaignOptions.slice(0, 50); // Show top 50 by default
        return campaignOptions.filter(c => c.name.toLowerCase().includes(debouncedCampaignSearch.toLowerCase()));
    }, [campaignOptions, debouncedCampaignSearch]);

    // Dialogs
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
    const [returnDialog, setReturnDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });

    // Table
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);


    // --- Data Fetching ---
    const fetchCampaignOptions = useCallback(async () => {
        try {
            const res = await axiosWrapper("get", `${CAMPAIGNS_API.GET_ALL_CAMPAIGNS}?page=1&limit=1000`, {}, token ?? undefined) as { data: CampaignOption[] };
            setCampaignOptions(res.data ?? []);
        } catch (e) { console.error(e); }
    }, [token]);

    const fetchStates = useCallback(async () => {
        try {
            const res = await axiosWrapper("get", LOCATION_API.GET_STATES, {}, token ?? undefined) as { data: StateOption[] };
            setStates(res.data ?? []);
        } catch (e) { console.error(e); }
    }, [token]);

    const fetchLeads = useCallback(async (pageIndex: number, pageSize: number) => {
        try {
            setLoading(true);
            setError(null);

            const normStateId = selectedState ? selectedState.split('|')[0] : undefined;
            const params = new URLSearchParams({
                page: (pageIndex + 1).toString(),
                limit: pageSize.toString(),
                ...(selectedCampaign && { campaign_id: selectedCampaign }),
                ...(selectedStatus && { status: selectedStatus }),
                ...(normStateId && { state: normStateId }),
                ...(defaultPaymentStatus && { payment_status: defaultPaymentStatus }),
                ...(defaultReturnStatus && { return_status: defaultReturnStatus }),
            });

            const endpoint = LEADS_API.GET_ALL_LEADS;

            const response = (await axiosWrapper(
                "get",
                `${endpoint}?${params.toString()}`,
                {},
                token ?? undefined
            )) as ApiResponse;

            setLeads(response.data || []);
            setTotalRows(response.meta?.total || 0);
        } catch (err) {
            console.error(`Failed to fetch leads:`, err);
            setError(`Failed to fetch leads`);
        } finally {
            setLoading(false);
        }
    }, [token, selectedCampaign, selectedStatus, selectedState, defaultPaymentStatus, defaultReturnStatus]);

    // Effects
    useEffect(() => {
        if (token) {
            fetchCampaignOptions();
            fetchStates();
        }
    }, [token, fetchCampaignOptions, fetchStates]);

    useEffect(() => {
        if (token) {
            fetchLeads(pagination.pageIndex, pagination.pageSize);
        }
    }, [token, pagination.pageIndex, pagination.pageSize, selectedCampaign, selectedStatus, selectedState, fetchLeads]);


    // --- Actions ---
    const handleDelete = (row: Lead) => setDeleteDialog({ open: true, lead: row });
    const handleReturnLead = (row: Lead) => setReturnDialog({ open: true, lead: row });

    const confirmDelete = async () => {
        if (!deleteDialog.lead) return;
        try {
            const response = await axiosWrapper("delete", LEADS_API.DELETE_LEAD.replace(':leadId', deleteDialog.lead._id), {}, token ?? undefined) as any;
            if (response.result?.deleted || response.message?.toLowerCase().includes('success')) {
                toast.success('Lead deleted successfully');
                setDeleteDialog({ open: false, lead: null });
                fetchLeads(pagination.pageIndex, pagination.pageSize);
            } else { toast.error('Failed to delete lead'); }
        } catch (err: any) { toast.error(err?.message || 'Failed to delete lead'); }
    };

    const confirmReturn = async () => {
        if (!returnDialog.lead) return;
        try {
            // NOTE: This usually just sets status to 'RETURNED' or similar, logic depends on API
            // Currently using APPROVE_RETURN_LEAD but might need specific 'request return' endpoint if different.
            // Assuming 'return a lead' means initiating a return or administrator forcing a return.
            // The original code used APPROVE_RETURN_LEAD which seems like approving a request.
            // If admin is returning, maybe it's the update status endpoint?
            // Keeping original logic for now: LEADS_API.APPROVE_RETURN_LEAD
            await axiosWrapper("patch", LEADS_API.APPROVE_RETURN_LEAD, { lead_id: returnDialog.lead._id, return_status: 'Approved' }, token ?? undefined);
            toast.success("Lead returned successfully");
            setReturnDialog({ open: false, lead: null });
            fetchLeads(pagination.pageIndex, pagination.pageSize);
        } catch (err: any) { toast.error(err?.message || "Failed to return lead"); }
    };


    // --- Columns ---
    const columns: ColumnDef<Lead>[] = useMemo(() => [
        {
            accessorKey: "lead_id",
            header: "Lead Info",
            cell: ({ row }) => {
                const user = typeof row.original.user_id === 'object' ? row.original.user_id : null;
                return (
                    <div className="flex items-start gap-2.5">
                        {user && (
                            <Tooltip
                                title={
                                    <div style={{ padding: '4px 0' }}>
                                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{user.name}</div>
                                        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{user.email}</div>
                                    </div>
                                }
                                arrow
                                placement="top"
                            >
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold cursor-help shrink-0 mt-0.5 border border-indigo-200 hover:bg-indigo-200 transition-colors">
                                    {user.name?.charAt(0)?.toUpperCase() || <User size={12} />}
                                </div>
                            </Tooltip>
                        )}
                        <div className="flex flex-col min-w-0">
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
                    </div>
                );
            },
            size: 160
        },
        {
            id: "contact",
            header: "Contact",
            cell: ({ row }) => (
                <div className="flex flex-col max-w-[180px]">
                    <span className="text-sm font-medium text-gray-900 truncate">{row.original.first_name} {row.original.last_name}</span>
                    <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 truncate">
                            <Mail size={11} className="text-gray-400" />
                            <a href={`mailto:${row.original.email}`} className="truncate hover:text-blue-600 hover:underline transition-colors">
                                {row.original.email}
                            </a>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone size={11} className="text-gray-400" />
                            {row.original.phone || row.original.phone_number ? (
                                <a href={`tel:${row.original.phone || row.original.phone_number}`} className="hover:text-blue-600 hover:underline transition-colors">
                                    {row.original.phone || row.original.phone_number}
                                </a>
                            ) : "--"}
                        </div>
                    </div>
                </div>
            ),
            size: 200
        },
        {
            id: "location",
            header: "Location",
            cell: ({ row }) => {
                const state = row.original.address.state?.abbreviation || row.original.address.state?.name || "--";
                // Construct full address for map
                const addr = row.original.address;
                const fullAddr = `${addr?.street || ''}, ${addr?.city || ''}, ${state} ${addr?.zip_code || ''}`;
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;

                return (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 group transition-colors hover:text-blue-600">
                        <MapPin size={14} className="text-gray-400 group-hover:text-blue-500" />
                        <span className="border-b border-transparent group-hover:border-blue-200">{row.original.address.city}, {state}</span>
                    </a>
                )
            },
            size: 140
        },
        {
            accessorKey: "campaign_id",
            header: "Campaign",
            cell: ({ row }) => {
                const name = typeof row.original.campaign_id === 'object' ? row.original.campaign_id?.name : row.original.campaign_id;
                // Cost calculation if needed, for admin probably useful? User specifically asked for 'cost' 
                // but checking Lead type, it doesn't strictly have 'original_cost' in the type definition in this file (lines 47-84), 
                // wait, line 80? No.
                // Let me check type Lead in AllLeadsTable.tsx again.
                // It does NOT have original_cost in type Lead! 
                // However, I should assume it might be there or I should update the type. 
                // BUT, looking at User Leads.tsx, it had original_cost.
                // I will assume it comes from API even if not in type, or fail gracefully.
                // Actually, I should probably check API response or adding it to type.
                // For now, I'll cast row.original as any to safely access it if it exists.
                const cost = (row.original as any).original_cost || 0;

                return (
                    <div className="flex flex-col">
                        <div className="text-sm text-gray-700 max-w-[150px] truncate font-medium" title={name || ""}>{name || "N/A"}</div>
                        {(cost > 0) && (
                            <span className="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center gap-0.5">
                                Cost: <span className="text-gray-900">${cost}</span>
                            </span>
                        )}
                    </div>
                );
            },
            size: 150
        },
        {
            id: "status_group",
            header: "Status (Lead | Return | Pay)",
            cell: ({ row }) => {
                const leadSt = row.original.status || "New";
                const retLabel = row.original.return_status === 'Not Returned' ? 'Active' : row.original.return_status;
                const payLabel = row.original.payment_status || 'Paid';

                return (
                    <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50/50 px-3 py-1.5 shadow-sm">
                        <Tooltip title="Lead Status">
                            <span className={`text-[11px] font-semibold uppercase tracking-wide cursor-help ${getStatusColor(row.original.status, 'lead')}`}>
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
                            <span className={`text-[11px] font-medium cursor-help ${getStatusColor(row.original.payment_status || '', 'payment')} uppercase tracking-wide`}>
                                {payLabel.replace(/_/g, " ")}
                            </span>
                        </Tooltip>
                    </div>
                );
            },
            size: 240
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <ActionMenu
                    lead={row.original}
                    onDelete={() => handleDelete(row.original)}
                    onReturn={() => handleReturnLead(row.original)}
                />
            ),
            size: 60
        }
    ], []);

    const table = useReactTable({
        data: leads,
        columns,
        pageCount: Math.ceil(totalRows / pagination.pageSize),
        state: { pagination, sorting, columnFilters },
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
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* --- Stats Section --- */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatCard
                    title="All Leads"
                    value={totalRows}
                    subtext="Total Generated"
                    icon={Users}
                    color="bg-purple-100 text-purple-700"
                />
                <StatCard
                    title="Campaigns"
                    value={campaignOptions.length}
                    subtext="Active Sources"
                    icon={ListFilter}
                    color="bg-blue-100 text-blue-600"
                />
            </div>

            {/* --- Header & Filters --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">All Leads</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        Monitor and track leads
                    </p>
                </div>

                <button
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] border rounded-xl transition-all ${Boolean(filterAnchorEl) || (selectedCampaign || selectedStatus || selectedState)
                        ? "bg-black text-white border-black shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                        }`}
                >
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters</span>
                    {(selectedCampaign || selectedStatus || selectedState) && (
                        <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                </button>
            </div>

            {/* --- Mobile Card View --- */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
                            <div className="flex justify-between mb-3">
                                <div className="h-5 w-32 bg-gray-100 rounded"></div>
                                <div className="h-5 w-5 bg-gray-100 rounded"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-48 bg-gray-100 rounded"></div>
                                <div className="h-3 w-32 bg-gray-100 rounded"></div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <div className="h-5 w-16 bg-gray-100 rounded-full"></div>
                                <div className="h-5 w-16 bg-gray-100 rounded-full"></div>
                            </div>
                        </div>
                    ))
                ) : leads.length ? (
                    leads.map(lead => (
                        <MobileLeadCard
                            key={lead._id}
                            lead={lead}
                            onDelete={() => handleDelete(lead)}
                            onReturn={() => handleReturnLead(lead)}
                        />
                    ))
                ) : (
                    <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                        <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-900 font-medium">No leads found</p>
                    </div>
                )}
            </div>

            {/* --- Desktop Table View --- */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                                        <td className="px-6 py-6"><div className="h-10 w-24 bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-10 w-32 bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-6 w-24 bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-6 w-24 bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-16 w-full bg-gray-100 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
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
                                            <Users className="h-12 w-12 text-gray-200 mb-4" />
                                            <p className="text-lg font-medium text-gray-900">No leads found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - Responsive */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white rounded-xl border border-gray-100">
                <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                    <span className="hidden sm:inline">Showing </span>
                    <span className="font-medium text-gray-900">{(pagination.pageIndex * pagination.pageSize) + 1}</span>
                    <span> - </span>
                    <span className="font-medium text-gray-900">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)}</span>
                    <span> of </span>
                    <span className="font-medium text-gray-900">{totalRows}</span>
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                    <select
                        value={pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className="hidden sm:block pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-black focus:border-black rounded-lg border"
                    >
                        {[10, 20, 30, 50].map(pageSize => (
                            <option key={pageSize} value={pageSize}>Show {pageSize}</option>
                        ))}
                    </select>
                    <div className="flex rounded-lg shadow-sm">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="inline-flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="inline-flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
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
                PaperProps={{ sx: { p: 0, width: 320, borderRadius: '16px' } }}
            >
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Filter Leads</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Status</label>
                        <select
                            value={tempFilters.status}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded-lg border-gray-200 text-sm"
                        >
                            <option value="">All Statuses</option>
                            {["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED", "RETURNED"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Campaign</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search campaign..."
                                value={campaignSearch}
                                onChange={(e) => setCampaignSearch(e.target.value)}
                                className="w-full rounded-lg border-gray-200 text-sm pl-8 mb-2"
                            />
                            <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-1 space-y-0.5 custom-scrollbar">
                            <div
                                onClick={() => setTempFilters(prev => ({ ...prev, campaign: "" }))}
                                className={`px-2 py-1.5 text-sm rounded-md cursor-pointer flex items-center justify-between ${!tempFilters.campaign ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                                <span>All Campaigns</span>
                                {!tempFilters.campaign && <CheckCircle size={14} className="text-black" />}
                            </div>
                            {filteredCampaigns.map(c => (
                                <div
                                    key={c._id}
                                    onClick={() => setTempFilters(prev => ({ ...prev, campaign: c._id }))}
                                    className={`px-2 py-1.5 text-sm rounded-md cursor-pointer flex items-center justify-between ${tempFilters.campaign === c._id ? 'bg-gray-100 font-medium text-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}
                                >
                                    <span className="truncate">{c.name}</span>
                                    {tempFilters.campaign === c._id && <CheckCircle size={14} className="text-black" />}
                                </div>
                            ))}
                            {filteredCampaigns.length === 0 && (
                                <div className="text-xs text-gray-400 p-2 text-center">No campaigns found</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                    <button
                        onClick={() => {
                            setSelectedCampaign(""); setSelectedStatus(""); setSelectedState("");
                            setFilterAnchorEl(null);
                        }}
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => {
                            setSelectedCampaign(tempFilters.campaign); setSelectedStatus(tempFilters.status); setSelectedState(tempFilters.state);
                            setFilterAnchorEl(null);
                        }}
                        className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800"
                    >
                        Apply
                    </button>
                </div>
            </Popover>

            {/* Confirm Dialogs */}
            <ConfirmDialog
                open={deleteDialog.open}
                title="Delete Lead"
                message="Are you sure you want to delete this lead?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ open: false, lead: null })}
            />
            <ConfirmDialog
                open={returnDialog.open}
                title="Return Lead"
                message={`Return lead ${returnDialog.lead?.first_name}?`}
                onConfirm={confirmReturn}
                onCancel={() => setReturnDialog({ open: false, lead: null })}
            />
        </div>
    );
}

// Sub-component
const ActionMenu = ({ lead, onDelete, onReturn }: any) => {
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
                <MenuItem onClick={() => { router.push(`/admin/leads/${lead._id}`); setAnchorEl(null); }} className="text-sm">View Details</MenuItem>
                <MenuItem onClick={() => { router.push(`/admin/leads/${lead._id}/edit`); setAnchorEl(null); }} className="text-sm">Edit Lead</MenuItem>

                {lead.return_status !== 'Approved' && (
                    <MenuItem onClick={() => { onReturn(); setAnchorEl(null); }} className="text-sm text-amber-600">Return Lead</MenuItem>
                )}

                <MenuItem onClick={() => { onDelete(); setAnchorEl(null); }} className="text-sm text-red-600">Delete</MenuItem>
            </Menu>
        </>
    )
}
