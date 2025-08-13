"use client";

import { useEffect, useState, useCallback } from "react";
import { CAMPAIGNS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography } from "@mui/material";
import Link from 'next/link';

type Campaign = {
  zip_code: string;
  default_city: string;
  population: number;
  county: string;
  county_fips: string;
  state: string;
  state_abbr: string;
  verticals?: string;
  bid_price?: number;
  status?: string;
};

type ApiResponse = {
  data: Campaign[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  message?: string;
};

export default function LocationTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);

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

        setCampaigns(response.data);
        setTotalRows(response.totalCount);
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
    zip_code: `skeleton-${i}`,
    default_city: "",
    population: 0,
    county: "",
    county_fips: "",
    state: "",
    state_abbr: "",
  }));

  const columns: TableColumn<Campaign>[] = [
    {
      name: "Campaigns",
      selector: (row) => row.default_city,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={100} animation="wave" />
        ) : (
          row.default_city
        ),
      sortable: false,
    },
    {
      name: "Verticals",
      selector: (row) => row.verticals ?? "",
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={80} animation="wave" />
        ) : (
          row.verticals ?? "-"
        ),
      sortable: false,
    },
    {
      name: "Bid Price",
      selector: (row) => row.bid_price ?? 0,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={60} animation="wave" />
        ) : (
          `$${(row.bid_price ?? 0).toFixed(2)}`
        ),
      sortable: false,
      right: true,
    },
    {
      name: "State",
      selector: (row) => row.state_abbr,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={40} animation="wave" />
        ) : (
          `${row.state} (${row.state_abbr})`
        ),
      sortable: false,
    },
    {
      name: "Status",
      selector: (row) => row.status ?? "",
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={60} animation="wave" />
        ) : (
          row.status ?? "-"
        ),
      sortable: false,
    },
    {
      name: "Action",
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="rectangular" width={100} height={30} animation="wave" />
        ) : (
          <>
            <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }}>
              Edit
            </Button>
            <Button size="small" variant="outlined" color="secondary">
              Summary
            </Button>
          </>
        ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
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
        backgroundColor: "#000000",
        color: "#FFFFFF",
        padding: "20px",
        fontSize: "16px",
      },
    },
    cells: {
      style: {
        padding: "16px",
        fontSize: "15px",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
      },
    },
  };

  const errorRow = [
    {
      zip_code: "error",
      default_city: "",
      population: 0,
      county: "",
      county_fips: "",
      state: "",
      state_abbr: "",
      verticals: "",
      bid_price: 0,
      status: "",
    },
  ];

  return (
    <Box sx={{ padding: 2 }}>
      <div className="flex justify-between items-center pb-[30px]">
            <h3 className="text-[24px] text-[#1C1C1C] text-[Inter]">List of Campaigns</h3>
          <Link href="/dashboard/campaigns/add"
              className="w-[175px] h-[52px] bg-[#1C1C1C] text-white rounded-[5px] text-center flex justify-center items-center text-[16px] no-underline"
          >
              Add New Campaign
          </Link>
      </div>

    <DataTable
      columns={columns}
      data={[]}
      customStyles={customStyles}
      pagination
      paginationServer
      paginationTotalRows={totalRows}
      paginationDefaultPage={pagination.page}
      paginationPerPage={pagination.limit}
      paginationRowsPerPageOptions={[10, 50, 100]}
      onChangePage={handlePageChange}
      onChangeRowsPerPage={handlePerRowsChange}
      highlightOnHover
      striped
      dense
      persistTableHead
      progressPending={loading} 
      progressComponent={ 
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto my-4"></div>
      }
      noDataComponent={
        error ? (
          <Typography color="error" sx={{ py: 2 }}>
            ⚠️ {error}
          </Typography>
        ) : (
          <Typography sx={{ py: 2 }}>No data available</Typography>
        )
      }
    />




    </Box>
  );
}
