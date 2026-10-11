/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

type SupabaseSession = {
  user: {
    id: string;
    email: string | null;
    user_metadata: {
      full_name: string | null;
      avatar_url: string | null;
    }
  }
}

function mapUserToSession(user: User): SupabaseSession {
  return {
    user: {
      id: user.uid,
      email: user.email,
      user_metadata: {
        full_name: user.displayName,
        avatar_url: user.photoURL,
      }
    }
  };
}

export const supabase = {
  auth: {
    signInWithOAuth: async ({ provider, options }: any) => {
      if (provider === 'google') {
        const authProvider = new GoogleAuthProvider();
        await signInWithPopup(auth, authProvider);
      }
    },
    signOut: async () => {
      await signOut(auth);
    },
    getSession: async () => {
      const isTestActive = import.meta.env.DEV && typeof window !== 'undefined' && (
        window.location.search.includes('testMode=true') || 
        (window as any).__TEST_BYPASS__ === true ||
        localStorage.getItem('bannon_test_mode') === 'true'
      );
      if (isTestActive) {
        return {
          data: {
            session: {
              user: {
                id: 'test-uid',
                email: 'MarquisWhitacre@gmail.com',
                user_metadata: {
                  full_name: 'Marquis Whitacre',
                  avatar_url: null
                }
              }
            }
          }
        };
      }
      return new Promise<{ data: { session: SupabaseSession | null } }>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          if (user) {
            resolve({ data: { session: mapUserToSession(user) } });
          } else {
            resolve({ data: { session: null } });
          }
        });
      });
    },
    onAuthStateChange: (callback: (event: string, session: SupabaseSession | null) => void) => {
      const isTestActive = import.meta.env.DEV && typeof window !== 'undefined' && (
        window.location.search.includes('testMode=true') || 
        (window as any).__TEST_BYPASS__ === true ||
        localStorage.getItem('bannon_test_mode') === 'true'
      );
      if (isTestActive) {
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: {
              id: 'test-uid',
              email: 'MarquisWhitacre@gmail.com',
              user_metadata: {
                full_name: 'Marquis Whitacre',
                avatar_url: null
              }
            }
          });
        }, 10);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          callback('SIGNED_IN', mapUserToSession(user));
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return { data: { subscription: { unsubscribe } } };
    }
  },
  from: (table: string) => {
    return {
      select: (fields?: string) => ({
        eq: (field: string, value: string) => ({
          single: async () => {
            try {
              const d = await getDoc(doc(db, table, value));
              if (d.exists()) {
                return { data: d.data(), error: null };
              }
              return { data: null, error: { message: 'Not found' } };
            } catch (error) {
              return { data: null, error };
            }
          }
        })
      }),
      upsert: async (data: any) => {
        try {
          const { id, ...rest } = data;
          if (!id) throw new Error('No id provided');
          await setDoc(doc(db, table, id), data, { merge: true });
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    };
  }
};
