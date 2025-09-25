// Hook for managing user location across the app
import { useState, useEffect } from 'react';

export function useUserLocation() {
  const [userCoords, setUserCoords] = useState(null);
  const [location, setLocation] = useState('Fetching location...');
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation('Location not supported');
      setLocationError('Geolocation is not supported by this browser');
      setIsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        setLocationError(null);
        
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { timeout: 5000 }
          );
          const data = await res.json();
          setLocation(data.display_name || 'Location unavailable');
        } catch (error) {
          console.warn('Failed to fetch address:', error);
          setLocation('Location detected');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocationError(error.message);
        setIsLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocation('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocation('Location unavailable');
            break;
          case error.TIMEOUT:
            setLocation('Location request timeout');
            break;
          default:
            setLocation('Location error occurred');
            break;
        }
      },
      options
    );
  }, []);

  return {
    userCoords,
    location,
    locationError,
    isLoading
  };
}
