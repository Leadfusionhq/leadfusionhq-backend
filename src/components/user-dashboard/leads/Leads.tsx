"use client";

import { useEffect, useState, useCallback } from "react";
import { LEADS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography,Chip } from "@mui/material";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ReturnFeedbackModal from "@/components/common/ReturnFeedbackModal";
import DownloadIcon from '@mui/icons-material/Download';

// Define Lead type
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
    };
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

export default function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [downloadingCSV, setDownloadingCSV] = useState<boolean>(false);
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // ✅ ADD THIS - Lead Status Mapping
  const LEAD_STATUS_MAP: Record<string, { label: string; color: string }> = {
    'Not Returned': { label: 'Active', color: '#4caf50' },
    'Pending': { label: 'Pending Return', color: '#ff9800' },
    'Approved': { label: 'Returned', color: '#2196f3' },
    'Rejected': { label: 'Return Rejected', color: '#f44336' }
  };

  const getLeadStatus = (return_status: string) => {
    return LEAD_STATUS_MAP[return_status] || LEAD_STATUS_MAP['Not Returned'];
  };


  // Fetch leads with pagination
  const fetchLeads = useCallback(
    async (pageNumber: number, pageSize: number) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: pageSize.toString(),
        });

        const response = (await axiosWrapper(
          "get",
          `${LEADS_API.GET_ALL_LEADS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        console.log("Leads Response:", response);
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

  // CSV Download Functions
// CSV Download Functions
const convertToCSV = (data: Lead[]): string => {
  if (!data || data.length === 0) return '';

  // Define CSV headers
  const headers = [
    'Lead ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Street',
    'City',
    'State',
    'State Abbreviation',
    'Zip Code',
    'Campaign Name',
    'Lead Type',
    'Exclusivity',
    'Language',
   

    'Original Cost',
    'Note',
    'Status',
    'Return Status',
    'Return Reason',
    'Return Comments',
    'Return Attempts',
    'Max Return Attempts',
    'Created Date',
    'Updated Date'
  ];

  // Create CSV rows
  const rows = data.map(lead => {
    // Extract campaign data
    const campaignName = typeof lead.campaign_id === 'object' && lead.campaign_id !== null
      ? lead.campaign_id.name
      : 'N/A';
    
    const leadType = typeof lead.campaign_id === 'object' && lead.campaign_id !== null
      ? (lead.campaign_id.lead_type || 'N/A')
      : 'N/A';
    
    const exclusivity = typeof lead.campaign_id === 'object' && lead.campaign_id !== null
      ? (lead.campaign_id.exclusivity || 'N/A')
      : 'N/A';
    
    const language = typeof lead.campaign_id === 'object' && lead.campaign_id !== null
      ? (lead.campaign_id.language || 'N/A')
      : 'N/A';
    
 
    

    // Extract transaction amount

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
      (lead.note || '').replace(/"/g, '""'), // Escape quotes in notes
      lead.status || '',
      lead.return_status || 'Not Returned',
      (lead.return_reason || '').replace(/"/g, '""'), // Escape quotes
      (lead.return_comments || '').replace(/"/g, '""'), // Escape quotes
      lead.return_attempts?.toString() || '0',
      lead.max_return_attempts?.toString() || '2',
      lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '',
      lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : ''
    ].map(field => `"${field}"`).join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
};

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloadingCSV(true);
      toast.info("Preparing CSV download...");

      // Fetch all leads (without pagination) for complete export
      const params = new URLSearchParams({
        page: '1',
        limit: totalRows.toString(), // Get all records
      });

      const response = (await axiosWrapper(
        "get",
        `${LEADS_API.GET_ALL_LEADS}?${params.toString()}`,
        {},
        token ?? undefined
      )) as ApiResponse;

      const allLeads = response.data || [];

      if (allLeads.length === 0) {
        toast.warning("No leads available to download");
        return;
      }

      // Convert to CSV
      const csvContent = convertToCSV(allLeads);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `leads_export_${currentDate}.csv`;

      // Download the file
      downloadCSV(csvContent, filename);

      toast.success(`Successfully downloaded ${allLeads.length} leads!`);
    } catch (err) {
      console.error("Failed to download CSV:", err);
      toast.error("Failed to download CSV. Please try again.");
    } finally {
      setDownloadingCSV(false);
    }
  };

  // Fetch leads on mount or pagination change
  useEffect(() => {
    if (token) {
      fetchLeads(pagination.page, pagination.limit);
    }
  }, [token, pagination.page, pagination.limit, fetchLeads]);

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

    original_cost: 0,
    note: "",
    createdAt: "",
    updatedAt: "",
    status: "",
    return_status: 'Not Returned' as const,
    return_attempts: 0,
    max_return_attempts: 2,
    return_reason: "",
    return_comments: "",
  }));

  const formatStatus = (status: string | undefined | null) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  };

  const getStatusBadge = (status: string | undefined | null) => {
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'QUALIFIED': 'bg-blue-100 text-blue-800',
      'CONVERTED': 'bg-purple-100 text-purple-800',
      'REJECTED': 'bg-gray-100 text-gray-800'
    };
    
    if (!status) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          N/A
        </span>
      );
    }
    
    const colorClass = statusColors[status.toUpperCase()] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {formatStatus(status)}
      </span>
    );
  };

  const handleEdit = (row: Lead) => {
    router.push(`/dashboard/leads/${row._id}/edit`);
  };

  const handleView = (row: Lead) => {
    router.push(`/dashboard/leads/${row._id}`);
  };

  const handleReturn = async (row: Lead) => {
    const currentStatus = (row.return_status || 'Not Returned').trim();
    console.log(currentStatus);
    
    if ((row.return_attempts || 0) >= (row.max_return_attempts || 2)) {
      toast.warning("You have reached the maximum return attempts for this lead.");
      return;
    }
    
    if (currentStatus !== 'Not Returned' && currentStatus !== 'Rejected') {
      toast.warning("This lead has already been marked for return.");
      return;
    }

    try {
      setLoading(true);
      console.log("Return request for lead:", row);

      const payload = {
        lead_id: row._id,
        return_status: 'Pending', 
      };

      const response = (await axiosWrapper(
        "post",
        LEADS_API.RETURN_LEAD,
        payload,
        token ?? undefined
      )) as ApiResponse;

      console.log("Return Lead Response:", response);

      toast.success("Lead return request submitted successfully!");
    } catch (err: any) {
      console.error("Failed to return lead:", err);
      const message = err?.response?.data?.message || err?.message || "Failed to submit return request. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
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

      const response = await axiosWrapper(
        "post",
        LEADS_API.RETURN_LEAD,
        payload,
        token ?? undefined
      ) as ApiResponse;

      console.log("Return Lead Response:", response);

      // Refresh the leads list
      await fetchLeads(pagination.page, pagination.limit);

      toast.success("Lead return request submitted successfully!");
    } catch (err: any) {
      console.error("Failed to return lead:", err);
      const message = err?.response?.data?.message || err?.message || "Failed to submit return request. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnCancel = () => {
    setReturnModalOpen(false);
    setSelectedLead(null);
  };

  // Columns for the lead table
  const columns: TableColumn<Lead>[] = [
    {
      name: "Lead ID",
      selector: (row) => row.lead_id,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{row.lead_id}</div>
        ),
      sortable: true,
      minWidth: "120px",
    },
    {
      name: "Name",
      selector: (row) => `${row.first_name} ${row.last_name}`,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={150} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{`${row.first_name} ${row.last_name}`}</div>
        ),
      sortable: true,
      minWidth: "160px",
    },
    {
      name: "Email",
      selector: (row) => row.email,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={180} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600">{row.email}</div>
        ),
      sortable: true,
      minWidth: "200px",
    },
    {
      name: "Phone",
      selector: (row) => row.phone,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600">{row.phone}</div>
        ),
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "State",
      selector: (row) => row.address.state._id ?? '',
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={80} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600">{row.address.state.abbreviation ?? ''}</div>
        ),
      sortable: true,
      minWidth: "100px",
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
      name: "Campaign",
      selector: (row) =>
        typeof row.campaign_id === "object" && row.campaign_id !== null
          ? row.campaign_id.name
          : row.campaign_id,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600">
            {typeof row.campaign_id === "object" && row.campaign_id !== null
              ? row.campaign_id.name
              : row.campaign_id || "N/A"}
          </div>
        ),
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "Created Date",
      selector: (row) => row.createdAt,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={90} animation="wave" />
        ) : (
          <div className="text-sm text-gray-500">
            {new Date(row.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        ),
      sortable: true,
      minWidth: "110px",
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

            <Button
              className="!bg-[#838383] !text-white hover:!bg-[#6b6b6b]"
              size="small"
              sx={{
                fontSize: "12px",
                minWidth: "60px",
                height: "28px",
                textTransform: "capitalize",
              }}
              onClick={() => handleReturnClick(row)}
            >
              Return
            </Button>
          </div>
        ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: "140px",
    },
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
    <Box sx={{ padding: 2 }}>
      <div className="flex justify-between items-center pb-[30px]">
        <h3 className="text-[24px] text-[#1C1C1C] text-[Inter] font-semibold">List of Leads</h3>
        
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadCSV}
          disabled={downloadingCSV || loading || leads.length === 0}
          className="!bg-[#1C1C1C] !text-white hover:!bg-[#333333]"
          sx={{
            textTransform: "capitalize",
            fontSize: "14px",
            padding: "8px 20px",
            fontWeight: 500,
          }}
        >
          {downloadingCSV ? "Downloading..." : "Download CSV"}
        </Button>
      </div>

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

      {/* Return Feedback Modal */}
      <ReturnFeedbackModal
        open={returnModalOpen}
        leadId={selectedLead?._id || ''}
        leadName={selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : ''}
        onConfirm={handleReturnConfirm}
        onCancel={handleReturnCancel}
      />
    </Box>
  );
}