import chokidar from 'chokidar';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { SemanticSearch } from './semanticSearch';

// Standard files watchdog logging kinetic perturbations
export const initializeFileSystemWatcher = (db: any) => {
    console.log(`[VAULT WATCHER] Initializing Nexus Source Code Sentinel...`);

    const watcher = chokidar.watch([
        path.join(process.cwd(), 'src'),
        path.join(process.cwd(), 'public'),
        path.join(process.cwd(), 'server.ts')
    ], {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('all', (event, filePath) => {
        console.log(`[VAULT WATCHER] Codebase perturbation [${event}]: ${filePath}`);
        
        try {
            const id = crypto.randomUUID();
            const stmt = db.prepare(`INSERT INTO kinetic_logs (id, session_id, stage_transition, bass_sensitivity, turbulence) VALUES (?, ?, ?, ?, ?)`);
            stmt.run(
                id,
                'nexus-watcher',
                `[CODE_MODIFICATION] ${event} on ${path.basename(filePath)}`,
                0.0,
                1.0
            );

            // Index semantically
            try {
                const text = `Kinetic Session Event:\nTransition: [CODE_MODIFICATION] ${event} on ${path.basename(filePath)}\nSession: nexus-watcher\nBass: 0.0\nTurbulence: 1.0`;
                SemanticSearch.indexNewEntry('kinetic_logs', id, text).catch(() => {});
            } catch (innerE) {}
        } catch (e: any) {
            console.error(`[VAULT WATCHER] Entropy detected in DB insertion:`, e.message);
        }
    });
};

/**
 * Perception Drop Filesystem Watcher
 * Monitors the `vault/perception_drop` directory for new/modified files,
 * splits file content into semantic chunks, and indexes them into the SQLite vector store.
 */
export const initializePerceptionWatcher = () => {
    const perceptionDir = path.join(process.cwd(), 'vault', 'perception_drop');
    console.log(`[PERCEPTION WATCHER] Initializing drop sentinel for folder: ${perceptionDir}`);

    // Ensure directory exists
    try {
        if (!fs.existsSync(perceptionDir)) {
            fs.mkdirSync(perceptionDir, { recursive: true });
            console.log(`[PERCEPTION WATCHER] Created perception_drop directory.`);
        }
    } catch (err: any) {
        console.error(`[PERCEPTION WATCHER] Failed to bootstrap perception_drop folder:`, err.message);
        return;
    }

    const watcher = chokidar.watch(perceptionDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles/folders
        persistent: true,
        ignoreInitial: false, // Ingest existing files on start
        awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100
        }
    });

    watcher.on('add', async (filePath) => {
        console.log(`[PERCEPTION WATCHER] New file dropped: ${path.basename(filePath)}`);
        await handlePerceptionFile(filePath);
    });

    watcher.on('change', async (filePath) => {
        console.log(`[PERCEPTION WATCHER] Existing file updated: ${path.basename(filePath)}`);
        await handlePerceptionFile(filePath);
    });
};

/**
 * Reads, chunks, and semantically indexes a dropped file
 */
async function handlePerceptionFile(filePath: string) {
    try {
        const fileName = path.basename(filePath);
        const stats = fs.statSync(filePath);
        
        // Skip directory and empty files
        if (stats.isDirectory() || stats.size === 0) return;

        // Verify if file is binary or can be safely treated as text
        const contentBuffer = fs.readFileSync(filePath);
        
        // Basic check for text vs binary (null byte detection in first 2KB)
        const isBinary = contentBuffer.slice(0, 2048).includes(0);
        if (isBinary) {
            console.warn(`[PERCEPTION WATCHER] Skipping binary file upload: ${fileName}`);
            return;
        }

        const textContent = contentBuffer.toString('utf8');
        if (!textContent.trim()) {
            console.warn(`[PERCEPTION WATCHER] File is empty or whitespace-only: ${fileName}`);
            return;
        }

        console.log(`[PERCEPTION WATCHER] Ingesting file "${fileName}" (${stats.size} bytes)`);

        // Perform semantic chunking to avoid LLM token overflow and keep vector search precise
        const CHUNK_SIZE = 2500;
        const OVERLAP = 250;
        const chunks: string[] = [];

        if (textContent.length <= CHUNK_SIZE) {
            chunks.push(textContent);
        } else {
            let start = 0;
            while (start < textContent.length) {
                const end = Math.min(start + CHUNK_SIZE, textContent.length);
                let chunkStr = textContent.substring(start, end);
                
                // Attempt to realign block with nearest newline to maintain syntactic boundary integrity
                if (end < textContent.length) {
                    const nextNewline = textContent.indexOf('\n', end - 100);
                    if (nextNewline !== -1 && nextNewline < end + 200) {
                        chunkStr = textContent.substring(start, nextNewline);
                        start = nextNewline;
                        continue;
                    }
                }
                
                chunks.push(chunkStr);
                start += CHUNK_SIZE - OVERLAP;
            }
        }

        console.log(`[PERCEPTION WATCHER] Splitting "${fileName}" into ${chunks.length} chunks`);

        let successCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i].trim();
            if (!chunkText) continue;

            const rowId = `${fileName}_chunk_${i}`;
            const textToEmbed = `[File Drop context: ${fileName} | Block ${i + 1}/${chunks.length}]\n\n${chunkText}`;
            
            const success = await SemanticSearch.indexNewEntry('perception_drop', rowId, textToEmbed);
            if (success) {
                successCount++;
            }
        }

        console.log(`[PERCEPTION WATCHER] Successfully indexed ${successCount}/${chunks.length} vector nodes for "${fileName}" into the SQL vector repository.`);
    } catch (err: any) {
        console.error(`[PERCEPTION WATCHER] Failed to ingest file "${path.basename(filePath)}":`, err.message);
    }
}
