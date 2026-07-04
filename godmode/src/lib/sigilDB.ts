export const initSigilDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('GodModeOS_SigilVault', 1);
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('sigils')) {
                db.createObjectStore('sigils', { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveSigil = async (id: string, data: any) => {
    const db = await initSigilDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('sigils', 'readwrite');
        const store = tx.objectStore('sigils');
        store.put({ id, data, timestamp: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
};

export const loadSigil = async (id: string): Promise<any> => {
    const db = await initSigilDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('sigils', 'readonly');
        const store = tx.objectStore('sigils');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
    });
};
