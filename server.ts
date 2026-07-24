
import fs from 'fs';
import { WebSocketServer } from 'ws';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'unreal/Saved/Logs/Bannon.log');

export function initLogWatcher(wss) {
    console.log("[R.A.B.B.I.T.S.F.O.O.T.] Initializing Log Ingestion...");
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LOG_FILE, '');
    }

    let currentSize = fs.statSync(LOG_FILE).size;

    fs.watchFile(LOG_FILE, { interval: 500 }, (curr, prev) => {
        if (curr.size > prev.size) {
            const stream = fs.createReadStream(LOG_FILE, { start: prev.size, end: curr.size });
            stream.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                lines.forEach(line => {
                    if (line.includes('Error:') || line.includes('Warning:') || line.includes('Exception') || line.includes('RESTORE_CORE_VARIABLES')) {
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

export function notifyUpdateReady(wss) {
    console.log("[L.I.O.N.T.A.M.E.R.] WRITE_FILE delta patch applied. Broadcasting UPDATE_READY.");
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'UPDATE_READY', payload: 'Delta patch ready for hot-reload' }));
        }
    });
}
