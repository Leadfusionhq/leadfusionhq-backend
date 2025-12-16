'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, FileText, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@mui/material';
import Link from 'next/link';
import axiosWrapper from "@/utils/api";
import { API_URL, BILLING_API, LEADS_API, DASHBOARD_API } from "@/utils/apiUrl";
import { RootState } from '@/redux/store';
import { Activity, AlertCircle } from 'lucide-react'
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalLeads: number;
  activeLeads: number;
  returnedLeads: number;
  totalCampaigns: number;
  activeCampaigns: number;
  pendingCampaigns: number;
  leadChartData: Array<{
    name: string;
    qualified: number;
    disqualified: number;
    date: string;
  }>;
  totalRevenue: number;
  qualifiedLeads: number; // Keeping for backward compatibility if needed, but will map from activeLeads
  disqualifiedLeads: number; // Keeping for backward compatibility if needed, but will map from returnedLeads
}

interface RevenueResponse {
  data?: {
    totalAmount?: number;
    from?: string;
    to?: string;
    sales?: number;
    refunds?: number;
  };
  totalAmount?: number;
  from?: string;
  to?: string;
  sales?: number;
  refunds?: number;
}

export default function AdminDashboard() {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalRevenue: 0,
    totalLeads: 0,
    activeLeads: 0,
    returnedLeads: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    pendingCampaigns: 0,
    leadChartData: [],
    qualifiedLeads: 0,
    disqualifiedLeads: 0,
  });

  // const [leadChartData, setLeadChartData] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Revenue and date range state
  const [revenueRange, setRevenueRange] = useState<'today' | '7d' | '30d' | 'mtd'>('mtd');
  const [revenueWindow, setRevenueWindow] = useState<{ from?: string; to?: string } | null>(null);
  const [leadDateRange, setLeadDateRange] = useState<'7d' | '30d' | 'mtd'>('7d');

  // Skeleton loading card component
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        {revenueLoading && (
          <Skeleton variant="rectangular" width={80} height={28} sx={{ borderRadius: 1 }} />
        )}
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
          <Skeleton variant="text" width={100} height={16} sx={{ mt: 1 }} />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 1 }} />
    </div>
  );

  // Fetch revenue data separately to allow independent updates
  const fetchRevenue = async () => {
    if (!token) return;

    setRevenueLoading(true);
    try {
      const revenueResp = await axiosWrapper(
        'get',
        `${BILLING_API.REVENUE_FROM_NMI}?range=${revenueRange}&includeRefunds=1`,
        {},
        token ?? undefined
      ) as RevenueResponse;

      // Support both response shapes with proper typing
      const r = revenueResp?.data || revenueResp;
      const totalRevenue = Number(r?.totalAmount ?? 0);

      setStats(prev => ({ ...prev, totalRevenue }));
      setRevenueWindow({
        from: r?.from || '',
        to: r?.to || ''
      });

      console.log('Revenue response:', r);
    } catch (err) {
      console.error('Error fetching revenue:', err);
      setStats(prev => ({ ...prev, totalRevenue: 0 }));
    } finally {
      setRevenueLoading(false);
    }
  };

  // Main dashboard data fetch
  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data...');

      try {
        const dashboardResponse = await axiosWrapper(
          'get',
          DASHBOARD_API.GET_DASHBOARD_DATA,
          {},
          token ?? undefined
        );

        const data = dashboardResponse as any; // Typed as any to match standard response shape if needed or direct data

        // If your axiosWrapper returns the response directly or inside .data, verify structure.
        // Assuming data comes directly or inside data property based on typical behavior.
        const dashboardData = data.data || data;

        setStats(prev => ({
          ...prev,
          totalUsers: dashboardData.totalUsers || 0,
          activeUsers: dashboardData.activeUsers || 0,
          inactiveUsers: dashboardData.inactiveUsers || 0,
          totalLeads: dashboardData.totalLeads || 0,
          activeLeads: dashboardData.activeLeads || 0,
          returnedLeads: dashboardData.returnedLeads || 0,
          totalCampaigns: dashboardData.totalCampaigns || 0,
          activeCampaigns: dashboardData.activeCampaigns || 0,
          pendingCampaigns: dashboardData.pendingCampaigns || 0,
          leadChartData: dashboardData.leadChartData || [],
          // Map for compatibility if needed or use directly in JSX
          qualifiedLeads: dashboardData.activeLeads || 0,
          disqualifiedLeads: dashboardData.returnedLeads || 0
        }));

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        throw err; // Re-throw to be caught by outer catch
      }

      // Fetch revenue independently
      await fetchRevenue();

    } catch (err: any) {
      console.error('Unexpected error in fetchDashboardData:', err);

      let errorMessage = 'Failed to load dashboard data';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);

      setStats({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalRevenue: 0,
        totalLeads: 0,
        activeLeads: 0,
        returnedLeads: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
        pendingCampaigns: 0,
        leadChartData: [],
        qualifiedLeads: 0,
        disqualifiedLeads: 0,
      });
      // setLeadChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [token, leadDateRange]);

  // Fetch revenue when range changes
  useEffect(() => {
    if (token && !loading) {
      fetchRevenue();
    }
  }, [revenueRange]);

  const handleRetry = () => {
    fetchDashboardData();
  };

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md">
            <p className="font-semibold mb-2">Error Loading Dashboard</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No token state
  if (!token) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-10">
          <p className="text-gray-600">Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.name || 'Admin'}! Here&apos;s what&apos;s happening.
            </p>

          </div>

          {/* Global Date Filter */}
          {/* <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              className="text-sm border-0 focus:ring-0 text-gray-700 font-medium"
              value={leadDateRange}
              onChange={(e) => setLeadDateRange(e.target.value as any)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="mtd">Month to Date</option>
            </select>
          </div> */}
          {/* ✅ ADD THIS - View Logs Button */}
          <Link href="/admin/logs">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
              <Activity className="w-4 h-4" />
              View Logs
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Number of Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-xs text-green-600 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                {stats.activeUsers} Active
              </p>
              <p className="text-xs text-red-500 flex items-center">
                <XCircle className="w-3 h-3 mr-1" />
                {stats.inactiveUsers} Inactive
              </p>
            </div>
          </div>
        )}

        {/* Total Revenue */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow relative">
            {revenueLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <select
                className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={revenueRange}
                onChange={(e) => setRevenueRange(e.target.value as any)}
                disabled={revenueLoading}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>

                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>

                <option value="mtd">Month to Date (MTD)</option>
                <option value="q1">Q1 (Jan–Mar)</option>
                <option value="q2">Q2 (Apr–Jun)</option>
                <option value="q3">Q3 (Jul–Sep)</option>
                <option value="q4">Q4 (Oct–Dec)</option>

                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>

              </select>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {revenueWindow?.from && revenueWindow?.to && (
              <p className="text-xs text-gray-500 mt-2">
                {new Date(revenueWindow.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
                {' '}{new Date(revenueWindow.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* Total Leads */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Number of Leads</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLeads.toLocaleString()}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-green-600">
                {stats.activeLeads} Active
              </span>
              <span className="text-xs text-red-600">
                {stats.returnedLeads} Returned
              </span>
            </div>
          </div>
        )}

        {/* Total Campaigns - NEW */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Campaigns</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns.toLocaleString()}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-green-600">
                {stats.activeCampaigns} Active
              </span>
              <span className="text-xs text-yellow-600">
                {stats.pendingCampaigns} Pending
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Leads Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Active Leads */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-gray-600 text-sm font-medium">Active Leads</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.qualifiedLeads.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Status: Active</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={stats.leadChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  interval={4}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
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
                  dataKey="qualified"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: leadDateRange === '30d' ? 2 : 4 }}
                  activeDot={{ r: 6 }}
                  name="Active Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Returned Leads */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="text-gray-600 text-sm font-medium">Returned Leads</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.disqualifiedLeads.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Status: Pending/Approved/Rejected</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={stats.leadChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  interval={4}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
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
                  dataKey="disqualified"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: leadDateRange === '30d' ? 2 : 4 }}
                  activeDot={{ r: 6 }}
                  name="Returned Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">© 2025 Lead Fusion, All Rights Reserved.</p>
      </div>
    </div>
  );
}