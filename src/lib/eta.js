// Utility for calculating realistic ETA to pharmacy locations
// Takes into account distance and realistic travel speeds

/**
 * Extract coordinates from various pharmacy data formats
 * @param {object} pharmacy - Pharmacy object with coordinates in various formats
 * @returns {object|null} Standardized coordinates {latitude, longitude} or null
 */
function getPharmacyCoordinates(pharmacy) {
  if (!pharmacy) return null;
  
  // Handle direct coordinates object with latitude/longitude
  if (pharmacy.coordinates && typeof pharmacy.coordinates === 'object') {
    if (pharmacy.coordinates.latitude && pharmacy.coordinates.longitude) {
      return {
        latitude: Number(pharmacy.coordinates.latitude),
        longitude: Number(pharmacy.coordinates.longitude)
      };
    }
    if (pharmacy.coordinates.lat && pharmacy.coordinates.lng) {
      return {
        latitude: Number(pharmacy.coordinates.lat),
        longitude: Number(pharmacy.coordinates.lng)
      };
    }
    if (pharmacy.coordinates.lat && pharmacy.coordinates.lon) {
      return {
        latitude: Number(pharmacy.coordinates.lat),
        longitude: Number(pharmacy.coordinates.lon)
      };
    }
  }
  
  // Handle direct latitude/longitude on pharmacy object
  if (pharmacy.latitude && pharmacy.longitude) {
    return {
      latitude: Number(pharmacy.latitude),
      longitude: Number(pharmacy.longitude)
    };
  }
  
  // Handle lat/lng format
  if (pharmacy.lat && pharmacy.lng) {
    return {
      latitude: Number(pharmacy.lat),
      longitude: Number(pharmacy.lng)
    };
  }
  
  // Handle lat/lon format
  if (pharmacy.lat && pharmacy.lon) {
    return {
      latitude: Number(pharmacy.lat),
      longitude: Number(pharmacy.lon)
    };
  }
  
  // Handle location object
  if (pharmacy.location && typeof pharmacy.location === 'object') {
    if (pharmacy.location.latitude && pharmacy.location.longitude) {
      return {
        latitude: Number(pharmacy.location.latitude),
        longitude: Number(pharmacy.location.longitude)
      };
    }
    if (pharmacy.location.lat && pharmacy.location.lng) {
      return {
        latitude: Number(pharmacy.location.lat),
        longitude: Number(pharmacy.location.lng)
      };
    }
  }
  
  // Handle coords object
  if (pharmacy.coords && typeof pharmacy.coords === 'object') {
    if (pharmacy.coords.latitude && pharmacy.coords.longitude) {
      return {
        latitude: Number(pharmacy.coords.latitude),
        longitude: Number(pharmacy.coords.longitude)
      };
    }
    if (pharmacy.coords.lat && pharmacy.coords.lng) {
      return {
        latitude: Number(pharmacy.coords.lat),
        longitude: Number(pharmacy.coords.lng)
      };
    }
  }
  
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate realistic ETA based on distance and travel mode
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} mode - Travel mode: 'walking', 'driving', 'cycling'
 * @returns {object} ETA information with minutes and formatted string
 */
export function calculateETA(distanceKm, mode = 'driving') {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return null;
  }

  // Average speeds in km/h for different modes
  const speeds = {
    walking: 5,    // 5 km/h walking speed
    cycling: 15,   // 15 km/h cycling speed
    driving: 30,   // 30 km/h average city driving (includes traffic, stops)
  };

  const speedKmh = speeds[mode] || speeds.driving;
  const etaHours = distanceKm / speedKmh;
  const etaMinutes = Math.round(etaHours * 60);

  // Format the ETA string
  let etaString;
  if (etaMinutes < 1) {
    etaString = '< 1 min';
  } else if (etaMinutes < 60) {
    etaString = `${etaMinutes} min${etaMinutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(etaMinutes / 60);
    const remainingMins = etaMinutes % 60;
    if (remainingMins === 0) {
      etaString = `${hours} hr${hours !== 1 ? 's' : ''}`;
    } else {
      etaString = `${hours}h ${remainingMins}m`;
    }
  }

  return {
    minutes: etaMinutes,
    formatted: etaString,
    distance: distanceKm,
    mode
  };
}

/**
 * Find the closest pharmacy and calculate ETA
 * @param {Array} pharmacies - Array of pharmacy objects with coordinates
 * @param {object} userCoords - User coordinates {latitude, longitude}
 * @param {string} mode - Travel mode for ETA calculation
 * @returns {object} Closest pharmacy info with ETA
 */
export function findClosestPharmacyWithETA(pharmacies, userCoords, mode = 'driving') {
  if (!pharmacies || pharmacies.length === 0 || !userCoords) {
    return null;
  }

  let closestPharmacy = null;
  let minDistance = Infinity;
  let etaInfo = null;

  pharmacies.forEach((pharmacy) => {
    const coords = getPharmacyCoordinates(pharmacy);
    if (coords) {
      const distance = getDistance(
        userCoords.latitude,
        userCoords.longitude,
        coords.latitude,
        coords.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPharmacy = pharmacy;
        etaInfo = calculateETA(distance, mode);
      }
    }
  });

  return closestPharmacy ? {
    pharmacy: closestPharmacy,
    eta: etaInfo,
    distance: minDistance
  } : null;
}

/**
 * Calculate ETA to a specific pharmacy
 * @param {object} pharmacy - Pharmacy object with coordinates
 * @param {object} userCoords - User coordinates {latitude, longitude}
 * @param {string} mode - Travel mode for ETA calculation
 * @returns {object} ETA information
 */
export function calculatePharmacyETA(pharmacy, userCoords, mode = 'driving') {
  const coords = getPharmacyCoordinates(pharmacy);
  if (!coords || !userCoords) {
    return null;
  }

  const distance = getDistance(
    userCoords.latitude,
    userCoords.longitude,
    coords.latitude,
    coords.longitude
  );

  return calculateETA(distance, mode);
}
