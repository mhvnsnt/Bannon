import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  timestamp: number;
}

export function useNexusLocation() {
  const [coords, setCoords] = useState<LocationData | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'tracking' | 'error'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  
  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error');
      setGeoError('Geolocation unsupported.');
      return;
    }
    
    setGeoStatus('tracking');
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const data: LocationData = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };
        setCoords(data);
        
        // Push to memory if auth exists
        if (auth && auth.currentUser && db) {
           addDoc(collection(db, 'users', auth.currentUser.uid, 'location_history'), data).catch(console.warn);
        }
      },
      (err) => {
        setGeoStatus('error');
        setGeoError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  };
  
  return { coords, geoStatus, geoError, startTracking };
}
