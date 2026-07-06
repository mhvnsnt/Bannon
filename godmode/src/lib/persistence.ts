import { doc, setDoc, getDocs, collection, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { db, auth, offlineMode, setOfflineMode } from './firebase';

export interface SimulationState {
  activeAcoustic: string | null;
  activePhotonic: string | null;
  activeAtmospheric: string | null;
  colorTemperature: number;
  flickerRate: number;
  stimuliIntensity: number;
  timestamp: string;
}

const saveToLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("[Persistence] Local storage backup write failed:", err);
  }
};

const getFromLocal = (key: string, defaultValue: any = null) => {
  try {
    const backup = localStorage.getItem(key);
    return backup ? JSON.parse(backup) : defaultValue;
  } catch (err) {
    console.warn("[Persistence] Local storage backup read failed:", err);
    return defaultValue;
  }
};

/**
 * Periodically sync the state of the simulation to Firebase Firestore.
 */
export const syncSimulationState = async (state: SimulationState) => {
  saveToLocal('simulation_state_backup', state);
  
  try {
    if (offlineMode || !auth || !auth.currentUser || !db) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'simulation_states', uid);
    
    await setDoc(docRef, state, { merge: true });
    console.debug('[Persistence] Synced simulation state to Firestore');
  } catch (error: any) {
    console.warn('[Persistence] Handled database fallback during simulation state sync:', error.message || error);
    setOfflineMode(true);
  }
};

/**
 * Save chat session and messages to Firestore
 */
export const syncChatSession = async (sessionId: string, messages: any[]) => {
  try {
    const isOffline = offlineMode || !auth || !auth.currentUser || !db;
    const cleanMessages = messages ? messages.map(msg => {
       const cleanMsg: any = {};
       for (const key in msg) {
          if (msg[key] !== undefined) {
             cleanMsg[key] = msg[key];
          }
       }
       return cleanMsg;
    }).filter(msg => Object.keys(msg).length > 0) : [];

    const title = cleanMessages.length > 0 
      ? cleanMessages.filter(m => m.role === 'user')[0]?.content?.substring(0, 40) + '...'
      : sessionId;

    const sessionObj = {
      id: sessionId,
      title: title || sessionId,
      updatedAt: new Date().toISOString(),
      messages: cleanMessages
    };

    // Always mirror to localStorage
    const localSessions = getFromLocal('chat_sessions_index', []);
    const existingIndex = localSessions.findIndex((s: any) => s.id === sessionId);
    if (existingIndex > -1) {
      localSessions[existingIndex] = { ...localSessions[existingIndex], title: sessionObj.title, updatedAt: sessionObj.updatedAt };
    } else {
      localSessions.unshift({ id: sessionId, title: sessionObj.title, updatedAt: sessionObj.updatedAt });
    }
    saveToLocal('chat_sessions_index', localSessions);
    saveToLocal(`chat_session_${sessionId}`, cleanMessages);

    if (!isOffline) {
      const uid = auth.currentUser.uid;
      const sessionRef = doc(db, 'users', uid, 'chat_sessions', sessionId);
      await setDoc(sessionRef, sessionObj, { merge: true });
      console.log('[Persistence] Synced chat session to remote Firestore:', sessionId);
    }
  } catch (error: any) {
    console.warn('[Persistence] Handled database fallback during chat session sync:', error.message || error);
    setOfflineMode(true);
  }
};

/**
 * Fetch chat sessions from Firestore
 */
export const getChatSessions = async () => {
  try {
    const isOffline = offlineMode || !auth || !auth.currentUser || !db;
    if (!isOffline) {
      const uid = auth.currentUser.uid;
      const sessionsRef = collection(db, 'users', uid, 'chat_sessions');
      const q = query(sessionsRef, orderBy('updatedAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const remoteSessions = snapshot.docs.map(doc => doc.data());
      if (remoteSessions.length > 0) {
        return remoteSessions;
      }
    }
  } catch (error: any) {
    console.warn('[Persistence] Handled database fallback during chat sessions fetch:', error.message || error);
    setOfflineMode(true);
  }
  return getFromLocal('chat_sessions_index', []);
};

/**
 * Fetch a specific chat session's messages
 */
export const getChatMessages = async (sessionId: string) => {
  try {
    const isOffline = offlineMode || !auth || !auth.currentUser || !db;
    if (!isOffline) {
      const uid = auth.currentUser.uid;
      const sessionRef = doc(db, 'users', uid, 'chat_sessions', sessionId);
      const docSnap = await getDoc(sessionRef);
      
      if (docSnap.exists() && docSnap.data().messages) {
        return docSnap.data().messages;
      }
    }
  } catch (error: any) {
    console.warn('[Persistence] Handled database fallback during chat messages fetch:', error.message || error);
    setOfflineMode(true);
  }
  return getFromLocal(`chat_session_${sessionId}`, []);
};
