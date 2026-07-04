import { useState, useEffect, useCallback } from 'react';
import geoAPI from '../api/geoAPI';

export const useLiveLocation = (trackingEnabled = true) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [progress, setProgress] = useState(0);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setProgress(10); // GPS Requested

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setProgress(30); // GPS Acquired
        const { latitude, longitude, accuracy } = position.coords;
        
        const locData = { latitude, longitude, accuracy };
        setLocation(locData);
        
        if (trackingEnabled) {
          try {
            setProgress(60); // Saving to DB
            await geoAPI.updateLocation(latitude, longitude, true);
            setProgress(100); // Done
          } catch (err) {
            console.error('Failed to sync location to server', err);
            // We don't fail the hook completely if just sync fails
            setProgress(100); 
          }
        } else {
          setProgress(100);
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('User denied the request for Geolocation.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('The request to get user location timed out.');
            break;
          default:
            setError('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [trackingEnabled]);

  useEffect(() => {
    if (trackingEnabled) {
      requestLocation();
    }
  }, [trackingEnabled, requestLocation]);

  return { location, error, isLocating, progress, requestLocation };
};
