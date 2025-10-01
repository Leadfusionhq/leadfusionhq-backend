"use client";

import { useEffect, useState, useCallback } from "react";
import { LEADS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type ReturnLead = {
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
  return_status: string; 
  returned_by?: {
    _id: string;
    name: string;
  } | string;
  createdAt: string;
  updatedAt: string;
  returned_at: string;
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

export default function ReturnLeadsTable() {
  const [returnLeads, setReturnLeads] = useState<ReturnLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchReturnLeads = useCallback(
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
          `${LEADS_API.GET_RETURN_LEADS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        console.log("Return Leads Response:", response);
        setReturnLeads(response.data || []);
        setTotalRows(response.meta?.total || 0);
      } catch (err) {
        console.error("Failed to fetch return leads:", err);
        setError("Failed to fetch return leads");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchReturnLeads(pagination.page, pagination.limit);
    }
  }, [token, pagination.page, pagination.limit, fetchReturnLeads]);

  const skeletonRows: ReturnLead[] = Array.from({ length: pagination.limit }).map((_, i) => ({
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
    return_reason: "",
    return_status: "",
    createdAt: "",
    updatedAt: "",
    returned_at: "",
  }));

  const handleApprove = async (row: ReturnLead) => {
    console.log('approve');    
    try {
      setLoading(true);
      setActionLoading(row._id);
      
      await axiosWrapper(
        "patch",
        LEADS_API.APPROVE_RETURN_LEAD,
        { 
          lead_id: row._id,           
          return_status: 'Approved' 
        },
        token ?? undefined
      );

      fetchReturnLeads(pagination.page, pagination.limit);
      
      console.log("Lead return approved successfully");
      toast.success("Lead return approved successfully");
    } catch (err:any) {
      console.error("Failed to approve return:", err);
      const message = err?.response?.data?.message || "Failed to approve return request";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
      setLoading(false);
    }
  };

  const handleReject = async (row: ReturnLead) => {
    try {
      setLoading(true);
      setActionLoading(row._id);

      await axiosWrapper(
        "patch",
        LEADS_API.REJECT_RETURN_LEAD, 
        { 
          lead_id: row._id,           
          return_status: 'Rejected' 
        },
        token ?? undefined
      );

      fetchReturnLeads(pagination.page, pagination.limit);

      console.log("Lead return rejected successfully");
      toast.success("Lead return rejected successfully");
    } catch (err: any) {
      console.error("Failed to reject return:", err);
      
      const message = err?.response?.data?.message || "Failed to reject return request";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
      setLoading(false);
    }
  };

  const handleView = (row: ReturnLead) => {
    router.push(`/admin/leads/${row._id}`);
  };

  const columns: TableColumn<ReturnLead>[] = [
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
      name: "Email",
      selector: (row) => row.email,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={180} animation="wave" />
        ) : (
          <div style={{ minWidth: "200px" }} className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis" title={row.email}>{row.email}</div>
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
      name: "Actions",
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton
            variant="rectangular"
            width={220}
            height={30}
            animation="wave"
          />
        ) : (
          <div style={{ minWidth: "240px" }} className="flex gap-2">
            <Button
              className="!bg-white !text-[#838383] border border-[#838383] hover:!bg-[#f4f4f4]"
              size="small"
              sx={{
                fontSize: "12px",
                minWidth: "60px",
                height: "28px",
                textTransform: "capitalize",
              }}
              onClick={() => handleView(row)}
              disabled={actionLoading === row._id}
            >
              View
            </Button>
            <Button
              className="!bg-green-600 !text-white hover:!bg-green-700"
              size="small"
              sx={{
                fontSize: "12px",
                minWidth: "70px",
                height: "28px",
                textTransform: "capitalize",
              }}
              onClick={() => handleApprove(row)}
              disabled={actionLoading === row._id}
            >
              {actionLoading === row._id ? "..." : "Approve"}
            </Button>
            <Button
              className="!bg-red-600 !text-white hover:!bg-red-700"
              size="small"
              sx={{
                fontSize: "12px",
                minWidth: "60px",
                height: "28px",
                textTransform: "capitalize",
              }}
              onClick={() => handleReject(row)}
              disabled={actionLoading === row._id}
            >
              {actionLoading === row._id ? "..." : "Reject"}
            </Button>
          </div>
        ),
      ignoreRowClick: true,
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
    <Box sx={{ padding: 2, marginTop: 4 }}>
      <div className="flex justify-between items-center pb-[30px]">
        <h3 className="text-[24px] text-[#1C1C1C] text-[Inter] font-semibold">
          Returned Leads
        </h3>
        {totalRows > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalRows}</span> pending return{totalRows !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={loading ? skeletonRows : returnLeads}
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
              {error}
            </Typography>
          ) : !loading && returnLeads.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: 'center', color: 'gray' }}>
               No pending return requests
            </Typography>
          ) : null
        }
      />
    </Box>
  );
}