"use client";

import { useEffect, useState, useCallback } from "react";
import { LEADS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import customStyles from "@/components/common/dataTableStyles";

// Define Lead type
type Lead = {
  _id: string;
  lead_id:string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
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
    lead_id:"",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
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
  }));

  // Columns for the lead table
  const columns: TableColumn<Lead>[] = [
    {
      name: "Lead ID",
      selector: (row) => `${row.lead_id}`,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{`${row.lead_id}`}</div>
        ),
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Name",
      selector: (row) => `${row.first_name} ${row.last_name}`,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{`${row.first_name} ${row.last_name}`}</div>
        ),
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Email",
      selector: (row) => row.email,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={150} animation="wave" />
        ) : (
          <div className="font-medium text-gray-900">{row.email}</div>
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
      selector: (row) => row.address.state,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600">{row.address.state}</div>
        ),
      sortable: true,
      minWidth: "130px",
    },
    {
      name: "Campaign",
      selector: (row) =>
        typeof row.campaign_id === "object" && row.campaign_id !== null
          ? row.campaign_id._id
          : row.campaign_id,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={100} animation="wave" />
        ) : (
          <div className="text-sm text-gray-600">
            {typeof row.campaign_id === "object" && row.campaign_id !== null
              ? row.campaign_id.name
              : row.campaign_id}
          </div>
        ),
      sortable: true,
      minWidth: "150px",
    },
    // {
    //   name: "Lead Type",
    //   selector: (row) => row.lead_type,
    //   cell: (row) =>
    //     row._id.startsWith("skeleton") ? (
    //       <Skeleton variant="text" width={100} animation="wave" />
    //     ) : (
    //       <div className="text-sm text-gray-600">{row.lead_type}</div>
    //     ),
    //   sortable: true,
    //   minWidth: "150px",
    // },
    // {
    //   name: "Actions",
    //   cell: (row) =>
    //     row._id.startsWith("skeleton") ? (
    //       <Skeleton variant="text" width={100} animation="wave" />
    //     ) : (
    //       <div className="flex gap-2">
    //         <Button
    //           className="!bg-[#838383] !text-white hover:!bg-[#6b6b6b]"
    //           size="small"
    //           sx={{
    //             fontSize: "12px",
    //             minWidth: "60px",
    //             height: "28px",
    //             textTransform: "capitalize",
    //           }}
    //           onClick={() => handleEdit(row)}
    //         >
    //           Edit
    //         </Button>
    //         <Button
    //           className="!bg-white !text-[#838383] border border-[#838383] hover:!bg-[#f4f4f4]"
    //           size="small"
    //           sx={{
    //             fontSize: "12px",
    //             minWidth: "70px",
    //             height: "28px",
    //             textTransform: "capitalize",
    //           }}
    //           // onClick={() => handleView(row)} // ✳️ Add this function if needed
    //         >
    //           View
    //         </Button>
    //       </div>
    //     ),
    //   minWidth: "150px",
    // },
  ];

  const handleEdit = (row: Lead) => {
    router.push(`/dashboard/leads/${row._id}/edit`);
  };

  const handleView = (row: Lead) => {
    router.push(`/admin/leads/${row._id}`);
  };

  return (
    <Box>
      <Typography variant="h6">Leads</Typography>
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={500} />
      ) : (
        <DataTable
          columns={columns}
          data={leads.length > 0 ? leads : skeletonRows}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          onChangePage={(page) => setPagination((prev) => ({ ...prev, page }))}
          onChangeRowsPerPage={(limit) => setPagination((prev) => ({ ...prev, limit }))}
          customStyles={customStyles}
        />
      )}
    </Box>
  );
}
