import { useState, useEffect, useCallback } from 'react';
import {
    Drawer,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    CircularProgress,
    Pagination,
    Button,
    Stack,
    Chip
} from '@mui/material';
import { X, RefreshCcw } from 'lucide-react';
import { API_URL, BILLING_API } from '@/utils/apiUrl';
import axiosWrapper from '@/utils/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Transaction, TransactionsResponse } from '@/types/wallet';

interface UserTransactionsDrawerProps {
    open: boolean;
    onClose: () => void;
    userId: string | null;
    userName: string;
}

export default function UserTransactionsDrawer({
    open,
    onClose,
    userId,
    userName
}: UserTransactionsDrawerProps) {
    const token = useSelector((state: RootState) => state.auth.token);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchTransactions = useCallback(async () => {
        if (!userId || !open) return;

        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                userId: userId // Passing userId to filter by specific user
            };

            const response = await axiosWrapper(
                "get",
                BILLING_API.USERS_TRANSACTIONS,
                { params },
                token || undefined
            ) as TransactionsResponse;

            if (response && response.transactions) {
                setTransactions(response.transactions);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                    setTotalCount(response.pagination.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch user transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [userId, open, page, token]);

    useEffect(() => {
        if (open) {
            fetchTransactions();
        } else {
            // Reset state when closed
            setTransactions([]);
            setPage(1);
        }
    }, [open, userId, fetchTransactions]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: { xs: '100%', md: '80vw', lg: '70vw', xl: '60vw' }, maxWidth: '1400px' }
            }}
        >
            <Box className="flex flex-col h-full bg-white">
                {/* Header */}
                <Box className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <Typography variant="h4" className="font-bold text-gray-900 tracking-tight">
                            Transaction History
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" className="mt-2">
                            <Typography variant="body2" className="text-gray-500 font-medium">
                                Transactions for:
                            </Typography>
                            <Chip
                                label={userName}
                                size="small"
                                className="font-semibold bg-gray-100 text-gray-700 border-none"
                            />
                        </Stack>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={fetchTransactions}
                            disabled={loading}
                            variant="outlined"
                            color="inherit"
                            className="border-gray-200 text-gray-700 hover:bg-gray-50"
                            startIcon={<RefreshCcw size={16} className={loading ? "animate-spin" : ""} />}
                        >
                            Refresh
                        </Button>
                        <IconButton
                            onClick={onClose}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors w-10 h-10 rounded-full"
                        >
                            <X size={20} />
                        </IconButton>
                    </div>
                </Box>

                {/* Content */}
                <Box className="flex-1 overflow-auto bg-gray-50/30 p-8">

                    {loading ? (
                        <Box className="flex flex-col items-center justify-center h-64 gap-3">
                            <CircularProgress size={40} thickness={4} className="text-black" />
                            <Typography variant="body2" className="text-gray-500 font-medium animate-pulse">Loading transaction data...</Typography>
                        </Box>
                    ) : transactions.length > 0 ? (
                        <Paper elevation={0} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                            <TableContainer className="max-h-[calc(100vh-250px)]">
                                <Table stickyHeader size="medium">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell className="bg-gray-50/90 backdrop-blur-sm px-6 py-5 border-b border-gray-100 min-w-[140px]">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date & Time</span>
                                            </TableCell>
                                            <TableCell className="bg-gray-50/90 backdrop-blur-sm px-6 py-5 border-b border-gray-100">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type</span>
                                            </TableCell>
                                            <TableCell className="bg-gray-50/90 backdrop-blur-sm px-6 py-5 border-b border-gray-100 w-[35%]">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</span>
                                            </TableCell>
                                            <TableCell className="bg-gray-50/90 backdrop-blur-sm px-6 py-5 border-b border-gray-100">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Method</span>
                                            </TableCell>
                                            <TableCell className="bg-gray-50/90 backdrop-blur-sm px-6 py-5 border-b border-gray-100 text-right">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</span>
                                            </TableCell>
                                            <TableCell className="bg-gray-50/90 backdrop-blur-sm px-6 py-5 border-b border-gray-100 text-right">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Balance</span>
                                            </TableCell>
                                            <TableCell className="bg-gray-50/90 backdrop-blur-sm px-6 py-5 border-b border-gray-100 text-center">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</span>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {transactions.map((tx) => {
                                            const isCredit = ['ADD_FUNDS', 'ADMIN_ADD_FUNDS', 'REFUND', 'PAYMENT_RECOVERY'].includes(tx.type);
                                            return (
                                                <TableRow key={tx._id} hover className="group transition-colors border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                                    <TableCell className="px-6 py-4 align-top">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-gray-900 text-sm">
                                                                {new Date(tx.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-medium">
                                                                {new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="text-[10px] text-gray-300 font-mono mt-1 group-hover:text-gray-400 transition-colors">
                                                                #{tx.transactionId || tx._id.slice(-8)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 align-top">
                                                        <Chip
                                                            label={tx.type.replace(/_/g, ' ')}
                                                            size="small"
                                                            className={`uppercase text-[10px] font-bold tracking-wide rounded-lg border-0 ${isCredit
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : tx.type === 'LEAD_ASSIGNMENT'
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 align-top">
                                                        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap break-words">
                                                            {tx.description || "—"}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-gray-900">
                                                                    {tx.paymentMethod === 'CARD' ? 'Card Payment' : (tx.paymentMethod?.replace('_', ' ') || 'Wallet Balance')}
                                                                </span>
                                                            </div>
                                                            {tx.paymentMethod === 'CARD' && tx.paymentMethodDetails && (
                                                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded w-fit border border-gray-100">
                                                                    {tx.paymentMethodDetails.brand} •••• {tx.paymentMethodDetails.lastFour}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-right align-top">
                                                        <span className={`font-bold text-base ${isCredit
                                                            ? 'text-emerald-600'
                                                            : 'text-gray-900'
                                                            }`}>
                                                            {isCredit ? '+' : '-'} ${Math.abs(tx.amount).toFixed(2)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-right align-top">
                                                        <span className="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-md">
                                                            ${tx.balanceAfter?.toFixed(2) || '--'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-center align-top">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tx.status === 'COMPLETED' || tx.status === 'SUCCESS'
                                                            ? 'bg-white text-emerald-700 border-emerald-200'
                                                            : tx.status === 'PENDING'
                                                                ? 'bg-white text-amber-700 border-amber-200'
                                                                : 'bg-white text-red-700 border-red-200'
                                                            }`}>
                                                            {tx.status}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>

                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    ) : (
                        <Box className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <RefreshCcw className="h-8 w-8 text-gray-400" />
                            </div>
                            <Typography variant="h6" className="font-bold text-gray-900 mb-1">
                                No transactions found
                            </Typography>
                            <Typography variant="body2" className="text-gray-500 max-w-sm">
                                This user hasn't made any transactions yet. When they do, they will appear here.
                            </Typography>
                        </Box>
                    )}

                    {/* Pagination */}
                    {!loading && transactions.length > 0 && (
                        <Box className="flex justify-center mt-8">
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                shape="rounded"
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
}
