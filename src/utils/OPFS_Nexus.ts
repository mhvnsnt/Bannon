export class OPFS_Nexus {
    private dirHandle: FileSystemDirectoryHandle | null = null;
    private initialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            this.dirHandle = await navigator.storage.getDirectory();
            this.initialized = true;
            console.log("OPFS_Nexus mounted successfully.");
        } catch (e) {
            console.error("OPFS_Nexus mount failed:", e);
        }
    }

    public async storeSnippet(snippet: string) {
        if (!this.initialized || !this.dirHandle) return;
        const timestamp = Date.now();
        try {
            const fileHandle = await this.dirHandle.getFileHandle(`snippet_${timestamp}.txt`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(snippet);
            await writable.close();
        } catch (e) {
            console.error("OPFS Write Error:", e);
        }
    }

    public async searchHistory(query: string): Promise<string[]> {
        if (!this.initialized || !this.dirHandle) return [];
        const results: string[] = [];
        
        try {
            // @ts-ignore
            for await (const entry of this.dirHandle.values()) {
                if (entry.kind === 'file') {
                    const fileHandle = await this.dirHandle.getFileHandle(entry.name);
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    
                    // Basic keyword-based fallback (would be TF-IDF in full implementation)
                    if (text.includes(query)) {
                        results.push(text);
                    }
                }
            }
        } catch (e) {
            console.error("OPFS Read Error:", e);
        }

        return results;
    }
}
