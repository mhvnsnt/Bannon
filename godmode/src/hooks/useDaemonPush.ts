import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';

export interface DaemonNotification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function useDaemonPush() {
  const [notifications, setNotifications] = useState<DaemonNotification[]>([]);
  const [localNotifications, setLocalNotifications] = useState<DaemonNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_notifications_fallback');
      return saved ? JSON.parse(saved) : [
        {
          id: 'welcome-sandbox-push',
          message: '[OVERSEER SYSTEM ACTIVATED] Welcome to the Reality Compiler OS. Local sandbox systems initialized.',
          timestamp: Date.now(),
          read: false
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_notifications_fallback', JSON.stringify(localNotifications));
  }, [localNotifications]);

  useEffect(() => {
    if (!auth || !auth.currentUser || !db) {
      setNotifications(localNotifications.filter(n => !n.read));
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'notifications'), where('read', '==', false));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const activeNotifications: DaemonNotification[] = [];
      snap.forEach(d => {
        activeNotifications.push({ id: d.id, ...d.data() } as DaemonNotification);
      });
      setNotifications(activeNotifications);
    }, (error) => {
      console.warn("DaemonPush firestore error, reverting to local alerts:", error);
      setNotifications(localNotifications.filter(n => !n.read));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [localNotifications]);

  const markRead = async (id: string) => {
    if (!auth || !auth.currentUser || !db) {
      setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', id), { read: true });
    } catch (e) {
      console.warn("Failed to mark notification read in DB, doing so locally:", e);
      setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  return { notifications, markRead };
}

