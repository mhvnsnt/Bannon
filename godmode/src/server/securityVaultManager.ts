import fs from 'fs';
import path from 'path';

export interface SIEMLog {
    id: string;
    event: string;
    detail: string;
    ip: string;
    timestamp: string;
    status: string;
}

const LOGS_FILE = path.join(process.cwd(), 'vault', 'siem_logs.json');

export function initSecurityVault() {
    const vaultDir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(vaultDir)) {
        fs.mkdirSync(vaultDir, { recursive: true });
    }
    if (!fs.existsSync(LOGS_FILE)) {
        fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
    }
}

export function logSecurityEvent(event: string, detail: string, ip: string, status: string = 'SECURE') {
    initSecurityVault();
    try {
        const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
        const logs: SIEMLog[] = JSON.parse(raw);
        
        const newLog: SIEMLog = {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            event,
            detail,
            ip,
            timestamp: new Date().toISOString(),
            status
        };
        
        logs.unshift(newLog); // Add to the beginning
        
        // Keep only top 1000 logs
        const trimmedLogs = logs.slice(0, 1000);
        fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmedLogs, null, 2));
    } catch(e) {
        console.error("[SIEM MANAGER FAULT]", e);
    }
}

export function getRecentSecurityLogs(): SIEMLog[] {
    initSecurityVault();
    try {
        const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch(e) {
        console.error("[SIEM MANAGER FAULT]", e);
        return [];
    }
}
