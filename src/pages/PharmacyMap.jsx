import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, Navigation, Search } from 'lucide-react';
import { getAllPharmacies } from '@/lib/db';
import { useUserLocation } from '@/hooks/useUserLocation';
import { calculatePharmacyETA, getDistance } from '@/lib/eta';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useAuth } from '@/lib/auth';
import FilterIcon from '@/icons/react/FilterIcon';

export default function PharmacyMap() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { userCoords, location, isLoading: locationLoading } = useUserLocation();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [sortedPharmacies, setSortedPharmacies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState('all'); // 'all', '5km', '10km', '20km'

  // Redirect non-customers to home
  useEffect(() => {
    if (profile && profile.role !== 'customer') {
      navigate('/');
    }
  }, [profile, navigate]);

  // Load pharmacies
  useEffect(() => {
    async function loadPharmacies() {
      try {
        const allPharmacies = await getAllPharmacies();
        setPharmacies(allPharmacies || []);
      } catch (error) {
        console.error('Error loading pharmacies:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPharmacies();
  }, []);

  // Sort and filter pharmacies by distance when user location is available
  useEffect(() => {
    if (!userCoords || pharmacies.length === 0) {
      setSortedPharmacies(pharmacies);
      return;
    }

    let pharmaciesWithDistance = pharmacies
      .map(pharmacy => {
        const eta = calculatePharmacyETA(pharmacy, userCoords, 'driving');
        const coords = getPharmacyCoordinates(pharmacy);
        const distance = coords ? getDistance(
          userCoords.latitude,
          userCoords.longitude,
          coords.latitude,
          coords.longitude
        ) : Infinity;
        
        return {
          ...pharmacy,
          distance,
          eta,
          coords
        };
      })
      .filter(pharmacy => pharmacy.coords); // Only include pharmacies with valid coordinates

    // Apply distance filter
    if (distanceFilter !== 'all') {
      const maxDistance = parseInt(distanceFilter); // e.g., "5km" -> 5
      pharmaciesWithDistance = pharmaciesWithDistance.filter(p => p.distance <= maxDistance);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      pharmaciesWithDistance = pharmaciesWithDistance.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
      );
    }

    // Sort by distance
    pharmaciesWithDistance.sort((a, b) => a.distance - b.distance);

    setSortedPharmacies(pharmaciesWithDistance);
    
    // Auto-select the closest pharmacy if no pharmacy is selected or current selection is filtered out
    if (pharmaciesWithDistance.length > 0 && (!selectedPharmacy || !pharmaciesWithDistance.find(p => p.id === selectedPharmacy.id))) {
      setSelectedPharmacy(pharmaciesWithDistance[0]);
    }
  }, [userCoords, pharmacies, selectedPharmacy, searchQuery, distanceFilter]);

  // Helper function to extract coordinates (duplicate from eta.js for simplicity)
  function getPharmacyCoordinates(pharmacy) {
    if (!pharmacy) return null;
    
    if (pharmacy.coordinates?.latitude && pharmacy.coordinates?.longitude) {
      return {
        latitude: Number(pharmacy.coordinates.latitude),
        longitude: Number(pharmacy.coordinates.longitude)
      };
    }
    if (pharmacy.latitude && pharmacy.longitude) {
      return {
        latitude: Number(pharmacy.latitude),
        longitude: Number(pharmacy.longitude)
      };
    }
    if (pharmacy.lat && pharmacy.lng) {
      return {
        latitude: Number(pharmacy.lat),
        longitude: Number(pharmacy.lng)
      };
    }
    return null;
  }

  const handleCallPharmacy = (pharmacy) => {
    if (pharmacy.phone) {
      window.location.href = `tel:${pharmacy.phone}`;
    }
  };

  const handleGetDirections = (pharmacy) => {
    const coords = getPharmacyCoordinates(pharmacy);
    if (coords && userCoords) {
      const url = `https://www.google.com/maps/dir/${userCoords.latitude},${userCoords.longitude}/${coords.latitude},${coords.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handlePharmacySelect = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
  };

  const handleViewPharmacy = (pharmacy) => {
    if (pharmacy.vendorId || pharmacy.id) {
      navigate(`/vendor/${pharmacy.vendorId || pharmacy.id}`);
    }
  };

  if (loading || locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-[25px] font-light">Nearby Pharmacies</h1>
          </div>
          <LoadingSkeleton lines={8} className="space-y-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-light">Nearby Pharmacies</h1>
              <p className="text-sm text-gray-400">
                {userCoords ? `${sortedPharmacies.length} pharmacies found near you` : 'Loading location...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Current Location with improved status */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            {userCoords ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Your Location</p>
                  <p className="text-xs text-gray-600 truncate">{location}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {locationLoading ? 'Getting your location...' : 'Location access needed'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {locationLoading 
                      ? 'Please allow location access for accurate ETAs' 
                      : 'Enable location services to see nearby pharmacies'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pharmacies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-b border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showFilters ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700'
              }`}
            >
              <FilterIcon className="h-4 w-4" />
              
            </button>
          </div>

          {showFilters && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Distance</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All' },
                  { value: '5', label: 'Within 5km' },
                  { value: '10', label: 'Within 10km' },
                  { value: '20', label: 'Within 20km' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setDistanceFilter(filter.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      distanceFilter === filter.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Map Visualization */}
        <div className="bg-white rounded-lg mb-4 shadow-sm overflow-hidden">
          <div className="h-80 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 relative">
            {/* Map grid pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6B7280" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* Roads illustration */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 320">
              <path d="M0 160 Q200 120 400 160" stroke="#E5E7EB" strokeWidth="8" fill="none" />
              <path d="M200 0 Q200 160 200 320" stroke="#E5E7EB" strokeWidth="6" fill="none" />
              <path d="M0 80 Q100 60 200 80" stroke="#F3F4F6" strokeWidth="4" fill="none" />
              <path d="M200 240 Q300 220 400 240" stroke="#F3F4F6" strokeWidth="4" fill="none" />
            </svg>
            
            {/* User location indicator */}
            {userCoords && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="relative">
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  <div className="absolute -inset-2 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
                </div>
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-white px-2 py-1 rounded shadow-md whitespace-nowrap">
                  You are here
                </span>
              </div>
            )}
            
            {/* Pharmacy pins with improved positioning */}
            {sortedPharmacies.slice(0, 8).map((pharmacy, index) => {
              const angle = (index * 45) * (Math.PI / 180); // 45 degrees apart
              const radius = 80 + (index * 10); // Increasing radius
              const x = 50 + (Math.cos(angle) * radius / 4); // Percentage from center
              const y = 50 + (Math.sin(angle) * radius / 6); // Percentage from center
              
              return (
                <div
                  key={pharmacy.id || index}
                  className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 hover:scale-125 z-20 ${
                    selectedPharmacy?.id === pharmacy.id ? 'scale-125 z-30' : ''
                  }`}
                  style={{
                    left: `${Math.max(10, Math.min(90, x))}%`,
                    top: `${Math.max(15, Math.min(85, y))}%`
                  }}
                  onClick={() => handlePharmacySelect(pharmacy)}
                >
                  <div className="relative group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white transition-colors ${
                      selectedPharmacy?.id === pharmacy.id ? 'bg-red-500 shadow-red-200' : 'bg-blue-500 shadow-blue-200'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                        <div className="font-medium">{pharmacy.name}</div>
                        <div className="text-gray-300">{pharmacy.eta?.formatted} • {pharmacy.distance?.toFixed(1)}km</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Map title overlay */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Pharmacy Locations</p>
                  <p className="text-xs text-gray-600">
                    {sortedPharmacies.length} pharmacies • Sorted by distance
                  </p>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
                  <span className="text-gray-700">Your location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                  <span className="text-gray-700">Pharmacy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                  <span className="text-gray-700">Selected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Selected Pharmacy Details */}
        {selectedPharmacy && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 shadow-sm border border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0">
                  {sortedPharmacies.findIndex(p => p.id === selectedPharmacy.id) + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base truncate">{selectedPharmacy.name}</h3>
                  <p className="text-xs text-gray-600 mb-2 truncate">{selectedPharmacy.address}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1">
                      <Clock className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <span className="font-medium whitespace-nowrap">{selectedPharmacy.eta?.formatted || 'Calculating...'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1">
                      <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="font-medium whitespace-nowrap">{selectedPharmacy.distance?.toFixed(1) || '0'} km</span>
                    </div>
                    {selectedPharmacy.phone && (
                      <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1">
                        <Phone className="h-3 w-3 text-purple-500 flex-shrink-0" />
                        <span className="font-medium text-xs truncate max-w-[80px]">{selectedPharmacy.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm flex-shrink-0 ml-2">
                Closest
              </span>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => handleGetDirections(selectedPharmacy)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-full text-xs font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm btn-interactive"
              >
                <Navigation className="h-3 w-3" />
                <span className="hidden sm:inline">Get Directions</span>
                <span className="sm:hidden">Get Directions</span>
              </button>
              {selectedPharmacy.phone && (
                <button
                  onClick={() => handleCallPharmacy(selectedPharmacy)}
                  className="bg-green-600 text-white py-2 px-3 rounded-full text-xs font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm btn-interactive"
                  title="Call pharmacy"
                >
                  <Phone className="h-3 w-3" />
                  <span className="hidden sm:inline">Call</span>
                </button>
              )}
              <button
                onClick={() => handleViewPharmacy(selectedPharmacy)}
                className="flex-1 bg-white text-blue-600 py-2 px-3 rounded-full text-xs font-medium hover:bg-blue-50 transition-all duration-200 border border-blue-200 shadow-sm btn-interactive"
              >
                <span className="hidden sm:inline">View Products</span>
                <span className="sm:hidden">View Products</span>
              </button>
            </div>
          </div>
        )}

        {/* Pharmacy List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchQuery ? 'Search Results' : 'All Pharmacies'}
            </h2>
            <span className="text-sm text-gray-500">
              {sortedPharmacies.length} found
            </span>
          </div>
          
          {sortedPharmacies.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchQuery ? 'No pharmacies found matching your search' : 'No pharmacies found'}
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms' : 'Try adjusting your location or check back later'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            sortedPharmacies.map((pharmacy, index) => (
              <div
                key={pharmacy.id || index}
                className={`bg-white rounded-lg p-3 shadow-sm border cursor-pointer transition-all duration-200 card-interactive animate-fadeInUp ${
                  selectedPharmacy?.id === pharmacy.id
                    ? 'border-blue-300 bg-blue-50 shadow-blue-100 scale-102'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handlePharmacySelect(pharmacy)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${
                      selectedPharmacy?.id === pharmacy.id ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{pharmacy.name}</h3>
                        {index === 0 && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Closest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2 truncate">{pharmacy.address}</p>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap">{pharmacy.eta?.formatted || 'Calculating...'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap">{pharmacy.distance?.toFixed(1) || '0'} km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetDirections(pharmacy);
                    }}
                    className="text-blue-600 hover:text-blue-700 transition-colors p-1.5 hover:bg-blue-50 rounded-full flex-shrink-0 ml-2"
                    title="Get directions"
                  >
                    <Navigation className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
