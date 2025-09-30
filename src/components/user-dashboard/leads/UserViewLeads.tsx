"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Paper,
  Stack,
  Avatar,
} from "@mui/material";
import {
  Person,
  LocationOn,
  Campaign,
  CalendarToday,
  ArrowBack,
} from "@mui/icons-material";

import axiosWrapper from "@/utils/api";
import { LEADS_API } from "@/utils/apiUrl";
import { RootState } from "@/redux/store";
import SpinnerLoader from "@/components/common/SpinnerLoader";

type LeadData = {
  _id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: {
      abbreviation: string;
      _id: string;
      name: string;
    };
    zip_code: string;
  };
  campaign_id: {
    _id: string;
    name: string;
    lead_type: string;
  };
  note: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  lead_type: string;
  exclusivity: string;
  language: string;
  geography: string;
  delivery: string;
};

const UserViewLeads = () => {
  const { leadId } = useParams();
  const router = useRouter();
  const leadIdString = Array.isArray(leadId) ? leadId[0] : leadId;
  const token = useSelector((state: RootState) => state.auth.token);

  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadIdString || !token) return;

      try {
        setIsLoading(true);
        const response = (await axiosWrapper(
          "get",
          LEADS_API.GET_LEAD.replace(":leadId", leadIdString),
          {},
          token
        )) as { data: LeadData };

        const lead = response?.data;
        if (lead) {
          setLeadData(lead);
          console.log(lead);
        }
      } catch (err) {
        console.error("Failed to fetch lead data:", err);
        toast.error("Could not fetch lead data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [leadIdString, token]);

  const formatStatus = (status: string) => {
    if (!status) return "N/A";
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: "success" | "error" | "warning" | "info" | "default" } = {
      ACTIVE: "success",
      INACTIVE: "error",
      PENDING: "warning",
      QUALIFIED: "info",
      CONVERTED: "success",
      REJECTED: "default",
    };
    return statusColors[status?.toUpperCase()] || "default";
  };

  const InfoCard = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <Card elevation={2} sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { elevation: 4, transform: 'translateY(-2px)' } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" color="primary.main" fontWeight={600}>
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );

  const DetailRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: { xs: 100, sm: 120 }, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right', flex: 1, wordBreak: 'break-word', fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
        {value || "N/A"}
      </Typography>
    </Box>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!leadIdString) return <p>Lead ID is missing!</p>;
  if (isLoading)
    return <SpinnerLoader variant="dots" color="gray" message="Loading lead data..." />;
  if (!leadData) return <p className="text-center py-6 text-red-600">Lead not found.</p>;


  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, mb: { xs: 2, sm: 3, md: 4 }, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
              <Person sx={{ fontSize: { xs: 28, sm: 32 } }} />
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                {leadData.first_name} {leadData.last_name}
              </Typography>
              <Chip 
                label={formatStatus(leadData.status)}
                color={getStatusColor(leadData.status)}
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
            </Stack>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Lead ID: {leadData.lead_id}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Created: {formatDate(leadData.createdAt)}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push("/dashboard/leads")}
            sx={{
              borderColor: "white",
              color: "white",
              "&:hover": { borderColor: "rgba(255,255,255,0.8)", backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Back
          </Button>
        </Stack>
      </Paper>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Personal Information */}
        <div className="col-span-12 md:col-span-6">
          <InfoCard title="Personal Information" icon={<Person fontSize="small" />}>
            <Stack spacing={1}>
              <DetailRow label="First Name" value={leadData.first_name} />
              <DetailRow label="Last Name" value={leadData.last_name} />
              <DetailRow label="Email" value={leadData.email} />
              <DetailRow label="Phone" value={leadData.phone} />
              {leadData.language && <DetailRow label="Language" value={leadData.language} />}
            </Stack>
          </InfoCard>
        </div>

        {/* Address Information */}
        <div className="col-span-12 md:col-span-6">
          <InfoCard title="Address Information" icon={<LocationOn fontSize="small" />}>
            <Stack spacing={1}>
              {leadData.address?.street && <DetailRow label="Street" value={leadData.address.street} />}
              {leadData.address?.city && <DetailRow label="City" value={leadData.address.city} />}
              {leadData.address?.state && (
                <DetailRow
                  label="State"
                  value={`${leadData.address.state.name} (${leadData.address.state.abbreviation})`}
                />
              )}
              {leadData.address?.zip_code && <DetailRow label="Zip Code" value={leadData.address.zip_code} />}
              {leadData.geography && <DetailRow label="Geography" value={leadData.geography} />}
            </Stack>
          </InfoCard>
        </div>

        {/* Campaign Information */}
        <div className="col-span-12 md:col-span-6">
          <InfoCard title="Campaign Information" icon={<Campaign fontSize="small" />}>
            <Stack spacing={1}>
              <DetailRow
                label="Campaign Name"
                value={
                  typeof leadData.campaign_id === "object"
                    ? leadData.campaign_id?.name
                    : leadData.campaign_id
                }
              />
              <DetailRow
                label="Lead Type"
                value={
                  typeof leadData.campaign_id === "object"
                    ? leadData.campaign_id?.lead_type
                    : leadData.lead_type
                }
              />
              {leadData.exclusivity && <DetailRow label="Exclusivity" value={leadData.exclusivity} />}
              {leadData.delivery && <DetailRow label="Delivery" value={leadData.delivery} />}
            </Stack>
          </InfoCard>
        </div>

        {/* Status & Timeline */}
        <div className="col-span-12 md:col-span-6">
          <InfoCard title="Status & Timeline" icon={<CalendarToday fontSize="small" />}>
            <Stack spacing={1}>
              <DetailRow
                label="Status"
                value={
                  <Chip
                    label={formatStatus(leadData.status)}
                    color={getStatusColor(leadData.status)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                }
              />
              <DetailRow
                label="Created Date"
                value={formatDate(leadData.createdAt)}
              />
              <DetailRow
                label="Last Updated"
                value={formatDate(leadData.updatedAt)}
              />
            </Stack>
          </InfoCard>
        </div>

        {/* Notes */}
        {leadData.note && (
          <div className="col-span-12">
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                    📝
                  </Avatar>
                  <Typography variant="h6" color="primary.main" fontWeight={600}>
                    Lead Notes
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    backgroundColor: '#f8f9fa', 
                    p: { xs: 2, sm: 3 }, 
                    borderRadius: 2,
                    border: '1px solid #e9ecef',
                    lineHeight: 1.6,
                    wordBreak: 'break-word'
                  }}
                >
                  {leadData.note}
                </Typography>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats Summary */}
        <div className="col-span-12">
          <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Quick Stats
              </Typography>
              <div className="grid grid-cols-12 gap-4 sm:gap-6">
                <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {formatStatus(leadData.status)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Status
                  </Typography>
                </div>
                <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography className="uppercase" variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {leadData.delivery || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Delivery
                  </Typography>
                </div>
                <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {leadData.address?.state?.abbreviation || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Location
                  </Typography>
                </div>
                <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {leadData.language || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Language
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Box>
  );
};

export default UserViewLeads;