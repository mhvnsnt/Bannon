import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, messaging } from '../lib/firebase';

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || 'BM_REPLACE_ME_VAPID';

export function useFCM() {
  useEffect(() => {
    const initFCM = async () => {
      try {
        if (!auth || !auth.currentUser || !messaging || !db) return;
        if (typeof Notification === 'undefined') {
          console.warn('[FCM] Notification API is not supported / defined in this iframe/sandbox environment.');
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(e => {
              console.warn('[FCM] Token acquisition bypassed without proper VAPID certificate.', e);
              return null;
          });
          
          if (token) {
            await setDoc(doc(db, 'users', auth.currentUser.uid, 'devices', token), {
              token,
              userAgent: navigator.userAgent,
              updatedAt: Date.now()
            });
            console.log('[FCM] Device registered for Daemon Push Interventions.');
          }
          
          onMessage(messaging, (payload) => {
            console.log('[FCM] Foreground Intervention Payload:', payload);
            if (payload.notification) {
                 const { title, body } = payload.notification;
                 // Custom toast logic could be triggered here to notify user while they actively use app
                 if (typeof Notification !== 'undefined') {
                   new Notification(title || 'Nexus Overdrive', { body: body || '' });
                 }
            }
          });
        }
      } catch (e) {
        console.warn('[FCM] Setup warning:', e);
      }
    };
    
    if (!auth) return;
    
    // Slight delay to ensure auth is settled
    const unsub = auth.onAuthStateChanged((user: any) => {
         if (user) {
             initFCM();
         }
    });
    
    return () => {
      if (unsub) unsub();
    };
  }, []);
}
