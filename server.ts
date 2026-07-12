import { telegramBotService } from './src/services/TelegramBotService.js';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DaemonCore } from './DaemonCore.js';
import { COMMENTARY_DB } from './AudioSynth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HISTORY_FILE = path.join(__dirname, 'fight_history.json');

// Pre-seed some default fight records to establish rich initial rivalries & lore density
const DEFAULT_HISTORY = [
  { winner: 'BANNON', loser: 'VIPER', date: '2026-06-10', type: 'slam' },
  { winner: 'VIPER', loser: 'BANNON', date: '2026-06-11', type: 'ko' },
  { winner: 'BANNON', loser: 'VIPER', date: '2026-06-12', type: 'submission' },
  { winner: 'VIPER', loser: 'BANNON', date: '2026-06-13', type: 'ko' },
  { winner: 'TITAN', loser: 'GOLEM', date: '2026-06-12', type: 'slam' },
  { winner: 'GOLEM', loser: 'TITAN', date: '2026-06-14', type: 'ko' },
  { winner: 'TITAN', loser: 'GOLEM', date: '2026-06-15', type: 'slam' },
  { winner: 'RONIN', loser: 'KAGE', date: '2026-06-14', type: 'ko' },
  { winner: 'KAGE', loser: 'RONIN', date: '2026-06-15', type: 'slam' },
  { winner: 'KAGE', loser: 'RONIN', date: '2026-06-16', type: 'ko' }
];

// Initialize history file if absent
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(DEFAULT_HISTORY, null, 2), 'utf-8');
}

// Commentary DB lives in AudioSynth.ts (the node that conceptually owns it) — imported above,
// not redefined here, so the two copies can't drift out of sync with each other.

const FIGHTER_WEIGHTS: Record<string, string> = {
  BANNON: 'Middleweight',
  TITAN: 'Heavyweight',
  GOLEM: 'Heavyweight',
  VIPER: 'Lightweight',
  ZEPHYR: 'Lightweight',
  RONIN: 'Middleweight',
  BRUTUS: 'Cruiserweight',
  MORTUS: 'Cruiserweight',
  KAGE: 'Middleweight'
};

async function startServer() {
  const app = express();

  // Ensure assets/mocap directory exists
  const mocapDir = path.join(process.cwd(), 'assets', 'mocap');
  if (!fs.existsSync(mocapDir)) {
    fs.mkdirSync(mocapDir, { recursive: true });
  }

  // Automatically migrate existing FBX, GLB, and GLTF files from root into the assets subdirectory
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    for (const file of rootFiles) {
      const ext = file.split('.').pop()?.toLowerCase();
      if (ext && ['fbx', 'glb', 'gltf'].includes(ext)) {
        const src = path.join(process.cwd(), file);
        const dest = path.join(mocapDir, file);
        try {
          fs.renameSync(src, dest);
          console.log(`[BANNON HARBOR] Moved loose asset: ${file} -> assets/mocap/`);
        } catch (renameErr) {
          // If rename fails (e.g., cross-device), fallback to copy+delete
          fs.copyFileSync(src, dest);
          fs.unlinkSync(src);
          console.log(`[BANNON HARBOR] Copied loose asset: ${file} -> assets/mocap/`);
        }
      }
    }
  } catch (err) {
    console.warn('[BANNON HARBOR] Autoasset migration failed:', err);
  }

  app.use(express.json({ limit: '50mb' }));

  // CORS: the game may be opened from a different origin (file://, a static host,
  // or the Railway URL) than wherever the daemon lives. Allow it so the always-on
  // daemon client can reach these routes from anywhere. Read-only/learning API.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // BANNON SENSES: mount the daemon's own routes (move-learning, match director,
  // fx cue decisions, input normalization, spatial/physics queries, evolution).
  const daemon = new DaemonCore();
  app.use(daemon.router);
  // Always-on: keep self-improving on a cadence even with no traffic.
  daemon.startHeartbeat();

  // GOD MODE OS ORDER QUEUE — the shared inbox for dev orders. Written by the in-game neuralink
  // terminal (window.GODOS '/order …') and by the Telegram agents; drained by the autonomous
  // coders (Living Nexus / codedummy daemon) working the repo while the owner is away.
  // File-backed (command_queue.json — the codedummy convention) so it survives restarts.
  const ORDERS_FILE = path.join(process.cwd(), 'command_queue.json');
  const readOrders = (): any[] => { try { const j = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8')); return Array.isArray(j) ? j : (j.orders || []); } catch (e) { return []; } };
  const writeOrders = (o: any[]) => { try { fs.writeFileSync(ORDERS_FILE, JSON.stringify(o, null, 1)); } catch (e) { /* read-only fs: queue lives in memory */ } };
  app.get('/api/orders', (_req, res) => { res.json({ ok: true, orders: readOrders() }); });
  app.post('/api/orders', (req, res) => {
    const text = String((req.body && req.body.text) || '').slice(0, 4000);
    if (!text) { res.status(400).json({ ok: false, error: 'text required' }); return; }
    const orders = readOrders();
    const order = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, from: String((req.body && req.body.from) || 'game'), at: new Date().toISOString(), status: 'queued' };
    orders.push(order); writeOrders(orders);
    res.json({ ok: true, order });
  });
  app.post('/api/orders/:id/done', (req, res) => {
    const orders = readOrders();
    const o = orders.find((x: any) => x.id === req.params.id);
    if (o) { o.status = 'done'; o.doneAt = new Date().toISOString(); writeOrders(orders); }
    res.json({ ok: !!o });
  });

  // API: Get history data
  app.get('/api/commentary/history', (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      res.json(data);
    } catch (e) {
      res.json(DEFAULT_HISTORY);
    }
  });

  // API: Initialize Commentary context for the current match
  app.post('/api/commentary/init', (req, res) => {
    try {
      const { fighterA, fighterB } = req.body;
      const fAName = String(fighterA || 'BANNON').toUpperCase();
      const fBName = String(fighterB || 'VIPER').toUpperCase();

      let history = DEFAULT_HISTORY;
      if (fs.existsSync(HISTORY_FILE)) {
        try {
          history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        } catch (_) {}
      }

      // Filter matches played between A and B (regardless of winner order)
      const matchesBtn = history.filter(m => 
        (m.winner.toUpperCase() === fAName && m.loser.toUpperCase() === fBName) ||
        (m.winner.toUpperCase() === fBName && m.loser.toUpperCase() === fAName)
      );

      const rivalryCount = matchesBtn.length;
      const rivalry = rivalryCount >= 3;

      const aWins = history.filter(m => m.winner.toUpperCase() === fAName).length;
      const aLosses = history.filter(m => m.loser.toUpperCase() === fAName).length;
      const bWins = history.filter(m => m.winner.toUpperCase() === fBName).length;
      const bLosses = history.filter(m => m.loser.toUpperCase() === fBName).length;

      const aVsBWins = matchesBtn.filter(m => m.winner.toUpperCase() === fAName).length;
      const bVsAWins = matchesBtn.filter(m => m.winner.toUpperCase() === fBName).length;

      // Select Intro Phrases
      let voiceAIntro = "";
      let voiceBIntro = "";

      const wtA = FIGHTER_WEIGHTS[fAName] || 'Middleweight';
      const wtB = FIGHTER_WEIGHTS[fBName] || 'Middleweight';

      if (rivalry) {
        const randRival = COMMENTARY_DB.VoiceA.rivalryIntros[Math.floor(Math.random() * COMMENTARY_DB.VoiceA.rivalryIntros.length)];
        voiceAIntro = `[ANALYST] ${randRival} We have registered ${rivalryCount} past encounters between ${fAName} and ${fBName}. Tonight, the statistics show a record of ${aVsBWins} wins for ${fAName} and ${bVsAWins} wins for ${fBName}.`;
        voiceBIntro = `[COLOR COMMENTATOR] BAH GAWD! Let the sirens wail! There's absolute raw, unfiltered intensity in the atmosphere tonight. They are going to break each other's bones!`;
      } else {
        const randGen = COMMENTARY_DB.VoiceA.genericIntros[Math.floor(Math.random() * COMMENTARY_DB.VoiceA.genericIntros.length)];
        voiceAIntro = `[ANALYST] ${randGen} We have the ${wtA} class player ${fAName} facing off against the ${wtB} class player ${fBName}. Let's observe how their joint kinematics resolve on the field.`;
        voiceBIntro = `[COLOR COMMENTATOR] OH MY LORD! Two titans, one canvas. Let's see who gets driven flat on their spine first!`;
      }

      res.json({
        rivalry,
        rivalryCount,
        voiceAIntro,
        voiceBIntro,
        stats: {
          fighterA: { name: fAName, wins: aWins, losses: aLosses, headToHeadWins: aVsBWins },
          fighterB: { name: fBName, wins: bWins, losses: bLosses, headToHeadWins: bVsAWins }
        },
        commentaryDb: COMMENTARY_DB
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Record a fight win
  app.post('/api/commentary/record-win', (req, res) => {
    try {
      const { winner, loser, type } = req.body;
      if (!winner || !loser) {
        return res.status(400).json({ error: 'Missing winner or loser parameters.' });
      }

      let history = [];
      if (fs.existsSync(HISTORY_FILE)) {
        try {
          history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        } catch (_) {}
      }

      const newMatch = {
        winner: String(winner).toUpperCase(),
        loser: String(loser).toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        type: type || 'ko'
      };

      history.push(newMatch);
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');

      res.json({ success: true, recorded: newMatch });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: List all FBX, GLB, GLTF files in the workspace
  app.get('/api/list-props', (req, res) => {
    try {
      const workspaceRoot = process.cwd();
      const propsDir = path.join(workspaceRoot, 'assets', 'props');
      const allFiles = new Set<string>();

      if (fs.existsSync(propsDir)) {
        fs.readdirSync(propsDir).forEach(f => {
          const lower = f.toLowerCase();
          if (lower.endsWith('.fbx') || lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.obj')) {
            allFiles.add(f);
          }
        });
      }
      res.json({ files: Array.from(allFiles) });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/list-mocap-files', (req, res) => {
    try {
      const workspaceRoot = process.cwd();
      const mocapDir = path.join(workspaceRoot, 'assets', 'mocap');
      const allFiles = new Set<string>();

      // Read from assets/mocap directory + the drive-sync bank (assets/mocap/drive — where the
      // owner's Drive uploads land; the combat move clips live there)
      for (const dir of [mocapDir, path.join(mocapDir, 'drive')]) {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach(f => {
            const lower = f.toLowerCase();
            if (lower.endsWith('.fbx') || lower.endsWith('.glb') || lower.endsWith('.gltf')) {
              allFiles.add(f);
            }
          });
        }
      }

      // Read from workspace root (as fallback)
      fs.readdirSync(workspaceRoot).forEach(f => {
        const lower = f.toLowerCase();
        if (lower.endsWith('.fbx') || lower.endsWith('.glb') || lower.endsWith('.gltf')) {
          allFiles.add(f);
        }
      });

      res.json({ files: Array.from(allFiles) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Upload custom mocap file to server
  app.post('/api/upload-mocap-file', (req, res) => {
    try {
      const { filename, base64 } = req.body;
      if (!filename || !base64) {
        return res.status(400).json({ error: 'Missing filename or base64 data.' });
      }
      const safeFilename = path.basename(filename);
      const ext = safeFilename.split('.').pop()?.toLowerCase();
      if (!ext || !['fbx', 'glb', 'gltf'].includes(ext)) {
        return res.status(400).json({ error: 'Only .fbx, .glb, and .gltf formats are supported.' });
      }
      const mocapDir = path.join(process.cwd(), 'assets', 'mocap');
      if (!fs.existsSync(mocapDir)) {
        fs.mkdirSync(mocapDir, { recursive: true });
      }
      const dstPath = path.join(mocapDir, safeFilename);
      const buf = Buffer.from(base64, 'base64');
      fs.writeFileSync(dstPath, buf);
      console.log(`[SERVER] Saved custom mocap: ${safeFilename} to assets/mocap/ (${buf.length} bytes)`);
      res.json({ success: true, filename: safeFilename });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Get mocap metadata
  app.get('/api/mocap-metadata', (req, res) => {
    try {
      const metadataPath = path.join(process.cwd(), 'mocap_metadata.json');
      if (fs.existsSync(metadataPath)) {
        const data = fs.readFileSync(metadataPath, 'utf-8');
        res.json(JSON.parse(data));
      } else {
        res.json({});
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Save mocap metadata
  app.post('/api/mocap-metadata', (req, res) => {
    try {
      const metadataPath = path.join(process.cwd(), 'mocap_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(req.body, null, 2), 'utf-8');
      console.log(`[SERVER] Saved updated custom mocap metadata`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve motion assets from root workspace or assets/mocap/
  app.get('/:file', (req, res, next) => {
    const file = req.params.file;
    const ext = file.split('.').pop()?.toLowerCase();
    if (ext && ['fbx', 'glb', 'gltf', 'bin'].includes(ext)) {
      // Check assets/mocap first, then the drive-sync bank
      const pMocap = path.join(process.cwd(), 'assets', 'mocap', file);
      if (fs.existsSync(pMocap)) {
        return res.sendFile(pMocap);
      }
      const pDrive = path.join(process.cwd(), 'assets', 'mocap', 'drive', file);
      if (fs.existsSync(pDrive)) {
        return res.sendFile(pDrive);
      }
      // Fallback to workspace root
      const pRoot = path.join(process.cwd(), file);
      if (fs.existsSync(pRoot)) {
        return res.sendFile(pRoot);
      }
    }
    next();
  });

  // Direct serve from assets path
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
  
  app.get('/assets/mocap/:file', (req, res, next) => {
    const file = req.params.file;
    const p = path.join(process.cwd(), 'assets', 'mocap', file);
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
    next();
  });

  // API endpoint to export the monolithic HTML
  app.get('/api/export', (req, res) => {
    const indexPath = path.resolve(__dirname, 'index.html');
    res.download(indexPath, 'BANNON_OS_LIVIN_NEXUS.html');
  });

  // Serve everything from the project root with no cache
  app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(__dirname, 'index.html'));
  });

  const PORT = Number(process.env.PORT) || 3000;
  
// [LIVING NEXUS] Ignite Autonomous Telegram Polling
telegramBotService.initialize().then((res) => {
    console.log("[Telegram] Autonomous Proactive engine booted:", res);
}).catch((err) => {
    console.error("[Telegram] Daemon failed:", err);
});

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BANNON Monolithic Engine Booted on port ${PORT}`);
  });
}

// Always-on: a single uncaught error must never take the daemon down. Log and
// keep serving; Railway's restart policy is the backstop if the process truly dies.
process.on('uncaughtException', (err) => {
  console.error('[BANNON] uncaughtException (kept alive):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[BANNON] unhandledRejection (kept alive):', reason);
});

startServer();
