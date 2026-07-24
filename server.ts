import dgram from "dgram";
import { MemoryManager } from "./server/memory_manager";
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

app.get('/api/bridge/memory', async (req, res) => {
    try {
        const brickLog = await fs.promises.readFile(path.join(process.cwd(), 'CLAUDE.md'), 'utf-8').catch(() => "CLAUDE.md not found");
        res.json({ brickLog });
    } catch(e) {
        res.json({ brickLog: "Error reading memory" });
    }
});

app.post('/api/quable-build', async (req, res) => {
    const { prompt, includeContext } = req.body;
    
    // Target your free local server
    const LOCAL_AI_ENDPOINT = process.env.QUABLE_LLM_URL || 'http://127.0.0.1:11434/api/generate';
    
    try {
        const systemContext = includeContext !== false ? await MemoryManager.getEvolvingContext() : "";
        const fullPrompt = `${systemContext}\n\nUser Directive: ${prompt}`;

        const proxyResponse = await fetch(LOCAL_AI_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "qwable-abliterated",
                prompt: fullPrompt,
                stream: true,
                options: { temperature: 0.1, num_ctx: 32000 }
            })
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        if (!proxyResponse.ok) {
            throw new Error(`HTTP error! status: ${proxyResponse.status}`);
        }
        
        let fullResponse = "";
        
        if (proxyResponse.body) {
            const reader = proxyResponse.body.getReader();
            const decoder = new TextDecoder("utf-8");
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for(const line of lines) {
                   if (line.trim()) {
                      try {
                          const data = JSON.parse(line);
                          if (data.response) fullResponse += data.response;
                          res.write(`data: ${JSON.stringify(data)}\n\n`);
                      } catch (e) {}
                   }
                }
            }
        }
        
        res.write(`data: [DONE]\n\n`);
        res.end();
        
        await MemoryManager.logInteraction(prompt, fullResponse);

    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
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
        console.log("Bridging God Mode OS Input to C++ UDP Port 4001:", data);
        const udpClient = dgram.createSocket('udp4');
        const payload = Buffer.from(JSON.stringify(data));
        udpClient.send(payload, 4001, '127.0.0.1', (err) => {
            if (err) console.error("Error sending God Mode command to C++:", err);
            udpClient.close();
        });
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


// IPC Bridge: UDP server to receive telemetry from C++ engine
const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  try {
    const telemetryData = JSON.parse(msg.toString());
    // Broadcast telemetry to all connected HTML UI WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({ event: 'CPP_TELEMETRY', data: telemetryData }));
      }
    });
  } catch(e) {
    console.error("Failed to parse UDP telemetry from C++ Engine:", e);
  }
});
udpServer.on('error', (err) => {
  console.log(`UDP server error:\n${err.stack}`);
  udpServer.close();
});
udpServer.bind(4000, () => {
  console.log("UDP IPC Bridge listening for C++ telemetry on port 4000");
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
