"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from '@/utils/apiUrl';
import axiosWrapper from '@/utils/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import DataTable, { TableColumn } from 'react-data-table-component';
import Image from 'next/image';  
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Skeleton, Box, Button, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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
    balance?: number;
};

type ApiResponse = {
    data: User[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
};

export default function UserTable() {
    const [users, setUsers] = useState<User[]>([]); 
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [pagination, setPagination] = useState<{ page: number; limit: number }>({
        page: 1,
        limit: 6,
    });

    const [totalRows, setTotalRows] = useState<number>(0);

    const token = useSelector((state: RootState) => state.auth.token);
    const router = useRouter();

    const fetchUsers = useCallback(
        async (pageNumber:number,pageSize:number) => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    page: pageNumber.toString(),
                    limit: pageSize.toString(),
                });

                const response = (await axiosWrapper(
                    "get",
                    `${API_URL.GET_ALL_USERS}?${params.toString()}`,
                    {},
                    token ?? undefined
                )) as ApiResponse;

                setUsers(response.data); 
                setTotalRows(response.totalCount); 
            }
            catch (err) {
                console.error("Unable to get users:", err);
                setError("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (token) {
          fetchUsers(pagination.page, pagination.limit);
        }
    }, [token, pagination.page, pagination.limit, fetchUsers]);

    const loadingSkeletonRows: User[] = Array.from({ length: pagination.limit }).map(
        (_, i) => ({
          _id: `skeleton-${i}`,
          name: "",
          createdAt: "",
          email: "",
          isActive: false,
          companyName: "",
          image: "",
        })
    );

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
        router.push(`/admin/user-management/user/${row._id}/edit`);
    };

    const handleAddBalance = (row:User) =>{
      console.log(row._id);
      router.push(`/admin/user-management/user/${row._id}/addBalance`);
    }

    const handleAddCampaign = (row:User) =>{
      // console.log(row._id);
      router.push(`/admin/campaigns/user/${row._id}/add`);
    }

    const handleDelete = async (row: User) => {
        const confirmation = window.confirm(`Are you sure you want to delete ${row.name}?`);
        if (!confirmation) return;
        try {
            setLoading(true);

            const url = API_URL.DELETE_USER_BY_ID.replace(':userId', row._id);
            await axiosWrapper('delete', url, {}, token ?? undefined);
            setUsers((prevUsers) => prevUsers.filter((user) => user._id !== row._id));
        } catch (err) {
            console.error('Failed to delete user:', err);
        } finally {
            setLoading(false);
        }
    };

    // State for action menu
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [menuRow, setMenuRow] = useState<User | null>(null);

    const isMenuOpen = Boolean(menuAnchorEl);

    const handleMenuClick = (
      event: React.MouseEvent<HTMLButtonElement>,
      row: User
    ) => {
      setMenuAnchorEl(event.currentTarget);
      setMenuRow(row);
    };

    const handleMenuClose = () => {
      setMenuAnchorEl(null);
      setMenuRow(null);
    };

    const columns: TableColumn<User>[] = [
        {
            name: 'User Profile',
            cell: (row) =>
                row._id.startsWith("skeleton") ? (
                  <Skeleton variant="circular" width={40} height={40} />
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
            name: 'Company',
            selector: (row: User) => row.companyName || '',
            cell: (row) =>
                row._id.startsWith("skeleton") ? (
                  <Skeleton variant="text" width={120} />
                ) : (
                  row.companyName
                ),
              sortable: true,
        },
        {
            name: 'Date & Time',
            selector: (row: User) => formatDate(row.createdAt),
            cell: (row) =>
                row._id.startsWith("skeleton") ? (
                  <Skeleton variant="text" width={150} />
                ) : (
                  formatDate(row.createdAt)
                ),
              sortable: true,
        },
        {
            name: 'Email',
            selector: (row: User) => row.email,
            cell: (row) =>
                row._id.startsWith("skeleton") ? (
                  <Skeleton variant="text" width={180} />
                ) : (
                  row.email
                ),
              sortable: true,
        },
        {
          name: "Balance",
          selector: (row: User & { balance?: number }) =>
            row.balance !== undefined ? row.balance.toString() : "0",
          cell: (row) =>
            row._id.startsWith("skeleton") ? (
              <Skeleton variant="text" width={100} />
            ) : (
              <span>$ {row.balance ?? 0}</span> 
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
        },
    ];

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

    return (
        <>
        <div className="">
            <div className="flex justify-between items-center pb-[30px]">
                <h3 className="text-[24px] text-[#1C1C1C] text-[Inter]">List of Users</h3>

                <Link href="/admin/user-management/user/add"
                    className="w-[175px] h-[52px] bg-[#1C1C1C] text-white rounded-[5px] text-center flex justify-center items-center text-[16px] no-underline"
                >
                    Add New User
                </Link>
            </div>

            <DataTable
                columns={columns}
                data={loading ? loadingSkeletonRows : users} 
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                paginationDefaultPage={pagination.page} 
                paginationPerPage={pagination.limit}
                paginationRowsPerPageOptions={[6, 10, 15, 20]}
                onChangePage={(page) => setPagination((prev) => ({ ...prev, page }))} 
                onChangeRowsPerPage={(newLimit, page) => setPagination({ page, limit: newLimit })} 
                customStyles={customStyles}
                highlightOnHover
                striped
                dense
            />

            {/* Action menu */}
            <Menu
              anchorEl={menuAnchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem
                onClick={() => {
                  if (menuRow) handleAddBalance(menuRow);
                  handleMenuClose();
                }}
              >
                Add Balance
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (menuRow) handleAddCampaign(menuRow);
                  handleMenuClose();
                }}
              >
                Add Campaign
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (menuRow) handleEdit(menuRow);
                  handleMenuClose();
                }}
              >
                Edit User Account
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (menuRow) handleDelete(menuRow);
                  handleMenuClose();
                }}
              >
                Delete User Account
              </MenuItem>
            </Menu>
        </div>
        </>
    );
}
