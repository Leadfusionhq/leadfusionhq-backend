"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axiosWrapper from "@/utils/api";
import { CAMPAIGNS_API, LEADS_API } from "@/utils/apiUrl";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  User,
  MapPin,
  Settings,
  Calendar,
  Edit3,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Zap,
  Plus,
  List,
  Users
} from 'lucide-react';

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
      partial: {
        counties: [{
          name: string;
          code: string;
          fips_code: string;
          state: string;
        }];
        zip_codes: string[];
        zip_code: string;
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
    case 'active': return 'bg-green-100 text-green-700 border-green-200';
    case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Premium Info Card Component
const InfoCard = ({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
          {icon}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

// Detail Row Component
const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b border-gray-100 last:border-0 gap-1 sm:gap-4">
    <span className="text-xs sm:text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm font-semibold text-gray-900 break-words sm:text-right">{value}</span>
  </div>
);

// Mobile Schedule Card Component
const ScheduleCard = ({ day }: { day: { day: string; active: boolean; start_time: string | null; end_time: string | null; cap: number | null } }) => (
  <div className={`p-3 rounded-xl border ${day.active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="font-bold text-gray-900 text-sm">{day.day}</span>
      {day.active ? (
        <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
          <CheckCircle className="w-3.5 h-3.5" /> Active
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
          <XCircle className="w-3.5 h-3.5" /> Inactive
        </span>
      )}
    </div>
    {day.active && (
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{day.start_time || '-'} - {day.end_time || '-'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>Cap: {day.cap ?? 0}</span>
        </div>
      </div>
    )}
  </div>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="p-4 sm:p-6 animate-pulse">
    <div className="h-24 bg-gray-200 rounded-xl mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
      ))}
    </div>
  </div>
);

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const token = useSelector((state: RootState) => state.auth.token);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [leadCountLoading, setLeadCountLoading] = useState<boolean>(false);
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

  useEffect(() => {
    const id = Array.isArray(campaignId) ? campaignId[0] : campaignId;
    if (!id || !token) return;

    const fetchLeadCount = async () => {
      try {
        setLeadCountLoading(true);
        const params = new URLSearchParams({
          page: "1",
          limit: "1",
          campaign_id: id,
        });

        const res = await axiosWrapper(
          "get",
          `${LEADS_API.GET_ALL_LEADS}?${params.toString()}`,
          {},
          token ?? undefined
        ) as { meta?: { total?: number } };

        setLeadCount(res?.meta?.total ?? 0);
      } catch (e) {
        console.error("Failed to fetch lead count", e);
        setLeadCount(0);
      } finally {
        setLeadCountLoading(false);
      }
    };

    fetchLeadCount();
  }, [campaignId, token]);

  const handleEdit = (id: any) => {
    router.push(`/admin/campaigns/${id}/edit`);
  };

  const handleAddLead = (id: any) => {
    router.push(`/admin/campaigns/${id}/leads/add`);
  };

  const handleViewLeads = (id: string) => {
    router.push(`/admin/leads?campaign_id=${id}`);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-2">Campaign Not Found</p>
        <p className="text-sm text-gray-500">{error || "The campaign you're looking for doesn't exist."}</p>
      </div>
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                {campaign.name}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>

            {/* Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/80 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                ID: {campaign.campaign_id}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created: {formatDate(campaign.createdAt)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleViewLeads(campaign._id)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors"
              title="View Leads"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Leads</span>
            </button>
            <button
              onClick={() => handleEdit(campaign._id)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors"
              title="Edit Campaign"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => handleAddLead(campaign._id)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors"
              title="Add Lead"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* Campaign Overview */}
        <InfoCard title="Campaign Overview" icon={<Megaphone className="w-4 h-4" />}>
          <div className="space-y-0">
            {campaign.lead_type && <DetailRow label="Lead Type" value={campaign.lead_type} />}
            {campaign.exclusivity && <DetailRow label="Exclusivity" value={campaign.exclusivity} />}
            {campaign.bid_price !== undefined && campaign.bid_price !== null && (
              <DetailRow label="Bid Price" value={`$ ${campaign.bid_price.toFixed(2)}`} />
            )}
            {campaign.language && <DetailRow label="Language" value={campaign.language} />}
            {campaign.updatedAt && <DetailRow label="Last Updated" value={formatDate(campaign.updatedAt)} />}
          </div>
        </InfoCard>

        {/* User Information */}
        {campaign.user_id && (
          <InfoCard title="Campaign Owner" icon={<User className="w-4 h-4" />}>
            <div className="space-y-0">
              {campaign.user_id.name && <DetailRow label="Name" value={campaign.user_id.name} />}
              {campaign.user_id.email && <DetailRow label="Email" value={campaign.user_id.email} />}
              {campaign.user_id._id && <DetailRow label="User ID" value={campaign.user_id._id} />}
            </div>
          </InfoCard>
        )}

        {/* Geography Information */}
        {campaign.geography && (campaign.geography.state || campaign.geography.coverage) && (
          <InfoCard title="Geographic Targeting" icon={<MapPin className="w-4 h-4" />}>
            <div className="space-y-0">
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
            </div>
          </InfoCard>
        )}

        {/* Delivery Settings */}
        {campaign.delivery && (
          <InfoCard title="Delivery Configuration" icon={<Settings className="w-4 h-4" />}>
            <div className="space-y-0">
              {campaign.delivery.method && (
                <DetailRow
                  label="Method"
                  value={typeof campaign.delivery.method === 'string' ? campaign.delivery.method.toUpperCase() : String(campaign.delivery.method)}
                />
              )}
              {campaign.delivery.email?.addresses && (
                <DetailRow label="Email Address" value={campaign.delivery.email.addresses} />
              )}
              {campaign.delivery.email?.subject && (
                <DetailRow label="Email Subject" value={campaign.delivery.email.subject} />
              )}
              {campaign.delivery.phone?.numbers && (
                <DetailRow label="Phone Number" value={campaign.delivery.phone.numbers} />
              )}
            </div>
            {campaign.delivery.crm?.instructions && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">CRM Instructions:</p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 font-mono break-words">
                  {campaign.delivery.crm.instructions}
                </div>
              </div>
            )}
          </InfoCard>
        )}
      </div>

      {/* Additional Notes */}
      {campaign.note && (
        <div className="mt-4 sm:mt-6">
          <InfoCard title="Campaign Notes" icon={<FileText className="w-4 h-4" />}>
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed break-words">
              {campaign.note}
            </div>
          </InfoCard>
        </div>
      )}

      {/* Delivery Schedule */}
      {campaign.delivery?.schedule?.days?.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <InfoCard title="Delivery Schedule" icon={<Calendar className="w-4 h-4" />}>
            {/* Mobile View - Cards */}
            <div className="grid grid-cols-1 sm:hidden gap-3">
              {campaign.delivery.schedule.days.map((day, idx) => (
                <ScheduleCard key={idx} day={day} />
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700 bg-gray-50 rounded-tl-lg">Day</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700 bg-gray-50">Status</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700 bg-gray-50">Start</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700 bg-gray-50">End</th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700 bg-gray-50 rounded-tr-lg">Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.delivery.schedule.days.map((day, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 font-medium text-gray-900">{day.day}</td>
                      <td className="py-3 px-4 text-center">
                        {day.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" /> Off
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{day.active ? day.start_time || '-' : '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{day.active ? day.end_time || '-' : '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{day.active ? day.cap ?? 0 : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InfoCard>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="mt-4 sm:mt-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <h3 className="text-base sm:text-lg font-bold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4">
              <p className="text-2xl sm:text-3xl font-bold">{leadCountLoading ? '...' : (leadCount ?? 0)}</p>
              <p className="text-xs sm:text-sm opacity-80 mt-1">Total Leads</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4">
              <p className="text-2xl sm:text-3xl font-bold">{campaign.status || 'N/A'}</p>
              <p className="text-xs sm:text-sm opacity-80 mt-1">Status</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4">
              <p className="text-2xl sm:text-3xl font-bold uppercase">
                {typeof campaign.delivery?.method === 'string' ? campaign.delivery.method : 'N/A'}
              </p>
              <p className="text-xs sm:text-sm opacity-80 mt-1">Delivery</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl p-3 sm:p-4">
              <p className="text-2xl sm:text-3xl font-bold">{campaign.geography?.state?.abbreviation || 'N/A'}</p>
              <p className="text-xs sm:text-sm opacity-80 mt-1">Location</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}