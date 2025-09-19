// components/common/MapLocationPicker.tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography,
  CircularProgress 
} from '@mui/material';
import { MapPin, X } from 'lucide-react';
import axiosWrapper from "@/utils/api";
import { GEOCODING_API } from "@/utils/apiUrl";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom grey/black marker icon
const customIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 21.875 12.5 41 12.5 41C12.5 41 25 21.875 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="#374151"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `),
  iconRetinaUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="50" height="82" viewBox="0 0 50 82" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 0C11.1929 0 0 11.1929 0 25C0 43.75 25 82 25 82C25 82 50 43.75 50 25C50 11.1929 38.8071 0 25 0Z" fill="#374151"/>
      <circle cx="25" cy="25" r="12" fill="white"/>
    </svg>
  `),
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Alternative: Use a grey filter on the default marker
const greyIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'grey-marker' // Add CSS class for styling
});

// Add this CSS to your global styles or component
const markerStyles = `
  .grey-marker {
    filter: grayscale(100%) brightness(0.3);
  }
`;

interface MapLocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    address: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  initialCoordinates?: { lat: number; lng: number };
}

// Map click handler component
const LocationSelector: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
  selectedPosition: { lat: number; lng: number } | null;
}> = ({ onLocationSelect, selectedPosition }) => {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (selectedPosition) {
      map.flyTo([selectedPosition.lat, selectedPosition.lng], map.getZoom());
    }
  }, [selectedPosition, map]);

  return null;
};

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  open,
  onClose,
  onLocationSelect,
  initialCoordinates
}) => {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    initialCoordinates || null
  );
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]);
  const [isMapReady, setIsMapReady] = useState(false);

  // Add styles for grey marker
  useEffect(() => {
    if (open && !document.getElementById('grey-marker-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'grey-marker-styles';
      styleSheet.textContent = markerStyles;
      document.head.appendChild(styleSheet);
    }
  }, [open]);

  // Get user's current location on mount
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          if (!initialCoordinates) {
            setSelectedPosition({ lat: latitude, lng: longitude });
            fetchAddress(latitude, longitude);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [open, initialCoordinates]);

  // Fetch address for coordinates
  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await axiosWrapper(
        'get',
        `${GEOCODING_API.PLACE_DETAILS}?lat=${lat}&lng=${lng}`
      );

      const data = response as any;
      const result = data.result || data;
      
      if (result.formatted_address) {
        setAddress(result.formatted_address);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress('Unable to fetch address');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedPosition({ lat, lng });
    fetchAddress(lat, lng);
  };

  const handleConfirm = () => {
    if (selectedPosition && address) {
      onLocationSelect({
        address,
        coordinates: selectedPosition
      });
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => setIsMapReady(true), 100);
    } else {
      setIsMapReady(false);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #E0E0E0',
        pb: 2
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapPin size={24} />
          Select Location on Map
        </Typography>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <X size={20} />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative', height: '500px' }}>
        {isMapReady && (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationSelector 
              onLocationSelect={handleLocationSelect}
              selectedPosition={selectedPosition}
            />
            {selectedPosition && (
              <Marker 
                position={[selectedPosition.lat, selectedPosition.lng]} 
                icon={customIcon} // Use custom grey/black icon
              />
            )}
          </MapContainer>
        )}
        
        {/* Instruction overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            px: 3,
            py: 1.5,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Click anywhere on the map to select a location
          </Typography>
        </Box>
      </DialogContent>
      
      <Box sx={{ p: 3, borderTop: '1px solid #E0E0E0' }}>
        {selectedPosition && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Selected Location:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {isLoadingAddress ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  Loading address...
                </Box>
              ) : (
                address || 'No address found'
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Coordinates: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
            </Typography>
          </Box>
        )}
        
        <DialogActions sx={{ px: 0 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{
              borderColor: '#E0E0E0',
              color: '#6B7280',
              '&:hover': {
                borderColor: '#9CA3AF',
                backgroundColor: 'rgba(156, 163, 175, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained"
            disabled={!selectedPosition || !address || isLoadingAddress}
            sx={{
              backgroundColor: '#374151', // Grey-black color
              color: 'white',
              '&:hover': {
                backgroundColor: '#1F2937', // Darker grey-black on hover
              },
              '&:disabled': {
                backgroundColor: '#9CA3AF',
                color: '#E5E7EB'
              }
            }}
          >
            Confirm Location
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default MapLocationPicker;