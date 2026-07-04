import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';

export function useNexusMemory() {
  const [coreMemory, setCoreMemory] = useState<string>('');
  const [pulseCount, setPulseCount] = useState<number>(0);

  useEffect(() => {
    const fetchCoreMemory = async () => {
      if (!auth || !auth.currentUser || !db) return;
      try {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, 'users', uid, 'core_memory', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().content) {
           setCoreMemory(docSnap.data().content);
        }
      } catch (e) {
        console.warn("Failed fetching core memory:", e);
      }
    };
    
    if (!auth) {
      setCoreMemory('');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) fetchCoreMemory();
      else setCoreMemory('');
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getRecentHistory = async (limitCount = 20) => {
    if (!auth || !auth.currentUser || !db) return [];
    try {
      const uid = auth.currentUser.uid;
      const q = query(collection(db, 'users', uid, 'memory'), orderBy('timestamp', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => d.data());
      return docs.reverse(); // oldest first for AI input
    } catch (e) {
      console.warn("Failed fetching recent history:", e);
      return [];
    }
  };

  const triggerSummarization = async () => {
    if (!auth || !auth.currentUser || !db) return;
    try {
      const history = await getRecentHistory(50);
      if (history.length < 5) return; // Need some baseline to summarize

      const response = await fetch('/api/armada/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history })
      });
      const data = await response.json();
      
      if (data.summary) {
         const uid = auth.currentUser.uid;
         const docRef = doc(db, 'users', uid, 'core_memory', 'main');
         await setDoc(docRef, { content: data.summary, updatedAt: Date.now() }, { merge: true });
         setCoreMemory(data.summary);
      }
    } catch (e) {
      console.warn("Summarization trigger failed:", e);
    }
  };

  const addMemory = async (role: 'user' | 'model', content: string, sensorContext: string = '') => {
    if (!auth || !auth.currentUser || !db) return;
    try {
      const uid = auth.currentUser.uid;
      await addDoc(collection(db, 'users', uid, 'memory'), {
        role,
        content,
        sensorContext,
        timestamp: Date.now()
      });
      
      const nextPulse = pulseCount + 1;
      setPulseCount(nextPulse);
      
      // Every 50 messages -> summarize
      // Wait, 50 calls is role * 25 exchanges.
      if (nextPulse > 0 && nextPulse % 50 === 0) {
        triggerSummarization();
      }
    } catch (e) {
      console.warn("Failed adding memory:", e);
    }
  };

  return { coreMemory, getRecentHistory, addMemory, triggerSummarization };
}
