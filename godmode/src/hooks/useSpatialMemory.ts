import { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export interface SpatialEntry {
  id: string;
  lat: number;
  lng: number;
  gHash: string;
  visionData: string;
  timestamp: number;
}

export function useSpatialMemory() {
  const [lastCheck, setLastCheck] = useState<number>(0);

  const getLocalMemories = (): SpatialEntry[] => {
    try {
      const saved = localStorage.getItem('nexus_spatial_fallback');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveLocalMemories = (entries: SpatialEntry[]) => {
    try {
      localStorage.setItem('nexus_spatial_fallback', JSON.stringify(entries));
    } catch (e) {
      console.warn("localStorage space full for spatial snapshots fallback:", e);
    }
  };

  const getAllMemories = async () => {
    if (!auth || !auth.currentUser || !db) {
      return getLocalMemories();
    }
    try {
      const q = query(collection(db, 'users', auth.currentUser.uid, 'spatial_memory'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) {
      console.warn("Failed fetching memories from DB, returning local fallback:", e);
      return getLocalMemories();
    }
  };

  const addSpatialSnapshot = async (lat: number, lng: number, visionData: string) => {
    const gHash = `${lat.toFixed(3)},${lng.toFixed(3)}`; 
    const newEntry: SpatialEntry = {
      id: `local_spatial_${Date.now()}`,
      lat,
      lng,
      gHash,
      visionData,
      timestamp: Date.now()
    };

    const currentLocal = getLocalMemories();
    saveLocalMemories([newEntry, ...currentLocal].slice(0, 50)); // Keep last 50 local snapshots max

    if (!auth || !auth.currentUser || !db) return;
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'spatial_memory'), {
         lat, lng, gHash, visionData, timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Spatial memory save on cloud failed, kept only locally:", e);
    }
  };

  const getNearbyContext = async (lat: number, lng: number) => {
    const gHash = `${lat.toFixed(3)},${lng.toFixed(3)}`;

    if (!auth || !auth.currentUser || !db) {
      const matched = getLocalMemories().filter(e => e.gHash === gHash);
      matched.sort((a, b) => b.timestamp - a.timestamp);
      return matched.slice(0, 2);
    }

    try {
      const now = Date.now();
      // Throttle checking to every 30 seconds unless needed
      if (now - lastCheck < 30000) return null;
      setLastCheck(now);

      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'spatial_memory'),
        where('gHash', '==', gHash)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      
      const docs = snap.docs.map(d => d.data());
      docs.sort((a, b) => b.timestamp - a.timestamp);
      
      return docs.slice(0, 2);
    } catch (e) {
      console.warn("Failed fetching nearby spatial context from DB, fetching from local:", e);
      const matched = getLocalMemories().filter(e => e.gHash === gHash);
      matched.sort((a, b) => b.timestamp - a.timestamp);
      return matched.slice(0, 2);
    }
  };

  return { addSpatialSnapshot, getNearbyContext, getAllMemories };
}

