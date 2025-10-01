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
import { toast } from "react-toastify";

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
  } | string; // campaign_id can be a string or an object
  note: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  lead_type: string;
  exclusivity: string;
  language: string;
  geography: string;
  delivery: string;
  return_status: 'Not Returned' | 'Pending' | 'Approved' | 'Rejected';
  return_attempts: number;
  max_return_attempts: number;
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
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

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
    campaign_id: "", // Set this to empty string as skeleton data
    note: "",
    createdAt: "",
    updatedAt: "",
    status: "",
    lead_type: "",
    exclusivity: "",
    language: "",
    geography: "",
    delivery: "",
    return_status: 'Not Returned',
    return_attempts: 0,
    max_return_attempts: 2,
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

      // setLeads((prevLeads) =>
      //   prevLeads.map((lead) =>
      //     lead.lead_id === row.lead_id
      //       ? {
      //           ...lead,
      //           return_status: 'Pending', 
      //           return_attempts: (lead.return_attempts || 0) + 1,
      //         }
      //       : lead
      //   )
      // );

      toast.success("Lead return request submitted successfully!");
    } catch (err: any) {
      console.error("Failed to return lead:", err);
      const message = err?.response?.data?.message || err?.message || "Failed to submit return request. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
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
    // {
    //   name: "Status",
    //   selector: (row) => row.status,
    //   cell: (row) =>
    //     row._id.startsWith("skeleton") ? (
    //       <Skeleton variant="text" width={80} animation="wave" />
    //     ) : (
    //       getStatusBadge(row.status)
    //     ),
    //   sortable: true,
    //   minWidth: "110px",
    // },
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
              onClick={() => handleReturn(row)}
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
        progressPending={false} // We handle loading with skeleton rows
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
    </Box>
  );
}