export const initSigilDB = (): Promise<IDBDatabase | null> => {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open('GodModeOS_SigilVault', 1);
            request.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('sigils')) {
                    db.createObjectStore('sigils', { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => {
                console.warn('IndexedDB failed to open:', request.error);
                resolve(null);
            };
        } catch (err) {
            console.warn('IndexedDB open caught exception:', err);
            resolve(null);
        }
    });
};

export const saveSigil = async (id: string, data: any) => {
    const db = await initSigilDB();
    if (!db) return false;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction('sigils', 'readwrite');
            const store = tx.objectStore('sigils');
            store.put({ id, data, timestamp: Date.now() });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => {
                console.warn('IndexedDB save error:', tx.error);
                resolve(false);
            };
        } catch (err) {
            console.warn('IndexedDB transaction caught exception:', err);
            resolve(false);
        }
    });
};

export const loadSigil = async (id: string): Promise<any> => {
    const db = await initSigilDB();
    if (!db) return null;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction('sigils', 'readonly');
            const store = tx.objectStore('sigils');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => {
                console.warn('IndexedDB load error:', request.error);
                resolve(null);
            };
        } catch (err) {
            console.warn('IndexedDB get caught exception:', err);
            resolve(null);
        }
    });
};
