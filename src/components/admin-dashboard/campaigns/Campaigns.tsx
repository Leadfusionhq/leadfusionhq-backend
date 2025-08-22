"use client";

import { useEffect, useState, useCallback } from "react";
import { CAMPAIGNS_API, API_URL,LOCATION_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography, FormControl, InputLabel, Select, MenuItem, Popover, IconButton, Chip, Stack } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import customStyles from '@/components/common/dataTableStyles';
import { STATUS, LEAD_TYPE, EXCLUSIVITY, LANGUAGE } from "@/constants/enums";

// Define User type
type User = {
  _id: string;
  name: string;
  email: string;
};

// Define State type for filter
type StateOption = {
  abbreviation: string;
  name: string;
};

// Define Campaign type
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

export default function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLeadType, setSelectedLeadType] = useState<string>("");
  const [tempSelectedUser, setTempSelectedUser] = useState<string>("");
  const [tempSelectedState, setTempSelectedState] = useState<string>("");
  const [tempSelectedStatus, setTempSelectedStatus] = useState<string>("");
  const [tempSelectedLeadType, setTempSelectedLeadType] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [states, setStates] = useState<StateOption[]>([]);




const statuses = Object.values(STATUS);
const leadTypes = Object.values(LEAD_TYPE);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = (await axiosWrapper(
        "get",
        API_URL.GET_ALL_USERS,
        {},
        token ?? undefined
      )) as UsersApiResponse;
      setUsers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to fetch users");
    }
  }, [token]);
  const fetchStates = useCallback(async () => {
    try {
      const response = await axiosWrapper(
        "get",
        LOCATION_API.GET_STATES,
        {},
        token ?? undefined
      )as {
        data: StateOption[];
        message?: string;
      };


      setStates(response.data || []);
    } catch (err) {
      console.error("Failed to fetch states:", err);
      setError("Failed to fetch states");
    }
  }, [token]);

  // Fetch campaigns with filters
  const fetchCampaigns = useCallback(
    async (
      pageNumber: number,
      pageSize: number,
      userId: string,
      state: string,
      status: string,
      leadType: string
    ) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
          ...(userId && { user_id: userId }),
          ...(state && { state: state }),
          ...(status && { status: status }),
          ...(leadType && { lead_type: leadType }),
        });
        console.log(`${CAMPAIGNS_API.GET_ALL_CAMPAIGNS}?${params.toString()}`);
        const response = (await axiosWrapper(
          "get",
          `${CAMPAIGNS_API.GET_ALL_CAMPAIGNS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        console.log("Campaign Response:", response);
        setCampaigns(response.data || []);
        setTotalRows(response.meta?.total || 0);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        setError("Failed to fetch campaigns");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Fetch users and campaigns on mount or changes
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchStates();
      fetchCampaigns(
        pagination.page,
        pagination.limit,
        selectedUser,
        selectedState,
        selectedStatus,
        selectedLeadType
      );
    }
  }, [token, pagination.page, pagination.limit, fetchCampaigns,fetchStates, fetchUsers, selectedUser, selectedState, selectedStatus, selectedLeadType]);

  // Set temp filters when popover opens
  useEffect(() => {
    if (anchorEl) {
      setTempSelectedUser(selectedUser);
      setTempSelectedState(selectedState);
      setTempSelectedStatus(selectedStatus);
      setTempSelectedLeadType(selectedLeadType);
    }
  }, [anchorEl, selectedUser, selectedState, selectedStatus, selectedLeadType]);

  const skeletonRows: Campaign[] = Array.from({ length: pagination.limit }).map((_, i) => ({
    _id: `skeleton-${i}`,
    campaign_id: "",
    name: "",
    status: "",
    lead_type: "",
    exclusivity: "",
    language: "",
    geography: {
      state: {
        abbreviation: "",
        name: "",
        _id: ""
      },
      coverage: { type: "" }
    },
    user_id: {
      email: '',
      name: '',
      _id: ''
    },
    delivery: { method: "" },
    createdAt: "",
    updatedAt: ""
  }));

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  const formatLeadType = (leadType: string) => {
    return leadType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  const formatExclusivity = (exclusivity: string) => {
    return exclusivity.charAt(0) + exclusivity.slice(1).toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'PAUSED': 'bg-yellow-100 text-yellow-800',
      'DRAFT': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {formatStatus(status)}
      </span>
    );
  };

  const handleEdit = (row: Campaign) => {
    router.push(`/dashboard/campaigns/${row._id}/edit`);
  };

  const handleView = (row: Campaign) => {
    router.push(`/admin/campaigns/${row._id}`);
  };

  const columns: TableColumn<Campaign>[] = [
    {
      name: "Campaign ID",
      selector: (row) => row.campaign_id,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{row.campaign_id}</div>
        ),
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Campaign Name",
      selector: (row) => row.name,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{row.name}</div>
        ),
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Client",
      selector: (row) => row.user_id?._id || "",
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{row?.user_id?.name}</div>
        ),
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Lead Type",
      selector: (row) => row.lead_type,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={100} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600">{formatLeadType(row.lead_type)}</div>
        ),
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "State",
      selector: (row) => row.geography.state.abbreviation,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={100} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600 uppercase">{row.geography.state.abbreviation}</div>
        ),
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={80} animation="wave" />
        ) : (
          getStatusBadge(row.status)
        ),
      sortable: true,
      minWidth: "100px",
    },
    {
      name: "Actions",
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton
            variant="rectangular"
            width={120}
            height={30}
            animation="wave"
          />
        ) : (
          <div className="flex gap-2">
            <Button
              className="!bg-white !text-[#838383] border border-[#838383] hover:!bg-[#f4f4f4]"
              size="small"
              sx={{
                fontSize: "12px",
                minWidth: "70px",
                height: "28px",
                textTransform: "capitalize",
              }}
              onClick={() => handleView(row)}
            >
              View
            </Button>
          </div>
        ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: "140px",
    }
  ];

  // Popover handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'filter-popover' : undefined;

  // Apply filters and close popover
  const handleApplyFilters = () => {
    setSelectedUser(tempSelectedUser);
    setSelectedState(tempSelectedState);
    setSelectedStatus(tempSelectedStatus);
    setSelectedLeadType(tempSelectedLeadType);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCampaigns(
      1,
      pagination.limit,
      tempSelectedUser,
      tempSelectedState,
      tempSelectedStatus,
      tempSelectedLeadType
    );
    handleFilterClose();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedUser("");
    setSelectedState("");
    setSelectedStatus("");
    setSelectedLeadType("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCampaigns(1, pagination.limit, "", "", "", "");
  };

  // Remove individual filter
  const handleRemoveFilter = (filterType: string) => {
    let newUser = selectedUser;
    let newState = selectedState;
    let newStatus = selectedStatus;
    let newLeadType = selectedLeadType;

    switch (filterType) {
      case 'user':
        newUser = "";
        setSelectedUser("");
        break;
      case 'state':
        newState = "";
        setSelectedState("");
        break;
      case 'status':
        newStatus = "";
        setSelectedStatus("");
        break;
      case 'leadType':
        newLeadType = "";
        setSelectedLeadType("");
        break;
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCampaigns(1, pagination.limit, newUser, newState, newStatus, newLeadType);
  };

  // Get display value for chips
  const getFilterLabel = (type: string, value: string) => {
    switch (type) {
      case 'user':
        const user = users.find(u => u._id === value);
        return user ? `Client: ${user.name}` : '';
      case 'state':
        const state = states.find(s => s.abbreviation === value);
        return state ? `State: ${state.name}` : '';
      case 'status':
        return `Status: ${formatStatus(value)}`;
      case 'leadType':
        return `Lead Type: ${formatLeadType(value)}`;
      default:
        return '';
    }
  };

  // Check if any filters are active
  const hasFilters = selectedUser || selectedState || selectedStatus || selectedLeadType;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePerRowsChange = (newLimit: number, page: number) => {
    setPagination({ page, limit: newLimit });
  };

  return (
    <Box sx={{ padding: 2 }}>
      <div className="flex justify-between items-center pb-[30px]">
        <h3 className="text-[24px] text-[#1C1C1C] text-[Inter] font-semibold">List of Campaigns</h3>
        <IconButton aria-label="filter" onClick={handleFilterClick}>
          <FilterListIcon />
        </IconButton>
      </div>

      {hasFilters && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {selectedUser && (
            <Chip
              label={getFilterLabel('user', selectedUser)}
              onDelete={() => handleRemoveFilter('user')}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
            />
          )}
          {selectedState && (
            <Chip
              label={getFilterLabel('state', selectedState)}
              onDelete={() => handleRemoveFilter('state')}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
            />
          )}
          {selectedStatus && (
            <Chip
              label={getFilterLabel('status', selectedStatus)}
              onDelete={() => handleRemoveFilter('status')}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
            />
          )}
          {selectedLeadType && (
            <Chip
              label={getFilterLabel('leadType', selectedLeadType)}
              onDelete={() => handleRemoveFilter('leadType')}
              deleteIcon={<ClearIcon />}
              color="primary"
              variant="outlined"
            />
          )}
          <Chip
            label="Clear All"
            onClick={handleClearFilters}
            color="default"
            variant="outlined"
          />
        </Stack>
      )}

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { p: 2, width: 400 },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="user-filter-label">Client</InputLabel>
            <Select
              labelId="user-filter-label"
              value={tempSelectedUser}
              label="Client"
              onChange={(e) => setTempSelectedUser(e.target.value as string)}
            >
              <MenuItem value="">
                <em>All Clients</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name}
                </MenuItem>
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
              <MenuItem value="">
                <em>All States</em>
              </MenuItem>
              {states.map((state) => (
                <MenuItem key={state.abbreviation} value={state.abbreviation}>
                  {state.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={tempSelectedStatus}
              label="Status"
              onChange={(e) => setTempSelectedStatus(e.target.value as string)}
            >
              <MenuItem value="">
                <em>All Statuses</em>
              </MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {formatStatus(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="lead-type-filter-label">Lead Type</InputLabel>
            <Select
              labelId="lead-type-filter-label"
              value={tempSelectedLeadType}
              label="Lead Type"
              onChange={(e) => setTempSelectedLeadType(e.target.value as string)}
            >
              <MenuItem value="">
                <em>All Lead Types</em>
              </MenuItem>
              {leadTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {formatLeadType(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleFilterClose}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleApplyFilters}>
              Apply
            </Button>
          </Stack>
        </Stack>
      </Popover>

      <DataTable
        columns={columns}
        data={loading ? skeletonRows : campaigns}
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
          ) : !loading && campaigns.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: 'center', color: 'gray' }}>
              📝 No campaigns found. Try adjusting your filters!
            </Typography>
          ) : null
        }
      />
    </Box>
  );
}