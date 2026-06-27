/**
 * CloudPersistence — optional Firestore mirror for the daemon's JSON state
 * (fight_history, move_fitness, learned_content). Local JSON files remain
 * the canonical source of truth and keep working with zero config; this
 * only activates once FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL /
 * FIREBASE_PRIVATE_KEY are present (e.g. set as Railway environment
 * variables), at which point every write also gets mirrored to Firestore
 * so state survives a redeploy onto a fresh container.
 */
let firestoreDb: any = null;
let initAttempted = false;

async function getFirestore(): Promise<any | null> {
  if (initAttempted) return firestoreDb;
  initAttempted = true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  try {
    const admin = await import('firebase-admin');
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    firestoreDb = admin.firestore(app);
    console.log('[CloudPersistence] Firestore connected — daemon state will mirror to cloud.');
  } catch (err: any) {
    console.warn('[CloudPersistence] Firestore init failed, staying on local JSON only:', err.message);
    firestoreDb = null;
  }
  return firestoreDb;
}

/** Best-effort mirror of a local JSON state blob into Firestore. Never throws; local file stays canonical. */
export async function mirrorToCloud(collection: string, docId: string, data: any): Promise<void> {
  const db = await getFirestore();
  if (!db) return;
  try {
    await db.collection(collection).doc(docId).set({ data, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.warn(`[CloudPersistence] mirror write failed for ${collection}/${docId}:`, err.message);
  }
}

/** Read a mirrored doc back, e.g. to seed a fresh container before the local file exists. */
export async function readFromCloud(collection: string, docId: string): Promise<any | null> {
  const db = await getFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(collection).doc(docId).get();
    return snap.exists ? snap.data()?.data ?? null : null;
  } catch (err: any) {
    console.warn(`[CloudPersistence] mirror read failed for ${collection}/${docId}:`, err.message);
    return null;
  }
}
