"use client";

import { useEffect, useState, useCallback } from "react";
import { LOCATION_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box } from "@mui/material";

type Location = {
  zip_code: string;
  default_city: string;
  population: number;
  county: string;
  county_fips: string;
  state: string;
  state_abbr: string;
};

type ApiResponse = {
  data: Location[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  message?: string;
};

export default function LocationTable() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  });
  const [totalRows, setTotalRows] = useState<number>(0);

  const token = useSelector((state: RootState) => state.auth.token);

  const fetchLocations = useCallback(
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
          `${LOCATION_API.GET_ALL_LOCATIONS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        setLocations(response.data);
        setTotalRows(response.totalCount);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        setError("Failed to fetch locations");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchLocations(pagination.page, pagination.limit);
    }
  }, [token, pagination.page, pagination.limit, fetchLocations]);

  // Skeleton placeholder rows (minimal to avoid unwanted values)
  const loadingSkeletonRows: Location[] = Array.from({ length: pagination.limit }).map((_, i) => ({
    zip_code: `skeleton-${i}`,
    default_city: "",
    population: 0, // Not used in cell renderer during loading
    county: "",
    county_fips: "",
    state: "",
    state_abbr: "",
  }));

  const columns: TableColumn<Location>[] = [
    {
      name: "Zip Code",
      selector: (row) => row.zip_code,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={60} animation="wave" />
        ) : (
          row.zip_code
        ),
      sortable: false,
      width: "15%",
    },
    {
      name: "City",
      selector: (row) => row.default_city,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={100} animation="wave" />
        ) : (
          row.default_city
        ),
    //   sortable: !loading,
      sortable: false,
      width: "25%",
    },
    {
      name: "Population",
      selector: (row) => row.population,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={80} animation="wave" />
        ) : (
          row.population.toLocaleString()
        ),
      sortable: false,
      right: true,
      width: "15%",
    },
    {
      name: "County",
      selector: (row) => row.county,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          row.county
        ),
      sortable: false,
      width: "25%",
    },
    {
      name: "State",
      selector: (row) => `${row.state} (${row.state_abbr})`,
      cell: (row) =>
        row.zip_code.startsWith("skeleton") ? (
          <Skeleton variant="text" width={80} animation="wave" />
        ) : (
          `${row.state} (${row.state_abbr})`
        ),
      sortable: false,
      width: "20%",
    },
  ];

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePerRowsChange = (newLimit: number, page: number) => {
    setPagination({ page, limit: newLimit });
  };

  const customStyles = {
    table: {
      style: {
        border: "1px solid #ddd",
        borderRadius: "4px",
        overflow: "hidden",
      },
    },
    headCells: {
      style: {
        fontWeight: "bold",
        backgroundColor: "#000000",
        color: "#FFFFFF",
        padding: "24px",
        fontSize: "16px",
        zIndex: 1,
      },
    },
    cells: {
      style: {
        padding: "24px",
        fontSize: "16px",
        borderBottom: "1px solid rgba(1, 1, 1, 0.09)",
      },
    },
  };

  if (error) return <p>Error: {error}</p>;

  return (
    <Box sx={{ padding: 2 }}>
      <h3 className="text-2xl mb-4">List of Locations</h3>

      <DataTable
        columns={columns}
        data={loading ? loadingSkeletonRows : locations}
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        paginationDefaultPage={pagination.page}
        paginationPerPage={pagination.limit}
        paginationRowsPerPageOptions={[10, 50, 100]}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        customStyles={customStyles}
        highlightOnHover
        striped
        dense
        progressPending={false}
      />
    </Box>
  );
}