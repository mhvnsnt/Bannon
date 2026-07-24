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

app.post('/api/quable-build', async (req, res) => {
    const { prompt } = req.body;
    
    // Target the remote-local LLM endpoint (RunPod, Vast.ai, or local rig)
    const QUABLE_ENDPOINT = process.env.QUABLE_LLM_URL || 'http://127.0.0.1:11434/api/generate';
    
    try {
        const proxyResponse = await fetch(QUABLE_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.QUABLE_API_KEY}`
            },
            body: JSON.stringify({
                model: "qwable-abliterated",
                prompt: prompt,
                max_tokens: 4096,
                temperature: 0.1
            })
        });

        const data = await proxyResponse.json();
        res.json({ message: "Quable execution successful", code: data.choices[0].text });
    } catch (error) {
        res.status(500).json({ message: "Remote GPU unreachable", error: error.message });
    }
});

app.get("/api/bridge/status", (req, res) => {
