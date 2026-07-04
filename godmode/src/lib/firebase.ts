import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any = null;
let db: any = null;
let auth: any = null;
let messaging: any = null;

// Track active listeners to dynamically notify if state or network fallback changes
const activeAuthListeners: any[] = [];
const activeIdTokenListeners: any[] = [];

// Clean offline identity mock
const mockUser = {
  uid: 'offline-identity-key',
  email: 'MarquisWhitacre@gmail.com',
  displayName: 'Marquis Whitacre (Offline)',
  photoURL: null,
  getIdTokenResult: async () => ({ claims: { admin: true } }),
  getIdToken: async () => 'mock-token',
};

// True: sandbox mode / fallback, False: real Firebase mode
let offlineMode = false;

function setOfflineMode(value: boolean) {
  offlineMode = value;
  console.log(`[THE MYTH ENGINE] Dynamic offlineMode changed: ${value}`);
  if (value) {
    setupMocks();
    // Synchronously dispatch offline state only if we do not have a real initialized configuration to protect Google Sign-in popup triggers
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.log(`[THE MYTH ENGINE] Instantly dispatching offline user to ${activeAuthListeners.length} active auth listeners...`);
      activeAuthListeners.forEach(cb => {
        try { cb(mockUser); } catch(e) { console.warn("[THE MYTH ENGINE] Listener dispatch warning:", e); }
      });
      activeIdTokenListeners.forEach(cb => {
        try { cb(mockUser); } catch(e) { console.warn("[THE MYTH ENGINE] Token-listener dispatch warning:", e); }
      });
    }
  }
}

function wrapAuthMethods() {
  if (!auth) return;
  const originalOnAuthStateChanged = auth.onAuthStateChanged.bind(auth);
  auth.onAuthStateChanged = (cb: any) => {
    activeAuthListeners.push(cb);
    const unsub = originalOnAuthStateChanged(cb);
    return () => {
      const idx = activeAuthListeners.indexOf(cb);
      if (idx > -1) activeAuthListeners.splice(idx, 1);
      try { unsub(); } catch (e) {}
    };
  };

  const originalOnIdTokenChanged = auth.onIdTokenChanged.bind(auth);
  auth.onIdTokenChanged = (cb: any) => {
    activeIdTokenListeners.push(cb);
    const unsub = originalOnIdTokenChanged(cb);
    return () => {
      const idx = activeIdTokenListeners.indexOf(cb);
      if (idx > -1) activeIdTokenListeners.splice(idx, 1);
      try { unsub(); } catch (e) {}
    };
  };
}

// In sandboxed environments or if initialization fails, use custom non-crashing mocks to support hooks
function setupMocks() {
  app = null;
  db = null;

  if (!auth) {
    auth = {
      currentUser: null,
      onAuthStateChanged: (cb: any) => {
        activeAuthListeners.push(cb);
        // Start null to trigger the login matrix in offline mode
        setTimeout(() => {
          cb(auth.currentUser);
        }, 50);
        return () => {
          const idx = activeAuthListeners.indexOf(cb);
          if (idx > -1) activeAuthListeners.splice(idx, 1);
        };
      },
      onIdTokenChanged: (cb: any) => {
        activeIdTokenListeners.push(cb);
        setTimeout(() => {
          cb(auth.currentUser);
        }, 50);
        return () => {
          const idx = activeIdTokenListeners.indexOf(cb);
          if (idx > -1) activeIdTokenListeners.splice(idx, 1);
        };
      },
      signInWithPopup: async () => {
        console.log("[THE MYTH ENGINE] Mock Google Sign In successful.");
        auth.currentUser = mockUser;
        activeAuthListeners.forEach(cb => cb(mockUser));
        activeIdTokenListeners.forEach(cb => cb(mockUser));
        return { user: mockUser };
      },
      signOut: async () => {
        console.log("[THE MYTH ENGINE] Mock Signout executed successfully.");
        auth.currentUser = null;
        activeAuthListeners.forEach(cb => cb(null));
        activeIdTokenListeners.forEach(cb => cb(null));
      }
    };
  }

  messaging = null; 
}

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true
    }, firebaseConfig.firestoreDatabaseId as string);
    auth = getAuth(app);
    wrapAuthMethods();
  } else {
    offlineMode = true;
  }
} catch (e) {
  console.warn("[THE MYTH ENGINE] Firebase service initialization failed. Activating robust offline fallback.", e);
  offlineMode = true;
}

if (offlineMode || !app || !auth) {
  setupMocks();
} else {
  // Test Firestore connection immediately on startup to handle disabled APIs or offline state
  (async () => {
    try {
      console.log("[THE MYTH ENGINE] Performing quick connection handshake to cloud Firestore...");
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("[THE MYTH ENGINE] Connection handshake success. Cloud database fully responsive.");
    } catch (error: any) {
      const isPermissionDenied = error && (
        error.code === 'permission-denied' ||
        (error.message && (
          error.message.includes('permission') ||
          error.message.includes('PERMISSION_DENIED')
        ))
      );
      if (isPermissionDenied) {
        console.log("[THE MYTH ENGINE] Handshake received active Permission Denied. Server is online and auth is restrictive (as expected!).");
      } else {
        console.warn("[THE MYTH ENGINE] Cloud database connectivity or API checks failed. Activating robust local state backup.", error);
        setOfflineMode(true);
      }
    }
  })();

  // Try to load Cloud Messaging safely; silences standard sandbox errors (e.g. unsupported Service Worker)
  try {
    messaging = getMessaging(app);
  } catch (messagingError) {
    console.warn("[THE MYTH ENGINE] Firebase Cloud Messaging is unsupported or blocked. Run-time disabled.", messagingError);
    messaging = null;
  }
}

export const signInUser = async () => {
  if (offlineMode && typeof auth?.signInWithPopup === 'function') {
    return auth.signInWithPopup();
  }
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOutUser = async () => {
  if (offlineMode && typeof auth?.signOut === 'function') {
    return auth.signOut();
  }
  if (!auth) return;
  return signOut(auth);
};

export { app, db, auth, messaging, offlineMode, setOfflineMode };
