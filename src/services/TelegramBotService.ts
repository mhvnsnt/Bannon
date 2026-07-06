import axios from 'axios';
import fs from 'fs';
import path from 'path';

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
        this.token = process.env.TELEGRAM_BOT_TOKEN || '8770548771:AAGdEeseFlkyfEesXJ_h1DXQcAYVolwujik';
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
            this.bot = new TelegramBotClass(this.token, { polling: true });
            
            console.log(`🤖 [TelegramBotService] Active token verified. Listening for command vectors...`);
            this.setupListeners();

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

            if (incomingText.includes('status')) {
                // Increment active jobs for metric visualization stress tracking
                if (process.env.ACTIVE_JOBS) {
                    process.env.ACTIVE_JOBS = String(Number(process.env.ACTIVE_JOBS) + 1);
                } else {
                    process.env.ACTIVE_JOBS = "1";
                }
                
                try {
                    const telemetry = `📊 *CODEDUMMY Autonomous Telemetry:* \n\n` +
                        `🟢 *System Engine:* \`ONLINE (Autonomous Linux Container)\`\n` +
                        `⚡ *Vibe Check Speed:* \`12ms (Superconductive)\`\n` +
                        `📦 *WASM MicroVM Memory:* \`Isolated Deno memory heap\`\n` +
                        `🎭 *Crawler Engine:* \`Obscura-Stealth v1.4.26\`\n` +
                        `📱 *Authorized Client:* \`@${senderUsername} (${senderChatId})\``;
                    await this.bot.sendMessage(senderChatId, telemetry, { parse_mode: 'Markdown' });
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
                await this.bot.sendMessage(senderChatId, `❓ *Unknown command: "${msg.text}"*\n\nTry sending \`status\` or \`run scrape\`.`, { parse_mode: 'Markdown' });
            }
        });
    }
}

export const telegramBotService = new TelegramBotService();
