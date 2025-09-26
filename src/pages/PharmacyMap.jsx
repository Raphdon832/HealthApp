import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

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

  // Generate search suggestions based on pharmacies
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const suggestions = pharmacies
      .filter(pharmacy => 
        pharmacy.name?.toLowerCase().includes(query) ||
        pharmacy.address?.toLowerCase().includes(query)
      )
      .slice(0, 5) // Limit to 5 suggestions
      .map(pharmacy => ({
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        type: pharmacy.name?.toLowerCase().includes(query) ? 'name' : 'address'
      }));

    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [searchQuery, pharmacies]);

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

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Find and select the pharmacy
    const pharmacy = pharmacies.find(p => p.id === suggestion.id);
    if (pharmacy) {
      setSelectedPharmacy(pharmacy);
      
      // Scroll to the pharmacy in the list after a short delay
      setTimeout(() => {
        const element = document.getElementById(`pharmacy-${pharmacy.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleSearchFocus = () => {
    if (searchSuggestions.length > 0 && searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
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
            <h1 className="text-[25px] font-light text-gray-900 dark:text-white">Nearby Pharmacies</h1>
          </div>
          <LoadingSkeleton lines={8} className="space-y-4 justify-center" />
        </div>
      </div>
    );
  }

  // Fixed Header Component (Mobile Only)
  const FixedHeader = () => (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-left">
          <div className="text-[18px] font-light tracking-tight">Nearby Pharmacies</div>
          <div className="text-[12px] text-gray-400">
            {userCoords ? `${sortedPharmacies.length} found near you` : 'Loading location...'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full border border-zinc-200 bg-white hover:bg-sky-50 hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="Filter pharmacies"
          >
            <FilterIcon className="w-5 h-5 text-sky-600" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(<FixedHeader />, document.body)}
      <div className="min-h-screen bg-gray-50 pt-24 md:pt-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-50 mx-auto px-4 py-4 sticky top-0 z-50 hidden md:block">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-[20px] font-light tracking-tight text-gray-900 dark:text-white">Nearby Pharmacies</h1>
              <p className="text-[12px] text-gray-400">
                {userCoords ? `${sortedPharmacies.length} pharmacies found near you` : 'Loading location...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Current Location with improved status */}
        <div className="bg-gray rounded-lg p-4 mb-4 border border-sky-300">
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
        <div className="bg-gray rounded-lg p-4 border mb-4 border-sky-300">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pharmacies..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 border-b bg-transparent border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                autoComplete="off"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto animate-fade-in">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full text-left px-4 py-3 focus:outline-none transition-colors duration-200 border-b border-gray-100 last:border-b-0 animate-fadeInUp ${
                          index === selectedSuggestionIndex 
                            ? 'bg-blue-100 border-blue-200' 
                            : 'hover:bg-blue-50 focus:bg-blue-50'
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                            index === selectedSuggestionIndex ? 'bg-blue-200' : 'bg-blue-100'
                          }`}>
                            <MapPin className={`h-4 w-4 ${
                              index === selectedSuggestionIndex ? 'text-blue-700' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {suggestion.type === 'name' ? (
                                <span>
                                  {suggestion.name.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                                      <span key={i} className="bg-sky-200 px-1 rounded">{part}</span>
                                    ) : (
                                      part
                                    )
                                  )}
                                </span>
                              ) : (
                                suggestion.name
                              )}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-1">
                              {suggestion.type === 'address' ? (
                                <span>
                                  {suggestion.address.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                                      <span key={i} className="bg-yellow-200 px-1 rounded">{part}</span>
                                    ) : (
                                      part
                                    )
                                  )}
                                </span>
                              ) : (
                                suggestion.address
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 font-medium flex-shrink-0">
                            {suggestion.type === 'name' ? 'Name' : 'Address'}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 animate-fade-in">
                      <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-[12px]">No pharmacies found</p>
                      <p className="text-[10px] mt-1">Try a different search term</p>
                    </div>
                  )}
                  
                  {/* Keyboard navigation hint */}
                  {searchSuggestions.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-[12px] text-gray-400 text-center">
                      Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
                    </div>
                  )}
                </div>
              )}
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
            <div className=" pt-3">
              <p className="text-[14px] font-medium text-gray-700 mb-2">Distance</p>
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
                    className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
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
                  <div className="w-4 h-4 bg-black rounded-full border-2 border-white shadow-lg animate-pulse"></div>
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
                  <div className="w-3 h-3 bg-black rounded-full border border-white"></div>
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
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2">
                Closest
              </span>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => handleGetDirections(selectedPharmacy)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-full text-xs font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-1 btn-interactive"
              >
                <Navigation className="h-3 w-3" />
                <span className="hidden sm:inline">Get Directions</span>
                <span className="sm:hidden">Get Directions</span>
              </button>
              {selectedPharmacy.phone && (
                <button
                  onClick={() => handleCallPharmacy(selectedPharmacy)}
                  className="bg-green-600 text-white py-2 px-3 rounded-full text-xs font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1 btn-interactive"
                  title="Call pharmacy"
                >
                  <Phone className="h-3 w-3" />
                  <span className="hidden sm:inline">Call</span>
                </button>
              )}
              <button
                onClick={() => handleViewPharmacy(selectedPharmacy)}
                className="flex-1 bg-white text-blue-600 py-2 px-3 rounded-full text-xs font-medium hover:bg-blue-50 transition-all duration-200 border border-blue-200 btn-interactive"
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
            <h2 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
              {searchQuery ? (
                <>
                  <span>Search Results</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse-slow">
                    "{searchQuery}"
                  </span>
                </>
              ) : (
                'All Pharmacies'
              )}
            </h2>
            <span className="text-sm text-gray-500">
              {sortedPharmacies.length} found
            </span>
          </div>
          
          {sortedPharmacies.length === 0 ? (
            <div className="bg-white-10 rounded-lg p-8 text-center">
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
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium hover:scale-105 active:scale-95 transition-all duration-200 px-3 py-1 rounded-full hover:bg-blue-50"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            sortedPharmacies.map((pharmacy, index) => (
              <div
                key={pharmacy.id || index}
                id={`pharmacy-${pharmacy.id}`}
                className={`bg-white rounded-lg p-3 border cursor-pointer transition-all duration-200 card-interactive animate-fadeInUp ${
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

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute z-50 w-full max-w-md mx-auto mt-2 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col divide-y divide-gray-200">
              {searchSuggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-900 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{suggestion.name}</span>
                      <span className="text-gray-500 truncate">{suggestion.address}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {sortedPharmacies.findIndex(p => p.id === suggestion.id) + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
