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

app.get("/api/bridge/status"app.get("/api/bridge/status"app.get("/api/bridge/status", (req, res) => {
