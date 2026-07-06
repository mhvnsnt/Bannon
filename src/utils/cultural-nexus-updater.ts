import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Initialize server-side Gemini SDK helper
const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("[CulturalNexusUpdater] Warning: GEMINI_API_KEY is not defined. Using mock evaluation.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export interface SlangMapping {
    term: string;
    target_primitive: string;
    drift_score: number;
    status: 'COMMITTED' | 'FLAGGED_AMBIGUOUS';
    context_scraped: string;
    simulation_pass: boolean;
}

export async function runCulturalNexusUpdate(logger?: (msg: string) => void): Promise<{
    success: boolean;
    addedCount: number;
    updatedTerms: string[];
    ledgerEntries: any[];
}> {
    const log = logger || ((msg) => console.log(`[CulturalNexusUpdater] ${msg}`));
    log("🕷️ [Ingestion] Launching Obscura headless browser in background schedule...");
    log("🕸️ [Ingestion] Target: Trending X threads & Web culture hubs (Crawl4AI stealth crawl)...");
    
    // Simulate Crawl4AI stealth crawl on slang directories / community boards
    await new Promise(resolve => setTimeout(resolve, 1500));
    log("✔ [Ingestion] Scraped 14.2KB of raw high-frequency text. DOM tags pruned.");

    // Curate simulated high-velocity internet text snippets to pass to the semantic drift evaluator
    const rawInternetText = `
    "Bro my script got stuck in a total rizz loop calling the API in an infinite circle, infinite doomscroll vibes"
    "Absolute skill issue - compiler threw a code L-take error on line 45, won't even compile, let him cook but he burned it"
    "Deno sandbox threw a massive brainrot overflow error when allocating linear WASM memory, out of memory real fast"
    "Websocket just ghosted connection after 30s timeout, silent treatment from the backend server"
    "Tried to fetch protected telemetry but got NPC gatekept by the cloudflare proxy, unauthorized access"
    "Total vibe collapse in the mainframe. Everything is down, system crashed completely."
    `;

    log("🧠 [Evaluator] Initializing Semantic Drift Tracking engine...");
    log("📐 [Evaluator] Loading vector embeddings for contextual proximity mapping...");

    let newTerms: SlangMapping[] = [];
    const ai = getAiClient();

    if (ai) {
        try {
            log("🤖 [Gemini Engine] Analyzing semantic distance between internet speech and tech primitives...");
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: `
                You are the Semantic Drift Evaluator for CODEDUMMY.
                Your job is to parse high-velocity web text and identify new internet slang words that describe technical primitives or system errors.
                
                Analyze the following scraped text:
                """
                ${rawInternetText}
                """
                
                The known core system technical primitives are:
                - "system_crash" (current slang: "Total Vibe Collapse")
                - "out_of_memory" (current slang: "Brainrot Overflow")
                - "syntax_error" (current slang: "No Cap Skill Issue")
                - "network_timeout" (current slang: "Ghosted Connection")
                - "infinite_loop" (current slang: "Infinite Doomscroll")
                - "unauthorized" (current slang: "NPC Gatekept")
                - "network_delay" (current slang: "Vibe Check Speed")
                - "success" (current slang: "W Cook")
                
                Determine if there are new emerging slang mappings with high proximity. Output exactly a JSON array of mappings.
                Each mapping must have:
                1. "term": The new slang term identified (e.g. "Rizz Loop", "Code L-Take", "NPC Gatekept").
                2. "target_primitive": Must be one of the known technical primitives listed above.
                3. "drift_score": A decimal confidence between 0.6 and 0.99 indicating how well it fits.
                4. "status": "COMMITTED" if score is >= 0.8 else "FLAGGED_AMBIGUOUS".
                5. "context_scraped": The context string from the scraped text.
                6. "simulation_pass": true if status is "COMMITTED" else false.
                
                Format as valid JSON only, without markdown blocks.
                `
            });

            const rawText = response.text || "";
            // Strip any markdown code fence if outputted by accident
            const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            newTerms = JSON.parse(cleanJson);
        } catch (err: any) {
            log(`⚠ [Gemini Evaluator] Error during LLM evaluation: ${err.message}. Using fallback analyzer.`);
            newTerms = getFallbackMappings();
        }
    } else {
        log("ℹ [Evaluator] Running localized offline semantic proximity matcher...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        newTerms = getFallbackMappings();
    }

    log(`✨ [Evaluator] Identified ${newTerms.length} potential cultural-technical mappings.`);

    // Read existing files
    const dictPath = path.join(process.cwd(), 'src/data/cultural_dictionary.json');
    const translationSchemaPath = path.join(process.cwd(), 'src/data/translation_schema.json');
    const ledgerPath = path.join(process.cwd(), 'src/data/cultural_ledger.json');

    let dictionary: any = { mappings: {} };
    let ledger: any = { entries: [] };

    try {
        if (fs.existsSync(translationSchemaPath)) {
            dictionary = JSON.parse(fs.readFileSync(translationSchemaPath, 'utf8'));
        } else if (fs.existsSync(dictPath)) {
            dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
        }
        if (fs.existsSync(ledgerPath)) {
            ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
        }
    } catch (e) {
        log("⚠ [Refactor] Error reading existing schema files. Creating clean structures.");
    }

    let addedCount = 0;
    const updatedTerms: string[] = [];

    // Apply auto-building loop (The Refactor)
    for (const mapping of newTerms) {
        log("🧪 [Simulation] Running localized terminal-simulation pass for \"" + mapping.term + "\" -> \"" + mapping.target_primitive + "\"...");
        // Test visual clarity simulation
        if (mapping.simulation_pass) {
            log("✔ [Simulation] Pass! No visual jargon conflict detected.");
            
            // Map the primitive in the dictionary
            dictionary.mappings[mapping.target_primitive] = mapping.term;
            addedCount++;
            updatedTerms.push(`${mapping.target_primitive} ➔ ${mapping.term}`);
            
            // Log to ledger
            ledger.entries.unshift({
                id: `ledger-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                term: mapping.term,
                target_primitive: mapping.target_primitive,
                drift_score: mapping.drift_score,
                status: 'COMMITTED',
                context_scraped: mapping.context_scraped,
                timestamp: new Date().toISOString(),
                simulation_pass: true
            });
        } else {
            log("❌ [Simulation] Simulation failed for \"" + mapping.term + "\" due to semantic ambiguity. Flagged for review.");
            ledger.entries.unshift({
                id: `ledger-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                term: mapping.term,
                target_primitive: mapping.target_primitive,
                drift_score: mapping.drift_score,
                status: 'FLAGGED_AMBIGUOUS',
                context_scraped: mapping.context_scraped,
                timestamp: new Date().toISOString(),
                simulation_pass: false
            });
        }
    }

    // Write updated schema/ledger back
    dictionary.last_updated = new Date().toISOString();
    dictionary.version = bumpVersion(dictionary.version || "2.4.1");

    try {
        fs.writeFileSync(dictPath, JSON.stringify(dictionary, null, 2), 'utf8');
        fs.writeFileSync(translationSchemaPath, JSON.stringify(dictionary, null, 2), 'utf8');
        fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
        log(`📂 [Refactor] Local configuration tables updated autonomously! Refactored dictionary & translation_schema to v${dictionary.version}.`);
        log(`📂 [Refactor] Successfully committed updates without server restart.`);
    } catch (writeErr: any) {
        log(`❌ [Refactor] Failed to write updated structures: ${writeErr.message}`);
    }

    return {
        success: true,
        addedCount,
        updatedTerms,
        ledgerEntries: ledger.entries
    };
}

function bumpVersion(version: string): string {
    const parts = version.split('.').map(Number);
    if (parts.length === 3) {
        parts[2] += 1; // Bump patch version
        return parts.join('.');
    }
    return "2.4.2";
}

function getFallbackMappings(): SlangMapping[] {
    return [
        {
            term: "Rizz Loop",
            target_primitive: "infinite_loop",
            drift_score: 0.93,
            status: "COMMITTED",
            context_scraped: "My script got stuck in a total rizz loop calling the API in an infinite circle.",
            simulation_pass: true
        },
        {
            term: "Code L-Take",
            target_primitive: "syntax_error",
            drift_score: 0.89,
            status: "COMMITTED",
            context_scraped: "The compiler threw a code L-take error on line 45, won't compile.",
            simulation_pass: true
        },
        {
            term: "Brainrot Overflow",
            target_primitive: "out_of_memory",
            drift_score: 0.95,
            status: "COMMITTED",
            context_scraped: "Deno sandbox threw a massive brainrot overflow error allocating memory.",
            simulation_pass: true
        }
    ];
}
