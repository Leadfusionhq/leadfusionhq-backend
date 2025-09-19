// services/geocoding/geocoding.service.js
const axios = require('axios');
const NodeCache = require('node-cache');
const { ErrorHandler } = require('../../utils/error-handler');

// Initialize cache with 1 hour TTL
const geocodeCache = new NodeCache({ stdTTL: 3600 });

const LOCATIONIQ_KEY = process.env.LOCATIONIQ_KEY;
const LOCATIONIQ_BASE_URL = 'https://api.locationiq.com/v1';

class GeocodingService {
    // Helper function to normalize address format
    normalizeAddress(address) {
        return address
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Score addresses based on relevance
    scoreAddress(address, query) {
        const normalizedAddress = this.normalizeAddress(address);
        const normalizedQuery = this.normalizeAddress(query);
        
        let score = 0;
        
        if (normalizedAddress.includes(normalizedQuery)) {
            score += 10;
        }
        
        const queryWords = normalizedQuery.split(' ');
        const addressWords = normalizedAddress.split(' ');
        
        queryWords.forEach(word => {
            if (addressWords.some(w => w.startsWith(word))) {
                score += 5;
            }
        });
        
        if (address.length > 100) {
            score -= 2;
        }
        
        return score;
    }

    // Extract main text from LocationIQ response
    extractMainText(item) {
        if (item.address) {
            const parts = [];
            if (item.address.house_number) parts.push(item.address.house_number);
            if (item.address.road) parts.push(item.address.road);
            if (parts.length > 0) return parts.join(' ');
        }
        return item.display_name.split(',')[0];
    }

    // Extract secondary text from LocationIQ response
    extractSecondaryText(item) {
        if (item.address) {
            const parts = [];
            if (item.address.city || item.address.town) {
                parts.push(item.address.city || item.address.town);
            }
            if (item.address.state) parts.push(item.address.state);
            if (item.address.postcode) parts.push(item.address.postcode);
            if (parts.length > 0) return parts.join(', ');
        }
        return item.display_name.split(',').slice(1).join(',').trim();
    }



// Main autocomplete function with hybrid approach
async getAddressAutocomplete({ input, country, bounds, limit }) {
    try {
        // Check cache first
        const cacheKey = `autocomplete:${input}:${country || ''}:${bounds || ''}`;
        const cached = geocodeCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        let predictions = [];

        // Try LocationIQ first if API key is available
        if (LOCATIONIQ_KEY) {
            try {
                const locationIQParams = {
                    q: input,
                    key: LOCATIONIQ_KEY,
                    limit: limit,
                    dedupe: 1,
                    format: 'json',
                    normalizecity: 1,
                    tag: 'place:house,place:street,place:city',
                    accept_language: 'en'
                };

                // Only add countrycodes if country is provided
                if (country) {
                    locationIQParams.countrycodes = country;
                }

                // Only add viewbox if bounds is provided
                if (bounds) {
                    locationIQParams.viewbox = bounds;
                }

                const locationIQResponse = await axios.get(
                    `${LOCATIONIQ_BASE_URL}/autocomplete`,
                    {
                        params: locationIQParams,
                        timeout: 3000
                    }
                );

                if (locationIQResponse.data && locationIQResponse.data.length > 0) {
                    predictions = locationIQResponse.data.map(item => ({
                        place_id: `liq_${item.place_id}`,
                        description: item.display_name,
                        structured_formatting: {
                            main_text: this.extractMainText(item),
                            secondary_text: this.extractSecondaryText(item)
                        },
                        coordinates: {
                            lat: parseFloat(item.lat),
                            lng: parseFloat(item.lon)
                        },
                        source: 'locationiq',
                        confidence: item.importance || 0.8,
                        address_components: item.address,
                        type: item.type
                    }));
                }
            } catch (locationIQError) {
                console.log('LocationIQ failed, falling back to Nominatim:', locationIQError.message);
            }
        }

        // Fallback to Nominatim if LocationIQ fails or returns no results
        if (predictions.length === 0) {
            try {
                const nominatimParams = {
                    q: input,
                    format: 'json',
                    limit: limit,
                    addressdetails: 1
                };

                // Only add countrycodes if country is provided
                if (country) {
                    nominatimParams.countrycodes = country;
                }

                // Only add viewbox if bounds is provided
                if (bounds) {
                    nominatimParams.viewbox = bounds;
                }

                const nominatimResponse = await axios.get(
                    'https://nominatim.openstreetmap.org/search',
                    {
                        params: nominatimParams,
                        headers: {
                            'User-Agent': 'YourApp/1.0'
                        },
                        timeout: 5000
                    }
                );

                predictions = nominatimResponse.data.map(item => ({
                    place_id: `nom_${item.place_id}`,
                    description: item.display_name,
                    structured_formatting: {
                        main_text: item.display_name.split(',')[0],
                        secondary_text: item.display_name.split(',').slice(1).join(',').trim()
                    },
                    coordinates: {
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon)
                    },
                    source: 'nominatim',
                    confidence: item.importance || 0.5,
                    address_components: item.address,
                    type: item.type
                }));
            } catch (nominatimError) {
                console.error('Nominatim also failed:', nominatimError.message);
                throw new ErrorHandler(500, 'Failed to fetch address suggestions');
            }
        }

        // Score and sort predictions
        predictions = predictions.map(pred => ({
            ...pred,
            score: this.scoreAddress(pred.description, input) + (pred.confidence * 2)
        }));

        predictions.sort((a, b) => b.score - a.score);

        const result = {
            predictions: predictions.slice(0, limit),
            source: predictions[0]?.source || 'none'
        };

        // Cache the result
        geocodeCache.set(cacheKey, result);

        return result;
    } catch (error) {
        throw new ErrorHandler(500, error.message || 'Failed to fetch address suggestions');
    }
}

    // Get detailed place information
    async getPlaceDetails(lat, lng) {
        try {
            const cacheKey = `details:${lat}:${lng}`;
            const cached = geocodeCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            let result = null;

            // Try LocationIQ first
            if (LOCATIONIQ_KEY) {
                try {
                    const response = await axios.get(
                        `${LOCATIONIQ_BASE_URL}/reverse`,
                        {
                            params: {
                                lat,
                                lon: lng,
                                key: LOCATIONIQ_KEY,
                                format: 'json',
                                addressdetails: 1,
                                zoom: 18
                            },
                            timeout: 3000
                        }
                    );

                    result = {
                        formatted_address: response.data.display_name,
                        address_components: response.data.address,
                        geometry: {
                            location: { lat, lng }
                        },
                        source: 'locationiq'
                    };
                } catch (error) {
                    console.log('LocationIQ reverse geocoding failed');
                }
            }

            // Fallback to Nominatim
            if (!result) {
                const response = await axios.get(
                    'https://nominatim.openstreetmap.org/reverse',
                    {
                        params: {
                            lat,
                            lon: lng,
                            format: 'json',
                            addressdetails: 1,
                            zoom: 18
                        },
                        headers: {
                            'User-Agent': 'YourApp/1.0'
                        }
                    }
                );

                result = {
                    formatted_address: response.data.display_name,
                    address_components: response.data.address,
                    geometry: {
                        location: { lat, lng }
                    },
                    source: 'nominatim'
                };
            }

            geocodeCache.set(cacheKey, result);
            return result;
        } catch (error) {
            throw new ErrorHandler(500, 'Failed to fetch place details');
        }
    }

    // Validate address
    async validateAddress(address) {
        const validationRules = {
            hasNumber: /\d/,
            hasStreet: /\b(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|place|pl|boulevard|blvd)\b/i,
            minLength: 10,
            maxLength: 200
        };

        const issues = [];

        if (address.length < validationRules.minLength) {
            issues.push('Address seems too short');
        }

        if (address.length > validationRules.maxLength) {
            issues.push('Address seems too long');
        }

        const hasStreetNumber = validationRules.hasNumber.test(address);
        const hasStreetType = validationRules.hasStreet.test(address);

        if (!hasStreetNumber && !hasStreetType) {
            issues.push('Address may be incomplete');
        }

        const confidence = this.calculateConfidence(address, hasStreetNumber, hasStreetType);

        return {
            isValid: issues.length === 0,
            issues,
            confidence
        };
    }

    calculateConfidence(address, hasNumber, hasStreet) {
        let confidence = 0.5;

        if (hasNumber) confidence += 0.2;
        if (hasStreet) confidence += 0.2;
        if (address.split(',').length >= 2) confidence += 0.1;

        return Math.min(confidence, 1);
    }

    // Reverse geocode
    async reverseGeocode(lat, lng) {
        return this.getPlaceDetails(lat, lng);
    }
}

module.exports = new GeocodingService();