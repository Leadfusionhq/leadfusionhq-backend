"use client";

import { useEffect, useState, useCallback } from "react";
import { LEADS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography } from "@mui/material";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { CAMPAIGNS_API, LOCATION_API } from "@/utils/apiUrl";
import { FormControl, InputLabel, Select, MenuItem, Popover, IconButton, Chip, Stack, Menu } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useSearchParams } from "next/navigation";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { toast } from 'react-toastify';

// Define Lead type
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
    }| any;
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
  lead_type: string;
  return_status: string; 
  exclusivity: string;
  language: string;
  geography: string;
  delivery: string;
  payment_status?: "paid" | "payment_pending";
};
// + add
type CampaignOption = { _id: string; name: string };
type StateOption = { _id: string; name: string; abbreviation: string };




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

export default function LeadTable() {

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  // + add (near other useState)
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);

  // selected filters

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  // temp filters (used in popover until Apply)

  const [tempSelectedStatus, setTempSelectedStatus] = useState<string>("");
  const [tempSelectedState, setTempSelectedState] = useState<string>("");

  // popover anchor
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // + add: adjust to your actual lead statuses or import LEAD_STATUS
  const statuses = [
    "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED", "RETURNED"
    // or: const statuses = Object.values(LEAD_STATUS);
  ];


const getPaymentStatus = (status?: string | null) => {
  // If payment_status is undefined, null, or empty - treat as "paid" (for old leads)
  if (!status) {
    return { label: "Paid", color: "#4caf50" };
  }
  return PAYMENT_STATUS_MAP[status] || { label: "Paid", color: "#4caf50" };
};




// ✅ ADD THIS - Lead Status Mapping
const LEAD_STATUS_MAP: Record<string, { label: string; color: string }> = {
  'Not Returned': { label: 'Active', color: '#4caf50' },
  'Pending': { label: 'Pending Return', color: '#ff9800' },
  'Approved': { label: 'Returned', color: '#2196f3' },
  'Rejected': { label: 'Return Rejected', color: '#f44336' }
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: "Paid", color: "#4caf50" },
  pending: { label: "Pending", color: "#ff9800" },
  failed: { label: "Failed", color: "#f44336" },
  refunded: { label: "Refunded", color: "#2196f3" },
};




const getLeadStatus = (return_status: string) => {
  return LEAD_STATUS_MAP[return_status] || LEAD_STATUS_MAP['Not Returned'];
};



  
  const formatStatus = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());



  const router = useRouter();
    // + add
    const searchParams = useSearchParams();

    // init from URL once, so first fetch already has the right id
    const [selectedCampaign, setSelectedCampaign] = useState<string>(() => {
      const cid = searchParams.get("campaign_id");
      return cid ? cid.split("|")[0] : "";
    });
    const [tempSelectedCampaign, setTempSelectedCampaign] = useState<string>(() => {
      const cid = searchParams.get("campaign_id");
      return cid ? cid.split("|")[0] : "";
    });

    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [menuRow, setMenuRow] = useState<Lead | null>(null);
    const [returnDialog, setReturnDialog] = useState({
      open: false,
      lead: null as Lead | null,
    });
    const isMenuOpen = Boolean(menuAnchorEl);


    const handleReturnLead = (row: Lead) => {
      setReturnDialog({ open: true, lead: row });
      handleMenuClose();
    };

    const confirmReturnLead = async () => {
      if (!returnDialog.lead) return;

      try {
        setLoading(true);
        
        await axiosWrapper(
          "patch",
          LEADS_API.APPROVE_RETURN_LEAD,
          { 
            lead_id: returnDialog.lead._id,           
            return_status: 'Approved' 
          },
          token ?? undefined
        );

        toast.success("Lead returned successfully");
        setReturnDialog({ open: false, lead: null });
        
        // Refresh the table
        fetchLeads(
          pagination.page,
          pagination.limit,
          selectedCampaign,
          selectedStatus,
          selectedState
        );
      } catch (err: any) {
        console.error("Failed to return lead:", err);
        const message = err?.response?.data?.message || "Failed to return lead";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    


    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, row: Lead) => {
      setMenuAnchorEl(event.currentTarget);
      setMenuRow(row);
    };

    const handleMenuClose = () => {
      setMenuAnchorEl(null);
      setMenuRow(null);
    };
    const [deleteDialog, setDeleteDialog] = useState({
      open: false,
      lead: null as Lead | null,
    });
    
    const handleDelete = (row: Lead) => {
      setDeleteDialog({ open: true, lead: row });
      handleMenuClose();
    };
    
    const confirmDelete = async () => {
      if (!deleteDialog.lead) return;
    
      try {
        const response = await axiosWrapper(
          "delete",
          LEADS_API.DELETE_LEAD.replace(':leadId', deleteDialog.lead._id),
          {},
          token ?? undefined
        ) as { 
          result: { 
            deleted: boolean;
            lead_id: string;
            message: string;
          };
          message: string;
        };
        
        // ✅ Check if deletion was successful
        if (response.result?.deleted) {
          toast.success(response.message || response.result.message || 'Lead deleted successfully');
          
          // Close dialog
          setDeleteDialog({ open: false, lead: null });
          
          // Refresh the table
          fetchLeads(
            pagination.page,
            pagination.limit,
            selectedCampaign,
            selectedStatus,
            selectedState
          );
        } else {
          toast.error('Failed to delete lead');
        }
      } catch (err: any) {
        console.error('Failed to delete lead:', err);
        toast.error(err?.response?.data?.message || err?.message || 'Failed to delete lead');
      }
    };

  const token = useSelector((state: RootState) => state.auth.token);

  // + add
  const fetchCampaignOptions = useCallback(async () => {
    try {
      const res = await axiosWrapper(
        "get",
        `${CAMPAIGNS_API.GET_ALL_CAMPAIGNS}?page=1&limit=1000`,
        {},
        token ?? undefined
      ) as { data: { _id: string; name: string }[] };
      setCampaignOptions(res.data ?? []);
    } catch (e) {
      console.error("Failed to fetch campaign options", e);
    }
  }, [token]);

  const fetchStates = useCallback(async () => {
    try {
      const res = await axiosWrapper(
        "get",
        LOCATION_API.GET_STATES,
        {},
        token ?? undefined
      ) as { data: StateOption[] };
      setStates(res.data ?? []);
    } catch (e) {
      console.error("Failed to fetch states", e);
    }
  }, [token]);

  // Fetch leads with pagination
  // - replace existing fetchLeads
  const fetchLeads = useCallback(
    async (
      pageNumber: number,
      pageSize: number,
      campaignId?: string,
      status?: string,
      stateId?: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const normStateId = stateId ? stateId.split('|')[0] : undefined;

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
          ...(campaignId ? { campaign_id: campaignId } : {}),
          ...(status ? { status } : {}),
          ...(normStateId ? { state: normStateId } : {}),
        });

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
        setError("Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchLeads(
        pagination.page,
        pagination.limit,
        selectedCampaign,
        selectedStatus,
        selectedState
      );
    }
  }, [
    token,
    pagination.page,
    pagination.limit,
    selectedCampaign,
    selectedStatus,
    selectedState,
    fetchLeads,
  ]);



  // + add: fetch campaign/state options once
useEffect(() => {
  if (token) {
    fetchCampaignOptions();
    fetchStates();
  }
}, [token, fetchCampaignOptions, fetchStates]);

// - replace your existing effect to include filters
useEffect(() => {
  if (token) {
    fetchLeads(
      pagination.page,
      pagination.limit,
      selectedCampaign,
      selectedStatus,
      selectedState
    );
  }
}, [
  token,
  pagination.page,
  pagination.limit,
  selectedCampaign,
  selectedStatus,
  selectedState,
  fetchLeads,
]);

// + add: sync temp filters when popover opens
useEffect(() => {
  if (anchorEl) {
    setTempSelectedCampaign(selectedCampaign);
    setTempSelectedStatus(selectedStatus);
    setTempSelectedState(selectedState);
  }
}, [anchorEl, selectedCampaign, selectedStatus, selectedState]);



  const skeletonRows: Lead[] = Array.from({ length: pagination.limit }).map((_, i) => ({
    _id: `skeleton-${i}`,
    lead_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: {
        abbreviation: "",
        name: "",
        _id: ""
      },
      zip_code: "",
    },
    campaign_id: "",
    note: "",
    createdAt: "",
    updatedAt: "",
    status: "",
    return_status: "", 
    lead_type: "",
    exclusivity: "",
    language: "",
    geography: "",
    delivery: "",
  }));

  const handleEdit = (row: Lead) => {
    router.push(`/admin/leads/${row._id}/edit`);
  };

  const handleView = (row: Lead) => {
    router.push(`/admin/leads/${row._id}`);
  };

  // + add
const handleFilterClick = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
const handleFilterClose = () => setAnchorEl(null);

const handleApplyFilters = () => {
  setSelectedCampaign(tempSelectedCampaign);
  setSelectedStatus(tempSelectedStatus);
  setSelectedState(tempSelectedState);
  setPagination((prev) => ({ ...prev, page: 1 }));
  handleFilterClose();
};

const handleClearFilters = () => {
  setSelectedCampaign("");
  setSelectedStatus("");
  setSelectedState("");
  setPagination((prev) => ({ ...prev, page: 1 }));
};

const handleRemoveFilter = (type: "campaign" | "status" | "state") => {
  let c = selectedCampaign, s = selectedStatus, st = selectedState;
  if (type === "campaign") c = "";
  if (type === "status") s = "";
  if (type === "state") st = "";
  setSelectedCampaign(c);
  setSelectedStatus(s);
  setSelectedState(st);
  setPagination((prev) => ({ ...prev, page: 1 }));
};

const getFilterLabel = (type: "campaign" | "status" | "state", value: string) => {
  switch (type) {
    case "campaign":
      return `Campaign: ${campaignOptions.find(x => x._id === value)?.name ?? ""}`;
    case "status":
      return `Status: ${formatStatus(value)}`;
    case "state":
      return `State: ${states.find(x => x._id === value)?.name ?? ""}`;
  }
};

const hasFilters = !!(selectedCampaign || selectedStatus || selectedState);


  // Columns for the lead table
  const columns: TableColumn<Lead>[] = [
    {
      name: "Lead ID",
      selector: (row) => row.lead_id,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div style={{ minWidth: "120px" }} className="font-medium text-gray-900">{row.lead_id}</div>
        ),
      sortable: true,
    },
    {
      name: "Name",
      selector: (row) => `${row.first_name} ${row.last_name}`,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={150} animation="wave" />
        ) : (
          <div style={{ minWidth: "160px" }} className="font-medium text-gray-900">{`${row.first_name} ${row.last_name}`}</div>
        ),
      sortable: true,
    },
     {
      name: "Lead Status",
      selector: (row) => row.return_status,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div style={{ minWidth: "140px" }}>
            <Chip
              label={getLeadStatus(row.return_status).label}
              size="small"
              sx={{
                backgroundColor: getLeadStatus(row.return_status).color,
                color: '#fff',
                fontWeight: 500,
                fontSize: '12px'
              }}
            />
          </div>
        ),
      sortable: true,
      width: "160px",
    },
    {
      name: "Payment Status",
      selector: (row) => row.payment_status,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <Chip
            label={getPaymentStatus(row.payment_status || "").label}
            size="small"
            sx={{
              minWidth: "100px",
              backgroundColor: getPaymentStatus(row.payment_status || "").color,
              color: "#fff",
              fontWeight: 500,
              fontSize: "12px",
            }}
          />
        ),
      sortable: true,
      width: "160px",
    },


    {
      name: "Email",
      selector: (row) => row.email,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={180} animation="wave" />
        ) : (
          <div style={{ minWidth: "200px" }} className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis" title={row.email} >{row.email}</div>
        ),
      sortable: true,
      width: "220px",
    },
    {
      name: "Phone",
      selector: (row) => row.phone,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div style={{ minWidth: "130px" }} className="text-sm text-gray-600">{row.phone}</div>
        ),
      sortable: true,
    },
    {
      name: "State",
      selector: (row) => row.address.state._id ?? '',
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={80} animation="wave" />
        ) : (
          <div style={{ minWidth: "90px" }} className="text-sm text-gray-600">{row.address.state.abbreviation ?? ''}</div>
        ),
      sortable: true,
      width: "90px",
    },
    {
      name: "Campaign",
      selector: (row) =>
        typeof row.campaign_id === "object" && row.campaign_id !== null
          ? row.campaign_id.name
          : row.campaign_id,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div style={{ minWidth: "130px" }} className="text-sm text-gray-600">
            {typeof row.campaign_id === "object" && row.campaign_id !== null
              ? row.campaign_id.name
              : row.campaign_id || "N/A"}
          </div>
        ),
      sortable: true,
    },
    {
      name: "Created Date",
      selector: (row) => row.createdAt,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={90} animation="wave" />
        ) : (
          <div style={{ minWidth: "110px" }} className="text-sm text-gray-500">
            {new Date(row.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        ),
      sortable: true,
    },
    {
      name: "Action",
      button: true,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="rectangular" width={80} height={30} />
        ) : (
          <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
            <MoreVertIcon />
          </IconButton>
        ),
      minWidth: "80px",
      maxWidth: "100px",
      ignoreRowClick: true,
      allowOverflow: true,
    }
  ];

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePerRowsChange = (newLimit: number, page: number) => {
    setPagination({ page, limit: newLimit });
  };

  const customStyles = {
    headCells: {
      style: {
        fontWeight: "bold",
        backgroundColor: "#1C1C1C",
        color: "#FFFFFF",
        padding: "16px",
        fontSize: "14px",
        borderBottom: "2px solid #E0E0E0",
      },
    },
    cells: {
      style: {
        padding: "12px 16px",
        fontSize: "14px",
        borderBottom: "1px solid #E0E0E0",
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: "#F9F9F9",
        },
      },
    },
  };

  return (
    <>
   
    <Box sx={{ padding: 2 }}>
      <div className="flex justify-between items-center pb-[30px]">
        <h3 className="text-[24px] text-[#1C1C1C] text-[Inter] font-semibold">List of Leads</h3>
   
        <IconButton aria-label="filter" onClick={handleFilterClick}>
          <FilterListIcon />
        </IconButton>
      </div>
    
      {hasFilters && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {selectedCampaign && (
            <Chip
              label={getFilterLabel("campaign", selectedCampaign)}
              onDelete={() => handleRemoveFilter("campaign")}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
            />
          )}
          {selectedStatus && (
            <Chip
              label={getFilterLabel("status", selectedStatus)}
              onDelete={() => handleRemoveFilter("status")}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
            />
          )}
          {selectedState && (
            <Chip
              label={getFilterLabel("state", selectedState)}
              onDelete={() => handleRemoveFilter("state")}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
            />
          )}
          <Chip label="Clear All" onClick={handleClearFilters} color="default" variant="outlined" />
        </Stack>
      )}

      <DataTable
        columns={columns}
        data={loading ? skeletonRows : leads}
        customStyles={customStyles}
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        paginationDefaultPage={pagination.page}
        paginationPerPage={pagination.limit}
        paginationRowsPerPageOptions={[10, 25, 50, 100]}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        highlightOnHover
        striped
        dense
        persistTableHead
        progressPending={false}
        noDataComponent={
          error ? (
            <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>
              ⚠️ {error}
            </Typography>
          ) : !loading && leads.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: 'center', color: 'gray' }}>
              📝 No leads found. Create your first lead!
            </Typography>
          ) : null
        }
      />
      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            if (menuRow) handleView(menuRow);
            handleMenuClose();
          }}
        >
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRow) handleEdit(menuRow);
            handleMenuClose();
          }}
        >
          Edit
        </MenuItem>
        {/* ✅ ADD THIS */}
        <MenuItem
          onClick={() => {
            if (menuRow) handleDelete(menuRow);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
          {/* ✅ ADD THIS */}
        {/* ✅ Show "Return Lead" for all statuses EXCEPT 'Approved' */}
        {menuRow && menuRow.return_status !== 'Approved' && (
          <MenuItem
            onClick={() => {
              if (menuRow) handleReturnLead(menuRow);
              handleMenuClose();
            }}
            sx={{ color: 'warning.main' }}
          >
            Return Lead
          </MenuItem>
        )}
        
        {/* Optional: add more lead actions here */}
        {/* <MenuItem onClick={() => { ... }}>Return Lead</MenuItem> */}
        {/* <MenuItem onClick={() => { ... }}>Delete Lead</MenuItem> */}
      </Menu>
  
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleFilterClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{ sx: { p: 2, width: 400 } }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="campaign-filter-label">Campaign</InputLabel>
          <Select
            labelId="campaign-filter-label"
            value={tempSelectedCampaign}
            label="Campaign"
            onChange={(e) => setTempSelectedCampaign(e.target.value as string)}
          >
            <MenuItem value=""><em>All Campaigns</em></MenuItem>
            {campaignOptions.map(c => (
              <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

      

        <FormControl fullWidth>
          <InputLabel id="state-filter-label">State</InputLabel>
          <Select
            labelId="state-filter-label"
            value={tempSelectedState}
            label="State"
            onChange={(e) => setTempSelectedState(e.target.value as string)}
          >
            <MenuItem value=""><em>All States</em></MenuItem>
            {states.map(st => (
              <MenuItem key={st._id} value={st._id}>{st.name} ({st.abbreviation})</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleFilterClose}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyFilters}>Apply</Button>
        </Stack>
      </Stack>
    </Popover>
    </Box>
    <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${deleteDialog.lead?.first_name} ${deleteDialog.lead?.last_name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, lead: null })}
      /> 
      {/* ✅ ADD THIS */}
    <ConfirmDialog
      open={returnDialog.open}
      title="Return Lead"
      message={`Are you sure you want to return lead "${returnDialog.lead?.first_name} ${returnDialog.lead?.last_name}"? The lead will be returned and the user will be refunded.`}
      onConfirm={confirmReturnLead}
      onCancel={() => setReturnDialog({ open: false, lead: null })}
    />
  </>
  );
}