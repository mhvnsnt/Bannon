// @ts-nocheck
import { Component, ErrorInfo, ReactNode, useState, useEffect, useCallback, createContext, useContext } from 'react';
import { auth, db, setOfflineMode } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { safeStorage } from '../lib/safeStorage';

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorData: string; }

class ErrorBoundaryInner extends Component<{ 
  children: ReactNode; 
  onError: (error: Error) => void; 
}, State> {
  public state: State = { hasError: false, errorData: '' };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorData: error.message };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    this.props.onError(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.children}
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: '#0a0000',
            border: '1px solid #d11f2a',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '90vw',
            width: '400px',
            fontFamily: 'monospace',
            color: '#d11f2a',
            boxShadow: '0 0 40px rgba(209,31,42,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '13px', letterSpacing: '2px' }}>SYSTEM DESYNC DETECTED</h2>
              <button
                onClick={() => this.setState({ hasError: false, errorData: '' })}
                style={{ background: 'transparent', border: '1px solid #d11f2a', color: '#d11f2a', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px', fontFamily: 'monospace', fontSize: '12px' }}
              >✕</button>
            </div>
            <p style={{ marginBottom: '16px', color: '#888', fontSize: '11px', lineHeight: '1.5' }}>
              Anomaly logged to RAG vault. Attempt soft recovery or force reboot.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => this.setState({ hasError: false, errorData: '' })}
                style={{ flex: 1, background: '#111', color: '#aaa', padding: '8px', border: '1px solid #333', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', borderRadius: '4px' }}
              >
                ↺ SOFT RECOVER
              </button>
              <button
                onClick={() => console.log("Reboot requested but blocked.")}
                style={{ flex: 1, background: '#ffaa00', color: '#000', padding: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', borderRadius: '4px' }}
              >
                ⚡ FORCE REBOOT
              </button>
            </div>
            <div style={{ marginTop: '12px', color: '#444', fontSize: '10px', wordBreak: 'break-word' }}>
              {this.state.errorData}
            </div>
          </div>
        </>
      );
    }
    return this.props.children;
  }
}

export interface OSThemeContextProps {
  theme: 'deep-obsidian' | 'standard';
  setTheme: (theme: 'deep-obsidian' | 'standard') => void;
}

export const OSThemeContext = createContext<OSThemeContextProps>({
  theme: 'deep-obsidian',
  setTheme: () => {}
});

export function useOSTheme() {
  return useContext(OSThemeContext);
}

export function SystemOverseer({ children }: Props) {
  const [errorStatus, setErrorStatus] = useState<{ hasError: boolean; message: string } | null>(null);
  const [theme, setThemeState] = useState<'deep-obsidian' | 'standard'>(() => {
    return (safeStorage.getItem('os-theme') as 'deep-obsidian' | 'standard') || 'deep-obsidian';
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Monitor auth changes
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (user) {
        setCurrentUser(user);
        // Attempt to fetch theme from firestore
        if (db && user.uid && user.uid !== 'offline-architect' && user.uid !== 'offline-identity-key') {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              if (data.theme === 'deep-obsidian' || data.theme === 'standard') {
                setThemeState(data.theme);
                safeStorage.setItem('os-theme', data.theme);
              }
            }
          } catch (e) {
            console.warn('[SYSTEM OVERSEER] Failed to load theme from Firestore:', e);
          }
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync theme changes with document classes
  useEffect(() => {
    if (theme === 'deep-obsidian') {
      document.documentElement.classList.add('deep-obsidian');
    } else {
      document.documentElement.classList.remove('deep-obsidian');
    }
  }, [theme]);

  const setTheme = useCallback(async (newTheme: 'deep-obsidian' | 'standard') => {
    setThemeState(newTheme);
    safeStorage.setItem('os-theme', newTheme);

    // Save to firestore if authenticated
    if (currentUser && db && currentUser.uid && currentUser.uid !== 'offline-architect' && currentUser.uid !== 'offline-identity-key') {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { theme: newTheme }, { merge: true });
        console.log('[SYSTEM OVERSEER] Persisted theme setting:', newTheme);
      } catch (e: any) {
        console.warn('[SYSTEM OVERSEER] Failed to persist theme to Firestore (falling back to offline mode):', e.message || e);
        try {
          setOfflineMode(true);
        } catch (_) {}
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (errorStatus?.hasError) {
      // We immediately write the failure to the SQLite vault
      fetch('/api/vault/kinetic-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: 'error-boundary', 
          stage_transition: 'DESYNC',
          bass_sensitivity: 0, 
          turbulence: 0 
        })
      }).catch(err => console.error("Failed to log error to vault", err));
    }
  }, [errorStatus?.hasError, errorStatus?.message]);

  const handleError = useCallback((error: Error) => {
    setErrorStatus({ hasError: true, message: error.message });
  }, []);

  return (
    <OSThemeContext.Provider value={{ theme, setTheme }}>
      <ErrorBoundaryInner onError={handleError}>
        {children}
      </ErrorBoundaryInner>
    </OSThemeContext.Provider>
  );
}
