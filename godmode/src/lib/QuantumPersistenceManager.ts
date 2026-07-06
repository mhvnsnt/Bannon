import { vectorMemory, VectorLog } from './chromaService';

const DB_NAME = 'QuantumPersistenceDB';
const STORE_NAME = 'LRUCacheStore';
const DB_VERSION = 1;

export class QuantumPersistenceManager {
  private static db: IDBDatabase | null = null;
  private static idleTimer: ReturnType<typeof setTimeout> | null = null;
  private static initialized = false;

  static async init() {
    if (typeof window === 'undefined' || this.initialized) return;

    return new Promise<void>((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          console.warn("IndexedDB not supported");
          resolve();
          return;
        }
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('Failed to open IndexedDB for Quantum Persistence');
          resolve(); // Resolve anyway so it doesn't crash
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
      } catch (e) {
        console.error("IndexedDB exception:", e);
        resolve();
      }
    });
  }

  static async saveCache() {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      try {
        const entries = vectorMemory.getCacheEntries();
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.put(entries, 'chromaQueryCache');

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error("Failed to save cache:", request.error);
          resolve();
        };
      } catch (e) {
        console.error("Failed to save cache exception:", e);
        resolve();
      }
    });
  }

  static async loadCache() {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('chromaQueryCache');

        request.onsuccess = () => {
          try {
            if (request.result) {
              vectorMemory.setCacheEntries(request.result);
              console.log('[QuantumPersistence] Successfully restored LRU cache from IndexedDB');
            }
          } catch (err) {
            console.error('[QuantumPersistence] Error applying restored cache:', err);
          }
          resolve();
        };

        request.onerror = () => {
          console.error("Failed to load cache:", request.error);
          resolve();
        };
      } catch (e) {
        console.error("Failed to load cache exception:", e);
        resolve();
      }
    });
  }

  static startIdleTracking() {
    if (typeof window === 'undefined') return;

    const resetIdleTimer = () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      // Save cache after 5 seconds of idle time
      this.idleTimer = setTimeout(() => {
        this.saveCache().catch(e => console.error('[QuantumPersistence] Failed to save cache:', e));
      }, 5000);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    // Initial timer start
    resetIdleTimer();

    // Also try to save before unload
    window.addEventListener('beforeunload', () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      // Synchronous save attempts usually fail in beforeunload, but we rely on the idle timer primarily
    });
  }

  static async initializeAndRestore() {
    if (this.initialized) return;
    this.initialized = true;
    await this.init();
    await this.loadCache();
    this.startIdleTracking();
  }
}
