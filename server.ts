
import fs from 'fs';
import { WebSocketServer } from 'ws';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'unreal/Saved/Logs/Bannon.log');
const HOSTILE_MODS_FILE = path.join(process.cwd(), 'hostile_mods.json');

export function initLogWatcher(wss: WebSocketServer) {
    console.log("[R.A.B.B.I.T.S.F.O.O.T.] Initializing Zero-Latency Log Ingestion...");
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LOG_FILE, '');
    }
    
    if (!fs.existsSync(HOSTILE_MODS_FILE)) {
        fs.writeFileSync(HOSTILE_MODS_FILE, JSON.stringify([]));
    }

    let currentSize = fs.statSync(LOG_FILE).size;

    // Bi-Directional Telemetry Overdrive: Poll at 100ms
    fs.watchFile(LOG_FILE, { interval: 100 }, (curr, prev) => {
        if (curr.size > prev.size) {
            const stream = fs.createReadStream(LOG_FILE, { start: prev.size, end: curr.size });
            stream.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                lines.forEach(line => {
                    if (line.includes('SANDBOX_VIOLATION')) {
                        // Flag hostile mod hash
                        const match = line.match(/Hash:\s([^\s|]+)/);
                        if (match && match[1]) {
                            const hash = match[1];
                            const hostileMods = JSON.parse(fs.readFileSync(HOSTILE_MODS_FILE, 'utf-8'));
                            if (!hostileMods.includes(hash)) {
                                hostileMods.push(hash);
                                fs.writeFileSync(HOSTILE_MODS_FILE, JSON.stringify(hostileMods, null, 2));
                                console.log(`[BannonPayloadRouter] Permanently flagged mod hash as hostile: ${hash}`);
                            }
                        }
                    }

                    if (line.includes('Error:') || line.includes('Warning:') || line.includes('Exception') || line.includes('RESTORE_CORE_VARIABLES') || line.includes('CRITICAL_PHYSICS_FAULT') || line.includes('SANDBOX_VIOLATION')) {
                        wss.clients.forEach(client => {
                            if (client.readyState === 1) {
                                client.send(JSON.stringify({ type: 'UE_LOG_STREAM', payload: line }));
                            }
                        });
                    }
                });
            });
        } else if (curr.size < prev.size) {
            currentSize = curr.size;
        }
    });
}

export function notifyUpdateReady(wss: WebSocketServer, binaryPayload = null) {
    console.log("[L.I.O.N.T.A.M.E.R.] Delta patch applied. Broadcasting UPDATE_READY override.");
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            if (binaryPayload) {
                // Runtime Execution Override pipe
                client.send(binaryPayload);
            } else {
                client.send(JSON.stringify({ type: 'UPDATE_READY', payload: 'Delta patch ready for hot-reload' }));
            }
        }
    });
}
