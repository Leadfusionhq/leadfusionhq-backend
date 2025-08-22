"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API } from "@/utils/apiUrl";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { 
  Skeleton, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Chip,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Stack,
  Badge
} from "@mui/material";
import { 
  Campaign as CampaignIcon,
  Person,
  LocationOn,
  Email,
  Phone,
  Settings,
  AttachMoney,
  Language,
  CalendarToday,
  Edit,
  Share,
  Add,
  MoreVert
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useRouter } from 'next/navigation';

type Campaign = {
  _id: string;
  campaign_id: string;
  name: string;
  status: string;
  lead_type: string;
  exclusivity: string;
  bid_price: number;
  language: string;
  user_id: {
    name: string;
    email: string;
    _id: string;
  };
  geography: {
    state: {
      name: string;
      abbreviation: string;
    };
    coverage: {
      type: string;
      partial:{
        counties:[{
          name: string;
          code: string;
          fips_code: string;
          state: string;
        }];
        zip_codes: string[];
        zip_code:string;
      }
      
    };
  };
  delivery: {
    method: string;
    email: {
        addresses: string;
        subject: string;
    };
    phone: {
        numbers: string;
    };
    crm: {
        instructions: string;
    };
    schedule: {
      days: {
        day: string;            
        active: boolean;        
        start_time: string | null; 
        end_time: string | null;  
        cap: number | null;    
      }[];
    };
  };
  note?: string;
  createdAt: string;
  updatedAt: string;
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'paused': return 'warning';
    case 'completed': return 'info';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const InfoCard = ({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) => (
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

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: { xs: 100, sm: 120 }, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
      {label}:
    </Typography>
    <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right', flex: 1, wordBreak: 'break-word', fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
      {value}
    </Typography>
  </Box>
);

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCampaign = async () => {
      const id = Array.isArray(campaignId) ? campaignId[0] : campaignId;
      if (!id) return;

      try {
        setLoading(true);
        const res = await axiosWrapper(
          "get",
          CAMPAIGNS_API.GET_CAMPAIGN.replace(":campaignId", id),
          {},
          token ?? undefined
        ) as {
          data?: any;
        };

        console.log("Backend campaign data:", res);

        if (res?.data) {
          setCampaign(res?.data);
        } else {
          toast.error("Failed to load campaign data.");
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId, token]);

  const handleEdit = (id:any) => {
    router.push(`/admin/campaigns/${id}/edit`);
  };
  const handleAddLead = (id:any) => {
    router.push(`/admin/campaigns/${id}/leads/add`);
  };
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 3, borderRadius: 2 }} />
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-span-12 md:col-span-6">
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </Box>
    );
  }

  if (error || !campaign) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography color="error" variant="h6">
          {error || "Campaign not found."}
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, mb: { xs: 2, sm: 3, md: 4 }, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
              <CampaignIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                {campaign.name}
              </Typography>
              <Chip 
                label={campaign.status}
                color={getStatusColor(campaign.status) as any}
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
            </Stack>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Campaign ID: {campaign.campaign_id}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Created: {formatDate(campaign.createdAt)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton sx={{ color: 'white' }}>
              <Edit onClick={() => handleEdit(campaign._id)}/>
            </IconButton>
            <IconButton sx={{ color: 'white' }}>
              <Add onClick={() => handleAddLead(campaign._id)} />
            </IconButton>
            
          </Stack>
        </Stack>
      </Paper>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Campaign Overview */}
        <div className="col-span-12 md:col-span-6">
          <InfoCard title="Campaign Overview" icon={<CampaignIcon fontSize="small" />}>
            <Stack spacing={1}>
              {campaign.lead_type && <DetailRow label="Lead Type" value={campaign.lead_type} />}
              {campaign.exclusivity && <DetailRow label="Exclusivity" value={campaign.exclusivity} />}
              {/* {campaign.bid_price && (
                <DetailRow 
                  label="Bid Price" 
                  value={`${campaign.bid_price.toFixed(2)}`} 
                />
              )} */}
              {campaign.language && <DetailRow label="Language" value={campaign.language} />}
              {campaign.updatedAt && (
                <DetailRow 
                  label="Last Updated" 
                  value={formatDate(campaign.updatedAt)} 
                />
              )}
            </Stack>
          </InfoCard>
        </div>

        {/* User Information */}
        {campaign.user_id && (
          <div className="col-span-12 md:col-span-6">
            <InfoCard title="Campaign Owner" icon={<Person fontSize="small" />}>
              <Stack spacing={1}>
                {campaign.user_id.name && <DetailRow label="Name" value={campaign.user_id.name} />}
                {campaign.user_id.email && <DetailRow label="Email" value={campaign.user_id.email} />}
                {campaign.user_id._id && <DetailRow label="User ID" value={campaign.user_id._id} />}
              </Stack>
            </InfoCard>
          </div>
        )}

        {/* Geography Information */}
        {campaign.geography && (campaign.geography.state || campaign.geography.coverage) && (
          <div className="col-span-12 md:col-span-6">
            <InfoCard title="Geographic Targeting" icon={<LocationOn fontSize="small" />}>
              <Stack spacing={1}>
                {campaign.geography.state?.name && (
                  <DetailRow 
                    label="State" 
                    value={`${campaign.geography.state.name} (${campaign.geography.state.abbreviation})`} 
                  />
                )}
                {campaign.geography.coverage?.type && (
                  <DetailRow label="Coverage Type" value={campaign.geography.coverage.type} />
                )}
               {campaign.geography.coverage?.type === 'PARTIAL' && 
                campaign.geography.coverage.partial?.counties?.length > 0 && (
                  <DetailRow
                    label="Counties"
                    value={campaign.geography.coverage.partial.counties.map(county => county.name).join(', ')}
                  />
                )}
                {campaign.geography.coverage?.partial?.zip_codes?.length > 0 && (

                  <DetailRow
                    label="Zip Codes"
                    value={campaign.geography.coverage.partial.zip_codes.join(', ')}
                  />
                )}

              </Stack>
            </InfoCard>
          </div>
        )}

        {/* Delivery Settings */}
        {campaign.delivery && (
          <div className="col-span-12 md:col-span-6">
            <InfoCard title="Delivery Configuration" icon={<Settings fontSize="small" />}>
              <Stack spacing={1}>
                {campaign.delivery.method && <DetailRow label="Method" value={campaign.delivery.method} />}
                {campaign.delivery.email?.addresses && (
                  <DetailRow label="Email Address" value={campaign.delivery.email.addresses} />
                )}
                {campaign.delivery.email?.subject && (
                  <DetailRow label="Email Subject" value={campaign.delivery.email.subject} />
                )}
                {campaign.delivery.phone?.numbers && (
                  <DetailRow label="Phone Number" value={campaign.delivery.phone.numbers} />
                )}
                {campaign.delivery.crm?.instructions && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      CRM Instructions:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        backgroundColor: '#f5f5f5', 
                        p: { xs: 1.5, sm: 2 }, 
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        wordBreak: 'break-word'
                      }}
                    >
                      {campaign.delivery.crm.instructions}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </InfoCard>
          </div>
        )}

        {/* Additional Notes */}
        {campaign.note && (
          <div className="col-span-12">
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                    📝
                  </Avatar>
                  <Typography variant="h6" color="primary.main" fontWeight={600}>
                    Campaign Notes
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
                  {campaign.note}
                </Typography>
              </CardContent>
            </Card>
          </div>
        )}

        {campaign.delivery?.schedule?.days?.length > 0 && (
          <div className="col-span-12">
            <InfoCard title="Delivery Schedule" icon={<CalendarToday fontSize="small" />}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem',
                    '& th, & td': {
                      border: '1px solid #e0e0e0',
                      padding: '8px 12px',
                      textAlign: 'center',
                    },
                    '& th': {
                      backgroundColor: '#f5f5f5',
                      fontWeight: 600,
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Active</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.delivery.schedule.days.map((day, idx) => (
                      <tr key={idx}>
                        <td>{day.day}</td>
                        <td>{day.active ? "✅" : "❌"}</td>
                        <td>{day.active ? day.start_time || '-' : '-'}</td>
                        <td>{day.active ? day.end_time || '-' : '-'}</td>
                        <td>{day.active ? day.cap ?? 0 : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </InfoCard>
          </div>
        )}

        {/* Campaign Statistics Summary */}
        <div className="col-span-12">
          <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #7799f8ff 0%, #5767f5ff 100%)', color: 'white' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Quick Stats
              </Typography>
              <div className="grid grid-cols-12 gap-4 sm:gap-6">
                {/* <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    ${campaign.bid_price?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Bid Price
                  </Typography>
                </div> */}
                <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {campaign.status || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Status
                  </Typography>
                </div>
                <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography className="uppercase" variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {campaign.delivery?.method || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Delivery
                  </Typography>
                </div>
                <div className="col-span-6 sm:col-span-3 text-center">
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {campaign.geography?.state?.abbreviation || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Location
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Box>
  );
}