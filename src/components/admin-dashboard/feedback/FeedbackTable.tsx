"use client";

import { useEffect, useState, useCallback } from "react";
import { FEEDBACK_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { Skeleton, Box, Button, Typography, IconButton } from "@mui/material";
import { toast } from "react-toastify";

import SearchIcon from '@mui/icons-material/Search';

import ConfirmDialog from "@/components/common/ConfirmDialog";
import ContentViewModal from "@/components/common/ContentViewModal";

// Define Feedback type
type Feedback = {
  _id: string;
  title: string;
  description: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  feedbacks: Feedback[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  message?: string;
};

export default function FeedbackTable() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);


  // Fetch feedbacks with pagination
  const fetchFeedbacks = useCallback(
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
          `${FEEDBACK_API.GET_ALL_FEEDBACKS}?${params.toString()}`,
          {},
          token ?? undefined
        )) as ApiResponse;

        console.log("Feedbacks Response:", response);
        setFeedbacks(response.feedbacks || []);
        setFilteredFeedbacks(response.feedbacks || []);
        setTotalRows(response.pagination?.total || 0);
      } catch (err) {
        console.error("Failed to fetch feedbacks:", err);
        setError("Failed to fetch feedbacks");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Filter feedbacks based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredFeedbacks(feedbacks);
    } else {
      const filtered = feedbacks.filter(feedback => 
        feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.user_id.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.user_id.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFeedbacks(filtered);
    }
  }, [searchTerm, feedbacks]);

  // Fetch feedbacks on mount or pagination change
  useEffect(() => {
    if (token) {
      fetchFeedbacks(pagination.page, pagination.limit);
    }
  }, [token, pagination.page, pagination.limit, fetchFeedbacks]);

  // Open view modal
  const handleViewClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setViewModalOpen(true);
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedFeedback(null);
  };



  // Open confirm dialog for delete
  const handleDeleteClick = (id: string) => {
    setFeedbackToDelete(id);
    setConfirmOpen(true);
  };

  // Handle confirm delete

  const handleConfirmDelete = async () => {
    if (!feedbackToDelete) return;
  
    try {
      const response = (await axiosWrapper(
        "delete",
        FEEDBACK_API.DELETE_FEEDBACK.replace(':feedbackId', feedbackToDelete),
        {},
        token ?? undefined
      )) as { message?: string };
  
      if (response.message) {
        toast.success(response.message || "Feedback deleted successfully!");
        
        // ✅ Update both feedbacks and filteredFeedbacks properly
        const updatedFeedbacks = feedbacks.filter(feedback => feedback._id !== feedbackToDelete);
        const updatedFilteredFeedbacks = filteredFeedbacks.filter(feedback => feedback._id !== feedbackToDelete);
        
        setFeedbacks(updatedFeedbacks);
        setFilteredFeedbacks(updatedFilteredFeedbacks);
        
        // ✅ Check pagination based on updated filtered results, not original
        if (updatedFilteredFeedbacks.length === 0 && pagination.page > 1) {
          // If no items left on current page and we're not on page 1, go to previous page
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
        } else {
          // Just update the total count
          setTotalRows(prev => Math.max(0, prev - 1));
        }
      } else {
        toast.error("Failed to delete feedback");
      }
    } catch (err: any) {
      console.error("Failed to delete feedback:", err);
      toast.error(err.response?.data?.message || "An error occurred while deleting feedback");
    } finally {
      setConfirmOpen(false);
      setFeedbackToDelete(null);
    }
  };
  
  // Handle cancel delete
  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setFeedbackToDelete(null);
  };

  const skeletonRows: Feedback[] = Array.from({ length: pagination.limit }).map((_, i) => ({
    _id: `skeleton-${i}`,
    title: "",
    description: "",
    user_id: {
      _id: "",
      name: "",
      email: ""
    },
    createdAt: "",
    updatedAt: ""
  }));

  // Columns for the feedback table
// Update your FeedbackTable component columns
const columns: TableColumn<Feedback>[] = [
  {
    name: "Title",
    selector: (row) => row.title,
    cell: (row) =>
      row._id.startsWith("skeleton") ? (
        <Skeleton variant="text" width={150} animation="wave" />
      ) : (
        <div 
          className="font-medium text-gray-900 cursor-pointer hover:text-grey-600 hover:underline"
          onClick={() => handleViewClick(row)}
        >
          {row.title}
        </div>
      ),
    sortable: true,
    minWidth: "150px", // This should be at the column level, not cell level
  },
  {
    name: "Description",
    selector: (row) => row.description,
    cell: (row) =>
      row._id.startsWith("skeleton") ? (
        <Skeleton variant="text" width={200} animation="wave" />
      ) : (
        <div 
          className="text-sm text-gray-600 line-clamp-2 cursor-pointer hover:text-grey-600"
          onClick={() => handleViewClick(row)}
        >
          {row.description.length > 100 
            ? `${row.description.substring(0, 100)}...` 
            : row.description}
        </div>
      ),
    sortable: true,
    minWidth: "250px", // This should be at the column level, not cell level
  },
  {
    name: "Sent By",
    selector: (row) => row.user_id.name,
    cell: (row) =>
      row._id.startsWith("skeleton") ? (
        <Skeleton variant="text" width={120} animation="wave" />
      ) : (
        <div className="text-sm text-gray-600">
          <div className="font-medium">{row.user_id.name}</div>
          <div className="text-xs text-gray-500">{row.user_id.email}</div>
        </div>
      ),
    sortable: true,
    minWidth: "180px", // This should be at the column level, not cell level
  },
  {
    name: "Created Date",
    selector: (row) => row.createdAt,
    cell: (row) =>
      row._id.startsWith("skeleton") ? (
        <Skeleton variant="text" width={120} animation="wave" />
      ) : (
        <div className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      ),
    sortable: true,
    minWidth: "150px", // This should be at the column level, not cell level
  },



          {
            name: "Action",
            button: true,
            cell: (row) =>
              row._id.startsWith("skeleton") ? (
                <Skeleton
                  variant="rectangular"
                  width={50}
                  height={30}
                  animation="wave"
                />
              ) : (
                <div style={{ display: "flex", gap: "6px" }}>
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
                    onClick={() => handleViewClick(row)}
                  >
                    View
                  </Button>
          
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
                    onClick={() => handleDeleteClick(row._id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
            minWidth: "160px",
            maxWidth: "180px",
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
        <h3 className="text-[24px] text-[#1C1C1C] text-[Inter] font-semibold">User Feedback</h3>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search feedback by title, description, or user..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={loading ? skeletonRows : filteredFeedbacks}
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
          ) : !loading && filteredFeedbacks.length === 0 ? (
            searchTerm ? (
              <Typography sx={{ py: 4, textAlign: 'center', color: 'gray' }}>
                🔍 No feedback found matching &quot;{searchTerm}&quot;
              </Typography>
            ) : (
              <Typography sx={{ py: 4, textAlign: 'center', color: 'gray' }}>
                📝 No feedback submitted yet.
              </Typography>
            )
          ) : null
        }
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

        {/* View Modal */}
        <ContentViewModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        title={selectedFeedback?.title || ""}
        content={selectedFeedback?.description || ""}
        // createdAt={selectedFeedback?.createdAt}
        user={selectedFeedback?.user_id}
      />
    </Box>
  );
}