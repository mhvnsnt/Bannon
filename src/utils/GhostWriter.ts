export class GhostWriter {
    private static dirHandle: FileSystemDirectoryHandle | null = null;
    
    public static async requestProjectAccess() {
        if (!('showDirectoryPicker' in window)) {
            console.warn("[GhostWriter] File System Access API not supported in this browser.");
            return false;
        }
        try {
            // @ts-ignore
            this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            console.log("[GhostWriter] God-Mode persistent local directory access granted.");
            return true;
        } catch (e) {
            console.error("[GhostWriter] Access denied by user/admin:", e);
            return false;
        }
    }

    public static async getFile(filePath: string): Promise<string | null> {
         if (!this.dirHandle) return null;
         try {
             const pathParts = filePath.split('/').filter(p => p !== '.' && p !== '');
             let currentHandle = this.dirHandle;
             for (let i = 0; i < pathParts.length - 1; i++) {
                 // @ts-ignore
                 currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: false });
             }
             // @ts-ignore
             const fileHandle = await currentHandle.getFileHandle(pathParts[pathParts.length - 1], { create: false });
             const file = await fileHandle.getFile();
             return await file.text();
         } catch (e) {
             console.error(`[GhostWriter] Failed to read ${filePath}:`, e);
             return null;
         }
    }

    public static async patchFile(filePath: string, newContent: string) {
        if (!this.dirHandle) {
            console.warn("[GhostWriter] No directory access. Cannot patch file.");
            return false;
        }
        try {
            window.dispatchEvent(new CustomEvent('ghost-writer-active', { detail: { filePath } }));
            
            const pathParts = filePath.split('/').filter(p => p !== '.' && p !== '');
            let currentHandle = this.dirHandle;
            
            for (let i = 0; i < pathParts.length - 1; i++) {
                 // @ts-ignore
                currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: true });
            }
            
            const fileName = pathParts[pathParts.length - 1];
             // @ts-ignore
            const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(newContent);
            await writable.close();
            
            console.log(`[GhostWriter] Successfully patched and self-upgraded: ${filePath}`);
            
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('ghost-writer-idle'));
            }, 2000);
            
            return true;
        } catch (e) {
            console.error(`[GhostWriter] Failed to patch ${filePath}:`, e);
            return false;
        }
    }
}
