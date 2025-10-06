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
  Map,
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
    full_address?: string; // ADD THIS
    state: {
      abbreviation: string;
      _id: string;
      name: string;
    } | string; // CHANGE THIS - allow string type too
    zip_code: string;
    coordinates?: {  // ADD THIS
      lat: number;
      lng: number;
    };
    place_id?: string; // ADD THIS
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
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
const [mapError, setMapError] = useState<string | null>(null);

// Load Google Maps API
useEffect(() => {
  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) {
      setIsGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  };

  loadGoogleMaps();
}, []);

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
        console.log('📍 Lead data received:', lead);
        console.log('📍 State data:', lead.address?.state);
        console.log('📍 Coordinates:', lead.address?.coordinates);
        console.log('📍 Place ID:', lead.address?.place_id);
        
        // If state is just an ObjectId string, we might need to handle it
        if (typeof lead.address?.state === 'string' && lead.address.state.length === 24) {
          console.warn('⚠️ State is ObjectId, not populated:', lead.address.state);
        }
        
        setLeadData(lead);
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

  // Initialize Google Map when data is loaded
  useEffect(() => {
    if (!leadData || !isGoogleLoaded) return;
  
    const initializeMap = async () => {
      const mapElement = document.getElementById(`map-${leadData._id}`);
      if (!mapElement) return;
  
      try {
        const geocoder = new window.google.maps.Geocoder();
        let mapCenter: { lat: number; lng: number } | null = null;
        let geocodeMethod = '';
  
        // 🔥 PRIORITY 1: Use coordinates (lat/lng) if available
        if (leadData.address?.coordinates?.lat && leadData.address?.coordinates?.lng) {
          mapCenter = {
            lat: leadData.address.coordinates.lat,
            lng: leadData.address.coordinates.lng,
          };
          geocodeMethod = 'coordinates';
          console.log('✅ Using coordinates for map:', mapCenter);
        }
        // 🔥 PRIORITY 2: Use place_id if available
        else if (leadData.address?.place_id) {
          console.log('🆔 Attempting to geocode by place_id:', leadData.address.place_id);
          try {
            const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
              geocoder.geocode({ placeId: leadData.address.place_id }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocode by place_id failed: ${status}`));
                }
              });
            });
            mapCenter = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            };
            geocodeMethod = 'place_id';
            console.log('✅ Geocoded by place_id:', mapCenter);
          } catch (err) {
            console.warn('⚠️ place_id geocoding failed, trying full_address:', err);
          }
        }
        
        // 🔥 PRIORITY 3: Use full_address if available
        if (!mapCenter && leadData.address?.full_address) {
          console.log('📍 Attempting to geocode by full_address:', leadData.address.full_address);
          try {
            const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
              geocoder.geocode({ address: leadData.address.full_address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocode by full_address failed: ${status}`));
                }
              });
            });
            mapCenter = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            };
            geocodeMethod = 'full_address';
            console.log('✅ Geocoded by full_address:', mapCenter);
          } catch (err) {
            console.warn('⚠️ full_address geocoding failed, trying street address:', err);
          }
        }
  
        // 🔥 PRIORITY 4: Use street + city + state + zip
        if (!mapCenter) {
          const stateLabel =
            typeof leadData.address.state === 'string'
              ? leadData.address.state
              : leadData.address.state.abbreviation;
          const constructedAddress = `${leadData.address.street}, ${leadData.address.city}, ${stateLabel} ${leadData.address.zip_code}`;
          console.log('📍 Attempting to geocode by constructed address:', constructedAddress);
          try {
            const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
              geocoder.geocode({ address: constructedAddress }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocode by constructed address failed: ${status}`));
                }
              });
            });
            mapCenter = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            };
            geocodeMethod = 'constructed_address';
            console.log('✅ Geocoded by constructed address:', mapCenter);
          } catch (err) {
            console.error('❌ All geocoding methods failed:', err);
            setMapError('Could not locate address on map');
            return;
          }
        }
  
        if (!mapCenter) {
          setMapError('No valid location data available');
          return;
        }
  
        // 🗺️ Initialize the map
        const map = new window.google.maps.Map(mapElement, {
          center: mapCenter,
          zoom: 15,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
  
        // 📍 Add marker
        const marker = new window.google.maps.Marker({
          position: mapCenter,
          map: map,
          title: `${leadData.first_name} ${leadData.last_name}`,
          animation: window.google.maps.Animation.DROP,
        });
  
        // 💬 Add info window
        const stateLabel =
          typeof leadData.address.state === 'string'
            ? leadData.address.state
            : leadData.address.state.abbreviation;
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #1976d2;">${leadData.first_name} ${leadData.last_name}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">
                📍 ${leadData.address.street}<br>
                ${leadData.address.city}, ${stateLabel} ${leadData.address.zip_code}
              </p>
              
            </div>
          `
        });
  
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
  
        // Auto-open info window after a small delay
        setTimeout(() => {
          infoWindow.open(map, marker);
        }, 500);
  
        setMapError(null);
      } catch (error) {
        console.error('❌ Map initialization error:', error);
        setMapError('Error initializing map');
      }
    };
  
    // Small delay to ensure DOM is ready
    setTimeout(initializeMap, 100);
  }, [leadData, isGoogleLoaded]);


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
                  value={(() => {
                    const state = leadData.address.state;
                    // Check if it's an object with name/abbreviation
                    if (typeof state === 'object' && state !== null) {
                      return `${state.name} (${state.abbreviation})`;
                    }
                    // If it's a 24-character string (ObjectId), show message
                    if (typeof state === 'string' && state.length === 24) {
                      return 'State (ID: ' + state.slice(-6) + ')'; // Show last 6 chars of ID
                    }
                    // Otherwise show as is
                    return state || 'N/A';
                  })()}
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

        {/* Google Map Display */}
        {(leadData.address?.coordinates || leadData.address?.place_id || leadData.address?.full_address || leadData.address?.street) && (
          <div className="col-span-12">
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                    <Map fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" color="primary.main" fontWeight={600}>
                    Location on Map
                  </Typography>
                </Stack>
                {!isGoogleLoaded ? (
                  <div 
                    style={{ 
                      height: '400px', 
                      width: '100%', 
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <Typography variant="body2" color="text.secondary">
                        Loading Google Map...
                      </Typography>
                    </div>
                  </div>
                ) : mapError ? (
                  <div 
                    style={{ 
                      height: '400px', 
                      width: '100%', 
                      borderRadius: '8px',
                      border: '1px solid #ffcccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fff5f5'
                    }}
                  >
                    <div style={{ textAlign: 'center', color: '#cc0000' }}>
                      <Typography variant="h6">⚠️ {mapError}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Address data may be incomplete
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <div 
                    id={`map-${leadData._id}`}
                    style={{ 
                      height: '400px', 
                      width: '100%', 
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  {(() => {
                    const stateLabel =
                      typeof leadData.address.state === 'string'
                        ? leadData.address.state
                        : leadData.address.state.abbreviation;
                    return `📍 ${leadData.address.street}, ${leadData.address.city}, ${stateLabel} ${leadData.address.zip_code}`;
                  })()}
                </Typography>
              </CardContent>
            </Card>
          </div>
        )}
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
          <Card
            elevation={2}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Quick Stats
              </Typography>
              <div className="grid grid-cols-12 gap-4 sm:gap-6">
                {/* Status */}
                <div className="col-span-12 sm:col-span-4 text-center">
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                  >
                    {formatStatus(leadData.status)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Status
                  </Typography>
                </div>

                {/* Delivery */}
                <div className="col-span-12 sm:col-span-4 text-center">
                  <Typography
                    className="uppercase"
                    variant="h4"
                    fontWeight={700}
                    sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                  >
                    {leadData.delivery || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Delivery
                  </Typography>
                </div>

                {/* Location */}
                <div className="col-span-12 sm:col-span-4 text-center">
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                  >
                    {(() => {
                      const st = leadData.address?.state;
                      return typeof st === 'string' ? st : st?.abbreviation || 'N/A';
                    })()}
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
};

export default UserViewLeads;