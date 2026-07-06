import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseAppletConfig from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig?.apiKey || "mock-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig?.authDomain || "mock-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig?.projectId || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig?.storageBucket || "mock-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig?.messagingSenderId || "mock-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig?.appId || "mock-app"
};

const app = initializeApp(firebaseConfig);
export const db = firebaseAppletConfig?.firestoreDatabaseId 
  ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export const subscribeToAgentStream = (sessionId: string, callback: (data: any) => void) => {
  if (firebaseConfig.apiKey === "mock-key") {
    // Return a mock un-subscriber if firebase isn't properly configured
    let mockInterval = setInterval(() => {
      callback({
        text: `[Firebase] Simulated thought process stream... ${Math.random()}`,
        timestamp: new Date()
      });
    }, 5000);
    return () => clearInterval(mockInterval);
  }

  const q = query(
    collection(db, "agent_logs"),
    where("sessionId", "==", sessionId),
    orderBy("timestamp", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(logs);
  });
};

export const pushAgentLog = async (sessionId: string, text: string) => {
  if (firebaseConfig.apiKey === "mock-key") {
    console.log("[Firebase Mock] Logged:", text);
    return;
  }
  
  try {
    await addDoc(collection(db, "agent_logs"), {
      sessionId,
      text,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding log:", error);
  }
};
