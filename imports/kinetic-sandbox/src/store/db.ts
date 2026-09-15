const DB_NAME = 'KineticSandboxDB';
const DB_VERSION = 1;
const STORE_ASSETS = 'assets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAsset(id: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite');
    const store = tx.objectStore(STORE_ASSETS);
    store.put({ id, file, name: file.name, type: file.name.split('.').pop() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAsset(id: string): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readonly');
    const store = tx.objectStore(STORE_ASSETS);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.file || null);
    request.onerror = () => reject(request.error);
  });
}
