import express from "express";
import path from "path";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { BannonMemory } from "./src/lib/mem0";
import { geminiRouter } from "./server/gemini";
import { githubRouter } from "./server/github";
import { workspaceRouter } from "./server/workspace";
import { telegramRouter } from "./server/telegram";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

app.use('/api/gemini', geminiRouter);
app.use('/api/github', githubRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api/telegram', telegramRouter);
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.get('/game.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

import { BannonBackend } from "./server/bannonLogic";
import * as UniverseMode from "./server/modes/universe";
import * as CareerMode from "./server/modes/career";
import * as GodWithinMode from "./server/modes/godWithinEndgame";
import * as GMMode from "./server/modes/gm";
import * as BackyardMode from "./server/modes/backyard";
import * as SandboxMode from "./server/modes/sandbox";
import * as BackstageMode from "./server/modes/backstage";

app.post("/api/bannon/stitch", (req, res) => {
  const { segments } = req.body;
  const result = BannonBackend.stitchMoveSegments(segments);
  res.json({ result });
});

app.post("/api/bannon/archetype", (req, res) => {
  const { archetype, currentStats } = req.body;
  const result = BannonBackend.applyArchetypeStats(archetype, currentStats);
  res.json({ result });
});

app.post("/api/bannon/injury", (req, res) => {
  const { injuries } = req.body;
  const result = BannonBackend.calculateInjuryPenalty(injuries);
  res.json({ result });
});

app.post("/api/bannon/story", (req, res) => {
  const { node } = req.body;
  const result = BannonBackend.processStoryNode(node);
  res.json({ result });
});

app.post("/api/bannon/strength", (req, res) => {
  const { game, playerInput } = req.body;
  const result = BannonBackend.calculateStrengthOutcome(game, playerInput);
  res.json({ result });
});

app.post("/api/bannon/archetype", (req, res) => {
  const { archetype, currentStats } = req.body;
  const result = BannonBackend.applyArchetypeStats(archetype, currentStats);
  res.json({ result });
});

app.post("/api/bannon/strength", (req, res) => {
  const { game, playerInput } = req.body;
  const result = BannonBackend.calculateStrengthOutcome(game, playerInput);
  res.json({ result });
});



// Mode API Routes
app.post("/api/bannon/mode/universe", (req, res) => {
  res.json({ result: UniverseMode.initUniverseMode() });
});

app.post("/api/bannon/mode/career", (req, res) => {
  res.json({ result: CareerMode.initCareerMode() });
});

app.post("/api/bannon/mode/godwithin", (req, res) => {
  res.json({ result: GodWithinMode.initGodWithinMode() });
});

app.post("/api/bannon/mode/gm", (req, res) => {
  res.json({ result: GMMode.initGMMode() });
});

app.post("/api/bannon/mode/backyard", (req, res) => {
  res.json({ result: BackyardMode.initBackyardMode() });
});

app.post("/api/bannon/mode/sandbox", (req, res) => {
  res.json({ result: SandboxMode.initSandboxMode() });
});

app.post("/api/bannon/mode/backstage", (req, res) => {
  res.json({ result: BackstageMode.initBackstageMode() });
});

app.get("/api/bridge/status", (req, res) => {
  res.json({ status: "active", engineConnected: wss.clients.size > 0 });
});

// LiveLink memory storage for dynamic C++ ingestion & hot-reload
let liveLinkConfig = {
  superstar: null as any,
  arena: null as any,
  titantronDecal: null as any,
  timestamp: new Date().toISOString()
};

import fs from "fs";

app.get("/api/engine/status", (req, res) => {
  let patchLog = "";
  try {
    patchLog = fs.readFileSync(path.join(process.cwd(), "PATCH_LOG.md"), "utf8");
  } catch (e) {
    patchLog = "No patch log found.";
  }
  
  res.json({
    status: "active",
    version: "V159.2",
    loadedFederations: ["Indies", "Pride_MMA", "BookLore"],
    patchLog
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/livelink/config", (req, res) => {
  res.json(liveLinkConfig);
});

// Broadcast config updates from client to in-game Unreal instances
app.post("/api/livelink/update", (req, res) => {
  const { type, payload } = req.body;
  if (type === "SYNC_SUPERSTAR_DNA") {
    liveLinkConfig.superstar = payload;
  } else if (type === "SYNC_ARENA") {
    liveLinkConfig.arena = payload;
  } else if (type === "INJECT_TITANTRON_DECAL") {
    liveLinkConfig.titantronDecal = payload;
  } else if (type === "SKELETAL_BONE_SCALING") {
    (liveLinkConfig as any).skeletalBoneScaling = payload;
    console.log("[SKELETAL_BONE_SCALING] Received calibration offsets:", payload.calibrationOffsets);
  }
  liveLinkConfig.timestamp = new Date().toISOString();

  // Broadcast to all active LiveLink WebSocket connections
  const messageStr = JSON.stringify({ event: "LIVE_LINK_HOT_RELOAD", data: liveLinkConfig });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(messageStr);
    }
  });

  res.json({ success: true, message: "LiveLink hot-reload update broadcasted", config: liveLinkConfig });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade for LiveLink clients
server.on("upgrade", (request, socket, head) => {
  const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : "";
  if (pathname === "/livelink") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    // Let other handlers or Vite websocket pass through
  }
});

let liveLinkWS: any = null;

wss.on("connection", (ws) => {
  console.log("LiveLink WebSocket Client connected to Unreal hot-reloading loop.");
  liveLinkWS = ws;
  // Send immediate current state upon handshake
  ws.send(JSON.stringify({ event: "LIVE_LINK_INITIAL_SYNC", data: liveLinkConfig }));
  
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'INPUT') {
        console.log("Bridging Input to Unreal Engine:", data);
        if (liveLinkWS) {
          liveLinkWS.send(JSON.stringify({ type: 'ENGINE_INPUT', ...data }));
        }
      }
    } catch (e) {
      console.error("Failed to parse LiveLink message:", e);
    }
    console.log("Received LiveLink message from Unreal Engine client:", msg.toString());
  });

  ws.on("close", () => {
    liveLinkWS = null;
  });
});

async function startServer() {
  try {
    // await BannonMemory.initializeConstants();
  } catch (e) {
    console.error('Failed to initialize constants, continuing without them...', e);
  }
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} with LiveLink WebSocket gateway active`);
  });
}

startServer();
