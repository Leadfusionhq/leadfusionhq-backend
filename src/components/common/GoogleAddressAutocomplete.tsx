// components/common/GoogleAddressAutocomplete.tsx
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, Clear as ClearIcon, MyLocation as MyLocationIcon, Map as MapIcon } from '@mui/icons-material';
import { debounce } from 'lodash';
import GoogleMapLocationPicker from './GoogleMapLocationPicker';

// Load Google Maps API
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
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&region=US&language=en`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
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

interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  fullAddress?: string;
}

interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  addressComponents: AddressComponents;
  coordinates: {
    lat: number;
    lng: number;
  };
  types: string[];
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: PlaceDetails) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  showCurrentLocation?: boolean;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
  value,
  onChange,
  label,
  placeholder = "Start typing your US address...",
  errorMessage,
  showCurrentLocation = true,
  disabled = false,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const geocoderService = useRef<any>(null);

  // Initialize Google Maps services
  useEffect(() => {
    const initializeGoogleServices = async () => {
      try {
        await loadGoogleMapsAPI();
        
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          
          // Create a dummy div for PlacesService (it needs a map or div)
          const dummyDiv = document.createElement('div');
          placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
          
          geocoderService.current = new window.google.maps.Geocoder();
          
          setIsGoogleLoaded(true);
          console.log('✅ Google Maps API loaded successfully');
        }
      } catch (error) {
        console.error('❌ Failed to load Google Maps API:', error);
      }
    };

    initializeGoogleServices();
  }, []);

  // Parse address components
  const parseAddressComponents = (place: any): AddressComponents => {
    const components: AddressComponents = {};
    
    if (place.address_components) {
      place.address_components.forEach((component: any) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          components.streetNumber = component.long_name;
        } else if (types.includes('route')) {
          components.streetName = component.long_name;
        } else if (types.includes('locality')) {
          components.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          components.state = component.short_name;
        } else if (types.includes('postal_code')) {
          components.zipCode = component.long_name;
        } else if (types.includes('administrative_area_level_2')) {
          components.county = component.long_name;
        }
      });
    }
    
    components.fullAddress = place.formatted_address;
    return components;
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      console.log('🔍 Searching for:', searchTerm);
      
      if (!isGoogleLoaded) {
        console.log('❌ Google Maps not loaded yet');
        setSuggestions([]);
        return;
      }
      
      if (!autocompleteService.current) {
        console.log('❌ Autocomplete service not available');
        setSuggestions([]);
        return;
      }
      
      if (searchTerm.length < 2) {
        console.log('❌ Search term too short:', searchTerm.length);
        setSuggestions([]);
        return;
      }

      console.log('✅ Starting Google Places search...');
      setIsLoading(true);
      
      try {
        const request = {
          input: searchTerm,
          componentRestrictions: { country: 'us' }, // US only - strict restriction
          types: ['address'], // Only addresses, not businesses
          fields: ['place_id', 'formatted_address', 'address_components', 'geometry']
        };

        autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Light filtering - Google's componentRestrictions should handle most filtering
            const usOnlyPredictions = predictions.filter(prediction => {
              const description = prediction.description.toLowerCase();
              
              // Block obvious non-US countries but be more permissive for US addresses
              const hasNonUSIndicator = description.includes(', india') ||
                                      description.includes(', pakistan') ||
                                      description.includes(', canada') ||
                                      description.includes(', uk') ||
                                      description.includes(', australia') ||
                                      description.includes(', mexico');
              
              // If no non-US indicators, assume it's valid (Google's restriction should handle it)
              return !hasNonUSIndicator;
            });
            
            console.log(`🇺🇸 Google returned ${predictions.length} predictions, filtered to ${usOnlyPredictions.length}`);
            console.log('📍 Suggestions:', usOnlyPredictions.map(p => p.description));
            
            setSuggestions(usOnlyPredictions);
            setShowDropdown(usOnlyPredictions.length > 0);
          } else {
            console.log('❌ Google Places API error:', status);
            setSuggestions([]);
            setShowDropdown(false);
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setIsLoading(false);
      }
    }, 300),
    [isGoogleLoaded]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    
    if (newValue.trim()) {
      debouncedSearch(newValue);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  // Get place details
  const getPlaceDetails = (placeId: string): Promise<PlaceDetails> => {
    return new Promise((resolve, reject) => {
      if (!placesService.current) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request = {
        placeId,
        fields: ['place_id', 'formatted_address', 'address_components', 'geometry', 'types']
      };

      placesService.current.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = parseAddressComponents(place);
          
          const placeDetails: PlaceDetails = {
            placeId: place.place_id,
            formattedAddress: place.formatted_address,
            addressComponents,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            types: place.types || []
          };
          
          resolve(placeDetails);
        } else {
          reject(new Error(`Failed to get place details: ${status}`));
        }
      });
    });
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: any) => {
    try {
      setIsLoading(true);
      const placeDetails = await getPlaceDetails(suggestion.place_id);
      
      onChange(placeDetails.formattedAddress, placeDetails);
      setShowDropdown(false);
      setSuggestions([]);
      
      console.log('✅ Selected place details:', placeDetails);
    } catch (error) {
      console.error('❌ Error getting place details:', error);
      onChange(suggestion.description);
    } finally {
      setIsLoading(false);
    }
  };

  // Get accurate current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation || !geocoderService.current) {
      alert('Geolocation is not supported or Google services not ready');
      return;
    }

    setGettingLocation(true);

    const options = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0 // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log(`📍 Got coordinates: ${latitude}, ${longitude} (accuracy: ${position.coords.accuracy}m)`);
          
          const latLng = new window.google.maps.LatLng(latitude, longitude);
          
          geocoderService.current.geocode(
            { 
              location: latLng,
              region: 'US' // Prefer US results
            },
            (results: any[], status: any) => {
              if (status === 'OK' && results && results.length > 0) {
                // Find the most precise address (usually the first one)
                const bestResult = results.find(result => 
                  result.types.includes('street_address') || 
                  result.types.includes('premise')
                ) || results[0];
                
                const addressComponents = parseAddressComponents(bestResult);
                
                const placeDetails: PlaceDetails = {
                  placeId: bestResult.place_id,
                  formattedAddress: bestResult.formatted_address,
                  addressComponents,
                  coordinates: { lat: latitude, lng: longitude },
                  types: bestResult.types || []
                };
                
                onChange(bestResult.formatted_address, placeDetails);
                console.log('✅ Current location address:', placeDetails);
              } else {
                console.error('❌ Geocoding failed:', status);
                alert('Could not determine address from your location');
              }
              setGettingLocation(false);
            }
          );
        } catch (error) {
          console.error('❌ Error getting address from coordinates:', error);
          alert('Error getting address from your location');
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let message = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
          default:
            message += 'Unknown error occurred.';
        }
        
        alert(message);
        setGettingLocation(false);
      },
      options
    );
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  // Handle map location selection
  const handleMapLocationSelect = (location: { address: string; coordinates: { lat: number; lng: number } }) => {
    onChange(location.address, {
      placeId: '',
      formattedAddress: location.address,
      addressComponents: {
        fullAddress: location.address
      },
      coordinates: location.coordinates,
      types: ['map_selection']
    });
    setShowMapPicker(false);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full relative ${className}`} ref={dropdownRef}>
      {label && <label className="block text-[#1C1C1C] text-lg mb-2">{label}</label>}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          disabled={disabled || !isGoogleLoaded || gettingLocation}
          className="h-[48px] border border-[#E0E0E0] rounded-[8px] pl-10 pr-20 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {(isLoading || !isGoogleLoaded) && (
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          )}
          
          {showCurrentLocation && !isLoading && isGoogleLoaded && (
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Select on Google Maps"
            >
              <MapIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          
          {showCurrentLocation && !value && !isLoading && isGoogleLoaded && (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Use current location (high accuracy)"
            >
              {gettingLocation ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full" />
              ) : (
                <MyLocationIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}
          
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Clear address"
            >
              <ClearIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      <div className="min-h-[20px]">
        {errorMessage && (
          <div className="text-red-500 text-xs transition-opacity duration-300">{errorMessage}</div>
        )}
        {!isGoogleLoaded && (
          <div className="text-blue-500 text-xs">Loading Google Maps...</div>
        )}
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-1">
            Debug: {suggestions.length} suggestions, dropdown: {showDropdown ? 'visible' : 'hidden'}, loading: {isLoading ? 'yes' : 'no'}
          </div>
        )}
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                selectedIndex === index ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                🇺🇸
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0]}
                </div>
                <div className="text-sm text-gray-500">
                  {suggestion.structured_formatting?.secondary_text || suggestion.description}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    Google Maps
                  </span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    US Only
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Google Map Location Picker */}
      {showMapPicker && (
        <GoogleMapLocationPicker
          open={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleMapLocationSelect}
          initialCoordinates={undefined}
        />
      )}
    </div>
  );
};

export default GoogleAddressAutocomplete;
