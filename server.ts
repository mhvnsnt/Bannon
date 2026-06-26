import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

// Global Commentary Database covering both voices and situations
const COMMENTARY_DB = {
  VoiceA: { // The Play-by-Play Lore analyst - clinical, structured, statistical
    genericIntros: [
      "Welcome to the Ouroboros Arena. This matchup sits directly in the crosshairs of competitive wrestling history.",
      "Both fighters represent distinct mathematical layouts in our biomechanical physics ledger.",
      "The spatial parameters look fully optimized tonight. Balance loops and spring dampings are calibrated."
    ],
    rivalryIntros: [
      "A classic bloodline rivalry is reignited tonight. These fighters have pushed each other past absolute structural failure multiple times.",
      "There is profound non-canon and canon lore build-up surrounding this rematch. The history is written in ruptured joints.",
      "An long-standing antagonism resumes. They know each other's weight distribution, muscle spring ratios, and recovery gates perfectly."
    ],
    idleLore: [
      "Notice the active center of mass management. Second-order critically damped controllers are keeping the skeletons upright.",
      "As performance fatigue accumulates, we will observe a significant reduction in skin material roughness.",
      "The bone velocity tracker is constantly calculating target coordinate offsets for the muscle torque equations.",
      "Both athletes are utilizing state-of-the-art Proportional Derivative muscle motors to fight local gravity wells."
    ]
  },
  VoiceB: { // The Visceral Color Commentator - high energy, shocked, impact-driven, loud
    strikes: [
      "BAH GAWD! What an absolute collision of flesh!",
      "He connected flush! That nearly sheared the jaw off the skeletal frame!",
      "A fierce impact! The kinetic energy output from that strike is outstanding!",
      "WHAT A SLAP! The sound resonated right through the arena walls!"
    ],
    slams: [
      "HOLY ALMIGHTY! Dropped with an intense, high-inertia slam!",
      "DUMPED! His spine absorbed the raw impact velocity of that entire mass!",
      "Smashed down! He got driven through the floor boards like concrete!"
    ],
    heavyMoves: {
      powerbomb: [
        "OH MY LORD! A COLLOSSAL POWERBOMB FROM THE HEAVENS!",
        "BAH GAWD, THE POWERBOMB! HE BROKE HIM IN HALF!",
        "CRUSHED! AN ABSOLUTE KINETIC BOMB STRAIGHT TO THE MAT!"
      ],
      suplex: [
        "VERTICAL SUPLEX! He rode the Bezier spline all the way down!",
        "SLAMMING SUPLEX! High parabolic arc of absolute physical destruction!",
        "A BEAUTIFUL THROW FROM DEEP INSIDE THE GRAVITY WELL!"
      ],
      backsuplex: [
        "BACK SUPLEX! Dropped directly onto the base of his neck!",
        "GERMAN SUPLEX! Complete joint rotation and slam!"
      ],
      aerial_dive: [
        "WOW LOOK AT HIM FLY! HE WENT INTO ORBIT!",
        "HE SAILED THROUGH THE SKY LIKE A HIGH-VELOCITY COAL-FIRED FREIGHT TRAIN!",
        "DEATH FROM ABOVE! AN UNBELIEVABLE SACRIFICE SUICIDE FLYING DIVE!"
      ]
    },
    blood: [
      "WE HAVE OUTRIGHT HEAD TRAUMA RUPE! LIQUID GLOSS SPREADING ACROSS THE CAVNAS!",
      "HE IS BUSTED WIDE OPEN! His head stress threshold exceeded the 60% probability barrier!",
      "A HORRIFYING GASH! The red decals are dripping straight under his head coordinate!"
    ],
    knockdown: [
      "DOWN HE GOES! A catastrophic center of mass failure!",
      "FLIPPED! That strike completely deactivated his inner balance loop!",
      "HE COULD NOT CONQUER GRAVITY! THE INVERTED PENDULUM COLLAPSED TO THE FLOOR!"
    ],
    ko: [
      "IT IS OVER! KNOCKOUT! A SYSTEM OVERLOAD AND MOTOR SHUTDOWN!",
      "FINISHED! A VISCERAL ENDING TO A CLINICAL CONFLICT!",
      "GOODNIGHT! THE CPU CALCULATION COMES TO A BRAIN-MATTER END!"
    ]
  }
};

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

      // Read from assets/mocap directory
      if (fs.existsSync(mocapDir)) {
        fs.readdirSync(mocapDir).forEach(f => {
          const lower = f.toLowerCase();
          if (lower.endsWith('.fbx') || lower.endsWith('.glb') || lower.endsWith('.gltf')) {
            allFiles.add(f);
          }
        });
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
      // Check assets/mocap first
      const pMocap = path.join(process.cwd(), 'assets', 'mocap', file);
      if (fs.existsSync(pMocap)) {
        return res.sendFile(pMocap);
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

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BANNON Monolithic Engine Booted on port ${PORT}`);
  });
}

startServer();
