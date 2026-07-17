import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp, getDocs, query, where, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CodeGenLog {
  moduleId: string;
  targetFile: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'TRUNCATED';
  extractedLines?: number;
  errorMessage?: string;
  timestamp?: any;
}

export const CodeGenLogger = {
  logCycle: async (log: CodeGenLog) => {
    try {
      const logsRef = collection(db, 'autonomous_codegen_logs');
      await addDoc(logsRef, {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'autonomous_codegen_logs');
    }
  },
  
  updateModuleStatus: async (moduleId: string, status: CodeGenLog['status'], details?: Partial<CodeGenLog>) => {
    try {
        const logsRef = collection(db, 'dependency_matrix');
        const docRef = doc(logsRef, moduleId.replace(/\//g, '_'));
        await setDoc(docRef, {
            status,
            ...details,
            lastUpdated: serverTimestamp()
        }, { merge: true });
    } catch(e) {
        handleFirestoreError(e, OperationType.UPDATE, `dependency_matrix/${moduleId}`);
    }
  }
}
