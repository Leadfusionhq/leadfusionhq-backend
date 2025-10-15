"use client";

import { useEffect, useState, useCallback } from "react";
import { LEADS_API } from "@/utils/apiUrl";
import axiosWrapper from "@/utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DataTable, { TableColumn } from "react-data-table-component";
import { 
  Skeleton, 
  Box, 
  Button, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ConfirmDialog from '@/components/common/ConfirmDialog';

type ReturnLead = {
  _id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_number?: string;
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
  return_comments?: string;
  return_status: string; 
  return_attempts?: number;
  returned_by?: {
    _id: string;
    name: string;
  } | string;
  createdAt: string;
  updatedAt: string;
  returned_at?: string;
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

// Return reason labels mapping
const RETURN_REASON_LABELS: { [key: string]: string } = {
  'invalid_contact': 'Invalid Contact',
  'duplicate': 'Duplicate Lead',
  'not_interested': 'Not Interested',
  'wrong_location': 'Wrong Location',
  'poor_quality': 'Poor Quality',
  'other': 'Other',
};

export default function ReturnLeadsTable() {
  const [returnLeads, setReturnLeads] = useState<ReturnLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<ReturnLead | null>(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<ReturnLead | any>(null);

  // Confirm dialogs
  const [approveDialog, setApproveDialog] = useState({
    open: false,
    lead: null as ReturnLead | null,
  });
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    lead: null as ReturnLead | null,
  });

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
  }));

  // Menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, row: ReturnLead) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const handleView = (row: ReturnLead) => {
    router.push(`/admin/leads/${row._id}`);
    handleMenuClose();
  };

  const handleApprove = (row: ReturnLead) => {
    setApproveDialog({ open: true, lead: row });
    handleMenuClose();
  };

  const handleReject = (row: ReturnLead) => {
    setRejectDialog({ open: true, lead: row });
    handleMenuClose();
  };

  const confirmApprove = async () => {
    if (!approveDialog.lead) return;
    
    try {
      setLoading(true);
      setActionLoading(approveDialog.lead._id);
      
      await axiosWrapper(
        "patch",
        LEADS_API.APPROVE_RETURN_LEAD,
        { 
          lead_id: approveDialog.lead._id,           
          return_status: 'Approved' 
        },
        token ?? undefined
      );

      toast.success("Lead return approved successfully");
      setApproveDialog({ open: false, lead: null });
      fetchReturnLeads(pagination.page, pagination.limit);
    } catch (err: any) {
      console.error("Failed to approve return:", err);
      const message = err?.response?.data?.message || "Failed to approve return request";
      toast.error(message);
    } finally {
      setActionLoading(null);
      setLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectDialog.lead) return;

    try {
      setLoading(true);
      setActionLoading(rejectDialog.lead._id);

      await axiosWrapper(
        "patch",
        LEADS_API.REJECT_RETURN_LEAD, 
        { 
          lead_id: rejectDialog.lead._id,           
          return_status: 'Rejected' 
        },
        token ?? undefined
      );

      toast.success("Lead return rejected successfully");
      setRejectDialog({ open: false, lead: null });
      fetchReturnLeads(pagination.page, pagination.limit);
    } catch (err: any) {
      console.error("Failed to reject return:", err);
      const message = err?.response?.data?.message || "Failed to reject return request";
      toast.error(message);
    } finally {
      setActionLoading(null);
      setLoading(false);
    }
  };

  // Detail dialog handlers
  const handleViewDetails = (row: ReturnLead) => {
    setSelectedLeadDetail(row);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedLeadDetail(null);
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
      selector: (row) => row.phone || row.phone_number || '',
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={120} animation="wave" />
        ) : (
          <div style={{ minWidth: "130px" }} className="text-sm text-gray-600">{row.phone || row.phone_number || 'N/A'}</div>
        ),
      sortable: true,
    },
    {
      name: "Return Reason",
      selector: (row) => row.return_reason || '',
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="text" width={140} animation="wave" />
        ) : (
          <div style={{ minWidth: "160px" }} className="flex items-center gap-2">
            <Chip 
              label={RETURN_REASON_LABELS[row.return_reason || ''] || 'N/A'}
              size="small"
              color={row.return_reason === 'other' ? 'warning' : 'default'}
              sx={{ fontSize: '12px' }}
            />
            {row.return_comments && (
              <IconButton 
                size="small" 
                onClick={() => handleViewDetails(row)}
                title="View details"
              >
                <InfoOutlinedIcon fontSize="small" color="primary" />
              </IconButton>
            )}
          </div>
        ),
      sortable: true,
      width: "180px",
    },
    {
      name: "Action",
      button: true,
      cell: (row) =>
        row._id.startsWith("skeleton") ? (
          <Skeleton variant="rectangular" width={40} height={30} />
        ) : (
          <IconButton 
            size="small" 
            onClick={(e) => handleMenuClick(e, row)}
            disabled={actionLoading === row._id}
          >
            <MoreVertIcon />
          </IconButton>
        ),
      minWidth: "80px",
      maxWidth: "100px",
      ignoreRowClick: true,
      allowOverflow: true,
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
    <>
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

      {/* Three Dot Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => menuRow && handleView(menuRow)}>
          View Lead
        </MenuItem>
        <MenuItem 
          onClick={() => menuRow && handleApprove(menuRow)}
          sx={{ color: 'success.main' }}
        >
          Approve Return
          </MenuItem>
        <MenuItem 
          onClick={() => menuRow && handleReject(menuRow)}
          sx={{ color: 'error.main' }}
        >
          Reject Return
        </MenuItem>
        {menuRow?.return_comments && (
          <MenuItem onClick={() => {
            if (menuRow) handleViewDetails(menuRow);
            handleMenuClose();
          }}>
            View Details
          </MenuItem>
        )}
      </Menu>

      {/* Return Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }
        }}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '20px',
            fontWeight: '500',
            padding: '28px 28px 16px',
            color: '#374151',
            background: 'transparent',
            borderBottom: '1px solid #E5E7EB'
          }}
        >
          Return Request Details
        </DialogTitle>

        <DialogContent sx={{ padding: '24px 28px' }}>
          {selectedLeadDetail && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Lead Information */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#6B7280', 
                    fontSize: '12px', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 1 
                  }}
                >
                  Lead Information
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#F9FAFB', 
                  padding: '16px', 
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '12px' }}>
                        Lead ID
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', fontWeight: '500', fontSize: '14px' }}>
                        {selectedLeadDetail.lead_id}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '12px' }}>
                        Name
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', fontWeight: '500', fontSize: '14px' }}>
                        {selectedLeadDetail.first_name} {selectedLeadDetail.last_name}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '12px' }}>
                        Email
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#374151', 
                          fontSize: '13px',
                          wordBreak: 'break-word'
                        }}
                      >
                        {selectedLeadDetail.email}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '12px' }}>
                        Phone
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#374151', fontSize: '14px' }}>
                        {selectedLeadDetail.phone || selectedLeadDetail.phone_number || 'N/A'}
                      </Typography>
                    </div>
                  </div>
                </Box>
              </Box>

              {/* Return Information */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#6B7280', 
                    fontSize: '12px', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 1 
                  }}
                >
                  Return Information
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#FEF3C7', 
                  padding: '16px', 
                  borderRadius: '10px',
                  border: '1px solid #FDE68A'
                }}>
                  <div className="space-y-3">
                    <div>
                      <Typography variant="caption" sx={{ color: '#92400E', fontSize: '12px', fontWeight: '500' }}>
                        Return Reason
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={RETURN_REASON_LABELS[selectedLeadDetail.return_reason || ''] || 'N/A'}
                          size="small"
                          sx={{ 
                            backgroundColor: '#FCD34D',
                            color: '#92400E',
                            fontWeight: '500',
                            fontSize: '13px'
                          }}
                        />
                      </Box>
                    </div>

                    {selectedLeadDetail.return_attempts !== undefined && (
                      <div>
                        <Typography variant="caption" sx={{ color: '#92400E', fontSize: '12px', fontWeight: '500' }}>
                          Return Attempt
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#78350F', fontSize: '14px', mt: 0.5 }}>
                          {selectedLeadDetail.return_attempts} of {selectedLeadDetail.max_return_attempts || 2}
                        </Typography>
                      </div>
                    )}

                    {selectedLeadDetail.return_comments && (
                      <div>
                        <Typography variant="caption" sx={{ color: '#92400E', fontSize: '12px', fontWeight: '500' }}>
                          Additional Comments
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#78350F', 
                            fontSize: '14px',
                            mt: 0.5,
                            backgroundColor: '#FFFBEB',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #FDE68A',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6'
                          }}
                        >
                          {selectedLeadDetail.return_comments}
                        </Typography>
                      </div>
                    )}

                    <div>
                      <Typography variant="caption" sx={{ color: '#92400E', fontSize: '12px', fontWeight: '500' }}>
                        Return Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={selectedLeadDetail.return_status}
                          size="small"
                          color={
                            selectedLeadDetail.return_status === 'Approved' ? 'success' :
                            selectedLeadDetail.return_status === 'Rejected' ? 'error' :
                            'warning'
                          }
                          sx={{ fontSize: '12px', fontWeight: '500' }}
                        />
                      </Box>
                    </div>

                    {selectedLeadDetail.updatedAt && (
                      <div>
                        <Typography variant="caption" sx={{ color: '#92400E', fontSize: '12px', fontWeight: '500' }}>
                          Returned Date
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#78350F', fontSize: '14px', mt: 0.5 }}>
                          {new Date(selectedLeadDetail.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </div>
                    )}
                  </div>
                </Box>
              </Box>

              {/* Campaign Information */}
              {typeof selectedLeadDetail.campaign_id === 'object' && selectedLeadDetail.campaign_id && (
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: '#6B7280', 
                      fontSize: '12px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      mb: 1 
                    }}
                  >
                    Campaign
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: '#EFF6FF', 
                    padding: '16px', 
                    borderRadius: '10px',
                    border: '1px solid #DBEAFE'
                  }}>
                    <Typography variant="body2" sx={{ color: '#1E40AF', fontWeight: '500', fontSize: '14px' }}>
                      {selectedLeadDetail.campaign_id.name}
                    </Typography>
                    {selectedLeadDetail.campaign_id.lead_type && (
                      <Typography variant="caption" sx={{ color: '#3B82F6', fontSize: '12px' }}>
                        {selectedLeadDetail.campaign_id.lead_type}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            padding: '20px 28px 28px',
            gap: '12px',
            justifyContent: 'center',
            borderTop: '1px solid #E5E7EB'
          }}
        >
          <Button
            onClick={handleCloseDetailDialog}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '10px 24px',
              textTransform: 'none',
              fontWeight: '400',
              color: '#6B7280',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(249, 250, 251, 0.9)',
                borderColor: '#D1D5DB',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={approveDialog.open}
        title="Approve Return Request"
        message={`Are you sure you want to approve the return request for lead "${approveDialog.lead?.first_name} ${approveDialog.lead?.last_name}"? The lead will be returned and the user will be refunded.`}
        onConfirm={confirmApprove}
        onCancel={() => setApproveDialog({ open: false, lead: null })}
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={rejectDialog.open}
        title="Reject Return Request"
        message={`Are you sure you want to reject the return request for lead "${rejectDialog.lead?.first_name} ${rejectDialog.lead?.last_name}"? The user will be notified of the rejection.`}
        onConfirm={confirmReject}
        onCancel={() => setRejectDialog({ open: false, lead: null })}
      />
    </>
  );
}