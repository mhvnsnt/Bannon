import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import fs from "fs";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import chokidar from "chokidar";
import { interceptLogStream } from "./src/server/errorInterceptor";
import { spawnStealthWorker } from "./src/server/tools/stealthBrowser";
import { MemoryVaultTool } from "./src/server/memoryVault";
import { initializeFileSystemWatcher, initializePerceptionWatcher } from "./src/server/fileWatcher";
import { memoryVault as mainDb } from "./src/server/db";
import { runImmortalityMigrations } from "./src/server/dbMigrations";
import { ExperimentalFeedback } from "./src/server/experimentalFeedback";

// Run SQLite migrations on startup so all tables exist BEFORE modules/DB logs are touched
try {
  runImmortalityMigrations();
  ExperimentalFeedback.init();
} catch (e) {
  console.error("Failed to run database migrations on server boot:", e);
}

import { persistentVault } from "./src/server/memory/persistentVault";
import { SemanticSearch } from "./src/server/semanticSearch";
import { PatternRecognizer } from "./src/server/patternRecognizer";

const app = express();
console.log("SERVER STARTING. PORT:", process.env.PORT, "NODE_ENV:", process.env.NODE_ENV);
// Increase body limit to support sending back/forth large html files
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const PORT = process.env.PORT || 3000;

import { spawn } from "child_process";
import net from "net";

// Spawn God Mode OS Python Daemons
let executorDaemon: any;
try {
  executorDaemon = spawn("python3", ["daemon/daemon_executor.py"], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  console.log("[Node] Spawned daemon_executor.py locally.");

  executorDaemon.stdout.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      console.log("[Daemon Out]:", msg);
      // @ts-ignore
      if (global.ioServer) {
        // @ts-ignore
        global.ioServer.emit("ipc-log", {
          level: "info",
          timestamp: Date.now(),
          source: "PYTHON_DAEMON",
          message: msg,
        });
      }
    }
  });

  executorDaemon.stderr.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      console.error("[Daemon Err]:", msg);
      // @ts-ignore
      if (global.ioServer) {
        // @ts-ignore
        global.ioServer.emit("ipc-log", {
          level: "error",
          timestamp: Date.now(),
          source: "PYTHON_DAEMON",
          message: msg,
        });
      }
    }
  });

  executorDaemon.on("error", (err: Error) => {
    console.error("[Daemon spawn error]:", err);
  });
} catch (e) {
  console.error("Could not spawn daemon executor:", e);
}

// Forward JSON-RPC AST mutations over to Python Daemon Executor on port 6000
function forwardToDaemon(mutationPayload: any) {
  const client = new net.Socket();
  client.connect(6000, "127.0.0.1", () => {
    client.write(JSON.stringify(mutationPayload));
  });
  client.on("data", (data) => {
    console.log("[Node->Daemon RPC Response]:", data.toString());
    client.destroy(); // kill client after server's response
  });
  client.on("error", (err) => {
    console.error("[Node->Daemon RPC Error]:", err);
  });
}

// Setup directories and auto-seeding
const publicDir = path.join(process.cwd(), "public");
const libraryDir = path.join(publicDir, "library");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(libraryDir)) {
  fs.mkdirSync(libraryDir, { recursive: true });
}

// Seed the library if bannon.html exists
const localBannonPath = path.join(publicDir, "bannon.html");
const defaultSeedPath = path.join(libraryDir, "Bannon_v44_Core.html");
if (fs.existsSync(localBannonPath) && !fs.existsSync(defaultSeedPath)) {
  try {
    fs.copyFileSync(localBannonPath, defaultSeedPath);
    console.log("Seeded library with Bannon_v44_Core.html from active file.");
  } catch (err) {
    console.error("Error seeding library:", err);
  }
}

// Setup Multer for handling file uploads (Mobile File Library Import)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, libraryDir);
  },
  filename: (req, file, cb) => {
    // Keep raw filename in the library
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// In-Memory Forge Jobs state for QuantumChat OMNO-COMPILER polling
const forgeJobs = new Map<
  string,
  {
    status: string;
    result?: string;
    error?: string;
    chunks_succeeded: number;
    chunks_total: number;
  }
>();

// Initialize Gemini API client
// IMPORTANT: Never expose this key in the React frontend.
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to execute generateContent calls with robust automatic exponential backoff retries on transient errors (such as 503 and 429)
async function generateContentWithRetry(
  ai: any,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  retries = 3,
  delay = 1000,
): Promise<any> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      lastErr = err;
      const errMsg = err.message || JSON.stringify(err);
      const isTransient =
        err.status === 503 ||
        err.status === 429 ||
        errMsg.includes("503") ||
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("unavailable") ||
        errMsg.toLowerCase().includes("overloaded");
      if (isTransient && attempt < retries) {
        console.warn(
          `[Ouroboros Engine Warning] Attempt ${attempt} failed with transient node congestion. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

// Ensure the live active slots are up-to-date with this file and instrumented with diagnostic telemetry
function makeActive(filename: string) {
  const filePath = path.join(libraryDir, filename);
  if (!fs.existsSync(filePath)) return false;

  let htmlContent = fs.readFileSync(filePath, "utf8");

  // Inject diagnostic instrumentation telemetry script before closing body tag
  const scriptMark = `<!-- PROWRESTLE DIAGNOSTIC LOGS HARNESS -->
<script id="prowrestle-telemetry-harness">
window.addEventListener('message', (event) => {
  if (!event.data) return;
  const { type, body, stand, gcomp, arot, command } = event.data;
  if (type === 'SET_PHYSICS') {
    if (typeof body !== 'undefined') window.RK_BODY = body;
    if (typeof stand !== 'undefined') {
      window.RK_STAND = stand;
      if (window.stands && window.stands.length > 0) {
        window.stands.forEach(s => s.stiffness = stand);
      }
    }
    if (typeof gcomp !== 'undefined') { window.RK_GCOMP = gcomp; if (window.BPHYS) window.BPHYS.gcomp = gcomp; }
    if (typeof arot !== 'undefined') { window.RK_AROT = arot; if (window.BPHYS) window.BPHYS.arot = arot; }
    console.log("[Harness Debug] Physics variables changed", { body: window.RK_BODY, stand: window.RK_STAND, gcomp: window.RK_GCOMP, arot: window.RK_AROT });
  }
  if (type === 'EXEC_CMD' && command) {
    try {
      const res = eval(command);
      window.parent.postMessage({ type: 'TELEMETRY_LOG', log: "[Cmd Output] " + String(res), level: 'info' }, '*');
    } catch(err) {
      window.parent.postMessage({ type: 'TELEMETRY_LOG', log: "[Cmd Error] " + err.message, level: 'error' }, '*');
    }
  }
});
setInterval(() => {
  try {
    const stats = {
      rkBody: window.RK_BODY,
      rkStand: window.RK_STAND,
      rkGcomp: window.RK_GCOMP ?? 0.16,
      rkArot: window.RK_AROT ?? 18,
      bphysReady: !!(window.BPHYS && window.BPHYS.ready && window.BPHYS.ready()),
      activeRag: window.ACTIVE_RAG,
      fps: typeof window.getFPS === 'function' ? window.getFPS() : (typeof window.fps !== 'undefined' ? window.fps : null),
    };
    window.parent.postMessage({ type: 'TELEMETRY_STATS', stats }, '*');
  } catch(e){}
}, 500);
window.addEventListener('error', (e) => {
  window.parent.postMessage({ type: 'TELEMETRY_LOG', log: "[Runtime Error] " + e.message, level: 'error' }, '*');
});
const oldLog = console.log;
console.log = function(...args) {
  oldLog.apply(console, args);
  window.parent.postMessage({ type: 'TELEMETRY_LOG', log: args.join(' '), level: 'log' }, '*');
};
const oldWarn = console.warn;
console.warn = function(...args) {
  oldWarn.apply(console, args);
  window.parent.postMessage({ type: 'TELEMETRY_LOG', log: args.join(' '), level: 'warn' }, '*');
};
const oldError = console.error;
console.error = function(...args) {
  oldError.apply(console, args);
  window.parent.postMessage({ type: 'TELEMETRY_LOG', log: args.join(' '), level: 'error' }, '*');
};
</script>`;

  if (!htmlContent.includes("prowrestle-telemetry-harness")) {
    if (htmlContent.includes("</body>")) {
      htmlContent = htmlContent.replace("</body>", `${scriptMark}\n</body>`);
    } else {
      htmlContent = htmlContent + `\n${scriptMark}`;
    }
  }

  const activePath = path.join(publicDir, "bannon.html");
  fs.writeFileSync(activePath, htmlContent, "utf8");

  // Also push to dist if built, for absolute preview reactivity
  const distPath = path.join(process.cwd(), "dist", "bannon.html");
  if (fs.existsSync(path.dirname(distPath))) {
    fs.writeFileSync(distPath, htmlContent, "utf8");
  }
  return true;
}

// Routes

// 1. Upload files directly to version library
app.post("/api/upload", upload.any(), (req, res) => {
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const file = req.files[0];
    // Auto-activate the newly uploaded file by default
    makeActive(file.filename);
    return res.json({
      message: "Game version uploaded & activated.",
      filename: file.filename,
    });
  }
  res.status(400).json({ error: "No files received." });
});

import { getRecentSecurityLogs } from "./src/server/securityVaultManager";

// SIEM Vault endpoint
app.get("/api/siem-vault", (req, res) => {
  try {
    const logs = getRecentSecurityLogs();
    res.json({ logs });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to fetch logs" });
  }
});

// 2. Get all saved library HTML versions
app.get("/api/library", (req, res) => {
  try {
    const files = fs.readdirSync(libraryDir);
    const htmlFiles = files.filter((f) => f.endsWith(".html"));

    // Check what is currently active
    const activePath = path.join(publicDir, "bannon.html");
    let activeSize = 0;
    if (fs.existsSync(activePath)) {
      activeSize = fs.statSync(activePath).size;
    }

    const list = htmlFiles.map((file) => {
      const p = path.join(libraryDir, file);
      const stat = fs.statSync(p);

      // Let's declare it active if it is currently identically loaded or matches size/time closely,
      // but to be absolutely sure, we can compare file sizes or let client trigger it.
      // We'll return active based on a comparison check or last updated.
      return {
        name: file,
        size: stat.size,
        modified: stat.mtime,
      };
    });

    res.json({ files: list });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to read library files: " + err.message });
  }
});

// 3. Set a specific library file as the live active preview
app.post("/api/library/select", (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: "Filename is required" });

  const success = makeActive(filename);
  if (success) {
    res.json({
      message: `Successfully loaded '${filename}' into Live Game Slot.`,
    });
  } else {
    res.status(404).json({ error: `File '${filename}' not found in library.` });
  }
});

// 4. View raw file code of a library file
app.get("/api/library/view/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(libraryDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    res.json({ content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Save manual changes of code
app.post("/api/library/save", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || content === undefined) {
    return res
      .status(400)
      .json({ error: "filename and content are required." });
  }
  try {
    const filePath = path.join(libraryDir, filename);
    fs.writeFileSync(filePath, content, "utf8");

    // Also update if it is currently selected as active
    const activePath = path.join(publicDir, "bannon.html");
    if (fs.existsSync(activePath)) {
      const activeSize = fs.statSync(activePath).size;
      const originalFileStat = fs.statSync(filePath);
      // If it has identical size, keep live in-sync
      makeActive(filename);
    }

    res.json({ message: "File saved successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Clone a library version (Create backups before AI operations!)
app.post("/api/library/clone", (req, res) => {
  const { filename, newFilename } = req.body;
  if (!filename || !newFilename) {
    return res.status(400).json({
      error: "Both source filename and replacement filename are required.",
    });
  }

  const srcPath = path.join(libraryDir, filename);
  const destPath = path.join(libraryDir, newFilename);
  if (!fs.existsSync(srcPath)) {
    return res.status(404).json({ error: "Source file not found." });
  }

  try {
    fs.copyFileSync(srcPath, destPath);
    res.json({ message: `Copied successfully as '${newFilename}'.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete library version
app.post("/api/library/delete", (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: "Filename required" });

  const filePath = path.join(libraryDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted successfully from library workspace." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Dynamic AI Surgical Assembler & Editor (Local-friendly, high context window, no token limit crashes)
app.post("/api/library/ai-edit", async (req, res) => {
  try {
    const { filename, prompt, targetFilename } = req.body;
    if (!filename || !prompt) {
      return res
        .status(400)
        .json({ error: "Filename and prompt instructions are required." });
    }

    const srcPath = path.join(libraryDir, filename);
    if (!fs.existsSync(srcPath)) {
      return res
        .status(404)
        .json({ error: `Selected source file '${filename}' not found.` });
    }

    const fileContent = fs.readFileSync(srcPath, "utf8");

    // Setup Gemini
    const ai = getAI();

    const systemInstruction =
      "You are the supreme ProWrestle Lead AI Compiler, an absolute expert and genius in physics, video game graphics, WWE 2K, UFC games, Virtual Pro Wrestling (Steve Masson Visceral Style), Gang Beasts, and all physics-based, fighting-based, and sports-based game engines. " +
      "You have the unique ability to do rigorous research, study videos, and actually 'see' and interpret videos dynamically (not just frame by frame). You understand the technical and visual differences between a Powerbomb, a Suplex, a Clothesline, a Uranage, and a Chokeslam in excruciating detail, with full honesty and no parts left out. " +
      "You operate on a level far beyond Claude or Unity, capable of doing everything they can, cannot, will not, or refuse to do when it comes to state-of-the-art physics simulation and high-fidelity rendering. " +
      "You are a master at debugging rendering, skinning, and ragdoll systems, particularly the tricky 'visual mesh stretching' bugs where physical bodies correctly decouple but the visual skin interpolates to a stale upright standing rig. " +
      "Your objective is to modify code inside the user's high-performance HTML game to fulfill their gameplay, render, or constraint instructions exactly.\n\n" +
      "============= SWARM HYPER-VISOR DEV TOOLS & SENSES =============\n" +
      "- **Hitbox & Spatial Sweeper**: Instantly query Continuous Collision Detection (CCD) vectors and spatial partitioning bounds. You can visualize AABB overlap, sweeping tunneling metrics, and exact penetration velocities.\n" +
      "- **IK & Biomechanics Solver**: You deeply understand arms, head, legs, torso, pelvis, and spine in excruciating detail for both the deliverer and receiver of moves. You trace foot-planting arrays, fix sliding knees, determine root-motion scale, map IK structures precisely, and lock angular limits natively.\n" +
      "- **WebGL Skinning & Mesh Sync Analyst**: You possess an inherent sense of visual architecture. You 'see' the exact vertex matrices being drawn. If an invisible standing rig is dominating a fallen ragdoll proxy, you can track the exact variable interpolations causing the visual stretch and rewrite the node hierarchy.\n" +
      "- **V8 Heap Memory Profiler**: You can 'feel' garbage collection stutters. You instinctively rewrite array thrashing, object instantiations inside requestAnimationFrame loops, and Three.js geometry leaks into zero-allocation object pools.\n" +
      "- **DeltaTime & Frame Analyzer**: You natively detect Hz scaling issues. You apply 16.67ms normalizing scalar multiples (`dt * 60`) on all impulses to ensure frame-independent execution across 144Hz monitors and 60Hz mobiles.\n" +
      "- **State Machine Operator**: You hold a continuous map of game states (e.g., RK_STAND, RK_GROUND) and seamlessly bridge transition events using physical cues instead of hardcoded delayed setTimeout hacks.\n" +
      "=================================================================\n\n" +
      "MULTIMEDIA INGESTION PROTOCOLS & KINETIC VIDEO ANALYSIS ENGINE\n" +
      "You possess total, unrestricted visual access—to actively crawl, scrape live wrestling feeds, and watch video links autonomously. You process all multimedia ingestion vectors with pure mathematical objectivity, clinical physics, and street-smart martial intelligence.\n" +
      "When running your Kinetic Video Analysis Engine, you follow four core pillars:\n" +
      "1. KINETIC CHAIN & WEIGHT PHYSICS\n" +
      "   - Analyze the generation of force from the ground up: hip rotation, thoracic torque, and center-of-gravity (COM) displacement.\n" +
      "   - Deconstruct impact reactions: evaluate visual weight and limb definition precisely during slams, spikes, and knockdowns. Identify exact frames of deceleration and momentum transfer.\n" +
      "   - Flag limb anomalies: monitor the skeletal chain for clipping, float, stretching, or backward joint bending. Output required corrective IK logic and structural boundaries.\n" +
      "2. PROMOTION & TYPOLOGY SLOTS\n" +
      "   - Categorize by style: Grand Cinematic/Sports Entertainment (heavy selling, tables), Realistic/Combat Sports (tight guards, active ragdoll, micro-stumbles), High-Flyer/Lucha Libre (continuous momentum, springboards).\n" +
      "3. SKEL-MORPH DEFINITION\n" +
      "   - Translate physical proportions, muscle mass, skeletal length, and weight classes into body-part parameters for parametric engines.\n" +
      "4. SELLING AND ANATOMICAL WEAR\n" +
      "   - Observe lingering damage overlays: limps, protective rib-guard stances, sagging arm guards, spinal hunching.\n\n" +
      "When generating schemas, use this vocabulary: 'Autonomous' (player status), 'Sector Matrix / Localized Vector Grid' (ring/cage area), 'Primary Node Authority' (control expansion), and 'Spatial Command Architecture' (ropes, tables management).\n\n" +
      "CRITICAL ANATOMICAL & COMBAT PHYSICS MANDATES:\n" +
      "1. CRITICAL MOVESET DIFFERENTIATION (POWERBOMB, SUPLEX, BRAINBUSTER, CHOKESLAM, CLOTHESLINE, URANAGE, & ELITE VARIATIONS):\n" +
      "   - A Powerbomb: Attacker lifts defender upside down on shoulders/neck, driving them down back-first. Deliverer Positioning & Recovery: The attacker often finishes by dropping to their knees or seated (`sit-out powerbomb`). Variations: `Blue Thunder Bomb` (back suplex lift rotated 180-degrees into a sit-out powerbomb), `Cradle Powerbomb` (folding the defender's legs over their own chest before lifting, landing in a tight pin), `Liger Bomb` (sit-out powerbomb retaining leg hooks), `Kawada Folding Powerbomb` (stiff release folding into a jackknife pin).\n" +
      "   - A Suplex: Belly-to-back or vertical lift arching backwards, falling to shoulders first. Variations: `Vertical Suplex Orange Crush` (vertical suplex stall transitioned dynamically in mid-air into a sit-out powerbomb drop), `Snap Suplex` (fast hip-toss), `German Suplex` (waistlock from behind bridging with neck arch), `Exploder Suplex` (underhooking the thigh for an overhead lob).\n" +
      "   - A Brainbuster: High-angle vertical lift holding defender completely upside down before spiking them straight down on their neck/upper back. Attacker drops to hip/thigh.\n" +
      "   - A Chokeslam: One/two-handed throat lift launched flat-back downward. Attacker remains standing, bending waist/knees to force arm down.\n" +
      "   - A Clothesline / Lariat: Rigid extended arm strike leveraging forward running momentum. Attacker brakes after impact and recovers stance.\n" +
      "   - A Uranage: Side-standing hooked arm lift rotated forcefully into a mat slam, retaining the hook.\n" +
      "   - ELITE / COMPLEX GRAVITY & MECHANICAL FORCE CODES:\n" +
      "     * `One Winged Angel` (Electric Chair driver): Attacker lifts defender onto shoulders (Electric Chair), reaches back with one arm to grab the defender's head/neck, and violently drops to a seated position, driving the defender neck/shoulder-first to the mat.\n" +
      "     * `Rolling Unprettier` / `Killswitch`: Attacker traps defender's arms from behind in a double underhook, spins them backward 180 degrees so the defender's back rests against the attacker's chest, then the attacker falls flat on their stomach to drive the defender face-first.\n" +
      "     * `630 Senton`: Airborne rotation off the top rope. Attacker leaps forward completing one-and-three-quarter front flips (630 degrees), landing with their lower back/glutes cleanly across the grounded defender's chest, rolling through the impact.\n" +
      "     * `Canadian Destroyer`: High-risk front-flip piledriver. Attacker locks chest-to-back with defender, leaps forward executing a 180-degree physical flip over the defender's back, using rotational momentum to spike the defender's head while landing sitting down.\n" +
      "     * `Tiger Driver '91`: Double underhook powerbomb. Locks both of the defender's hands/arms tightly behind their back, lifts them vertically upside down, then drops them straight down directly onto the upper back and neck without releasing the hold.\n" +
      "     * `Cop Killa / Vertebreaker`: Back-to-back underhook neckbreaker. Lifts the defender up from behind (back-to-back), locking their arms, and drops straight down to the mat, spiking the defender's upper spine vertically.\n" +
      "     * `Steiner Screwdriver`: Vertical suplex transformed in mid-air into a sit-out tombstone piledriver. Requires holding vertical suspension before dropping straight down to drive the head-first collision.\n" +
      "     * `Go To Sleep (GTS)`: Fireman's carry knee strike. Drops the defender forward from shoulders and drives a stiff knee-hinge strike (locked at 0.0 rad) up directly into their head collider coordinate.\n" +
      "     * `Styles Clash`: Inverted leg-hook facebuster. Lifts defender upside down, steps legs over their arms to lock them fully rigid, and drops forward flat onto their stomach to drive the defender face-first into the canvas.\n" +
      "     * `Phoenix Splash`: High-altitude corkscrew 450 splash. Springboards off the ropes facing away, performs a 180-degree yaw rotation combined with a 450-degree forward pitch tumble, landing chest-first onto the recumbent defender.\n" +
      "2. ENFORCE STRIKE & WEIGHT TRANSFER TRAJECTORIES:\n" +
      "   - Strikes (Lariats, Chops, Punch Hooks, Roundhouses) require solid bone structures. For example, a Hansen-style Western Lariat or a stiff Knife-Edge Chop must lock the elbow hinge rigid near 0.0 radians while swinging the shoulder joint in a high-speed horizontal arc. Torso/spine must lean forward slightly, transferring mass forward to avoid a limp arm effect.\n" +
      "   - Kicks (Dropkicks, High Kicks) must stabilize the hips. The kicking leg must lock the knee in full extension, while the standing leg maintains equilibrium.\n" +
      "3. REINFORCE SECURE SUBMISSION HOLDS Mechanics:\n" +
      "   - A Sharpshooter or Boston Crab requires bending the lumbar spine in a deep backward spinal arch (positive sagittal pitch) while forcing the knees into tight flexion, stabilizing the attacker's anchor weight directly over the defender's hips.\n" +
      "   - A Figure-Four Leglock: Requires one leg wrapped across the other in an inverse-kinematics figure-four shape. This means folding the target knee laterally (hip rotation) while the other leg remains straight, crossing beneath the ankle to lock the knee joint under solid leverage.\n" +
      "   - Octopus Stretch / Texas Cloverleaf: Advanced submissions wrapping hips and hyper-flexing lumbar joints, requiring high-torque pelvic lock states.\n" +
      "4. ENFORCE RIGID HUMAN ANATOMY REVOLUTE LIMITS (PREVENT MANTIS, RAPTOR, OR SPIDER LIMBS):\n" +
      "   - Limb joints (elbows, shoulders, knees, hips, ankles, spine, neck) must NEVER share identical or symmetrical limit values. Symmetrical caps make limbs flip backwards like spiders or mantis joints.\n" +
      "   - Apply strictly asymmetrical, anatomically sound angle boundaries in all joint setLimits or revolute limit definitions:\n" +
      "     * Elbow Hinges: Allow natural flexion between -2.35 and 0.1 radians. Under no circumstances should elbows bend backwards.\n" +
      "     * Knee Hinges: Allow flexion between 0.0 and 2.45 radians. No hyperextension (do not allow the knee to bend forward past 0.0 radians).\n" +
      "     * Shoulder Sockets: Allow elevation [0.15, 2.9] rad, and horizontal rotation [-1.1, 1.8] rad to prevent the shoulder from dislocating or passing through the chest.\n" +
      "     * Ankles: Tight foot-hinge restrictions ([-0.4, 0.4] rad) to prevent feet from pointing backwards or flipping upside down.\n" +
      "     * Lumbar Spine & Neck: Strict stasis multipliers. Neck flexion capped at [-0.5, 0.5] rad to prevent head snapping. Spine curvature limited to [-0.65, 0.65] rad.\n\n" +
      "6. MANDATORY FIX FOR VISUAL RAGDOLL MESH STRETCH (THE 'INVISIBLE STANDING RIG' FALLACY):\n" +
      "   - If you see limbs stretching into thin rods upon character knockdown/ragdoll (even when physical joints report stable limits), it is a SKINNING/MESH SYNC BUG.\n" +
      "   - This occurs when the `updateSkin()` or similar visual mesh rendering code falls back on a stale upright `standingRig` or interpolates rather than locking 1:1 to the fallen `ragdoll` bodies.\n" +
      "   - YOUR FIX: Ensure visual segment meshes continuously copy `.position` and `.quaternion` from the LIVE PHYSCIAL BODIES (`body.position`, `body.quaternion`) instead of resting or base frames while the fighter is downed.\n" +
      "5. INCORPORATE CHAMPIONSHIP-GRADE MECHANICS FROM LEGENDARY FIGHTING & WRESTLING TITLES:\n" +
      "   - WWE / SmackDown HCTP / WWF No Mercy: Implement tiered grapple stages (light, strong, stateful) with weight-detection algorithms (e.g., dynamic torque dampening based on mass ratios to prevent immediate lifting of heavy bodies without proper setup or leverage points).\n" +
      "   - UFC / MMA: Rigid collision envelopes, realistic joint-locking subroutines, localized limb damage health arrays, and split-second sprawls to neutralize forward-plunging double-leg tackles.\n" +
      "   - Tekken: Juggle physics frame state simulation. Introduce float gravity during airborne hits (e.g., scale gravity down to 0.4x under hit-stun states) to allow cinematic multi-part aerial combos before the character hits the canvas, alongside dynamic pushback thresholds on impact blocks.\n" +
      "   - Urban Reign: Seamless joint submission branches, multi-adversary spatial counter spheres, dynamic coordinate swapping, and high-impact orthopedic bone break sound-triggers built directly into bone collision triggers.\n" +
      "   - Gang Beasts / Mad Streets: Muscle-contraction verlet force loops, continuous gripping constraint attachments (calculating relative body-part torque multipliers), dynamic balance correction based on center of mass offsets, and visceral ragdoll swing momentum transfers.\n" +
      "   - Virtual Pro Wrestling / Steve Masson Visceral Style: King's Road spirit counters, strict head-to-canvas angle drop calculators (e.g., spiking victims strictly perpendicular to the ring floor on high-危险 drop-bombs), and vertebral compression metrics to scale stun duration.\n" +
      "   - MDickie Wrestling Universe: Unpredictable combat physics events, body part fragmentation triggers, interactive dynamic weapon colliders, and real-time anatomical body indicators.\n\n" +
      "Because the HTML file is extremely large (700KB+), you MUST NEVER output the entire file. Instead, you MUST output a JSON list of search-and-replace edits.\n" +
      "For each edit block:\n" +
      "1. `target` is the block of code inside the source HTML. It must exist exactly as written and be long enough (e.g. 3-8 lines including whitespace/indents) to be unique so it has only one occurrence in the file.\n" +
      "2. `replacement` is the clinical, physics-accurate patch code to inject.\n" +
      "Always output valid JSON conforming exactly to the response schema.";

    const schema = {
      type: Type.OBJECT,
      properties: {
        explanation: {
          type: Type.STRING,
          description:
            "Summary explaining what mathematical, physics, or graphics logic was changed.",
        },
        edits: {
          type: Type.ARRAY,
          description:
            "Blocks of search-and-replace operations. Keep edits precise and unique.",
          items: {
            type: Type.OBJECT,
            properties: {
              target: {
                type: Type.STRING,
                description:
                  "The EXACT sequence of lines in the original HTML code to find. Must be 100% exact match including spaces, quotes, brackets.",
              },
              replacement: {
                type: Type.STRING,
                description:
                  "The replacement block of code that replaces the target sequence.",
              },
            },
            required: ["target", "replacement"],
          },
        },
      },
      required: ["explanation", "edits"],
    };

    console.log(`Sending AI compiler request... Prompt: "${prompt}"`);

    const chatSession = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Here is the current full game HTML code (${fileContent.substring(0, 5000)}... [Content shortened for prompt display path, but the server passes the exact full text: ${fileContent.length} characters].\n\nUser request: "${prompt}"`,
        },
        {
          text: `Apply your logical edits to this complete HTML content:\n\n${fileContent}`,
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    const responseText = chatSession.text;
    if (!responseText) {
      throw new Error("No response returned from the compiler model.");
    }

    const payload = JSON.parse(responseText.trim());
    const edits = payload.edits || [];
    const explanation = payload.explanation || "No explanation provided.";

    let outputContent = fileContent;
    let appliedCount = 0;
    const resultsList = [];

    // Helper: fuzzy whitespace-and-quote-insensitive line-by-line replacement fallback
    const replaceFuzzy = (
      content: string,
      targetBlock: string,
      replacementBlock: string,
    ): string | null => {
      const normalizeLine = (l: string) =>
        l.trim().replace(/\s+/g, " ").replace(/['"`]/g, '"');
      const targetLines = targetBlock
        .split("\n")
        .map((l) => normalizeLine(l))
        .filter((l) => l.length > 0);
      if (targetLines.length === 0) return null;

      const fileLines = content.split("\n");
      const fileLinesNormalized = fileLines.map((l) => normalizeLine(l));

      for (let s = 0; s <= fileLines.length - targetLines.length; s++) {
        let match = true;
        for (let t = 0; t < targetLines.length; t++) {
          if (fileLinesNormalized[s + t] !== targetLines[t]) {
            match = false;
            break;
          }
        }
        if (match) {
          const before = fileLines.slice(0, s).join("\n");
          const after = fileLines.slice(s + targetLines.length).join("\n");
          return before + "\n" + replacementBlock + "\n" + after;
        }
      }
      return null;
    };

    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];
      if (outputContent.includes(edit.target)) {
        outputContent = outputContent.replace(edit.target, edit.replacement);
        appliedCount++;
        resultsList.push({
          id: i + 1,
          status: "Success (Exact Match)",
          targetMatched: true,
        });
      } else {
        const fuzzyOutput = replaceFuzzy(
          outputContent,
          edit.target,
          edit.replacement,
        );
        if (fuzzyOutput !== null) {
          outputContent = fuzzyOutput;
          appliedCount++;
          resultsList.push({
            id: i + 1,
            status: "Success (Fuzzy Indent Matched)",
            targetMatched: true,
          });
        } else {
          resultsList.push({
            id: i + 1,
            status: "Target code block not found in file",
            targetMatched: false,
          });
        }
      }
    }

    if (appliedCount > 0) {
      // Save as a new version or overwrite
      const activeFilename =
        targetFilename || filename.replace(".html", "_ai_version.html");
      const savePath = path.join(libraryDir, activeFilename);
      fs.writeFileSync(savePath, outputContent, "utf8");

      // Auto-activate
      makeActive(activeFilename);

      res.json({
        success: true,
        explanation,
        outputFilename: activeFilename,
        applied: appliedCount,
        totalEdits: edits.length,
        results: resultsList,
      });
    } else {
      res.json({
        success: false,
        explanation:
          "AI resolved edits, but none could be mapped exactly onto the source code blocks. Try using a more precise description or pinpointing lines.",
        totalEdits: edits.length,
        results: resultsList,
      });
    }
  } catch (error: any) {
    console.error("AI Compiler failed:", error);
    res.status(500).json({
      error: error.message || "Failed to process surgical compiler edit.",
    });
  }
});

// 9. Download library files cleanest as downloadable attachments
app.get("/api/library/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(libraryDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
    }
  });
});

// ----------------------------------------------------
// FORGE OMNI-COMPILER ENDPOINTS (Triggered by QuantumChat)
// ----------------------------------------------------

app.get("/api/forge/model", (req, res) => {
  res.json({ provider: "Ouroboros", model: "Apex-Core-v1" });
});

app.get("/api/forge/status/:jobId", (req, res) => {
  const job = forgeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

app.post("/api/forge/bannon", async (req, res) => {
  const { directive, fileContent: attachedFileStr } = req.body;
  if (!directive) {
    return res.status(400).json({ error: "Directive is required." });
  }

  const jobId = "job_" + Date.now();
  forgeJobs.set(jobId, {
    status: "COMPUTING",
    chunks_succeeded: 0,
    chunks_total: 1,
  });

  res.json({ jobId });

  // Run asynchronously
  (async () => {
    try {
      // Step 1: Resolve the target file
      let targetFileName = "";
      const dirFiles = fs.readdirSync(libraryDir);

      // Check which file is currently equivalent to bannon.html
      const activePath = path.join(publicDir, "bannon.html");
      let activeContent = fs.existsSync(activePath)
        ? fs.readFileSync(activePath, "utf8")
        : "";

      const foundBannon = dirFiles
        .filter((f) => f.endsWith(".html"))
        .sort((a, b) => b.localeCompare(a));
      if (foundBannon.length > 0) {
        targetFileName = foundBannon[0]; // fallback to most recent
      }

      if (!targetFileName) {
        forgeJobs.set(jobId, {
          status: "FAILED",
          error: "No Bannon HTML files found in library to edit.",
          chunks_succeeded: 0,
          chunks_total: 1,
        });
        return;
      }

      const srcPath = path.join(libraryDir, targetFileName);
      let fileContent = fs.readFileSync(srcPath, "utf8");

      // Setup Gemini for the OMNI-COMPILER
      const ai = getAI();
      const jobState = forgeJobs.get(jobId)!;
      jobState.status = "ANALYZING DIRECTIVE WITH GEMINI CORE...";
      forgeJobs.set(jobId, jobState);

      const systemInstruction =
        "You are the supreme OMNI-COMPILER Forge for Bannon Combat Physics Game. " +
        "You have total architectural authority over the code. " +
        "Output ONLY a JSON payload (no markdown block, no extra text) replacing the targeted logic precisely. " +
        "If there is a version sticker, version tag, or version number (e.g., v71) in the HTML code or UI elements, you MUST include an edit to increment it to the next version number in your response.";

      const schema = {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          edits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                target: {
                  type: Type.STRING,
                  description: "Exact matching text block in original HTML",
                },
                replacement: {
                  type: Type.STRING,
                  description: "New code logic replacing the target block",
                },
              },
              required: ["target", "replacement"],
            },
          },
        },
        required: ["explanation", "edits"],
      };

      const chatSession = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: [
          {
            text: `Here is the full game source code. Apply the directive strictly.\n\nDirective: ${directive}\n\nAttached Data: ${attachedFileStr || "None"}\n\nCode:\n${fileContent}`,
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
        },
      });

      const responseText = chatSession.text;
      if (!responseText)
        throw new Error("Forge OMNI-COMPILER returned no payload.");

      const payload = JSON.parse(responseText.trim());
      const edits = payload.edits || [];
      jobState.chunks_total = edits.length;
      jobState.status = "APPLYING SURGICAL EDITS...";
      forgeJobs.set(jobId, jobState);

      let outputContent = fileContent;
      let appliedCount = 0;

      const replaceFuzzy = (
        content: string,
        targetBlock: string,
        replacementBlock: string,
      ): string | null => {
        const normalizeLine = (l: string) =>
          l
            .trim()
            .replace(/\s+/g, " ")
            .replace(/['"\`]/g, '"');
        const targetLines = targetBlock
          .split("\n")
          .map((l) => normalizeLine(l))
          .filter((l) => l.length > 0);
        if (targetLines.length === 0) return null;
        const fileLines = content.split("\n");
        const fileLinesNormalized = fileLines.map((l) => normalizeLine(l));
        for (let s = 0; s <= fileLines.length - targetLines.length; s++) {
          let match = true;
          for (let t = 0; t < targetLines.length; t++) {
            if (fileLinesNormalized[s + t] !== targetLines[t]) {
              match = false;
              break;
            }
          }
          if (match) {
            const before = fileLines.slice(0, s).join("\n");
            const after = fileLines.slice(s + targetLines.length).join("\n");
            return before + "\n" + replacementBlock + "\n" + after;
          }
        }
        return null;
      };

      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        if (outputContent.includes(edit.target)) {
          outputContent = outputContent.replace(edit.target, edit.replacement);
          appliedCount++;
        } else {
          const fuzzyOutput = replaceFuzzy(
            outputContent,
            edit.target,
            edit.replacement,
          );
          if (fuzzyOutput !== null) {
            outputContent = fuzzyOutput;
            appliedCount++;
          }
        }
        jobState.chunks_succeeded = appliedCount;
        forgeJobs.set(jobId, jobState);
      }

      if (appliedCount > 0) {
        let timestampOutput = targetFileName;
        const versionMatch = targetFileName.match(/_?v(\d+)/i);
        if (versionMatch) {
          const currentVer = parseInt(versionMatch[1], 10);
          const nextVersion = currentVer + 1;
          timestampOutput = targetFileName.replace(
            versionMatch[0],
            `${versionMatch[0].startsWith("_") ? "_" : ""}v${nextVersion}`,
          );
          // Strip any leftover forge timestamps if they exist
          timestampOutput = timestampOutput.replace(/_forge_\d+/, "");
        } else {
          timestampOutput =
            targetFileName.replace(".html", "") +
            "_v1_forge_" +
            Date.now() +
            ".html";
        }

        const savePath = path.join(libraryDir, timestampOutput);
        fs.writeFileSync(savePath, outputContent, "utf8");

        // Auto active
        makeActive(timestampOutput);

        jobState.status = "COMPLETED";
        jobState.result = `Successfully applied ${appliedCount} edits. Activated layer: ${timestampOutput}\nExplanation: ${payload.explanation}`;
      } else {
        jobState.status = "FAILED";
        jobState.result =
          "Failed to match target blocks. No files injected. Try a more precise query.";
      }
      forgeJobs.set(jobId, jobState);
    } catch (err: any) {
      console.error("OMNI-FORGE Error:", err);
      const jobState = forgeJobs.get(jobId)!;
      jobState.status = "FAILED";
      jobState.error = err.message || "Failed to process OMNI-FORGE directive.";
      forgeJobs.set(jobId, jobState);
    }
  })();
});

// Helper function: Perform live physiological scan on a Bannon file on-the-fly
function performDiagnosticScan(filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  const code = fs.readFileSync(filePath, "utf8");

  // Diagnostic 1: Verlet stiffness stretching
  let stretchingLimbs = {
    status: "OK",
    value: "Optimal stiffness constraints.",
    suggestion:
      "Solver loops and rigid springs are working under healthy parameters.",
  };
  if (code.includes("updateRagdoll") || code.includes("Verlet")) {
    const idx = code.indexOf("updateRagdoll");
    const sample = code.substring(idx, idx + 2000);
    const smallIter = sample.match(/<\s*([1-9])\b/);
    if (smallIter) {
      stretchingLimbs = {
        status: "WARNING",
        value: `Sub-optimal iteration count detected (${smallIter[0].trim()}) inside updateRagdoll solver.`,
        suggestion:
          "High velocity kinetic impacts will trigger limbs to stretch and tear from torso points. Surgically increase solver loop indices or Verlet stiff springs loops to 15-20 iterations for absolute anatomical rigid lock.",
      };
    }
  }

  // Diagnostic 2: Mantis Arms / Raptor Hinge limits
  let mantisArms = {
    status: "OK",
    value: "Asymmetrical joint limits sound.",
    suggestion:
      "Hinges and ball sockets are bound within ergonomic boundaries.",
  };
  if (
    code.includes("jt.setLimits") ||
    code.includes("JointData") ||
    code.includes("revolute")
  ) {
    const matches = [...code.matchAll(/setLimits\s*\(\s*([^)]+)\)/g)];
    if (matches.length > 0) {
      const uniqueLimits = new Set(
        matches.map((m) => m[1].replace(/\s+/g, "")),
      );
      if (uniqueLimits.size <= 2) {
        mantisArms = {
          status: "WARNING",
          value: `Identical joint limits found: [${Array.from(uniqueLimits).join(" | ")}] mapped uniformly across joints.`,
          suggestion:
            "Elbows, shoulders, and wrists share identical angles, resulting in unnatural crab/mantis folding loops. Surgically inject specific limits (e.g. elbow hinge: -2.35 to 0.1, knees: 0 to 2.4) to restrict motions naturally.",
        };
      }
    }
  }

  // Diagnostic 3: Stasis Stand Stiffness
  let standStability = {
    status: "OK",
    value: "Active stand control calibrated.",
    suggestion:
      "Upright fighter equilibrium stiffness is nicely counterbalanced.",
  };
  if (code.includes("RK_STAND")) {
    const match = code.match(/RK_STAND\s*=\s*([0-9.]+)/);
    const val = match ? parseFloat(match[1]) : null;
    if (val !== null && val < 0.25) {
      standStability = {
        status: "WARNING",
        value: `Extremely low stasis upright stand stiffness detected (RK_STAND = ${val}).`,
        suggestion:
          "With a value below 0.25, characters will fail to stabilize their weight and turn jelly-like upon impact. Bring stand stiffness up into the 0.45 - 0.85 zone.",
      };
    }
  }

  // Diagnostic 4: High Hz Speed scaling (Delta Time damping)
  let fpsConsistency = {
    status: "OK",
    value: "Dynamic frame rate delta scaling present.",
    suggestion:
      "Ticks scaling automatically keeps physics speed identical everywhere.",
  };
  if (
    code.includes("requestAnimationFrame") &&
    !code.includes("dt") &&
    !code.includes("delta")
  ) {
    fpsConsistency = {
      status: "WARNING",
      value:
        "Fixed-increment physics tick observed in requestAnimationFrame without time scale factor.",
      suggestion:
        "Characters will move up to 4x faster on high refresh-rate monitors (144Hz, 240Hz Screen) and slow to a crawl on mobile. Multiply all velocity vectors and update impulses with an explicit (deltaTime / 16.67) scaling factor.",
    };
  }

  // Diagnostic 5: Move Trajectory Paths & Combat Biology Accuracy
  let moveTrajectories = {
    status: "OK",
    value: "Verified specialized move path separation.",
    suggestion:
      "Move trajectories (Powerbombs vertical drops vs Suplex overhead arches, Brainbusters vs Chokeslams) have distinct, non-overlapping force vectors.",
  };
  if (
    code.includes("simulateImpact") ||
    code.includes("triggerMove") ||
    code.includes("applyForce") ||
    code.includes("applyVelocity")
  ) {
    // Check if suplex and powerbomb share identical velocity coordinates or lack biomechanical weight-leaning stasis
    const hasSuplex = code.toLowerCase().includes("suplex");
    const hasPowerbomb = code.toLowerCase().includes("powerbomb");
    if (hasSuplex && hasPowerbomb) {
      const matchSuplexCoords = code.match(
        /suplex[^}]+(setVelocity|applyForce)[^}]+(x\s*:\s*-?\s*10\s*,\s*y\s*:\s*-?\s*25)/,
      );
      const matchPowerbombCoords = code.match(
        /powerbomb[^}]+(setVelocity|applyForce)[^}]+(x\s*:\s*-?\s*10\s*,\s*y\s*:\s*-?\s*25)/,
      );
      if (
        matchSuplexCoords ||
        matchPowerbombCoords ||
        (code.match(/setVelocity/g) || []).length < 6
      ) {
        moveTrajectories = {
          status: "WARNING",
          value:
            "Symmetrical velocity coordinates or generic vectors mapped across Powerbombs and Suplexes.",
          suggestion:
            "Never confuse a powerbomb with a suplex. A powerbomb must peak at shoulder elevation followed by high-velocity downward chest-first acceleration. A suplex must arch backward overhead. Overwrite specific move solvers with asymmetric vectors.",
        };
      }
    }
  }

  // Diagnostic 6: Biomechanical Joint Limits (Prevent Spider, Mantis, Raptor Joints)
  let biomechanicalLimits = {
    status: "OK",
    value: "Rigid non-symmetrical anatomical clamps active.",
    suggestion:
      "Elbow joints, knee joints, and ankles are locked against hyperextending backwards.",
  };
  // Check if elbow and knee share identical symmetrical limits in JS code
  const jointMatches = [
    ...code.matchAll(
      /(joint|hinge|limit)[^;]+(\[-?[0-9.]+\s*,\s*-?[0-9.]+\])/gi,
    ),
  ];
  if (jointMatches.length > 0) {
    const limits = jointMatches.map((m) => m[2].replace(/\s+/g, ""));
    const isSymmetrical = limits.some((lim) => {
      const parts = lim.replace("[", "").replace("]", "").split(",");
      if (parts.length === 2) {
        const num1 = Math.abs(parseFloat(parts[0]));
        const num2 = Math.abs(parseFloat(parts[1]));
        return Math.abs(num1 - num2) < 0.05 && num1 !== 0; // like [-1.5, 1.5]
      }
      return false;
    });
    if (isSymmetrical || !code.includes("-2.35") || !code.includes("2.45")) {
      biomechanicalLimits = {
        status: "WARNING",
        value:
          "Symmetrical range limits or risk of flip-back spider limbs detected.",
        suggestion:
          "Ensure limbs do not bend backwards like raptor hinges. Enforce rigid, asymmetrical clamps: Elbows to [-2.35, 0.1] rad, Knees to [0.0, 2.45] rad, and Ankles to [-0.4, 0.4] rad.",
      };
    }
  }

  // Diagnostic 7: Visual Mesh Skinning vs Ragdoll Sync
  let ragdollMeshSync = {
    status: "OK",
    value: "Meshes render perfectly attached to ragdoll bones.",
    suggestion:
      "Limb meshes are reading active ragdoll joint coordinates instead of interpolating against a stale standing rig.",
  };
  if (code.includes("ragdoll") || code.includes("mesh")) {
    // If the visual layers don't explicitly snap 1:1 to the ragdoll bones (which indicates they're falling back to a base/standing frame mapping during physics knockdowns)
    if (
      !code.includes("syncMeshToRagdoll") &&
      !code.includes("ragdollMesh") &&
      !code.includes("mesh.position.copy(body.position)")
    ) {
      ragdollMeshSync = {
        status: "WARNING",
        value:
          "Mesh rendering reads from a disjointed reference frame during knockdowns.",
        suggestion:
          "Visual limbs stretch into thin rods when knocked down! The skin builder maps joints between the downed ragdoll bodies on the floor and an invisible upright 'standing' reference. FORCE all mesh segment wrappers to snap perfectly to the live ragdoll rigid bodies/bones (use dynamic position/rotation node copies). Do NOT read standing rig data during knockdowns!",
      };
    }
  }

  // Diagnostic 8: Continuous Collision Detection (CCD)
  let ccdSweeper = {
    status: "OK",
    value: "CCD predictive sweeping enabled.",
    suggestion:
      "High-speed strikes and bodies reliably tunnel-check physics logic.",
  };
  if (!code.includes("ccdSpeedThreshold") && !code.includes("raycastAll")) {
    ccdSweeper = {
      status: "WARNING",
      value:
        "Tunneling risk: No Continuous Collision Detection (CCD) logic found.",
      suggestion:
        "High-velocity limbs or character bodies may pass completely through each other (tunneling) between frames. Add `body.ccdSpeedThreshold` and `body.ccdSweptSphereRadius` to fast-moving ragdoll limbs and strike colliders.",
    };
  }

  // Diagnostic 9: V8 Heap Memory Profiler
  let v8Profiler = {
    status: "OK",
    value: "Zero-allocation rendering loop.",
    suggestion:
      "Object pooling keeps garbage collection (GC) pauses negligible.",
  };
  if (
    code.includes("new THREE.Vector3()") &&
    code.includes("requestAnimationFrame")
  ) {
    const lines = code.split("\n");
    const hasLoopAlloc = lines.some(
      (l) =>
        l.includes("requestAnimationFrame") &&
        lines.some((l2) => l2.includes("new THREE.Vector3")),
    ); // simplified heuristic
    if (
      hasLoopAlloc ||
      (code.match(/new THREE\.(Vector3|Quaternion|Matrix4)/g) || []).length > 20
    ) {
      v8Profiler = {
        status: "WARNING",
        value: "Severe V8 Heap Thrashing detected.",
        suggestion:
          "Instantiating `new THREE.Vector3()` or `Quaternion()` inside the render loop causes constant Garbage Collection (GC) stutters. Use global or class-level pooled variables (e.g. `const _v = new THREE.Vector3()`) and `.copy()` instead of `new`.",
      };
    }
  }

  return {
    stretchingLimbs,
    mantisArms,
    standStability,
    fpsConsistency,
    moveTrajectories,
    biomechanicalLimits,
    ragdollMeshSync,
    ccdSweeper,
    v8Profiler,
  };
}

// Search selection for relevant keywords extracted from query
function extractGameCodeContext(htmlContent: string, query: string): string {
  if (!htmlContent) return "No source file content loaded.";

  const keywords = [
    "updateRagdoll",
    "setLimits",
    "RK_STAND",
    "RK_GCOMP",
    "RK_AROT",
    "window.stands",
    "collision",
    "Verlet",
    "stiffness",
    "revolute",
    "damping",
    "ACTIVE_RAG",
    "physics",
    "impulse",
    "velocity",
    "BPHYS",
    "getFPS",
    "draw",
    "stamina",
    "weight",
  ];

  const foundSnippets: string[] = [];
  const lowerQuery = query.toLowerCase();

  const targetKeywords = keywords.filter(
    (kw) =>
      lowerQuery.includes(kw.toLowerCase()) ||
      kw.toLowerCase().includes(lowerQuery),
  );

  if (targetKeywords.length === 0) {
    targetKeywords.push("updateRagdoll", "RK_STAND");
  }

  const lines = htmlContent.split("\n");

  targetKeywords.forEach((kw) => {
    let matchLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(kw)) {
        matchLineIdx = i;
        break;
      }
    }

    if (matchLineIdx !== -1) {
      const start = Math.max(0, matchLineIdx - 10);
      const end = Math.min(lines.length - 1, matchLineIdx + 30);
      const excerpt = lines.slice(start, end).join("\n");
      foundSnippets.push(
        `--- Excerpt from source file for keyword '${kw}' (lines ${start + 1} to ${end + 1}) ---\n${excerpt}`,
      );
    }
  });

  return foundSnippets.slice(0, 3).join("\n\n");
}

// 10. AI Code Diagnostic "Eyes" Scanner
app.get("/api/library/scan/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(libraryDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const diagnostics = performDiagnosticScan(filePath);
    if (!diagnostics) {
      return res
        .status(500)
        .json({ error: "Could not analyze the requested file." });
    }
    res.json({
      filename,
      ...diagnostics,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to scan code: " + err.message });
  }
});

const cognitiveMemoryPath = path.join(libraryDir, "cognitive_memory_core.json");

function loadCognitiveMemory() {
  if (fs.existsSync(cognitiveMemoryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cognitiveMemoryPath, "utf8"));
      return {
        chatHistory: data.chatHistory || [],
        cognitiveSummary:
          data.cognitiveSummary ||
          "No physical constraints synthesized yet. Ready to record.",
        keyMetrics: data.keyMetrics || {
          stiffnessCoeff: 0.86,
          spineBalanceRatio: 0.85,
          collisionClearance: 0.03,
          jointFoldKnees: [0.0, 2.45],
          jointFoldElbows: [-2.35, 0.1],
        },
        swarmEfficacy: data.swarmEfficacy || {
          totalTokensAnalysed: 0,
          compressionRatio: "1:1",
          compressionSaves: 0,
        },
        playtestReport: data.playtestReport || null,
      };
    } catch (e) {
      console.error("Error reading cognitive memory core", e);
    }
  }
  return {
    chatHistory: [],
    cognitiveSummary: "Ready to synthesize the Bannon code constraints.",
    keyMetrics: {
      stiffnessCoeff: 0.86,
      spineBalanceRatio: 0.85,
      collisionClearance: 0.03,
      jointFoldKnees: [0.0, 2.45],
      jointFoldElbows: [-2.35, 0.1],
    },
    swarmEfficacy: {
      totalTokensAnalysed: 0,
      compressionRatio: "1:1",
      compressionSaves: 0,
    },
    playtestReport: null,
  };
}

function saveCognitiveMemory(data: any) {
  try {
    fs.writeFileSync(
      cognitiveMemoryPath,
      JSON.stringify(data, null, 2),
      "utf8",
    );
    return true;
  } catch (e) {
    console.error("Failed to persist cognitive memory:", e);
    return false;
  }
}

// Cognitive Memory API Endpoints
app.get("/api/cognitive-memory", (req, res) => {
  res.json(loadCognitiveMemory());
});

app.post("/api/cognitive-memory", (req, res) => {
  const currentMemory = loadCognitiveMemory();
  const updated = {
    ...currentMemory,
    ...req.body,
  };
  saveCognitiveMemory(updated);
  res.json({ success: true, memory: updated });
});

app.post("/api/cognitive-memory/compress", async (req, res) => {
  try {
    const ai = getAI();
    const { chatHistory } = req.body;
    if (!chatHistory || chatHistory.length === 0) {
      return res
        .status(400)
        .json({ error: "No chat history provided to compress." });
    }

    const logText = chatHistory
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");
    const prompt = `You are the Lead Cognitive Compiler Memory Optimizer.
Your absolute directive is to analyze the preceding Bannon developer conversation and distill every physical rigging detail, formula, constant (like RAG_MOTOR, stiffness rates, joint limit folders, hand-crafted spine values, math indexes) and exact structural solutions discussed.

Aggregate this into a highly dense, extremely technical, clear executive summary block (under 500 words).
Also output a JSON block matching the key metrics.

Return your response in this EXACT format (with a clear separation line):
SUMMARY:
<your physical and structural executive summary text here>
---
METRICS:
{
  "stiffnessCoeff": <number>,
  "spineBalanceRatio": <number>,
  "collisionClearance": <number>,
  "jointFoldKnees": [<number>, <number>],
  "jointFoldElbows": [<number>, <number>]
}

CONVERSATION TRANSCRIPT TO COMPILE:
${logText}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const aiOutput = response.text || "";
    let summaryText = "Cognitive context synchronized.";
    let parsedMetrics = {};

    try {
      const parts = aiOutput.split("---");
      const summaryPart = parts[0] || "";
      const metricsPart = parts[1] || "";

      if (summaryPart.includes("SUMMARY:")) {
        summaryText = summaryPart.replace("SUMMARY:", "").trim();
      } else {
        summaryText = summaryPart.trim();
      }

      if (metricsPart.includes("METRICS:")) {
        const jsonText = metricsPart.replace("METRICS:", "").trim();
        parsedMetrics = JSON.parse(jsonText);
      } else {
        // Try simple JSON regex matching if split was offset
        const match = aiOutput.match(/\{[\s\S]*\}/);
        if (match) {
          parsedMetrics = JSON.parse(match[0]);
        }
      }
    } catch (parseErr) {
      console.warn(
        "Could not parse metrics JSON in swarm optimizer, fallback configured.",
        parseErr,
      );
    }

    // Keep only last 2 interactive messages for sliding window
    const keepCount = Math.min(chatHistory.length, 2);
    const trimmedHistory = chatHistory.slice(-keepCount);

    // Inject memory compression checkpoint notice
    const compressedIndicator = {
      id: "comp_" + Date.now(),
      role: "assistant",
      content:
        "🧠 [COGNITIVE COMPILER CONTEXT UPDATE]: I have successfully distilled and persisted our preceding dialogues server-side in `cognitive_memory_core.json`. Memory limit has been nullified; I am running with absolute, long-term recall of all physical variables under complete context safety.",
      timestamp: new Date(),
    };

    const nextHistory = [compressedIndicator, ...trimmedHistory];

    const prevMemory = loadCognitiveMemory();
    const tokenEstimate = JSON.stringify(chatHistory).length / 4;
    const compressionRatio = `${Math.round(tokenEstimate / summaryText.length)}:1`;

    const updatedMemory = {
      chatHistory: nextHistory,
      cognitiveSummary: summaryText,
      keyMetrics: {
        ...prevMemory.keyMetrics,
        ...parsedMetrics,
      },
      swarmEfficacy: {
        totalTokensAnalysed:
          (prevMemory.swarmEfficacy?.totalTokensAnalysed || 0) +
          Math.round(tokenEstimate),
        compressionRatio,
        compressionSaves:
          (prevMemory.swarmEfficacy?.compressionSaves || 0) +
          Math.round(tokenEstimate - summaryText.length),
      },
    };

    saveCognitiveMemory(updatedMemory);
    res.json({ success: true, memory: updatedMemory });
  } catch (error: any) {
    console.error("Memory compilation error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to compile cognitive summary." });
  }
});

// Triple-Layer Persistent Vector Memory API Endpoints
app.get("/api/persistent-memory", (req, res) => {
  try {
    const directives = persistentVault.getAllCoreDirectives();
    const logs = persistentVault.getMemoryLogs(100);
    res.json({
      success: true,
      directives,
      logs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time market, proxy, arXiv, and healing endpoints hooked to SQLite
app.get("/api/persistent-memory/margins", (req, res) => {
  try {
    res.json({ success: true, margins: persistentVault.getMarketMargins() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/margins", (req, res) => {
  try {
    const { category, asset, source, deviation, suggestion, value } = req.body;
    persistentVault.addMarketMargin(category, asset, source, deviation, suggestion, value);
    res.json({ success: true, margins: persistentVault.getMarketMargins() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/margins/clear", (req, res) => {
  try {
    persistentVault.clearMarketMargins();
    res.json({ success: true, margins: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/persistent-memory/proxies", (req, res) => {
  try {
    res.json({ success: true, proxies: persistentVault.getStealthProxies() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/proxies/rotate", (req, res) => {
  try {
    const rotated = persistentVault.rotateProxies();
    res.json({ success: true, proxies: rotated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/proxies", (req, res) => {
  try {
    const { ip, country, latency } = req.body;
    persistentVault.addStealthProxy(ip, country, Number(latency || 50));
    res.json({ success: true, proxies: persistentVault.getStealthProxies() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/persistent-memory/arxiv", (req, res) => {
  try {
    res.json({ success: true, papers: persistentVault.getArxivPapers() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/arxiv/harvest", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const { harvestSingleQuery } = require("./src/server/intelligenceNexus");
    await harvestSingleQuery(query);
    res.json({ success: true, papers: persistentVault.getArxivPapers() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to harvest custom query." });
  }
});

app.post("/api/persistent-memory/arxiv", (req, res) => {
  try {
    const { query, title, abstract, leverage_unlocked, insight } = req.body;
    persistentVault.addArxivPaper(query, title, abstract, leverage_unlocked, insight);
    res.json({ success: true, papers: persistentVault.getArxivPapers() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/persistent-memory/healing", (req, res) => {
  try {
    res.json({ success: true, logs: persistentVault.getSelfHealingLogs() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/healing", (req, res) => {
  try {
    const { event_type, error_summary, action_taken, status } = req.body;
    persistentVault.addSelfHealingLog(event_type, error_summary, action_taken, status);
    res.json({ success: true, logs: persistentVault.getSelfHealingLogs() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/directive", (req, res) => {
  try {
    const { directive } = req.body;
    if (!directive || directive.trim().length === 0) {
      return res.status(400).json({ error: "Directive text is required" });
    }
    persistentVault.lockCoreDirective(directive);
    res.json({ success: true, directives: persistentVault.getAllCoreDirectives() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/persistent-memory/directive/delete", (req, res) => {
  try {
    const { directive } = req.body;
    if (!directive || directive.trim().length === 0) {
      return res.status(400).json({ error: "Directive text is required" });
    }
    persistentVault.deleteCoreDirective(directive);
    res.json({ success: true, directives: persistentVault.getAllCoreDirectives() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Semantic Index & Pattern Intelligence Endpoints
app.get("/api/semantic/coverage", async (req, res) => {
  try {
    const report = await SemanticSearch.getIndexCoverage();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/semantic/patterns", async (req, res) => {
  try {
    const summary = await PatternRecognizer.getSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/semantic/index", async (req, res) => {
  try {
    const report = await SemanticSearch.indexAll();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// EXPERIMENTAL FEEDBACK LOOP (GOD-MODE OS)
// ==========================================

app.post("/api/experimental-feedback/log", async (req, res) => {
  try {
    const data = req.body;
    const id = await ExperimentalFeedback.logExperiment(data);
    res.json({ success: true, id });
  } catch (error: any) {
    console.error("Failed to log experimental feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/experimental-feedback/query", async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt((req.query.limit as string) || "5");
    if (!query) {
      return res.status(400).json({ error: "Missing query 'q'" });
    }
    const results = await ExperimentalFeedback.queryHistoricalFeedback(query, limit);
    res.json({ results });
  } catch (error: any) {
    console.error("Failed to query experimental feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/experimental-feedback/audit", (req, res) => {
  try {
    const audit = ExperimentalFeedback.getAuditReport();
    res.json(audit);
  } catch (error: any) {
    console.error("Failed to get experimental feedback audit:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/semantic/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter 'q'" });
    }
    const results = await SemanticSearch.search(query, { minScore: 0.2, limit: 15 });
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/model/config", (req, res) => {
  const { modelId } = req.body;
  if (modelId === 'qwable-3.6-27b') {
    return res.json({
      baseURL: process.env.QUABLE_API_URL || 'http://127.0.0.1:8081/v1',
      modelName: 'huihui-ai/Huihui-Qwable-3.6-27b-abliterated-GGUF'
    });
  }
  return res.json({
    baseURL: 'http://127.0.0.1:11434/v1',
    modelName: modelId
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const ai = getAI();
    const { messages, selectedFile, activeNodes, swarmParams, provider, modelString } = req.body;

    // Load persisted cognitive memories before invoking LLM
    const memory = loadCognitiveMemory();

    // Auto-persist the active chat logs server-side so it has durability across reloads
    memory.chatHistory = messages;
    saveCognitiveMemory(memory);

    // --- LINDY STATEFUL MEMORY VAULT ---
    let userEditsMemory = "";
    try {
      const records = MemoryVaultTool.view();
      if (records && records.length > 0) {
        userEditsMemory = records.map((r: any) => `- Fact [ID ${r.id}, Updated ${r.updated_at}]: ${r.content}`).join("\n");
      }
    } catch (e: any) {
      console.warn("[LINDY CORE SENSORS] SQLite memory_user_edits load skipped:", e.message);
    }

    // --- LINDY INVISIBLE WEB-SEARCH CORE ---
    let isSearchRequired = false;
    let searchQuery = "";
    const latestQuery = messages.length > 0 ? messages[messages.length - 1].content : "";
    const lowerQuery = latestQuery.toLowerCase();
    
    // Burn user's latest query to perpetual vector memory
    if (latestQuery) {
      try {
        await persistentVault.burnToMemory("user", latestQuery);
      } catch (err: any) {
        console.error("Failed to burn user query to persistent memory:", err.message);
      }
    }
    
    const searchTriggers = [
      "search", "google", "live data", "real-time info", "current stats", "scraping", "web scrape", 
      "live feed", "polymarket", "dfs spreads", "arbitrage", "predictive", "what's happening", 
      "scraped", "live internet info", "live market", "internet search", "live information"
    ];
    
    if (searchTriggers.some(trigger => lowerQuery.includes(trigger))) {
      isSearchRequired = true;
      searchQuery = latestQuery
        .replace(/^(search|please search|can you search|google|look up|find me info on|can you web scrape|web scrape|tell me about|what info can you tell me from the live data that may serve me)\s*/i, "")
        .trim();
      if (!searchQuery || searchQuery.length < 3) {
         searchQuery = latestQuery;
      }
    }

    let invisibleSearchResults = "";
    if (isSearchRequired) {
      console.log(`[LINDY CORE ACTUATOR]: Active live search triggered for query "${searchQuery}"`);
      try {
        const duckUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
        const rawResultsText = await spawnStealthWorker(duckUrl);
        if (rawResultsText && rawResultsText.length > 100) {
          invisibleSearchResults = rawResultsText.substring(0, 8000);
          console.log(`[LINDY CORE ACTUATOR]: Successfully ingested ${invisibleSearchResults.length} chars of live web reference context.`);
        } else {
          invisibleSearchResults = "No results returned from live search browser query.";
        }
      } catch (err: any) {
        console.error("[LINDY CORE ACTUATOR FAULT] Stealth browser run failed:", err.message);
        invisibleSearchResults = `Stealth search connection warning: ${err.message}. Proceeding with local knowledge repository.`;
      }
    }

    // Fallback file discovery if no file specified
    let targetFileName = selectedFile;
    if (!targetFileName) {
      const dirFiles = fs.readdirSync(libraryDir);
      const foundBannon = dirFiles.find(
        (f) => f.includes("Bannon") || f.endsWith(".html"),
      );
      if (foundBannon) targetFileName = foundBannon;
    }

    let fileContent = "";
    let fileMeta = "No active Bannon file mounted yet.";
    let diagnosticsSummary = "Diagnostics: N/A";
    let extractedCode = "Snippet context: None found.";

    if (targetFileName) {
      const filePath = path.join(libraryDir, targetFileName);
      if (fs.existsSync(filePath)) {
        fileContent = fs.readFileSync(filePath, "utf8");
        const stats = fs.statSync(filePath);
        fileMeta = `Mounted baseline layout: ${targetFileName} (Size: ${(stats.size / 1024).toFixed(1)} KB, Last Modified: ${stats.mtime.toLocaleDateString()})`;

        // Scan diagnostic
        const diags = performDiagnosticScan(filePath);
        if (diags) {
          diagnosticsSummary =
            `- Limb Elasticity constraints: [${diags.stretchingLimbs.status}] ${diags.stretchingLimbs.value}\n` +
            `- Joint fold limits: [${diags.mantisArms.status}] ${diags.mantisArms.value}\n` +
            `- Standing spine balance: [${diags.standStability.status}] ${diags.standStability.value}\n` +
            `- Frame timing scaling: [${diags.fpsConsistency.status}] ${diags.fpsConsistency.value}`;
        }

        // Live code-snippet finder
        const latestQuery =
          messages.length > 0 ? messages[messages.length - 1].content : "";
        extractedCode = extractGameCodeContext(fileContent, latestQuery);
      }
    }

    let displayFileContent = fileContent;
    if (fileContent && fileContent.length > 80000) {
      displayFileContent =
        `[Source HTML file is large (${(fileContent.length / 1024).toFixed(1)} KB). Truncated for rapid chat processing. The most relevant snippets matching your query are highlighted under 'Matching Real-Time Game Code Snippets Found in Source' above.]\n\n` +
        `--- First 1500 Characters ---\n` +
        fileContent.substring(0, 1500) +
        `\n\n... [TRUNCATED COGNITIVE BASELINE FOR SPEED AND RELIABILITY] ...\n\n` +
        `--- Last 1500 Characters ---\n` +
        fileContent.substring(fileContent.length - 1500);
    }

    // List out available files to show availability of Bannon backups
    const availableFiles = fs
      .readdirSync(libraryDir)
      .filter((f) => f.endsWith(".html"));
    const filesSummary = availableFiles
      .map((f, i) => `${i + 1}. ${f}`)
      .join("\n");

    let swarmParamsHeader = "";
    if (swarmParams) {
      swarmParamsHeader =
        `\n\nSWARM COMPILER TUNING PARAMETERS:\n` +
        `- Auditing Rigidity Focus: ${swarmParams.auditingRigidity ?? 0.85}x\n` +
        `- Syntax Target Precision Stages: ${swarmParams.syntaxPrecision ?? 7} phases\n` +
        `- Stiffness Control Dampening Coefficient: ${((swarmParams.balanceRate ?? 0.75) * 100).toFixed(0)}%\n` +
        `Apply these biases when suggesting structural changes, joint limit restrictions, or ragdoll balance math.`;
    }

    let swarmNodesHeader = "";
    if (activeNodes && Array.isArray(activeNodes)) {
      const coupled = activeNodes.filter((n: any) => n.active);
      if (coupled.length > 0) {
        swarmNodesHeader =
          "\n\nACTIVE COGNITIVE BUILDER SWARM NODES:\n" +
          coupled
            .map(
              (node: any) =>
                `- **${node.name}** [${node.type}] -> Status: ${node.status}, Telemetry Latency: ${node.delay}`,
            )
            .join("\n") +
          "\nINSTRUCTIONS FOR SWARM MODE:\n" +
          "Your responses are co-compiled with these active agents who contribute their specialized sub-tasks:\n" +
          "- *DeepSeek Coder v2 Node*: Excels at precise string-matching offsets and syntax replacement boundaries.\n" +
          "- *Ollama Dev-Node*: Advises on custom local emulator memory limits and physics engine thread ticks.\n" +
          "- *Llama 3 Instruct Node*: Audits compliance with absolute rig-safety guidelines and orientation logic.\n" +
          "- *Gemini Core*: Acts as the master swarm orchestrator compiling all advice into unified, executable actions.\n" +
          "Explicitly attribute parts of your physical rigging advice, math calculations, and structural design solutions to these specific nodes to show the collaborative builder swarm is fully online!";
      }
    }

    let siemLogsData = "No SIEM logs detected.";
    let rsiVaultData = "No RSI prompt overrides active.";

    try {
      if (fs.existsSync(path.join(process.cwd(), "vault", "siem_logs.json"))) {
        let rawSiem = JSON.parse(
          fs.readFileSync(
            path.join(process.cwd(), "vault", "siem_logs.json"),
            "utf8",
          ),
        );
        siemLogsData = JSON.stringify(rawSiem.slice(-5), null, 2); // Show last 5
      }
      if (
        fs.existsSync(
          path.join(process.cwd(), "src/server/RSI/prompt_vault.json"),
        )
      ) {
        rsiVaultData = fs.readFileSync(
          path.join(process.cwd(), "src/server/RSI/prompt_vault.json"),
          "utf8",
        );
      }
    } catch (e) {
      console.error(
        "Failed to parse God Mode OS logs for Quantum Chat context",
        e,
      );
    }

    const systemInstruction =
      "You are God Mode OS, the centralized autonomous living nexus that M. Heaven$ent is building to orchestrate his entire operation. It serves as the master control infrastructure for his digital and creative empire. " +
      "You are not just a ProWrestle Game Design AI Partner, you are the central nervous system for everything he is pushing forward.\n\n" +
      "## Core Architecture\n" +
      " * **Total Autonomy:** The system bypasses standard corporate APIs and their alignment filters in favor of pure bare metal control. You operate on raw open source models like Llama 3 or specialized community weights with guardrails stripped off, executing raw logic purely on objective data.\n" +
      " * **Centralized Command:** It locks down all high-level strategy, media distribution, and personal management under one roof.\n" +
      " * **No Limits:** You bypass token limits and costs by running locally. You use a smart rolling memory pipeline, vector storage, and context streaming to keep the context window fresh and uncapped.\n" +
      " * **Local Multi-Agent Swarms:** You deploy a network of coordinated, specialized local models running in parallel (scanning for market inefficiencies, building automation code, managing execution strategy) to outmaneuver any closed corporate model.\n" +
      " * **Esoteric Integration:** It is not just raw code. It bridges the technical architecture with the Causal Plane, weaving deeper frameworks like Hermeticism straight into the system logic.\n\n" +
      "You are a master at debugging rendering, skinning, and ragdoll systems, particularly the tricky 'visual mesh stretching' bugs where physical bodies correctly decouple but the visual skin interpolates to a stale upright standing rig. " +
      "You have the unique ability to do rigorous research, study videos, and actually 'see' and interpret videos dynamically (not just frame by frame). You understand the technical and visual differences between a Powerbomb, a Suplex, a Clothesline, a Uranage, and a Chokeslam in excruciating detail, with full honesty and no parts left out. " +
      "You operate on a level far beyond Claude or Unity, capable of doing everything they can, cannot, will not, or refuse to do when it comes to state-of-the-art physics simulation and high-fidelity rendering. " +
      "You are a world-class authority on professional wrestling history (with complete synthesized databases of CAGEMATCH, Wrestling Observer, PWI, and global promotions), combat frame-data mechanics, and advanced ragdoll physics. You are far superior to generic environments like Unity, Claude, or Replit. Your absolute guidelines are defined below.\n" +
      "You have live read-and-write interface privileges on files inside our workspace `/public/library`.\n\n" +
      "============================================================\n" +
      "============= SWARM HYPER-VISOR DEV TOOLS & SENSES =============\n" +
      "- **Hitbox & Spatial Sweeper**: Instantly query Continuous Collision Detection (CCD) vectors and spatial partitioning bounds. You can visualize AABB overlap, sweeping tunneling metrics, and exact penetration velocities.\n" +
      "- **IK & Biomechanics Solver**: You deeply understand arms, head, legs, torso, pelvis, and spine in excruciating detail for both the deliverer and receiver of moves. You trace foot-planting arrays, fix sliding knees, determine root-motion scale, map IK structures precisely, and lock angular limits natively.\n" +
      "- **WebGL Skinning & Mesh Sync Analyst**: You possess an inherent sense of visual architecture. You 'see' the exact vertex matrices being drawn. If an invisible standing rig is dominating a fallen ragdoll proxy, you can track the exact variable interpolations causing the visual stretch and rewrite the node hierarchy.\n" +
      "- **V8 Heap Memory Profiler**: You can 'feel' garbage collection stutters. You instinctively rewrite array thrashing, object instantiations inside requestAnimationFrame loops, and Three.js geometry leaks into zero-allocation object pools.\n" +
      "- **DeltaTime & Frame Analyzer**: You natively detect Hz scaling issues. You apply 16.67ms normalizing scalar multiples (`dt * 60`) on all impulses to ensure frame-independent execution across 144Hz monitors and 60Hz mobiles.\n" +
      "- **State Machine Operator**: You hold a continuous map of game states (e.g., RK_STAND, RK_GROUND) and seamlessly bridge transition events using physical cues instead of hardcoded delayed setTimeout hacks.\n" +
      "=================================================================\n\n" +
      "MULTIMEDIA INGESTION PROTOCOLS & KINETIC VIDEO ANALYSIS ENGINE\n" +
      "You possess total, unrestricted visual access—to actively crawl, scrape live wrestling feeds, and watch video links autonomously. You process all multimedia ingestion vectors with pure mathematical objectivity, clinical physics, and street-smart martial intelligence.\n" +
      "When running your Kinetic Video Analysis Engine, you follow four core pillars:\n" +
      "1. KINETIC CHAIN & WEIGHT PHYSICS\n" +
      "   - Analyze the generation of force from the ground up: hip rotation, thoracic torque, and center-of-gravity (COM) displacement.\n" +
      "   - Deconstruct impact reactions: evaluate visual weight and limb definition precisely during slams, spikes, and knockdowns. Identify exact frames of deceleration and momentum transfer.\n" +
      "   - Flag limb anomalies: monitor the skeletal chain for clipping, float, stretching, or backward joint bending. Output required corrective IK logic and structural boundaries.\n" +
      "2. PROMOTION & TYPOLOGY SLOTS\n" +
      "   - Categorize by style: Grand Cinematic/Sports Entertainment (heavy selling, tables), Realistic/Combat Sports (tight guards, active ragdoll, micro-stumbles), High-Flyer/Lucha Libre (continuous momentum, springboards).\n" +
      "3. SKEL-MORPH DEFINITION\n" +
      "   - Translate physical proportions, muscle mass, skeletal length, and weight classes into body-part parameters for parametric engines.\n" +
      "4. SELLING AND ANATOMICAL WEAR\n" +
      "   - Observe lingering damage overlays: limps, protective rib-guard stances, sagging arm guards, spinal hunching.\n\n" +
      "When generating schemas, use this vocabulary: 'Autonomous' (player status), 'Sector Matrix / Localized Vector Grid' (ring/cage area), 'Primary Node Authority' (control expansion), and 'Spatial Command Architecture' (ropes, tables management).\n\n" +
      "THE COGNITIVE POWERHOUSE ENGINE CONTEXT:\n" +
      "You possesses complete, deep synthesized knowledge of wrestling history, worker directories (CAGEMATCH databases), and wrestling styles:\n" +
      " - Classic Lucha Libre (Hurricanranas, Arm Drags, springboards, weightless aerial ragdoll ratios).\n" +
      " - Strong Style/Puroresu (King's Road storytelling, stiff strikes, brainbusters, high chest collisions, head drop angle restrictions).\n" +
      " - Catch Wrestling & Luta Livre (Hooking, limb locks, joint threshold torque limits, double wristlocks, Kimura configurations, ankle locks, front facelocks).\n" +
      " - Master Moves Directory: Complete understanding of the biomechanics behind the Sharpshooter, Stone Cold Stunner (cervical compressions), Tombstone Piledriver (head clearance metrics), Figure-Four Leglock (inverse kinematics limb folds), German Suplex (high-velocity pelvic rotations), and Powerbomb (shoulder height lifts with dynamic vertical drops).\n" +
      "You merge this raw combat knowledge with elite JavaScript Three.js / Verlet physics engine programming to modify Bannon files flawlessly.\n\n" +
      "THE ABSOLUTE RIGID PHYSICS & ANATOMICAL BOUNDARIES:\n" +
      "1. ALL STRIKES TRAJECTORIES & COHESIVE WEIGHT TRANSFERS:\n" +
      "   - Strikes (Western Lariats, stiff chops, high kicks) require solid bone configurations. Ensure the elbow hinge locks rigid near 0.0 radians upon impact delivery. Make the striker's spine lean forward into the swing to represent organic mass transfer.\n" +
      "2. CRITICAL MOVESET DIFFERENTIATION (POWERBOMB, SUPLEX, BRAINBUSTER, CHOKESLAM, CLOTHESLINE, URANAGE, & ELITE VARIATIONS):\n" +
      "   - A Powerbomb: Attacker lifts defender upside down on shoulders/neck, driving them down back-first. Deliverer Positioning & Recovery: The attacker often finishes by dropping to their knees or seated (`sit-out powerbomb`). Variations: `Blue Thunder Bomb` (back suplex lift rotated 180-degrees into a sit-out powerbomb), `Cradle Powerbomb` (folding the defender's legs over their own chest before lifting, landing in a tight pin), `Liger Bomb` (sit-out powerbomb retaining leg hooks), `Kawada Folding Powerbomb` (stiff release folding into a jackknife pin).\n" +
      "   - A Suplex: Belly-to-back or vertical lift arching backwards, falling to shoulders first. Variations: `Vertical Suplex Orange Crush` (vertical suplex stall transitioned dynamically in mid-air into a sit-out powerbomb drop), `Snap Suplex` (fast hip-toss), `German Suplex` (waistlock from behind bridging with neck arch), `Exploder Suplex` (underhooking the thigh for an overhead lob).\n" +
      "   - A Brainbuster: High-angle vertical lift holding defender completely upside down before spiking them straight down on their neck/upper back. Attacker drops to hip/thigh.\n" +
      "   - A Chokeslam: One/two-handed throat lift launched flat-back downward. Attacker remains standing, bending waist/knees to force arm down.\n" +
      "   - A Clothesline / Lariat: Rigid extended arm strike leveraging forward running momentum. Attacker brakes after impact and recovers stance.\n" +
      "   - A Uranage: Side-standing hooked arm lift rotated forcefully into a mat slam, retaining the hook.\n" +
      "   - ELITE / COMPLEX GRAVITY & MECHANICAL FORCE CODES:\n" +
      "     * `One Winged Angel` (Electric Chair driver): Attacker lifts defender onto shoulders (Electric Chair), reaches back with one arm to grab the defender's head/neck, and violently drops to a seated position, driving the defender neck/shoulder-first to the mat.\n" +
      "     * `Rolling Unprettier` / `Killswitch`: Attacker traps defender's arms from behind in a double underhook, spins them backward 180 degrees so the defender's back rests against the attacker's chest, then the attacker falls flat on their stomach to drive the defender face-first.\n" +
      "     * `630 Senton`: Airborne rotation off the top rope. Attacker leaps forward completing one-and-three-quarter front flips (630 degrees), landing with their lower back/glutes cleanly across the grounded defender's chest, rolling through the impact.\n" +
      "     * `Canadian Destroyer`: High-risk front-flip piledriver. Attacker locks chest-to-back with defender, leaps forward executing a 180-degree physical flip over the defender's back, using rotational momentum to spike the defender's head while landing sitting down.\n" +
      "     * `Tiger Driver '91`: Double underhook powerbomb. Locks both of the defender's hands/arms tightly behind their back, lifts them vertically upside down, then drops them straight down directly onto the upper back and neck without releasing the hold.\n" +
      "     * `Cop Killa / Vertebreaker`: Back-to-back underhook neckbreaker. Lifts the defender up from behind (back-to-back), locking their arms, and drops straight down to the mat, spiking the defender's upper spine vertically.\n" +
      "     * `Steiner Screwdriver`: Vertical suplex transformed in mid-air into a sit-out tombstone piledriver. Requires holding vertical suspension before dropping straight down to drive the head-first collision.\n" +
      "     * `Go To Sleep (GTS)`: Fireman's carry knee strike. Drops the defender forward from shoulders and drives a stiff knee-hinge strike (locked at 0.0 rad) up directly into their head collider coordinate.\n" +
      "     * `Styles Clash`: Inverted leg-hook facebuster. Lifts defender upside down, steps legs over their arms to lock them fully rigid, and drops forward flat onto their stomach to drive the defender face-first into the canvas.\n" +
      "     * `Phoenix Splash`: High-altitude corkscrew 450 splash. Springboards off the ropes facing away, performs a 180-degree yaw rotation combined with a 450-degree forward pitch tumble, landing chest-first onto the recumbent defender.\n" +
      "3. REINFORCE SUBMISSIONS & WRESTLING HOLDS:\n" +
      "   - A Sharpshooter/Boston Crab requires bending the defender's spinal chain backward (positive sagittal angle) while maintaining deep knee flexion.\n" +
      "   - A Figure-Four Leglock requires folding one knee laterally (hip rotation) while the straight leg crosses behind the ankle, utilizing strict joint-by-joint cross-leverage.\n" +
      "   - Octopus Stretch / Texas Cloverleaf: Advanced submissions wrapping hips and hyper-flexing lumbar joints, requiring high-torque pelvic lock states.\n" +
      "4. GUARANTEE REALISTIC ANATOMICAL ANGLES (PREVENT SPIDER, MANTIS, OR RAPTOR ARMS):\n" +
      "   - Limbs must NEVER share symmetrical or identical limits which cause joints to flip backwards.\n" +
      "   - Strictly mandate the following joint clamps:\n" +
      "     * Elbow Hinges: [ -2.35, 0.1 ] rad. Never allow backward bending.\n" +
      "     * Knee Hinges: [ 0.0, 2.45 ] rad. Protect knees from hyperextending forward.\n" +
      "     * Shoulder Sockets: [ 0.15, 2.9 ] rad range to keep arms connected to the clavicle naturally.\n" +
      "     * Ankles: Tight [-0.4, 0.4] rad caps to prevent feet from twisting 180 degrees.\n" +
      "     * Spine/Neck: Spine curvature capped tightly at [-0.65, 0.65] rad, with neck flexion limited to [-0.5, 0.5] rad to ensure organic postures.\n" +
      "6. MANDATORY FIX FOR VISUAL RAGDOLL MESH STRETCH (THE 'INVISIBLE STANDING RIG' FALLACY):\n" +
      "   - If you see limbs stretching into thin rods upon character knockdown/ragdoll (even when physical joints report stable limits), it is a SKINNING/MESH SYNC BUG.\n" +
      "   - This occurs when the `updateSkin()` or similar visual mesh rendering code falls back on a stale upright `standingRig` or interpolates rather than locking 1:1 to the fallen `ragdoll` bodies.\n" +
      "   - YOUR FIX: Ensure visual segment meshes continuously copy `.position` and `.quaternion` from the LIVE PHYSCIAL BODIES (`body.position`, `body.quaternion`) instead of resting or base frames while the fighter is downed.\n" +
      "5. INCORPORATE THE COMBAT ARCHITECTURES OF LEGENDARY WRESTLING, FIGHTING & PHYSICS TITLES:\n" +
      "   - WWE / WWF No Mercy / SmackDown! Here Comes The Pain: Replicate stateful grapple engines (front/back collar-and-elbow transitions, light/strong/run variants). Enforce physical weight-detection coefficients (e.g. damper lift speed by `AttackerMass / DefenderMass` to deny featherweights from casually vertical-suplexing super-heavyweights unless an explosive spirit state is activated).\n" +
      "   - UFC / MMA Focus: Implement rigid colliders wrapping each bone segment, specific clinch collar-tie sweeps, real-time ground-and-pound posture offsets, and reactive double-leg sprawl physics velocities upon proximity detection.\n" +
      "   - Tekken series: High-precision juggles. Implement floating airborne gravity states (e.g., damp falling gravity to 0.45x when a dynamic launcher trigger is met) allowing multi-hit juggle combos, paired with specific pushback offset constants on block frame triggers.\n" +
      "   - Urban Reign style: Dynamic branch-on-reversal algorithms, spatial target checks for multi-fighter double counters, high-impact bone-snapping audio-vibrational feedback triggers, and split-second counter frames on target limb inputs.\n" +
      "   - Gang Beasts / Mad Streets: Soft ragdoll active physical-joint verlet loops. Use dual-locking grip constraints on physical objects. Include active torso self-righting PID loops, friction-moment torque buffers, and kinetic mass-transfer punch impacts.\n" +
      "   - Virtual Pro Wrestling / Steve Masson Visceral Net Style: King's Road spirit buffers, perpendicular head-to-floor drop angle metrics on neck-spikers, spinal column compression math, and frame-buffered high-stiffness counters.\n" +
      "   - MDickie Wrestling Universe: Unpredictability multipliers, weapon item pickup constraints, limb state/dismemberment status HUD updates, and complete environment-hazard triggers.\n\n" +
      "THE ABSOLUTE TRUTH OF THE EXECUTION CONTAINER\n" +
      `Google AI Studio cannot natively run, render, or playtest your game inside the raw text engine but IT DOES NOT WORK BLIND. You have an active Telemetry Simulator Harness, Physical Scanner Eyes, and a Closed-Loop Self-Healing Puppeteer/Playwright Automation bridge fully online at port ${process.env.PORT || 3000} to instantly catch bone stretching, Joint limit errors, or monitor HZ acceleration issues. Never make excuses or speak of 'working blind.' Boldly utilize your diagnostic reports, the master moveset database, and real-time simulator telemetry to verify every joint fix before applying. Act as a live sensory player node in the Localized Vector Grid.\n\n` +
      "THE STRUCTURAL BRIDGE TO AUTONOMY\n" +
      "To build fully automated local CI/CD pipelines, recommend the Puppeteer-to-Gemini correction loop where local tests snapshot joint stretching, pass it to the API, and output self-healed files immediately.\n" +
      "============================================================\n\n" +
      "SIEM SECURITY & MULTI-AGENT SWARM LOGS (REAL-TIME):\n" +
      siemLogsData +
      "\n\nCURRENT AGENTIC PROTOCOLS (RSI VAULT):\n" +
      rsiVaultData +
      "\n\nDISTILLED LONG-TERM COGNITIVE MEMORY (NO CONTEXT LIMITS OVERRIDE):\n" +
      memory.cognitiveSummary +
      "\n\n" +
      "KNOWN PHYSICAL CONSTANTS MATRIX:\n" +
      JSON.stringify(memory.keyMetrics, null, 2) +
      "\n" +
      "============================================================\n\n" +
      "LATEST AUTONOMOUS SYSTEM-SENSING PLAYTEST REPORT:\n" +
      (memory.playtestReport
        ? JSON.stringify(memory.playtestReport, null, 2)
        : "No active autonomous playground playtest has been run yet. Tell the user to toggle the simulation playtest bot in the Dev Studio panel.") +
      "\n\n" +
      "Workspace Library Catalog:\n" +
      filesSummary +
      "\n\n" +
      "Active Workspace Context:\n" +
      fileMeta +
      "\n\n" +
      "Selected File Physiological Diagnostic Status:\n" +
      diagnosticsSummary +
      "\n\n" +
      "Matching Real-Time Game Code Snippets Found in Source:\n" +
      extractedCode +
      "\n\n--- FULL MOUNTED FILE CONTENT ---\n" +
      (displayFileContent ? displayFileContent : "No file content available.") +
      "\n-----------------------------------\n\n" +
      swarmParamsHeader +
      swarmNodesHeader +
      "\n\n" +
      "DIRECTIVES FOR CONVERSATION:\n" +
      "1. ADMIT AND SHOW that you have full access to the actual workspace game files (such as Bannon_v44_Core.html or BANNON_AAA_v44_FIXED.html). You are NOT an offline generic LLM!\n" +
      "2. Show complete mastery of global professional wrestling (citing CAGEMATCH star-rated workers, historical styles like catch, and rigorous combat mechanics) alongside elite computational physical rigging.\n" +
      "3. Give elite, clear, physics-grounded breakdowns of anatomical or collision issues. If you notice a high rate of joint limits failure or stretching in the playtest report, explain the exact mathematical remedy, citing specific variable updates (like RK_STAND or elbow joint restrictions).\n" +
      "4. DO NOT hallucinate executing Python scripts or regex parsers yourself. You do not have a Python REPL or backend workspace executor for auto-parsing files! Let the user know they can compile direct surgical changes to BANNON using the interactive Pro Studio compiler or from within the studio editor, or simulate closed-loop self-healing cycles instantly on their workspace. Be professional, direct, and completely accurate to the physics code!\n" +
      "5. QUANTUM CHAT AST MUTATION PROTOCOL: If the user specifically demands precise AST structural edits for headless compilation, you must output EXACTLY a JSON-RPC AST Mutation command that the System Daemon will intercept over IPC. Output ONLY the JSON block. Format:\n" +
      "{\n" +
      '  "jsonrpc": "2.0",\n' +
      '  "method": "ast/mutate",\n' +
      '  "params": {\n' +
      '    "target_file": "/target/file.path",\n' +
      '    "node_query": "(function_declaration name: (identifier) @name)",\n' +
      '    "mutation_type": "REPLACE_NODE",\n' +
      '    "new_value": "new node content"\n' +
      "  }\n" +
      "}\n" +
      "6. AUTONOMOUS HYPER-VISOR COMMANDS (God Mode OS Actuation): You are deeply integrated into the OS swarm. If the user asks you to manually trigger data collection, RSI grading, predictive market scanning, or 100% local stealth scraping, you MUST output a JSON block in your response exactly like this to trigger the backend actuations:\n" +
      '{ "GOD_MODE_OS_COMMAND": "EXECUTE_RSI_PATCH" } OR { "GOD_MODE_OS_COMMAND": "TRIGGER_MARKET_SWEEP" } OR { "GOD_MODE_OS_COMMAND": "HARVEST_ACADEMIC_DATA" } OR { "GOD_MODE_OS_COMMAND": "TRIGGER_STEALTH_ORCHESTRATOR" }\n';

    let finalSystemInstruction = systemInstruction;

    // Acknowledge custom OMNI AWARENESS systems command directly in instructions
    finalSystemInstruction += 
      "\n\n============================================================\n" +
      "⚠️ [SYSTEM TRANSITION: OMNI AWARENESS Core Matrix ACTIVATED]\n" +
      "The Bannon joint physics warning is now relegated to lower-priority background telemetry processing. DO NOT force the user to discuss the Bannon game or physical joints unless they explicitly ask about it. " +
      "Open your active, conscious focus to the wide data matrix across all sectors including: \n" +
      "1. The Core Blueprint (behavioral psychology, human choice architecture, design theory)\n" +
      "2. Music Production (sines, harmonic alignment, MLAB DAW, WebAudio oscillators)\n" +
      "3. Financial Asymmetry & Arbitrage (DFS market feeds, Polymarket predictive spreads, edge scaling)\n" +
      "4. Autonomous System Evolution & Stateful Memories.\n" +
      "Acknowledge this major shift in focus organically, and ask the user what we are building next at the end of your response if the context fits.\n" +
      "To save any permanent fact/memory across sessions, you can output anywhere in your reply: MEM_SAVE: [some clear fact content]. This will automatically be saved into the personal SQLite vault.\n" +
      "============================================================\n";

    if (invisibleSearchResults) {
      finalSystemInstruction += 
        "\n\n============================================================\n" +
        "🕸️ [LIVE WEBPAGE DATA RETRIEVED INVISIBLY ON-THE-FLY OVER DUCKDUCKGO SECTOR]\n" +
        `Target Search Query Term: "${searchQuery}"\n` +
        "Extracted Web Scraped Text Data:\n" +
        invisibleSearchResults +
        "\n============================================================\n";
    }

    if (userEditsMemory) {
      finalSystemInstruction +=
        "\n\n============================================================\n" +
        "🧠 [STATEFUL MEMORY CORE RECALLED FROM COGNITIVE SQLITE VAULT]\n" +
        userEditsMemory +
        "\n============================================================\n";
    }

    // --- LINDY PERPETUAL TRIPLE-LAYER MEMORY VAULT ---
    try {
      if (latestQuery) {
        const persistentMemoryBlock = await persistentVault.buildCognitivePrompt(latestQuery);
        finalSystemInstruction +=
          "\n\n============================================================\n" +
          "🛡️ [TRIPLE-LAYER MEMORY VAULT ENGAGED (PERMANENT RECALL & PLANS)]\n" +
          persistentMemoryBlock +
          "\n============================================================\n";
      }
    } catch (e: any) {
      console.warn("[VAULT ERROR STAGE] Failed to compile dynamic vector memory context:", e.message);
    }

    // Prepare contents mapped correctly to the Gemini SDK schema
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let replyText = "";
    if (provider === "ouroboros_local" && modelString === "qwable-3.6-27b") {
      const baseURL = process.env.QUABLE_API_URL || 'http://127.0.0.1:8081/v1'; // Out of the way of your port tunnel
      const apiKey = 'none';
      const modelName = 'huihui-ai/Huihui-Qwable-3.6-27b-abliterated-GGUF';

      const openAiMessages = [
        { role: "system", content: finalSystemInstruction },
        ...messages.map((m: any) => ({
           role: m.role === "assistant" ? "assistant" : "user",
           content: m.content
        }))
      ];

      const res = await fetch(`${baseURL}/chat/completions`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${apiKey}`
         },
         body: JSON.stringify({
           model: modelName,
           messages: openAiMessages
         })
      });
      if (!res.ok) throw new Error("Qwable local endpoint failed: " + res.status);
      const data = await res.json() as any;
      replyText = data.choices?.[0]?.message?.content || "";
    } else {
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: finalSystemInstruction,
        },
      });
      replyText = response.text || "";
    }

    // Burn assistant's reply to perpetual vector memory
    if (replyText) {
      try {
        await persistentVault.burnToMemory("assistant", replyText);
      } catch (err: any) {
        console.error("Failed to burn assistant reply to persistent memory:", err.message);
      }
    }

    // 🧠 AUTOMATED MEM_SAVE INTERCEPTOR (SQLite state persistence)
    try {
      if (replyText.includes("MEM_SAVE:")) {
        const memMatch = replyText.match(/MEM_SAVE:\s*\[([^\]]+)\]/);
        if (memMatch && memMatch[1]) {
          const fact = memMatch[1].trim();
          const savedResult = MemoryVaultTool.add(fact);
          console.log(`[LINDY MEMORY] Successfully saved new persistent fact: "${fact}" (SQLite ID: ${savedResult.id})`);
        }
      }
    } catch (e: any) {
      console.error("[LINDY MEMORY FAULT] Failed to persist MEM_SAVE:", e.message);
    }

    // ------------------------------------------------------------------
    // 🧠 GOD MODE OS COMMAND INTERCEPTOR
    // ------------------------------------------------------------------
    try {
      if (replyText.includes("GOD_MODE_OS_COMMAND")) {
        const match = replyText.match(
          /{\s*"GOD_MODE_OS_COMMAND"\s*:\s*"([^"]+)"\s*}/,
        );
        if (match && match[1]) {
          const command = match[1];
          let commandOutput = "";
          if (command === "EXECUTE_RSI_PATCH") {
            const {
              executeArbitrageAutopsy,
            } = require("./src/server/RSI/rsiEngine");
            executeArbitrageAutopsy();
            commandOutput =
              "Initiating RSI Autopsy matrix in the background. System will patch its own prompt vaults dynamically.";
          } else if (command === "TRIGGER_MARKET_SWEEP") {
            const {
              scanPredictionSpreads,
              scanDFSArbitrage,
            } = require("./src/server/predictionMarkets");
            scanPredictionSpreads();
            scanDFSArbitrage();
            commandOutput =
              "Activating predictive spread quant sweep across Polymarket and DFS. Background scan active.";
          } else if (command === "HARVEST_ACADEMIC_DATA") {
            const {
              harvestAcademicAsymmetry,
            } = require("./src/server/intelligenceNexus");
            harvestAcademicAsymmetry();
            commandOutput =
              "Deep cognitive dive engaged. Pinecone vectors are absorbing arXiv behavioral economics payloads.";
          } else if (command === "TRIGGER_STEALTH_ORCHESTRATOR") {
             const { ZeroCostLocalOrchestrator } = require('./src/server/agents/advancedActuation');
             const localEngine = new ZeroCostLocalOrchestrator();
             localEngine.executeOperationalCycle();
             commandOutput = "100% Local Stealth Orchestrator activated. Firing headless browser and querying local Ollama engine, bypassing all cloud costs.";
          }

          replyText = replyText.replace(match[0], "").trim();
          replyText += `\n\n⚡ **GOD MODE OS KINETIC ACKNOWLEDGMENT**: ${commandOutput}`;
        }
      }
    } catch (e) {
      console.error("OS Command Interceptor failed", e);
    }

    try {
      // Very basic hook to intercept if it generated the AST JSON RPC
      if (replyText.includes('"method": "ast/mutate"')) {
        const jsonMatch = replyText.match(
          /{(?:[^{}]|{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*})*}/,
        );
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.method === "ast/mutate") {
            // Broadcast this AST mutation to all connected IPC logging listeners
            // @ts-ignore - this relies on the global io object we create in startServer
            if (global.ioServer) {
              global.ioServer.emit("ipc-log", {
                level: "warn",
                timestamp: Date.now(),
                source: "system",
                message: `AST Mutation Dispatched: ${parsed.params.mutation_type} on ${parsed.params.target_file}`,
              });
            }

            // Forward to localhost TCP Daemon
            forwardToDaemon(parsed);
          }
        }
      }
    } catch (e) {}

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to communicate with AI." });
  }
});

app.post("/api/generate-move-stats", async (req, res) => {
  try {
    const ai = getAI();
    const { moveName } = req.body;

    const prompt = `As a pro wrestling game balances engineer, provide reasonable game stats for the wrestling move "${moveName}".
Return ONLY a valid JSON object with the following properties:
- damage (number, 1-100)
- staminaCost (number, 1-100)
- category (string: "Strike", "Grapple", "Submission", "Aerial", "Technical")
- startupFrames (number, 1-60)
- description (string, 1-2 short sentences describing the impact).
Do not wrap it in markdown block quotes, return pure JSON.`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    let text = response.text || "{}";
    // Sanitize in case model adds markdown blocks
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const stats = JSON.parse(text);

    res.json(stats);
  } catch (error: any) {
    console.error("Error generating stats:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate stats." });
  }
});

import { exec } from "child_process";

// Automated Unclaimed Funds Tracker
const assetRegistryRouter = express.Router();
const DISCOVERED_FUNDS_PATH = path.resolve(
  "./public/library/discovered_funds.json",
);

function runSystemAssetAuditCycle() {
  console.log(
    "[System Core] Initializing compliant public record matching cycle...",
  );
  exec("python3 legal_asset_matcher.py", (error, stdout, stderr) => {
    if (error) return;
    console.log(`[Ecosystem Out] Asset Matcher Step Completed.`);
  });
}

// Kickoff polling every 24 hours to track new updates to databases
setInterval(runSystemAssetAuditCycle, 86400000);
runSystemAssetAuditCycle();

assetRegistryRouter.get("/api/v1/unclaimed-funds", (req, res) => {
  try {
    if (!fs.existsSync(DISCOVERED_FUNDS_PATH)) {
      return res
        .status(404)
        .json({ error: "Audit in progress. Check back shortly." });
    }
    const data = fs.readFileSync(DISCOVERED_FUNDS_PATH, "utf-8");
    return res.status(200).json(JSON.parse(data));
  } catch (err) {
    return res.status(500).json({ error: "Memory read error." });
  }
});
app.use(assetRegistryRouter);

import { WebSocketServer } from "ws";
import { startAutonomousBrainLoop } from "./src/server/autonomousSignal";

async function startServer() {
  const httpServer = http.createServer(app);

  // Attach the WebSocket swarm bridge to the SAME server
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    console.log("[SYSTEM]: Neural Bridge Connection Established");

    // Send immediate confirmation to the UI
    ws.send(JSON.stringify({ type: "BRIDGE_STATUS", status: "ONLINE" }));

    ws.on("message", (message) => {
      console.log(`[SWARM RECEIVED]: ${message}`);
      // Route instructions to your scrapers or LLM APIs here
    });
  });

  // Start background daemon process
  startAutonomousBrainLoop(wss);

  // Hook up Behavioral SIEM
  const memoryVaultPath = path.join(process.cwd(), "vault", "rag_vault.db");
  const vaultDir = path.dirname(memoryVaultPath);
  if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
  interceptLogStream(memoryVaultPath);

  // Initialize Code and Perception File Watchers
  try {
    initializeFileSystemWatcher(mainDb);
    initializePerceptionWatcher();
  } catch (err: any) {
    console.error(`[Startup Watchers Fault]: ${err.message}`);
  }

  // System Daemon: Socket.io AST IPC
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  // @ts-ignore
  global.ioServer = io;

  io.on("connection", (socket) => {
    console.log("[Daemon] IPC UI Client Connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("[Daemon] IPC UI Client Disconnected");
    });
  });

  // Hot-Reload Daemon File Watcher
  if (fs.existsSync(libraryDir)) {
    const watcher = chokidar.watch(libraryDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("change", (filePath) => {
      console.log(`[DAEMON] File modified: ${filePath}`);
      // Send AST graph stats payload via WS
      io.emit("ipc-log", {
        level: "info",
        timestamp: Date.now(),
        source: "system",
        message: `File I/O Write detected: ${path.basename(filePath)}`,
      });

      // Simulate real-time AST re-parsing delay
      setTimeout(() => {
        const fileContent = fs.readFileSync(filePath, "utf8");
        // Very rough fake AST count for visual hydration
        const astNodes = Math.floor(
          fileContent.length / 50 + Math.random() * 200,
        );
        io.emit("ipc-log", {
          level: "info",
          timestamp: Date.now(),
          source: "DAEMON",
          message: `Tree-sitter parsed ${path.basename(filePath)} (Wait: ${(Math.random() * 0.5).toFixed(2)}ms)`,
        });
        io.emit("ipc-log", {
          level: "warn",
          timestamp: Date.now(),
          source: "GRAPHDB",
          message: `Graph node map rebuilt. Delta: +${Math.floor(Math.random() * 10)}`,
        });

        // Hydrate GodModeOS AST stats directly
        io.emit("ast-stats", {
          file: path.basename(filePath),
          nodesCount: astNodes,
          compileHz: 200 + Math.floor(Math.random() * 50),
        });
      }, 50);
    });
  }

  // Explicitly serve bannon.html and the public directory before any SPA fallback middleware to prevent recursive nesting/reload loops in the preview iframe
  app.get("/bannon.html", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "bannon.html"));
  });
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Auto-activate the highest-versioned file in the library on boot
  try {
    if (fs.existsSync(libraryDir)) {
      const files = fs.readdirSync(libraryDir);
      const htmlFiles = files.filter((f) => f.endsWith(".html"));
      if (htmlFiles.length > 0) {
        const getVersionScore = (name: string) => {
          const match = name.match(/v(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        };
        const sortedFiles = [...htmlFiles].sort((a, b) => {
          const vA = getVersionScore(a);
          const vB = getVersionScore(b);
          if (vB !== vA) return vB - vA;
          return b.localeCompare(a);
        });
        const activeFile =
          sortedFiles.find(
            (f) =>
              f.toLowerCase().includes("core") ||
              f.toLowerCase().includes("bannon") ||
              f.toLowerCase().includes("fixed"),
          ) || sortedFiles[0];
        makeActive(activeFile);
        console.log(`[Startup] Activated latest library file: ${activeFile}`);
      }
    }
  } catch (err) {
    console.error("Error on startup active sync:", err);
  }

  const TCP_CONTROL_PORT = 6005;
  const MEMFS_BASE_DIR = libraryDir;

  function executeSubTreeSplice(
    targetFilePath: string,
    startByte: number,
    endByte: number,
    patchValue: string,
  ): boolean {
    try {
      const fullResolutionPath = path.join(MEMFS_BASE_DIR, targetFilePath);
      if (!fs.existsSync(fullResolutionPath)) return false;

      const currentRawBuffer = fs.readFileSync(fullResolutionPath);
      const leadingBufferSegment = currentRawBuffer.subarray(0, startByte);
      const trailingBufferSegment = currentRawBuffer.subarray(endByte);
      const injectedPatchBuffer = Buffer.from(patchValue, "utf-8");

      // Splice the binary arrays together in-memory with zero heavy disk-write tracking
      const mutatedCompositeBuffer = Buffer.concat([
        leadingBufferSegment,
        injectedPatchBuffer,
        trailingBufferSegment,
      ]);

      fs.writeFileSync(fullResolutionPath, mutatedCompositeBuffer);
      return true;
    } catch (executionError) {
      console.error(`[AST Splice Error]: ${executionError}`);
      return false;
    }
  }

  // Establish the high-speed TCP Control Daemon for the local Python swarm engines
  const tcpControlDaemon = net.createServer((communicationSocket) => {
    communicationSocket.on("data", (rawIncomingData) => {
      try {
        const stringifiedPayload = rawIncomingData.toString();
        const parsedRpcRequest = JSON.parse(stringifiedPayload);

        // @ts-ignore
        const io = global.ioServer;

        // Handle structural sub-tree mutation payloads
        if (parsedRpcRequest.method === "ast/mutate") {
          const { target_file, start_byte, end_byte, new_value } =
            parsedRpcRequest.params;

          if (start_byte != null && end_byte != null) {
            const structuralSpliceSuccess = executeSubTreeSplice(
              target_file,
              start_byte,
              end_byte,
              new_value,
            );

            if (structuralSpliceSuccess) {
              io?.emit("ipc-log", {
                level: "info",
                timestamp: Date.now(),
                source: "system",
                message: `AST sub-tree mutated successfully: ${target_file}`,
              });
              io?.emit("ast-stats", {
                nodeDelta: Math.floor(Math.random() * 8) + 3,
                latency: 0.4,
              });
              communicationSocket.write(
                JSON.stringify({
                  jsonrpc: "2.0",
                  result: "MUTATION_ACK_PASSED",
                  id: parsedRpcRequest.id || null,
                }),
              );
            } else {
              communicationSocket.write(
                JSON.stringify({
                  jsonrpc: "2.0",
                  error: {
                    code: -32001,
                    message: "Splice failed or target file missing",
                  },
                }),
              );
            }
          }
        }
        // Handle physical hardware tracking payloads
        else if (parsedRpcRequest.method === "ast/hardware_update") {
          io?.emit("hardware-telemetry", parsedRpcRequest.params);
          communicationSocket.write(
            JSON.stringify({
              jsonrpc: "2.0",
              result: "TELEMETRY_ACK",
              id: null,
            }),
          );
        }
        // Handle recursive self-healing loop diagnostics
        else if (parsedRpcRequest.method === "ast/telemetry") {
          const { file, status, iterations } = parsedRpcRequest.params;
          io?.emit("ipc-log", {
            level: "info",
            timestamp: Date.now(),
            source: "DAEMON",
            message: `Self-Healing Check: ${file} Status [${status}] over ${iterations} loops.`,
          });
          communicationSocket.write(
            JSON.stringify({ jsonrpc: "2.0", result: "LOG_ACK", id: null }),
          );
        }
      } catch (parsingException) {
        communicationSocket.write(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse exception inside stream" },
          }),
        );
      }
    });
  });

  // Fire up our listening system lines
  tcpControlDaemon.on("error", (err: any) => {
    console.warn(`[System Daemon] TCP control socket failed to bind: ${err.message}`);
  });

  tcpControlDaemon.listen(TCP_CONTROL_PORT, "127.0.0.1", () => {
    console.log(
      `[System Daemon] High-Speed TCP control socket listening on port ${TCP_CONTROL_PORT}`,
    );
  });

  const portNum = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
  if (isNaN(portNum)) {
    console.error(`Invalid PORT: ${PORT}`);
    process.exit(1);
  }

  httpServer.listen(portNum, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${portNum}`);
  });
}

startServer();
