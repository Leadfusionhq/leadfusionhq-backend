// components/common/BillingAddressAutocomplete.tsx
import React from 'react';
import { Search as SearchIcon, Clear as ClearIcon, MyLocation as MyLocationIcon ,
    Map as MapIcon 
} from '@mui/icons-material';
import { debounce } from 'lodash';
import axiosWrapper from "@/utils/api";
import { GEOCODING_API } from "@/utils/apiUrl";
import MapLocationPicker from "./MapLocationPicker";

interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  source: string;
  confidence?: number;
  type: string;
}

interface BillingAddressAutocompleteProps {
  value: string;
  onChange: (value: string, meta?: { coordinates?: { lat: number; lng: number }; source?: string; placeId?: string; type?: string }) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  country?: string;
  showCurrentLocation?: boolean;
}

const BillingAddressAutocomplete: React.FC<BillingAddressAutocompleteProps> = ({
  value,
  onChange,
  label,
  placeholder = "Start typing your address...",
  errorMessage,
  country = "",
  showCurrentLocation = true
}) => {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [gettingLocation, setGettingLocation] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const debouncedSearch = React.useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          input: searchTerm,
          ...(country && { country }),
          limit: '5'
        });

        const response = await axiosWrapper(
          'get',
          `${GEOCODING_API.AUTOCOMPLETE}?${params}`
        );

        const data = response as any;
        if (data.predictions || data.result?.predictions) {
          const predictions = data.predictions || data.result.predictions;
          setSuggestions(predictions);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [country]
  );

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

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    onChange(suggestion.description, {
      coordinates: suggestion.coordinates,
      source: suggestion.source,
      placeId: suggestion.place_id,
      type: suggestion.type
    });
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await axiosWrapper(
            'get',
            `${GEOCODING_API.PLACE_DETAILS}?lat=${latitude}&lng=${longitude}`
          );

          const data = response as any;
          const result = data.result || data;
          if (result.formatted_address) {
            const address = result.formatted_address;
            onChange(address, { coordinates: { lat: latitude, lng: longitude }, source: 'geolocation' });
          }
        } catch (error) {
          console.error('Error getting address from location:', error);
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setGettingLocation(false);
        alert('Unable to get your location. Please enter address manually.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

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

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Map location selection handler
  const handleMapLocationSelect = (location: { address: string; coordinates: { lat: number; lng: number } }) => {
    onChange(location.address, { coordinates: location.coordinates, source: 'map_picker' });
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
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
          disabled={gettingLocation}
          className="h-[48px] border border-[#E0E0E0] rounded-[8px] pl-10 pr-20 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition w-full"
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          )}

          {showCurrentLocation && !isLoading && (
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Select on map"
            >
              <MapIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          {showCurrentLocation && !value && !isLoading && (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Use current location"
            >
              {gettingLocation ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full" />
              ) : (
                <MyLocationIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ClearIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[20px]">
        {errorMessage && (
          <div className="text-red-500 text-xs transition-opacity duration-300">{errorMessage}</div>
        )}
      </div>

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
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">📍</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{suggestion.structured_formatting.main_text}</div>
                <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{suggestion.source}</span>
                  {suggestion.confidence && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{Math.round(suggestion.confidence * 100)}%</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showMapPicker && (
        <MapLocationPicker
          open={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleMapLocationSelect}
        />
      )}
    </div>
  );
};

export default BillingAddressAutocomplete;


