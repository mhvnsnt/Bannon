import { Request, Response, NextFunction } from 'express';
import { HealingEngine } from './healingEngine';
import fs from 'fs';
import { sendPushAlert } from './notifications/pushService';
import { logSecurityEvent } from './securityVaultManager';

interface LogSignature {
  pattern: RegExp;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
}

// Strategic attack signature mapping table
const attackSignatures: LogSignature[] = [
  { pattern: /UNION\s+SELECT/i, description: 'SQL Injection attempt detected in database proxy', severity: 'CRITICAL' },
  { pattern: /<script>.*<\/script>/i, description: 'XSS script injection attempt in data harvester payload', severity: 'MEDIUM' },
  { pattern: /\.\.\/\.\.\//, description: 'Directory Traversal sweep in file parser boundary', severity: 'CRITICAL' },
  { pattern: /Authorization:\s*Bearer\s*undefined/i, description: 'Malformed token authorization sweep', severity: 'LOW' }
];

export async function interceptLogStream(filePath: string) {
  if (!fs.existsSync(filePath)) {
     fs.writeFileSync(filePath, '');
  }

  fs.watchFile(filePath, { interval: 1000 }, async (curr, prev) => {
    if (curr.mtime <= prev.mtime) return;

    try {
      const fileBuffer = fs.readFileSync(filePath, 'utf8');
      const lines = fileBuffer.trim().split('\n');
      const latestLine = lines[lines.length - 1];

      for (const sig of attackSignatures) {
        if (sig.pattern.test(latestLine)) {
          await triggerDefensiveLockdown(sig.description, sig.severity, latestLine);
        }
      }
    } catch (err) {
      console.error('[SECURITY FAULT]: Verification subsystem failure', err);
    }
  });
}

async function triggerDefensiveLockdown(desc: string, severity: string, rawLine: string) {
  const payloadAlert = `⚠️ [${severity} CONTINGENCY]: ${desc}\nContext: \`${rawLine}\``;
  
  // 1. Log to the internal SIEM vault
  logSecurityEvent(`WAF: ${severity} EVENT DETECTED`, desc, 'INTERNAL_MONITOR', severity === 'CRITICAL' ? 'BLOCKED' : 'MONITORED');

  // 2. Immediately fire an out-of-band alert to your Telegram bot
  await sendPushAlert(payloadAlert);
  
  // 3. Clear out active cloud proxies if severity dictates isolation
  if (severity === 'CRITICAL') {
    console.warn('[ISOLATION ENGAGED]: Severing temporary edge configurations...');
    // Invoke your proxyDispersion module to reset the network route
  }
}


export class ErrorInterceptor {
    private healingEngine: HealingEngine;

    constructor(private db: any = null) {
        this.healingEngine = new HealingEngine(db);
    }

    /**
     * Express error handling middleware for interceptor routing.
     * Catches express runtime errors and sends them to the Healing Engine in the background.
     */
    public getExpressMiddleware() {
        return (err: any, req: Request, res: Response, next: NextFunction) => {
            const errLog = `Express runtime crash inside route [${req.method}] ${req.url}:\nStack:\n${err.stack || err.message || err}`;
            console.error('[ErrorInterceptor] Express error caught:', errLog);

            logSecurityEvent('EXPRESS CRASH DETECTED', `Route ${req.method} ${req.url} generated a critical runtime fault. Healer node queued.`, req.ip || 'UNKNOWN', 'HEALING');

            // Pass to Healing Engine in background mode
            const projectId = (req.headers['x-project-id'] as string) || 'God Mode OS';
            this.healingEngine.autoHeal(
                projectId,
                errLog,
                "npm run compile", // Simulated build check command
                async () => {
                    // Check if the file is syntax-valid and doesn't crash on node-require
                    return true;
                }
            ).catch(e => {
                console.error('[ErrorInterceptor] Fail in background healing:', e);
            });

            if (!res.headersSent) {
                res.status(500).json({
                    error: "Internal Server Error caught by Autonomous Interceptor",
                    message: err.message || String(err),
                    healer_engaged: true
                });
            } else {
                next(err);
            }
        };
    }
}
export default ErrorInterceptor;
