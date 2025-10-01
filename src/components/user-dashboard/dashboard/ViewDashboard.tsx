"use client";

import { useEffect, useState } from "react";
import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API, LEADS_API, BILLING_API } from "@/utils/apiUrl";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Alert
} from "@mui/material";
import { 
  Campaign as CampaignIcon,
  People as PeopleIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp,
  Add,
  Visibility,
  Edit,
  Warning
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  balance: number;
  lastPaymentDate?: string;
}

interface RecentLead {
  id: string;
  name: string;
  status: string;
  campaign: string;
  lastActivity: string;
}

interface CampaignPerformance {
  id: string;
  name: string;
  totalLeads: number;
  conversionRate: number;
  status: string;
}

interface StatCardProps {
  title: string;
  mainValue: string | number;
  subtext: string;
  icon: React.ReactNode;
  color: string;
  buttonText?: string;
  buttonAction?: () => void;
}

export default function ClientDashboard() {
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
    balance: 0
  });
  
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const campaignsRes = await axiosWrapper(
        "get",
        CAMPAIGNS_API.GET_ALL_CAMPAIGNS,
        {},
        token ?? undefined
      ) as any;
      
      // Fetch leads
      const leadsRes = await axiosWrapper(
        "get",
        LEADS_API.GET_ALL_LEADS,
        {},
        token ?? undefined
      ) as any;
      
      // Fetch billing info
      const billingRes = await axiosWrapper(
        "get",
        BILLING_API.GET_BALANCE,
        {},
        token ?? undefined
      ) as any;

      // Process campaigns data
      const campaigns = Array.isArray(campaignsRes?.data) ? campaignsRes.data : [];
      const activeCampaigns = campaigns.filter((c: any) => c.status?.toLowerCase() === 'active').length;
      const completedCampaigns = campaigns.filter((c: any) => c.status?.toLowerCase() === 'completed').length;

      // Process leads data
      const leads = Array.isArray(leadsRes?.data) ? leadsRes.data : [];
      const newLeads = leads.filter((l: any) => l.status?.toLowerCase() === 'new').length;
      const contactedLeads = leads.filter((l: any) => l.status?.toLowerCase() === 'contacted').length;
      const convertedLeads = leads.filter((l: any) => l.status?.toLowerCase() === 'converted').length;

      // Process billing data
      const balance = billingRes?.balance?.balance || 0;
      const lastPaymentDate = billingRes?.balance?.lastPaymentDate;

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns,
        completedCampaigns,
        totalLeads: leads.length,
        newLeads,
        contactedLeads,
        convertedLeads,
        balance,
        lastPaymentDate
      });

      // Set low balance alert if balance is less than $100
      setLowBalanceAlert(balance < 100);

      // Process recent leads (last 5)
      const recent = leads.slice(0, 5).map((lead: any) => ({
        id: lead._id || '',
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        status: lead.status || 'New',
        campaign: lead.campaign_id.campaign_id || 'N/A',
        lastActivity: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : 'N/A'
      }));
      setRecentLeads(recent);

      // Process campaign performance
      const performance = campaigns.slice(0, 5).map((campaign: any) => ({
        id: campaign._id || '',
        name: campaign.name || 'Unnamed Campaign',
        totalLeads: campaign.leadCount || 0,
        conversionRate: campaign.conversionRate || 0,
        status: campaign.status || 'Active'
      }));
      setCampaignPerformance(performance);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    mainValue, 
    subtext, 
    icon, 
    color, 
    buttonText, 
    buttonAction 
  }: StatCardProps) => (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={color} gutterBottom>
              {mainValue}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtext}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              backgroundColor: `${color}20`,
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Stack>
        {buttonText && buttonAction && (
          <Button 
            variant="outlined" 
            size="small" 
            fullWidth 
            sx={{ mt: 2, borderColor: color, color: color }}
            onClick={buttonAction}
          >
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const getStatusColor = (status: string): "success" | "info" | "primary" | "warning" | "default" => {
    switch (status?.toLowerCase()) {
      case 'active': 
      case 'new': 
        return 'success';
      case 'contacted': 
        return 'info';
      case 'converted': 
      case 'completed': 
        return 'primary';
      case 'paused': 
        return 'warning';
      default: 
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here&apos;s what&apos;s happening with your campaigns.
        </Typography>
      </Box>

      {/* Low Balance Alert */}
      {lowBalanceAlert && (
        <Alert 
          severity="warning" 
          icon={<Warning />}
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => router.push('/dashboard/billing-control')}
            >
              Add Funds
            </Button>
          }
        >
          Your account balance is low. Please add funds to continue your campaigns.
        </Alert>
      )}

      {/* Stats Cards */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <StatCard
            title="Total Campaigns"
            mainValue={stats.totalCampaigns}
            subtext={`Active: ${stats.activeCampaigns} | Completed: ${stats.completedCampaigns}`}
            icon={<CampaignIcon sx={{ fontSize: 40, color: '#1976d2' }} />}
            color="#1976d2"
            buttonText="View All Campaigns"
            buttonAction={() => router.push('/dashboard/campaigns')}
          />
        </div>

        <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <StatCard
            title="Total Leads"
            mainValue={stats.totalLeads}
            subtext={`New: ${stats.newLeads} | Contacted: ${stats.contactedLeads} | Converted: ${stats.convertedLeads}`}
            icon={<PeopleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />}
            color="#2e7d32"
            buttonText="View Leads"
            buttonAction={() => router.push('/dashboard/leads')}
          />
        </div>

        <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <StatCard
            title="Account Balance"
            mainValue={`$${stats.balance.toFixed(2)}`}
            subtext={stats.lastPaymentDate ? `Last Payment: ${new Date(stats.lastPaymentDate).toLocaleDateString()}` : 'No recent payments'}
            icon={<WalletIcon sx={{ fontSize: 40, color: '#ed6c02' }} />}
            color="#ed6c02"
            buttonText="Add Funds"
            buttonAction={() => router.push('/dashboard/billing-control')}
          />
        </div>
      </div>

      {/* Recent Leads Table */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Recent Leads
            </Typography>
            
          </Stack>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Lead Name</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Campaign</strong></TableCell>
                  <TableCell><strong>Last Activity</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={lead.status} 
                          color={getStatusColor(lead.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{lead.campaign}</TableCell>
                      <TableCell>{lead.lastActivity}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">No recent leads</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Campaign Performance Table */}
      <Card elevation={3}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Campaign Performance
            </Typography>
            <Button 
              startIcon={<Add />} 
              variant="outlined"
              onClick={() => router.push('/dashboard/campaigns/new')}
            >
              New Campaign
            </Button>
          </Stack>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Campaign Name</strong></TableCell>
                  <TableCell align="center"><strong>Total Leads</strong></TableCell>
                  <TableCell align="center"><strong>Conversion Rate</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaignPerformance.length > 0 ? (
                  campaignPerformance.map((campaign) => (
                    <TableRow key={campaign.id} hover>
                      <TableCell>{campaign.name}</TableCell>
                      <TableCell align="center">{campaign.totalLeads}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                          <TrendingUp fontSize="small" color="success" />
                          <Typography>{campaign.conversionRate}%</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={campaign.status} 
                          color={getStatusColor(campaign.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/edit`)}
                        >
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">No campaigns found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}