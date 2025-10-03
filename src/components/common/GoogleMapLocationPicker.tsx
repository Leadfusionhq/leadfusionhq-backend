// components/common/GoogleMapLocationPicker.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
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
import { MapPin, X, Crosshair } from 'lucide-react';

// Load Google Maps API (same as in GoogleAddressAutocomplete)
const loadGoogleMapsAPI = (() => {
  let promise: Promise<any> | null = null;
  
  return () => {
    if (promise) return promise;
    
    promise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window not available'));
        return;
      }

      // Check if already loaded
      if (window.google && window.google.maps) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&region=US&language=en`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google);
        } else {
          reject(new Error('Google Maps API failed to load properly'));
        }
      };
      
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      
      document.head.appendChild(script);
    });
    
    return promise;
  };
})();

interface GoogleMapLocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    address: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  initialCoordinates?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleMapLocationPicker: React.FC<GoogleMapLocationPickerProps> = ({
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
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      if (!open) return;
      
      try {
        await loadGoogleMapsAPI();
        
        if (window.google && window.google.maps) {
          geocoderRef.current = new window.google.maps.Geocoder();
          setIsGoogleLoaded(true);
          console.log('✅ Google Maps API loaded for map picker');
        }
      } catch (error) {
        console.error('❌ Failed to load Google Maps API:', error);
      }
    };

    initializeGoogleMaps();
  }, [open]);

  // Get user's current location
  useEffect(() => {
    if (open && !initialCoordinates && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter = { lat: latitude, lng: longitude };
          setMapCenter(newCenter);
          setSelectedPosition(newCenter);
          fetchAddress(latitude, longitude);
        },
        (error) => {
          console.error('Error getting current location:', error);
          // Keep default NYC location
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else if (initialCoordinates) {
      setMapCenter(initialCoordinates);
      setSelectedPosition(initialCoordinates);
      fetchAddress(initialCoordinates.lat, initialCoordinates.lng);
    }
  }, [open, initialCoordinates]);

  // Initialize map when Google is loaded
  useEffect(() => {
    if (isGoogleLoaded && mapRef.current && !mapInstanceRef.current) {
      // Create map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 15,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Create marker
      markerRef.current = new window.google.maps.Marker({
        position: selectedPosition || mapCenter,
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Selected Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      // Handle map clicks
      mapInstanceRef.current.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        handleLocationSelect(lat, lng);
      });

      // Handle marker drag
      markerRef.current.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        handleLocationSelect(lat, lng);
      });

      console.log('✅ Google Map initialized');
    }
  }, [isGoogleLoaded, mapCenter, selectedPosition]);

  // Update map center when it changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedPosition) {
      mapInstanceRef.current.setCenter(selectedPosition);
      if (markerRef.current) {
        markerRef.current.setPosition(selectedPosition);
      }
    }
  }, [selectedPosition]);

  // Fetch address for coordinates
  const fetchAddress = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    
    setIsLoadingAddress(true);
    
    const latLng = new window.google.maps.LatLng(lat, lng);
    
    geocoderRef.current.geocode(
      { 
        location: latLng,
        region: 'US' // Prefer US results
      },
      (results: any[], status: any) => {
        if (status === 'OK' && results && results.length > 0) {
          // Find the most precise address
          const bestResult = results.find(result => 
            result.types.includes('street_address') || 
            result.types.includes('premise')
          ) || results[0];
          
          setAddress(bestResult.formatted_address);
        } else {
          setAddress('Unable to fetch address for this location');
        }
        setIsLoadingAddress(false);
      }
    );
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    const newPosition = { lat, lng };
    setSelectedPosition(newPosition);
    fetchAddress(lat, lng);
    
    // Update marker position
    if (markerRef.current) {
      markerRef.current.setPosition(newPosition);
    }
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

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude);
          
          // Center map on current location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
            mapInstanceRef.current.setZoom(17); // Zoom in for current location
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Unable to get your current location');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          maxHeight: '90vh'
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
          Select Location on Google Maps
        </Typography>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <X size={20} />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative', height: '500px' }}>
        {/* Google Map Container */}
        <div 
          ref={mapRef}
          style={{ 
            height: '100%', 
            width: '100%',
            display: isGoogleLoaded ? 'block' : 'none'
          }}
        />
        
        {/* Loading State */}
        {!isGoogleLoaded && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: '#f5f5f5'
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading Google Maps...
            </Typography>
          </Box>
        )}
        
        {/* Instructions overlay */}
        {isGoogleLoaded && (
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
              zIndex: 1000,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Click anywhere on the map or drag the marker to select a location
            </Typography>
          </Box>
        )}

        {/* Current Location Button */}
        {isGoogleLoaded && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <Button
              onClick={handleCurrentLocation}
              variant="contained"
              sx={{
                minWidth: 'auto',
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'white',
                color: '#4285F4',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              <Crosshair size={20} />
            </Button>
          </Box>
        )}
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
              backgroundColor: '#4285F4', // Google Blue
              color: 'white',
              '&:hover': {
                backgroundColor: '#3367D6', // Darker Google Blue
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

export default GoogleMapLocationPicker;
