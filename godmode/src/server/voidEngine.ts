export class VoidCompressionEngine {
    constructor(private semanticSearch: any = null) {}

    /**
     * Compresses large code files (HTML, JS, TS, CSS) into a lightweight "skeleton"
     * targeting >90% compression ratio.
     */
    public async compressForTask(
        fileContent: string, 
        taskIntent: string, 
        maxTokens: number = 16000
    ) {
        const stats: { [key: string]: number } = {};
        const originalLength = fileContent.length;
        const estOriginalTokens = Math.ceil(originalLength / 4);
        stats["Original System Tokens"] = estOriginalTokens;

        let workingContent = fileContent;

        // ==========================================
        // PASS 3 - COMMENT STRIP (Run early to clean code noise)
        // ==========================================
        const beforeCommentStrip = workingContent.length;
        // Strip block comments /* ... */
        workingContent = workingContent.replace(/\/\*[\s\S]*?\*\//g, '');
        // Strip line comments // ... (making sure we don't destroy http:// or file annotation comments)
        workingContent = workingContent.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') && !trimmed.includes('File:')) {
                return '';
            }
            // inline comment check
            const idx = line.indexOf('//');
            if (idx !== -1 && !line.substring(0, idx).includes('http:') && !line.substring(0, idx).includes('https:') && !line.substring(idx).includes('File:')) {
                return line.substring(0, idx);
            }
            return line;
        }).join('\n');
        stats["After Comment Strip"] = Math.ceil(workingContent.length / 4);

        // ==========================================
        // PASS 1 - STYLE TOTAL VOID
        // ==========================================
        const beforeStyleVoid = workingContent.length;
        // Strip HTML style tags
        workingContent = workingContent.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, (match) => {
            const saved = Math.ceil(match.length / 4);
            return `[STYLES: VOIDED — ${saved} tokens saved]`;
        });
        // Strip CSS files or major CSS rules blocks if file is CSS
        if (taskIntent.toLowerCase().includes('style') === false) {
            // we can recognize styled-components or major tailwind styles blocks
            workingContent = workingContent.replace(/const\s+\w+\s*=\s*styled\.[a-zA-Z0-9]+`[\s\S]*?`/g, (match) => {
                const saved = Math.ceil(match.length / 4);
                return `[STYLES: VOIDED — ${saved} tokens saved]`;
            });
        }
        stats["After Style Void"] = Math.ceil(workingContent.length / 4);

        // ==========================================
        // PASS 2 - IMPORT COMPRESSION
        // ==========================================
        const beforeImportVoid = workingContent.length;
        const importLines: string[] = [];
        const nonImportLines: string[] = [];
        
        workingContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('import ') || trimmed.startsWith('import{') || (trimmed.includes('require(') && (trimmed.startsWith('const ') || trimmed.startsWith('var ') || trimmed.startsWith('let ')))) {
                importLines.push(line);
            } else {
                nonImportLines.push(line);
            }
        });

        if (importLines.length > 0) {
            // Check if taskIntent is targeting a specific package
            const isTargetedImport = (imp: string) => {
                const lowerIntent = taskIntent.toLowerCase();
                const match = imp.match(/from\s+['"]([^'"]+)['"]/i) || imp.match(/require\(['"]([^'"]+)['"]\)/i);
                if (match) {
                    const pkg = match[1].toLowerCase();
                    return lowerIntent.includes(pkg);
                }
                return false;
            };

            const preservedImports = importLines.filter(isTargetedImport);
            const collapsedCount = importLines.length - preservedImports.length;
            const collapsedSnippet = collapsedCount > 0 
                ? `[IMPORTS: ${collapsedCount} declarations — ${Math.ceil((collapsedCount * 40) / 4)} tokens saved]`
                : "";
            
            workingContent = [
                ...preservedImports,
                collapsedSnippet,
                ...nonImportLines
            ].filter(Boolean).join('\n');
        }
        stats["After Import Compression"] = Math.ceil(workingContent.length / 4);

        // ==========================================
        // PASS 0 - DEAD CODE VOID (Scan AST / regex list matches)
        // ==========================================
        const beforeDeadVoid = workingContent.length;
        // Find function declarations and check their reference occurrences in the rest of the text
        const functionDeclarations = Array.from(workingContent.matchAll(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/g));
        const deadFunctions: string[] = [];
        
        functionDeclarations.forEach(match => {
            const name = match[1] || match[2];
            if (name && name.length > 3) {
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                const occurrences = (workingContent.match(regex) || []).length;
                // If only 1 occurrence (its own definition), it is dead code
                if (occurrences <= 1) {
                    deadFunctions.push(name);
                }
            }
        });

        if (deadFunctions.length > 0) {
            // Void those functions
            deadFunctions.forEach(name => {
                const regex = new RegExp(`(?:function\\s+${name}\\s*\\([\\s\\S]*?\\)\\s*\\{[\\s\\S]*?\\}|const\\s+${name}\\s*=\\s*(?:\\([^)]*\\)|[a-zA-Z0-9_]+)\\s*=>\\s*\\{[\\s\\S]*?\\})`, 'g');
                workingContent = workingContent.replace(regex, `/* [DEAD FUNCTION VOIDED: ${name}] */`);
            });
            console.log(`[VoidEngine] PASS 0: ${deadFunctions.length} dead functions voided (${deadFunctions.join(', ')})`);
        }
        stats["After Dead Code Pass"] = Math.ceil(workingContent.length / 4);

        // ==========================================
        // PASS 4 - DUPLICATE PATTERN DETECTION
        // ==========================================
        // Parse functions/chunks and find structural patterns
        let chunks = this.structuralMapping(workingContent);

        // Group chunks by rough length and structural similarity
        const signatureGroups: { [key: string]: any[] } = {};
        chunks.forEach(chunk => {
            // Create a normalized structural key (strip numbers and specific names, keep brackets shape)
            const structureKey = chunk.content
                .replace(/[a-zA-Z0-9_]+/g, 'X')
                .replace(/\s+/g, '')
                .substring(0, 80); // examine first 80 characters of structure

            if (structureKey.length > 10) {
                if (!signatureGroups[structureKey]) {
                    signatureGroups[structureKey] = [];
                }
                signatureGroups[structureKey].push(chunk);
            }
        });

        const patternVoidedIds = new Set<number>();
        Object.keys(signatureGroups).forEach(key => {
            const group = signatureGroups[key];
            if (group.length >= 3) {
                // Keep the first item in the group, void the rest
                for (let i = 1; i < group.length; i++) {
                    patternVoidedIds.add(group[i].id);
                }
            }
        });

        // Update chunks content if pattern voided
        chunks = chunks.map(chunk => {
            if (patternVoidedIds.has(chunk.id)) {
                return {
                    ...chunk,
                    content: `/* [PATTERN MATCH x DUPLICATE: VOIDED] */`,
                    lines: 1
                };
            }
            return chunk;
        });

        stats["After Duplicate Pattern Pass"] = Math.ceil(chunks.reduce((acc, c) => acc + c.content.length, 0) / 4);

        // ==========================================
        // PASS 5 - SEMANTIC RADIUS & CHUNKING
        // ==========================================
        // Set maximum chunks based on taskIntent semantic clues
        let maxChunks = 3;
        const intentLower = taskIntent.toLowerCase();
        if (intentLower.includes('architecture') || intentLower.includes('refactor') || intentLower.includes('orchestrator') || intentLower.includes('parliament')) {
            maxChunks = 5;
        } else if (intentLower.includes('fix') || intentLower.includes('typo') || intentLower.includes('rename') || intentLower.includes('error') || intentLower.includes('bug')) {
            maxChunks = 1;
        }

        const relevantChunks = await this.semanticTargeting(chunks, taskIntent);
        const topChunks = relevantChunks.slice(0, maxChunks);
        const active_chunk_ids = topChunks.map((c: any) => c.id);

        // Assemble the final skeletonized output
        let reconstructed = '';
        for (const chunk of chunks) {
            if (active_chunk_ids.includes(chunk.id) || chunk.content.includes('File:')) {
                reconstructed += chunk.content + '\n';
            } else {
                // Skeletonization stub
                const lines = chunk.content.split('\n');
                let signature = '';
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('{')) {
                        signature = lines.slice(0, i + 1).join('\n').trim();
                        break;
                    }
                }
                if (!signature) {
                    signature = lines[0].trim();
                }
                if (signature.length > 150) {
                    signature = signature.substring(0, 140) + "... {";
                }
                reconstructed += `${signature} ... [VOID COMPRESSED ${chunk.lines} LINES] ... }\n`;
            }
        }

        const finalTokens = Math.ceil(reconstructed.length / 4);
        stats["Final Output Tokens"] = finalTokens;

        const savingsPercentage = estOriginalTokens > 0 
            ? ((estOriginalTokens - finalTokens) / estOriginalTokens) * 100 
            : 0;
        
        const hitTarget90 = savingsPercentage >= 90;

        console.log(`[VoidEngine] Compression Complete. Stats:`, stats);
        console.log(`[VoidEngine] Final Compression Ratio: ${savingsPercentage.toFixed(2)}% (Target 90%+ Hit: ${hitTarget90 ? 'YES' : 'NO'})`);

        return {
            content: reconstructed,
            active_chunk_ids,
            stats: {
                originalTokens: estOriginalTokens,
                compressedTokens: finalTokens,
                savingsPercentage,
                hitTarget90,
                passBreakdown: stats
            }
        };
    }

    private structuralMapping(content: string) {
        const lines = content.split('\n');
        const chunks: any[] = [];
        let currentChunk = '';
        let chunkLines = 0;
        let idCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match function start, export start, class declaration as starting point for a chunk
            if ((line.includes('function ') || line.includes('class ') || line.includes('const ') && line.includes('=>')) && chunkLines > 2) {
                chunks.push({ id: idCount++, content: currentChunk, lines: chunkLines });
                currentChunk = line + '\n';
                chunkLines = 1;
            } else {
                currentChunk += line + '\n';
                chunkLines++;
            }
        }
        if (chunkLines > 0) {
            chunks.push({ id: idCount++, content: currentChunk, lines: chunkLines });
        }
        return chunks;
    }

    private async semanticTargeting(chunks: any[], taskIntent: string) {
        if (this.semanticSearch && typeof this.semanticSearch.findSimilar === 'function') {
            try {
                return await this.semanticSearch.findSimilar(chunks, taskIntent);
            } catch (e) {
                console.warn('Semantic search failed in VoidEngine, falling back to keyword matching:', e);
            }
        }

        const skip = ['update', 'the', 'loop', 'in', 'and', 'for', 'of', 'a', 'to'];
        const nouns = taskIntent.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
            .filter(n => n.length > 2 && !skip.includes(n));
            
        return chunks.map(chunk => {
            let score = 0;
            const lowerContent = chunk.content.toLowerCase();
            nouns.forEach(noun => {
                if (lowerContent.includes(noun)) {
                    score += 5;
                }
            });
            // Task intent context multipliers
            if (lowerContent.includes('parliament') || lowerContent.includes('model') || lowerContent.includes('critic')) {
                score += 15;
            }
            if (lowerContent.includes('void') || lowerContent.includes('compress') || lowerContent.includes('ast')) {
                score += 10;
            }
            return { ...chunk, score };
        }).sort((a, b) => b.score - a.score);
    }
}
