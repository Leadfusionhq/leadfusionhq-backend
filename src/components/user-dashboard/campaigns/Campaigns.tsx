"use client";

import { useEffect, useState, useCallback } from "react";
import { CAMPAIGNS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography } from "@mui/material";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Campaign = {
  _id: string;
  name: string;
  status: string;
  lead_type: string;
  exclusivity: string;
  // bid_price: number;
  language: string;
  geography: {
    state: string;
    coverage: {
      type: string;
    };
  };
  delivery: {
    method: string;
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

export default function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const router = useRouter();

  const token = useSelector((state: RootState) => state.auth.token);

  const fetchCampaigns = useCallback(
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

  useEffect(() => {
    if (token) {
      fetchCampaigns(pagination.page, pagination.limit);
    }
  }, [token, pagination.page, pagination.limit, fetchCampaigns]);

  const skeletonRows: Campaign[] = Array.from({ length: pagination.limit }).map((_, i) => ({
    _id: `skeleton-${i}`,
    name: "",
    status: "",
    lead_type: "",
    exclusivity: "",
    // bid_price: 0,
    language: "",
    geography: {
      state: "",
      coverage: { type: "" }
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

  const columns: TableColumn<Campaign>[] = [
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
      name: "Exclusivity",
      selector: (row) => row.exclusivity,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={80} animation="wave" />
        ) : (
          <div className="text-sm">{formatExclusivity(row.exclusivity)}</div>
        ),
      sortable: true,
      minWidth: "110px",
    },
    // {
    //   name: "Bid Price",
    //   selector: (row) => row.bid_price,
    //   cell: (row) =>
    //     row._id.startsWith("skeleton") ? (
    //       <Skeleton variant="text" width={60} animation="wave" />
    //     ) : (
    //       <div className="font-semibold text-green-600">${row.bid_price.toFixed(2)}</div>
    //     ),
    //   sortable: true,
    //   right: true,
    //   minWidth: "100px",
    // },
    {
      name: "Delivery Method",
      selector: (row) => row.delivery.method,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={70} animation="wave" />
        ) : (
          <div className="capitalize text-sm">{row.delivery.method}</div>
        ),
      sortable: true,
      minWidth: "120px",
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
          className="!bg-[#838383] !text-white hover:!bg-[#6b6b6b]"
          size="small"
          sx={{
            fontSize: "12px",
            minWidth: "60px",
            height: "28px",
            textTransform: "capitalize",
          }}
          onClick={() => handleEdit(row)}
        >
          Edit
        </Button>
        <Button
          className="!bg-white !text-[#838383] border border-[#838383] hover:!bg-[#f4f4f4]"
          size="small"
          sx={{
            fontSize: "12px",
            minWidth: "70px",
            height: "28px",
            textTransform: "capitalize",
          }}
          // onClick={() => handleView(row)} // ✳️ Add this function if needed
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
        <h3 className="text-[24px] text-[#1C1C1C] text-[Inter] font-semibold">List of Campaigns</h3>
        <Link href="/dashboard/campaigns/add"
          className="w-[175px] h-[52px] bg-[#1C1C1C] text-white rounded-[5px] text-center flex justify-center items-center text-[16px] no-underline hover:bg-[#333333] transition-colors"
        >
          Add New Campaign
        </Link>
      </div>

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
        progressPending={false} // We handle loading with skeleton rows
        noDataComponent={
          error ? (
            <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>
              ⚠️ {error}
            </Typography>
          ) : !loading && campaigns.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: 'center', color: 'gray' }}>
              📝 No campaigns found. Create your first campaign!
            </Typography>
          ) : null
        }
      />
    </Box>
  );
}