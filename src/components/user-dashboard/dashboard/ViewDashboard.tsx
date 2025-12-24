'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  AlertCircle,
  Plus,
  Eye,
  Wallet,
  Download
} from 'lucide-react';
import { Skeleton, Chip, IconButton } from '@mui/material';
import Link from 'next/link';
import axiosWrapper from "@/utils/api";
import { DASHBOARD_API } from "@/utils/apiUrl";
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getErrorMessage } from "@/utils/getErrorMessage";

// --- Interfaces ---

interface ChartDataPoint {
  date: string;
  count: number;
}

interface RecentLead {
  id: string;
  name: string;
  campaign_name: string;
  status: string;
  payment_status: string;
  created_at: string;
}

interface CampaignPerformance {
  id: string;
  name: string;
  total_leads: number;
  status: string;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface DashboardData {
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    completed_campaigns: number;
    total_leads: number;
  };
  lead_metrics: {
    active: number;
    pending_return: number;
    returned: number;
    rejected_return: number;
    payment_pending: number;
  };
  billing: {
    current_balance: number;
    spent_this_period: number;
    added_this_period: number;
    currency: string;
    is_low_balance: boolean;
    last_payment?: {
      amount: number;
      date: string;
    };
  };
  charts: {
    leads_trend: ChartDataPoint[]; // Renamed to leads_trend to match new API
    returned_leads_trend?: ChartDataPoint[]; // Optional, fallback to leads_trend if missing
  };
  recent_leads: RecentLead[];
  campaign_performance: CampaignPerformance[];
  recent_activity: RecentActivity[];
}

export default function ClientDashboard() {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<string>('30d');

  const handlePrint = () => {
    window.print();
  };

  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      // Pass the date range filter to the API
      const res = await axiosWrapper(
        "get",
        DASHBOARD_API.USER_DASHBOARD_DATA,
        { range: dateRange }, // Send range param
        token ?? undefined
      ) as any;

      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, dateRange]); // Refetch when dateRange changes

  // Skeleton loading card component
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={36} sx={{ mt: 1 }} />
    </div>
  );

  // Skeleton chart component
  const SkeletonChart = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={120} height={20} />
          </div>
          <Skeleton variant="text" width={80} height={36} />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 1 }} />
    </div>
  );

  const getStatusColor = (status: string): "success" | "info" | "primary" | "warning" | "error" | "default" => {
    const s = status?.toLowerCase() || "";
    if (s === "active" || s === "paid" || s === "approved" || s === "new") return "success";
    if (s === "contacted" || s === "returned") return "info";
    if (s === "completed" || s === "converted") return "primary";
    if (s === "pending" || s === "paused") return "warning";
    if (s === "rejected" || s === "unpaid") return "error";
    return "default";
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.name || 'User'}! Here&apos;s what&apos;s happening.
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="all_time">All Time</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {
        data?.billing?.is_low_balance && (
          <div className="mb-8 bg-orange-50 rounded-xl border border-orange-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Low Account Balance</h4>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Current balance: <span className="font-medium text-orange-700">${data.billing.current_balance.toFixed(2)}</span>. Minimum recommended: $100.00
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard/billing-control")}
                className="px-4 py-2 bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-sm font-semibold shadow-sm"
              >
                Add Funds
              </button>
            </div>
          </div>
        )
      }

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : data && (
          <>
            {/* Total Leads */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-gray-900">{data.summary.total_leads.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">Total Leads</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-green-600 font-semibold">
                  {data.lead_metrics.active} Active
                </span>
                <span className="text-xs text-red-600 font-semibold">
                  {data.lead_metrics.returned} Returned
                </span>
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-gray-900">${data.billing.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <span className="text-xs text-gray-500">Account Balance</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs">
                <div className="flex flex-col">
                  <span className="text-gray-500">Spent Today</span>
                  <span className="font-semibold text-gray-900">${data.billing.spent_this_period?.toFixed(2) ?? '0.00'}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-500">Added</span>
                  <span className="font-semibold text-green-600">+${data.billing.added_this_period?.toFixed(2) ?? '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Total Campaigns */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-gray-900">{data.summary.total_campaigns.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">Total Campaigns</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-green-600 font-semibold">
                  {data.summary.active_campaigns} Active
                </span>
                <span className="text-xs text-orange-600 font-semibold">
                  {data.summary.total_campaigns - data.summary.active_campaigns} Pending
                </span>
              </div>
            </div>

            {/* Pending Payments */}
            <div
              onClick={() => router.push("/dashboard/leads?status=payment_pending")}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-50 p-3 rounded-lg group-hover:bg-red-100 transition-colors">
                  <Wallet className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-gray-900">{data.lead_metrics.payment_pending.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">Pending Payments</span>
                </div>
              </div>
              <p className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Needs Action
              </p>
            </div>
          </>
        )}
      </div>

      {/* Content Grid: Charts + Side Panel (Activity) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Charts Column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <>
                <SkeletonChart />
                <SkeletonChart />
              </>
            ) : data && (
              <>
                {/* Active Leads Chart */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                        <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Leads</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{data.lead_metrics.active.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Status: Active</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.charts.leads_trend} margin={{ top: 5, right: 5, left: -15, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        stroke="#94a3b8"
                        interval="preserveStartEnd"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        tickFormatter={(value) => {
                          // Shorten date format for mobile
                          const parts = value.split('-');
                          if (parts.length >= 2) {
                            return `${parts[1]}/${parts[2] || ''}`;
                          }
                          return value;
                        }}
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={25} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Leads"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Returned Leads Chart */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-600" />
                        <p className="text-gray-600 text-xs sm:text-sm font-medium">Returned Leads</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{data.lead_metrics.returned.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Status: Pending/Approved/Rejected</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.charts.returned_leads_trend || data.charts.leads_trend} margin={{ top: 5, right: 5, left: -15, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        stroke="#94a3b8"
                        interval="preserveStartEnd"
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        tickFormatter={(value) => {
                          // Shorten date format for mobile
                          const parts = value.split('-');
                          if (parts.length >= 2) {
                            return `${parts[1]}/${parts[2] || ''}`;
                          }
                          return value;
                        }}
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={25} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Returned"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="xl:col-span-1">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 h-full">
              <Skeleton variant="text" width="50%" height={32} />
              <div className="mt-4 space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rectangular" height={50} className="rounded-md" />)}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>

              {data && data.recent_activity && data.recent_activity.length > 0 ? (
                <div className="space-y-4">
                  {data.recent_activity.map((activity) => (
                    <div key={activity.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
                      <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center ${activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                        activity.type === 'campaign' ? 'bg-purple-100 text-purple-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                        {activity.type === 'payment' ? <DollarSign size={14} /> :
                          activity.type === 'campaign' ? <Activity size={14} /> :
                            <FileText size={14} />}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium leading-tight">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-gray-400">
                  <Activity size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lead Conversion Funnel */}
      {
        !loading && data && data.summary.total_leads > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Lead Conversion Funnel</h3>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
              {/* Step 1: Total */}
              <div className="flex-1 w-full bg-gray-50 rounded-xl p-4 border border-gray-100 relative z-10 text-center">
                <p className="text-sm font-semibold text-gray-500 mb-1">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.total_leads}</p>
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded-full font-medium">100%</div>
              </div>

              {/* Connector */}
              <div className="hidden md:block text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </div>

              {/* Step 2: Active */}
              <div className="flex-1 w-full bg-gray-50 rounded-xl p-4 border border-gray-100 relative z-10 text-center">
                <p className="text-sm font-semibold text-gray-500 mb-1">Active</p>
                <p className="text-2xl font-bold text-gray-900">{data.lead_metrics.active}</p>
                <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-2 py-0.5 rounded-full font-medium">
                  {((data.lead_metrics.active / data.summary.total_leads) * 100).toFixed(1)}% Conversion
                </div>
              </div>

              {/* Connector */}
              <div className="hidden md:block text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </div>

              {/* Step 3: Pending Payment */}
              <div className="flex-1 w-full bg-gray-50 rounded-xl p-4 border border-gray-100 relative z-10 text-center">
                <p className="text-sm font-semibold text-gray-500 mb-1">Payment Pending</p>
                <p className="text-2xl font-bold text-gray-900">{data.lead_metrics.payment_pending}</p>
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 inline-block px-2 py-0.5 rounded-full font-medium">
                  {((data.lead_metrics.payment_pending / data.summary.total_leads) * 100).toFixed(1)}% Potential
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Top Campaigns Table */}
      {
        !loading && data && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Top Campaign Performance</h3>
              <Link
                href="/dashboard/campaigns"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.campaign_performance.length > 0 ? (
                data.campaign_performance.map((camp) => (
                  <div key={camp.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                          {camp.name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{camp.total_leads.toLocaleString()} leads</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                            ${camp.status.toLowerCase() === 'active' ? 'bg-green-50 text-green-700' :
                              camp.status.toLowerCase() === 'completed' ? 'bg-gray-100 text-gray-700' :
                                'bg-orange-50 text-orange-700'}`}>
                            {camp.status.toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/campaigns/${camp.id}`)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex-shrink-0"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No active campaigns found.
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total Leads</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.campaign_performance.length > 0 ? (
                    data.campaign_performance.map((camp) => (
                      <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{camp.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-600">{camp.total_leads.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${camp.status.toLowerCase() === 'active' ? 'bg-green-50 text-green-700 border border-green-100' :
                              camp.status.toLowerCase() === 'completed' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                            {camp.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/dashboard/campaigns/${camp.id}`)}
                            className="hover:bg-blue-50 text-blue-600"
                          >
                            <Eye size={18} />
                          </IconButton>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-sm">
                        No active campaigns found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {/* Footer */}
      <div className="mt-12 mb-4 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Lead Fusion, All Rights Reserved.
        </p>
      </div>
    </div >
  );
}
