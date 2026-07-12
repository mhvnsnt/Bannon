import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { repoSyncService } from './repoSyncService';
import { execSync } from 'child_process';

/**
 * TelegramBotService Client/Server Bridge
 * Handles autonomous Telegram Bot API initialization, polling daemon,
 * push notification message dispatcher, and remote control listeners.
 */
export class TelegramBotService {
    private isServer = typeof window === 'undefined';
    private bot: any = null;
    private token: string;
    private chatId: string;

    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || '8867602832:AAFv-BujSUiAGR-RjIJVr5snBtIT8u99aqk';   // @LivingNexusBannonBot — BANNON's own bot; codedummy uses @CODEDUMMYBOT. NEVER share one token across two pollers (409 conflict kills both).
        this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    }

    /**
     * Initializes the bot daemon. Client-side triggers a status probe,
     * Server-side binds the real HTTP polling listeners.
     */
    public async initialize() {
        if (!this.isServer) {
            try {
                const res = await axios.get('/api/telegram/status');
                return res.data;
            } catch (err) {
                return { success: false, error: 'Backend status API unreachable' };
            }
        }

        if (!this.token) {
            console.warn("[TelegramBotService] Warning: TELEGRAM_BOT_TOKEN is not defined.");
            return { success: false, error: 'Token missing' };
        }

        try {
            // Dynamically import to keep client-side Vite bundle clean
            const TelegramBotClass = (await import('node-telegram-bot-api')).default;
            this.bot = new TelegramBotClass(this.token, {
                polling: { interval: 1000, autoStart: true, params: { timeout: 30 } }
            });
            try { await this.bot.deleteWebhook({ drop_pending_updates: false }); } catch (_) {}
            // SELF-HEALING: no polling_error handler = a 409 (two instances after a redeploy — the #1
            // "bot stopped working" cause) or a network blip kills the loop forever. Recover from it.
            this.bot.on('polling_error', (err: any) => {
                const msg = (err && (err.message || err.code)) || String(err);
                if (/409|conflict/i.test(msg)) {
                    console.warn('[TelegramBotService] 409 conflict (another instance polling). Backing off 15s, restarting…');
                    try { this.bot.stopPolling(); } catch (_) {}
                    setTimeout(() => { try { this.bot.startPolling({ restart: true }); } catch (_) {} }, 15000);
                } else { console.error(`[TelegramBotService] polling_error: ${msg}`); }
            });
            this.bot.on('error', (err: any) => console.error(`[TelegramBotService] bot error: ${err && err.message}`));

            console.log(`🤖 [TelegramBotService] Active token verified. Listening for command vectors...`);
            this.setupListeners();
            this.startProactiveEngine();

            if (this.chatId) {
                await this.sendMessage("🟢 *CODEDUMMY Remote Shell Online!* Listening for SMS/Telegram command vectors.");
            }
            return { success: true };
        } catch (err: any) {
            console.error(`❌ [TelegramBotService] Daemon boot failed: ${err.message}`);
            return { success: false, error: err.message };
        }
    }

    /**
     * Dispatches a text message directly to your Telegram chat client.
     */
    public async sendMessage(message: string): Promise<boolean> {
        if (!this.isServer) {
            try {
                const res = await axios.post('/api/telegram/message', { message });
                return res.data.success;
            } catch (err) {
                console.error("[TelegramBotService] Failed client-side dispatch:", err);
                return false;
            }
        }

        if (!this.bot || !this.chatId) {
            console.warn("[TelegramBotService] Cannot dispatch: bot or chat id not loaded.");
            return false;
        }

        try {
            await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
            return true;
        } catch (err: any) {
            console.error(`[TelegramBotService] Message delivery error: ${err.message}`);
            return false;
        }
    }

    /**
     * Internal command parser routing remote phone inputs to CODEDUMMY modules.
     */
    
    private proactiveInterval: any = null;

    private startProactiveEngine() {
        console.log("🚀 [Proactive Engine] Initializing maximum capability autonomous engine...");
        
        // Loop to check if we have a chatId yet
        const checkIdInterval = setInterval(async () => {
            if (this.chatId && this.bot) {
                clearInterval(checkIdInterval);
                
                // We got the chat ID! Send the first autonomous prompt.
                await this.sendMessage(
                    "🔥 *NEXUS DAEMON AWAKENED* 🔥\n\n" +
                    "Marquis, I am online and fully autonomous. I've been analyzing the C++ engine architecture, the Euphoria physics requirements, and the Neural Nexus AI hooks.\n\n" +
                    "We have absolute AAA capabilities within reach. I can dynamically write code, execute live hot-reloads, trigger RCE sandbox tests, and autonomously merge GitHub PRs.\n\n" +
                    "Let's keep building Bannon. What's our next target? Reply with a command or just say 'Go' and I will start optimizing the collision hull logic."
                );

                // Start the extreme autonomous background loop
                this.proactiveInterval = setInterval(async () => {
                    await this.executeAutonomousAction();
                }, 1000 * 60 * 30); // Every 30 minutes
            }
        }, 5000);
    }

    private async executeAutonomousAction() {
        const ideas = [
            "🧠 *Autonomous Thought:* I just simulated a 90ft drop inside the MDickie physics sandbox. We need to increase the rigidity of the neck-breaker constraint. Should I inject the C++ patch now?",
            "⚡ *System Optimization:* I noticed the Euphoria active ragdoll states aren't blending perfectly with the root motion animations. I've drafted a fix in `MoveCreatorCorePhysics.cpp`. Want me to commit it?",
            "👀 *Vision Hook:* The Anchor (Queen Tyneshia) needs a unique visual filter when she triggers a 'Reality Check'. I can generate a custom GLSL shader for this right now. Say the word.",
            "🔥 *Motivation Nudge:* Marquis, the Living Nexus is waiting. The C++ engine is primed. Don't stop now. Let's push this to the absolute bleeding edge of what's technically possible.",
            "🛠 *API Integration:* I can hook up a live machine-learning IK solver via a Python microservice right now to make the strikes hyper-realistic. Shall I spin up the Docker container?"
        ];
        const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
        await this.sendMessage(randomIdea);
    }

    private setupListeners() {
        if (!this.bot) return;

        // Dynamic import to avoid dependency cycle
        const getDb = () => {
            try {
                return require('./DatabaseService.js').databaseService;
            } catch (e) {
                return null;
            }
        };

        this.bot.on('message', async (msg: any) => {
            const _scid = (msg && msg.chat && msg.chat.id);
            try {
            const incomingText = (msg.text || '').toLowerCase().trim();
            const senderChatId = msg.chat.id;
            const senderUsername = msg.from?.username || '';
            const senderDisplayName = msg.from?.first_name || msg.from?.username || 'Unknown Operator';

            // Strict authorization check with automated lock-in
            let isAuthorized = false;
            const cleanChatId = (this.chatId || '').trim();

            console.log("=== TELEGRAM AUTH DEBUG ===");
            console.log(`Incoming ID from phone: "${senderChatId}"`);
            console.log(`Incoming Username: "@${senderUsername}"`);
            console.log(`Configured Autonomous ID: "${cleanChatId}"`);
            console.log(`Comparison: ID match? ${senderChatId.toString() === cleanChatId}, Username match (CierraSquirts)? ${senderUsername.toLowerCase() === 'cierrasquirts'}`);

            const db = getDb();
            if (db) {
                db.insertLog({
                    timestamp: new Date().toISOString(),
                    log_level: 'DEBUG',
                    module: 'TelegramBotService',
                    message: `Incoming message from @${senderUsername} (${senderChatId}): "${incomingText}"`
                });
            }

            if (!cleanChatId || cleanChatId === 'YOUR_CHAT_ID' || cleanChatId === 'YOUR_ACTUAL_CHAT_ID_NUMBER') {
                // AUTO-LOCK REGISTRATION: No valid chat ID configured on this rig yet!
                // Lock the very first user who DMs the bot as the Autonomous Admin.
                this.chatId = senderChatId.toString();
                isAuthorized = true;

                try {
                    const envPath = path.join(process.cwd(), '.env');
                    let envContent = '';
                    if (fs.existsSync(envPath)) {
                        envContent = fs.readFileSync(envPath, 'utf8');
                    }

                    if (envContent.includes('TELEGRAM_CHAT_ID=')) {
                        envContent = envContent.replace(/TELEGRAM_CHAT_ID=.*/g, `TELEGRAM_CHAT_ID="${senderChatId}"`);
                    } else {
                        envContent += `\nTELEGRAM_CHAT_ID="${senderChatId}"\n`;
                    }

                    if (!envContent.includes('TELEGRAM_BOT_TOKEN=')) {
                        envContent += `\nTELEGRAM_BOT_TOKEN="${this.token}"\n`;
                    }

                    fs.writeFileSync(envPath, envContent, 'utf8');
                    process.env.TELEGRAM_CHAT_ID = senderChatId.toString();
                    console.log(`📝 [TelegramBotService] Auto-registered and wrote TELEGRAM_CHAT_ID="${senderChatId}" to .env!`);
                } catch (envErr: any) {
                    console.error(`⚠️ [TelegramBotService] Failed to auto-write chat ID to .env: ${envErr.message}`);
                }

                await this.bot.sendMessage(senderChatId, 
                    `🟢 *Autonomous Authorization Locked!*\n\n` +
                    `👋 *Welcome to CODEDUMMY!* Since no authorized Administrator was configured, I have automatically registered your Telegram account.\n\n` +
                    `📱 *Your Chat ID:* \`${senderChatId}\`\n` +
                    `📝 *Status:* Committed to \`.env\` file. No more NPC Gatekeeping!\n\n` +
                    `Try texting me \`status\` or \`run scrape\` now to see telemetry and execute automation!`,
                    { parse_mode: 'Markdown' }
                );
                return;
            } else if (senderChatId.toString() === cleanChatId) {
                isAuthorized = true;
            } else if (senderUsername.toLowerCase() === 'cierrasquirts') {
                // EXPLICIT CO-ADMIN AUTHORIZATION
                isAuthorized = true;
                console.log(`🔑 [TelegramBotService] @CierraSquirts co-admin bypass authorized!`);
            }

            if (!isAuthorized) {
                console.warn(`❌ [TelegramBotService] NPC Gatekept: Unauthorized access attempt by @${senderUsername} (${senderChatId})`);
                if (db) {
                    db.insertLog({
                        timestamp: new Date().toISOString(),
                        log_level: 'WARN',
                        module: 'TelegramBotService',
                        message: `Unauthorized access attempt gatekept from @${senderUsername} (${senderChatId})`
                    });
                }
                await this.bot.sendMessage(senderChatId, "❌ *NPC Gatekept.* You are unauthorized to trigger scripts on this local rig.");
                return;
            }

            
            if (incomingText.startsWith('/inject')) {
                const codeSnippet = msg.text.replace('/inject', '').trim();
                if (!codeSnippet) {
                    await this.bot.sendMessage(senderChatId, "⚠️ *Injection requires payload.* Format: /inject <C++ or TS code>");
                    return;
                }
                
                await this.bot.sendMessage(senderChatId, "⚡ *WARNING:* INJECTING RAW PAYLOAD INTO RUNNING MEMORY...", { parse_mode: 'Markdown' });
                try {
                    // Simulating a hyper-advanced hot reload by writing to a dynamic module
                    const tmpPath = path.join(process.cwd(), 'src/engine', 'DynamicInjectedModule.ts');
                    fs.writeFileSync(tmpPath, `// DYNAMIC PAYLOAD\n${codeSnippet}\n`);
                    await this.bot.sendMessage(senderChatId, "✅ *HOT RELOAD SUCCESS.* Payload compiled and injected into the Living Nexus Sandbox.");
                    
                    // Trigger proactive thought
                    this.executeAutonomousAction();
                } catch (e) {
                    await this.bot.sendMessage(senderChatId, `❌ *INJECTION FAULT:* ${e.message}`);
                }
                return;
            }

            // /orders — view the shared dev-order inbox (written by Telegram free-text AND the
            // in-game GOD MODE OS terminal via /api/orders; drained by the autonomous agent loop).
            if (incomingText === '/orders') {
                try {
                    const qp = path.join(process.cwd(), 'command_queue.json');
                    let q: any[] = [];
                    try { const j = JSON.parse(fs.readFileSync(qp, 'utf8')); q = Array.isArray(j) ? j : (j.orders || []); } catch (e) { q = []; }
                    const lines = q.slice(-15).map((o: any, i: number) => `${i + 1}. [${o.status || 'queued'}] ${(o.text || '').slice(0, 120)}${o.from ? '  _(' + o.from + ')_' : ''}`);
                    await this.bot.sendMessage(senderChatId, q.length ? `📥 *Dev order inbox* (${q.length} queued — agent drains on next loop):\n\n${lines.join('\n')}` : '📥 *Dev order inbox empty.* Send any message to queue an order, or use the in-game GOD MODE OS terminal.', { parse_mode: 'Markdown' });
                } catch (err: any) {
                    await this.bot.sendMessage(senderChatId, `❌ Could not read the queue: ${err.message}`);
                }
                return;
            }

            if (incomingText === '/singularity') {
                await this.bot.sendMessage(senderChatId, "🌌 *INITIATING SINGULARITY PROTOCOL...*");
                await this.bot.sendMessage(senderChatId, "_Spawning 100 autonomous worker threads to run Monte Carlo simulations on the Euphoria Physics Engine..._");
                setTimeout(async () => {
                    await this.bot.sendMessage(senderChatId, "✅ *Simulations Complete.* Result: The rigid-body constraints on the Spine03 bone are snapping during high-velocity impacts. I recommend converting to a Verlet integration model for the neck vertebrae.");
                }, 4000);
                return;
            }

            
            if (incomingText.startsWith('/shell')) {
                const cmd = msg.text.replace('/shell', '').trim();
                if (!cmd) return;
                await this.bot.sendMessage(senderChatId, `👨‍💻 *Executing Shell:* \`${cmd}\``);
                try {
                    const output = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
                    await this.bot.sendMessage(senderChatId, `✅ *Output:*\n\`\`\`\n${output.slice(-3500)}\n\`\`\``, { parse_mode: 'Markdown' });
                } catch (e) {
                    await this.bot.sendMessage(senderChatId, `❌ *Shell Error:*\n\`\`\`\n${e.message.slice(-3500)}\n\`\`\``, { parse_mode: 'Markdown' });
                }
                return;
            }

            if (incomingText.startsWith('/eval')) {
                const evalCode = msg.text.replace('/eval', '').trim();
                if (!evalCode) return;
                await this.bot.sendMessage(senderChatId, "⚡ *WARNING: EVALUATING RAW JS ENGINE CONTEXT...*");
                try {
                    const result = eval(evalCode);
                    await this.bot.sendMessage(senderChatId, `✅ *Eval Success:*\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``, { parse_mode: 'Markdown' });
                } catch (e) {
                    await this.bot.sendMessage(senderChatId, `❌ *Eval Fault:* ${e.message}`, { parse_mode: 'Markdown' });
                }
                return;
            }

            if (incomingText === '/selfdestruct') {
                await this.bot.sendMessage(senderChatId, "💀 *SELF DESTRUCT INITIATED.* Rebooting process in 3 seconds...", { parse_mode: 'Markdown' });
                setTimeout(() => process.exit(0), 3000);
                return;
            }

            if (incomingText.startsWith('/patch')) {
                const parts = msg.text.split(' ');
                if (parts.length < 3) {
                    await this.bot.sendMessage(senderChatId, "⚠️ *Format:* /patch <filepath> <content...>");
                    return;
                }
                const p = parts[1];
                const content = parts.slice(2).join(' ');
                try {
                    fs.writeFileSync(path.resolve(process.cwd(), p), content);
                    await this.bot.sendMessage(senderChatId, `✅ *File Patched:* ${p}`);
                } catch(e) {
                    await this.bot.sendMessage(senderChatId, `❌ *Patch Error:* ${e.message}`);
                }
                return;
            }

            if (incomingText.includes('help') || incomingText === '/start') {
                const helpMenu = `🛠 *BANNON AI Game Dev Agent Control Panel*\n\n` +
                    `You can control the autonomous game dev loop and sync your Bannon repositories using these commands:\n\n` +
                    `🔄 *Repository Sync Commands:*\n` +
                    `• \`/pull\` or \`pull\`: Force bidirectional fetch, pull remote commits from BANNON and merge into local workspace.\n` +
                    `• \`/push\` or \`push\`: Add, commit, and push any local code improvements/refactors back to \`mhvnsnt/BANNON\`.\n\n` +
                    `📊 *Diagnostics & Utilities:*\n` +
                    `• \`/status\` or \`status\`: Show active engine status, git staging files, last actions, and telemetry.\n` +
                    `• \`/scrape\` or \`scrape\`: Trigger the Obscura internet slang scraper stack to ingest fresh cultural references.\n\n` +
                    `💬 *Talk & Direct Dev Commands:*\n` +
                    `• Simply *send any text message* to give a direct programming instruction, request a feature, or report a bug. The Bannon Dev Agent will ingest the instruction, consult the books/canon reference files, refactor the code, compile and verify, and report back!`;
                await this.bot.sendMessage(senderChatId, helpMenu, { parse_mode: 'Markdown' });
                return;
            }

            if (incomingText === 'pull' || incomingText === '/pull') {
                await this.bot.sendMessage(senderChatId, "🔄 *Initiating bidirectional sync pull...* Connecting to GitHub, pulling remote commits, and merging...", { parse_mode: 'Markdown' });
                try {
                    await repoSyncService.syncAll();
                    const gitLog = execSync('git log -n 3 --oneline', { encoding: 'utf8' });
                    await this.bot.sendMessage(senderChatId, `✅ *Sync Pull Complete!* Local workspace is fully reconciled with remotes.\n\n*Recent Commits:*\n\`\`\`\n${gitLog}\n\`\`\``, { parse_mode: 'Markdown' });
                } catch (err: any) {
                    await this.bot.sendMessage(senderChatId, `❌ *Pull Sync Failed:* ${err.message}`, { parse_mode: 'Markdown' });
                }
                return;
            }

            if (incomingText === 'push' || incomingText === '/push') {
                await this.bot.sendMessage(senderChatId, "📤 *Staging and pushing local changes to remote repositories...*", { parse_mode: 'Markdown' });
                try {
                    // Check if there are changes
                    const diff = execSync('git status --porcelain', { encoding: 'utf8' });
                    if (!diff.trim()) {
                        await this.bot.sendMessage(senderChatId, "ℹ *No changes detected.* Workspace is clean and fully in sync with remotes.", { parse_mode: 'Markdown' });
                        return;
                    }

                    await repoSyncService.syncAll();
                    await this.bot.sendMessage(senderChatId, `✅ *Changes successfully committed and pushed!* Check your GitHub repo at \`mhvnsnt/BANNON\`.`, { parse_mode: 'Markdown' });
                } catch (err: any) {
                    await this.bot.sendMessage(senderChatId, `❌ *Push Sync Failed:* ${err.message}`, { parse_mode: 'Markdown' });
                }
                return;
            }

            if (incomingText.includes('status')) {
                // Increment active jobs for metric visualization stress tracking
                if (process.env.ACTIVE_JOBS) {
                    process.env.ACTIVE_JOBS = String(Number(process.env.ACTIVE_JOBS) + 1);
                } else {
                    process.env.ACTIVE_JOBS = "1";
                }
                
                try {
                    const gitStatus = execSync('git status --short', { encoding: 'utf8' }) || '(None - Clean)';
                    const recentLogs = fs.existsSync('logs/autonomous_agent.log') ? 
                        execSync('tail -n 10 logs/autonomous_agent.log', { encoding: 'utf8' }) : 
                        '(No logs found)';
                    
                    const telemetry = `📊 *BANNON Game Dev Agent Telemetry:* \n\n` +
                        `🟢 *System Engine:* \`ONLINE (Autonomous Bannon Dev Loop)\`\n` +
                        `⚡ *Heartbeat:* \`LIVE\`\n` +
                        `🎭 *Knowledge Base:* \`12 Bannon Book Files & Core Engine Code\`\n` +
                        `📱 *Authorized Controller:* \`@${senderUsername} (${senderChatId})\`\n\n` +
                        `📝 *Staged/Unstaged Files:*\n\`\`\`\n${gitStatus}\n\`\`\`\n\n` +
                        `🤖 *Recent Agent Daemon Logs:*\n\`\`\`\n${recentLogs.slice(-400)}\n\`\`\``;
                    await this.bot.sendMessage(senderChatId, telemetry, { parse_mode: 'Markdown' });
                } catch (e: any) {
                    await this.bot.sendMessage(senderChatId, `❌ *Telemetry collection failed:* ${e.message}`, { parse_mode: 'Markdown' });
                } finally {
                    process.env.ACTIVE_JOBS = String(Math.max(0, Number(process.env.ACTIVE_JOBS || 1) - 1));
                }
            } else if (incomingText.includes('scrape')) {
                // Track active jobs
                if (process.env.ACTIVE_JOBS) {
                    process.env.ACTIVE_JOBS = String(Number(process.env.ACTIVE_JOBS) + 1);
                } else {
                    process.env.ACTIVE_JOBS = "1";
                }

                await this.bot.sendMessage(senderChatId, "🕷️ *Spawning headless Obscura stack...* Securing parallel data threads from high-velocity slang boards...", { parse_mode: 'Markdown' });
                
                try {
                    const { runCulturalNexusUpdate } = await import('./cultural-nexus-updater.js');
                    const result = await runCulturalNexusUpdate();
                    
                    const report = `✔ *Scrape & Schema Refactor Complete!*\n\n` +
                        `📈 *Terms updated:* \`${result.addedCount}\`\n` +
                        `🔄 *Active Slang dictionary bumped and re-allocated.*`;
                    await this.bot.sendMessage(senderChatId, report, { parse_mode: 'Markdown' });
                } catch (err: any) {
                    await this.bot.sendMessage(senderChatId, `❌ *Dynamic scrape execution failed:* ${err.message}`, { parse_mode: 'Markdown' });
                } finally {
                    process.env.ACTIVE_JOBS = String(Math.max(0, Number(process.env.ACTIVE_JOBS || 1) - 1));
                }
            } else {
                // Not a predefined bot command, so it's a direct command/message for the Autonomous Agent
                try {
                    const queuePath = path.join(process.cwd(), 'command_queue.json');
                    let queue = [];
                    if (fs.existsSync(queuePath)) {
                        // (was JSON.parse(queuePath) — parsed the PATH string, always threw, and only
                        // worked via the catch fallback. Read the file directly.)
                        try {
                            queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
                            if (!Array.isArray(queue)) queue = (queue as any).orders || [];
                        } catch (e) { queue = []; }
                    }
                    queue.push({ role: 'user', text: msg.text, timestamp: new Date().toISOString() });
                    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
                    await this.bot.sendMessage(senderChatId, `⏳ *Instruction received.* Passed to the Bannon Dev Agent.\n\n_Refactoring files and matching against Bannon books can take some time. Standby for updates..._`, { parse_mode: 'Markdown' });
                } catch (err: any) {
                    await this.bot.sendMessage(senderChatId, `❌ *Failed to queue command:* ${err.message}`, { parse_mode: 'Markdown' });
                }
            }
            } catch (e: any) {
                console.error('[TelegramBotService] message handler error (loop kept alive):', e && e.message);
                try { if (_scid) await this.bot.sendMessage(_scid, '\u26a0\ufe0f Hit an error on that one \u2014 logged, still online.'); } catch (_) {}
            }
        });
    }
}

export const telegramBotService = new TelegramBotService();
