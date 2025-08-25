"use client";

import { useEffect, useState,useCallback } from "react";
import { API_URL } from '@/utils/apiUrl';
import axiosWrapper from '@/utils/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import DataTable, { TableColumn } from 'react-data-table-component';
import Image from 'next/image';  
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { Skeleton, Box,Button } from "@mui/material"; 

type User = {
    _id: string;
    name: string;
    createdAt: string;
    email: string;
    isActive: boolean;
    companyName?: string;
    phoneNumber?: string;
    zipCode?: string;
    image?: string;
    isSuperAdmin?: boolean;
};


// 🔹 CHANGE: Define API response type with pagination
type ApiResponse = {
    data: User[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    message?: string;
};


export default function AdminTable() {
    const [users, setUsers] = useState<User[]>([]); 
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [pagination, setPagination] = useState<{ page: number; limit: number }>(
        {  page: 1,
          limit: 6, }
      );
    const [totalRows, setTotalRows] = useState<number>(0); 

    const token = useSelector((state: RootState) => state.auth.token);
    const router = useRouter();

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             setLoading(true);
    //             const response = await axiosWrapper('get', API_URL.GET_ALL_ADMINS, {}, token ?? undefined) as { data: User[] };
    //             setUsers(response.data);
    //             console.log(response);
    //         } catch (err) {
    //               console.error('Unable to get admin data:', err);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchData();
    // }, [token]);

    const fetchUsers = useCallback(
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
              `${API_URL.GET_ALL_ADMINS}?${params.toString()}`,
              {},
              token ?? undefined
            )) as ApiResponse;
    
            setUsers(response.data);
            setTotalRows(response.totalCount); // update pagination count
          } catch (err) {
            console.error("Unable to get admin data:", err);
            setError("Failed to fetch admins");
          } finally {
            setLoading(false);
          }
        },
        [token]
      );
    
      // 🔹 CHANGE: Trigger API call when page/limit changes
      useEffect(() => {
        if (token) {
          fetchUsers(pagination.page, pagination.limit);
        }
      }, [token, pagination.page, pagination.limit, fetchUsers]);


    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
           
            hour12: true,
        };

        return date.toLocaleString('en-US', options);
    };


    const handleEdit = (row: User) => {
        router.push(`/admin/user-management/admin/${row._id}/edit`);
    };

    const handleDelete = async (row: User) => {
        const confirmation = window.confirm(`Are you sure you want to delete ${row.name}?`);
        if (!confirmation) return;

        if (row.isSuperAdmin) {
            // alert('Super Admin cannot be deleted.');
            toast.error('Super Admin cannot be deleted.');
            return; // 🚨 Prevent further execution
        }

        try {
            setLoading(true);
            const url = API_URL.DELETE_ADMIN_BY_ID.replace(':adminId', row._id);
            await axiosWrapper('delete', url, {}, token ?? undefined);
            setUsers((prevUsers) => prevUsers.filter((user) => user._id !== row._id));
        } catch (err) {
            console.error('Failed to delete user:', err);
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const loadingSkeletonRows: User[] = Array.from({ length: pagination.limit }).map(
        (_, i) => ({
          _id: `skeleton-${i}`,
          name: "",
          createdAt: new Date().toISOString(),
          email: "",
          isActive: false,
        })
    );
    


    const columns: TableColumn<User>[] = [
        // {
        //     name: 'User ID',
        //     cell: (row) =>
        //         row._id.startsWith("skeleton") ? (
        //           <Skeleton variant="text" width={120} animation="wave" />
        //         ) : (
        //           `# ${row._id}`
        //         ),
        //     sortable: true,
        // },
        {
            name: 'User Profile',
            cell: (row) =>
                row._id.startsWith("skeleton") ? (
                  <Skeleton variant="circular" width={40} height={40} animation="wave" />
                ) : (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Image
                      src={row.image || "/images/icons/User.svg"}
                      alt={row.name}
                      width={40}
                      height={40}
                      style={{ borderRadius: "50%", marginRight: "10px" }}
                    />
                    <span>{row.name}</span>
                  </div>
                ),
            sortable: true,
        },
        {
            name: 'Date & Time',
            cell: (row) =>
                row._id.startsWith("skeleton") ? (
                  <Skeleton variant="text" width={150} animation="wave" />
                ) : (
                  formatDate(row.createdAt)
                ),
            sortable: true,
        },
        {
            name: 'Email',
            cell: (row) =>
                row._id.startsWith("skeleton") ? (
                  <Skeleton variant="text" width={180} animation="wave" />
                ) : (
                  row.email
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
              <div style={{ display: "flex", gap: "6px" }}>
                <Button
                  className="!bg-[#838383] !text-white hover:!bg-[#6b6b6b]"
                  size="small"
                  sx={{
                    fontSize: "11px",
                    minWidth: "50px",
                    height: "26px",
                    padding: "0px 6px",
                    textTransform: "capitalize",
                    fontWeight: 500,
                  }}
                  onClick={() => handleEdit(row)}
                >
                  Edit
                </Button>
        
                <Button
                  className="!bg-white !text-[#838383] hover:!bg-[#f5f5f5] border border-[#838383]"
                  size="small"
                  sx={{
                    fontSize: "11px",
                    minWidth: "50px",
                    height: "26px",
                    padding: "0px 6px",
                    textTransform: "capitalize",
                    fontWeight: 500,
                  }}
                  onClick={() => handleDelete(row)}
                >
                  Delete
                </Button>
              </div>
            ),
          minWidth: "160px",
          maxWidth: "180px",
        },
    ];

      // 🔹 CHANGE: Pagination handlers for server-side
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePerRowsChange = (newLimit: number, page: number) => {
    setPagination({ page, limit: newLimit });
  };

    const customStyles = {
        table: {
            style: {
                border: '1px solid #ddd',
            },
        },
        headCells: {
            style: {
                fontWeight: 'bold',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                padding: '24px',
                fontSize: '16px',
            },
        },
        cells: {
            style: {
                padding: '24px',
                fontSize: '16px',
                border: '1px #01010117',
            },
        },
    };

    // Loading and Error Handling
 
    if (error) {
      return <p className="text-red-500">Error: {error}</p>;
    }

    return (
        <>
        <div className="mt-[32px]">
            <div className="flex justify-between items-center pb-[30px]">
                <h3 className="text-[24px] text-[#1C1C1C] text-[Inter]">List of Admin</h3>

                <Link href="/admin/user-management/admin/add"
                    className="w-[175px] h-[52px] bg-[#1C1C1C] text-white rounded-[5px] text-center flex justify-center items-center text-[16px] no-underline"
                >
                    Add New Admin
                </Link>
            </div>

             <DataTable
                columns={columns}
                data={loading ? loadingSkeletonRows : users} // 🔹 CHANGE: use skeleton rows instead of text
                pagination
                paginationServer // 🔹 CHANGE: enable server-side pagination
                paginationTotalRows={totalRows} // 🔹 CHANGE
                paginationDefaultPage={pagination.page} // 🔹 CHANGE
                paginationPerPage={pagination.limit} // 🔹 CHANGE
                paginationRowsPerPageOptions={[6, 10, 15, 20]}
                onChangePage={handlePageChange} // 🔹 CHANGE
                onChangeRowsPerPage={handlePerRowsChange} // 🔹 CHANGE
                customStyles={customStyles}
                highlightOnHover
                striped
                dense
            />
        </div>
        </>
    );
}
