import * as JSZip from 'jszip';

const DB_NAME = 'kinetic-assets';
const DB_VERSION = 1;

class AssetVaultSingleton {
    private static instance: AssetVaultSingleton;
    private dbPromise: Promise<IDBDatabase> | null = null;

    private constructor() {}

    public static getInstance(): AssetVaultSingleton {
        if (!AssetVaultSingleton.instance) {
            AssetVaultSingleton.instance = new AssetVaultSingleton();
        }
        return AssetVaultSingleton.instance;
    }

    public async initVault(): Promise<IDBDatabase> {
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('funnels')) {
                    db.createObjectStore('funnels');
                }
                if (!db.objectStoreNames.contains('cylinders')) {
                    db.createObjectStore('cylinders');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                this.dbPromise = null;
                reject(request.error);
            };
        });

        return this.dbPromise;
    }
}

export const initVault = (): Promise<IDBDatabase> => {
    return AssetVaultSingleton.getInstance().initVault();
};

export const writeAsset = async (storeName: 'funnels' | 'cylinders', name: string, buffer: ArrayBuffer) => {
    const db = await initVault();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(buffer, name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const readAsset = async (storeName: 'funnels' | 'cylinders', name: string): Promise<ArrayBuffer | null> => {
    const db = await initVault();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(name);
        request.onsuccess = () => resolve(request.result as ArrayBuffer);
        request.onerror = () => reject(request.error);
    });
};

export const readAllEntries = async (storeName: 'funnels' | 'cylinders'): Promise<{name: string, buffer: ArrayBuffer}[]> => {
    const db = await initVault();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAllKeys();
        
        request.onsuccess = async () => {
            const keys = request.result;
            const results: {name: string, buffer: ArrayBuffer}[] = [];
            for (const key of keys) {
                const buffer = await readAsset(storeName, key as string);
                if (buffer) {
                    results.push({ name: key as string, buffer });
                }
            }
            resolve(results);
        };
        request.onerror = () => reject(request.error);
    });
};

export const getAssetNames = async (storeName: 'funnels' | 'cylinders'): Promise<string[]> => {
    const db = await initVault();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve((request.result as string[]) || []);
        request.onerror = () => reject(request.error);
    });
};

export const exportVault = async () => {
    const funnels = await readAllEntries('funnels');
    const cylinders = await readAllEntries('cylinders');
    
    const zip = new JSZip();
    const fFolder = zip.folder("funnels");
    funnels.forEach(f => fFolder?.file(f.name, f.buffer));
    
    const cFolder = zip.folder("cylinders");
    cylinders.forEach(c => cFolder?.file(c.name, c.buffer));
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "master_grid_vault.zip";
    a.click();
    URL.revokeObjectURL(url);
};

export const importAssetFile = async (file: File, storeName: 'funnels' | 'cylinders'): Promise<string> => {
    let buffer = await file.arrayBuffer();
    let finalName = file.name;
    
    // Check if it's a zip file based on magic bytes (PK)
    const uint8 = new Uint8Array(buffer);
    const isZip = file.name.toLowerCase().endsWith(".zip") || (uint8.length >= 2 && uint8[0] === 0x50 && uint8[1] === 0x4B);
    
    if (isZip) {
        const unpackedZip = await JSZip.loadAsync(buffer);
        const targetFilename = Object.keys(unpackedZip.files).find(f => f.toLowerCase().endsWith(".glb") || f.toLowerCase().endsWith(".fbx") || f.toLowerCase().endsWith(".gltf"));
        if (targetFilename) {
            buffer = await unpackedZip.file(targetFilename)!.async("arraybuffer");
            finalName = targetFilename; // Use the extracted inner file's name
        } else {
            throw new Error("No .glb, .gltf, or .fbx found in zip");
        }
    }

    await writeAsset(storeName, finalName, buffer);
    return finalName;
};
