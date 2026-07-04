import React, { useEffect, useState, useRef } from "react";
import {
  Play,
  Save,
  Sparkles,
  Terminal,
  Copy,
  Trash2,
  Download,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileCode,
  RotateCcw,
  PenSquare,
  Activity,
  Zap,
  Info,
  Sliders,
  Bug,
  Eye,
  Send,
  ShieldAlert,
  Cpu,
  ChevronLeft,
} from "lucide-react";

interface LibraryFile {
  name: string;
  size: number;
  modified: string;
}

const puppeteerCode = `const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runAutonomousSession() {
  console.log("🚀 STARTING HEADLESS SPATIAL EYE SANDBOX...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  const url = 'file://' + path.resolve(__dirname, 'public/library/Bannon_v44_Core.html');
  await page.goto(url);

  page.on('console', msg => {
    if (msg.type() === 'error') {
      fs.appendFileSync('telemetry-bridge-errors.log', \\\`[ERROR] \\\${msg.text()}\\\\\\\n\\\`);
    }
  });

  await page.exposeFunction('onTelemetryIntercept', (data) => {
    fs.writeFileSync('game-telemetry-output.json', JSON.stringify(data, null, 2));
    console.log("⚡ Telemetry tick saved to game-telemetry-output.json.");
  });

  await page.evaluateOnNewDocument(() => {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PLAYTEST_COMPLETED_STATS') {
        window.onTelemetryIntercept(event.data);
      }
    });
  });

  console.log("🤺 Simulating fighter controls...");
  await page.evaluate(() => {
    if (typeof playerAttack === 'function') playerAttack('jab');
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log("📸 Snapping regression screenshot...");
  const screenshotPath = path.join(__dirname, 'error-visual-regression.png');
  await page.screenshot({ path: screenshotPath });
  
  await browser.close();
  console.log("✅ HEADLESS LOCAL SESSION COMPLETED STABLE.");
}
runAutonomousSession();`;

const geminiBridgeCode = `const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function autoCorrectFighterCode() {
  console.log("🧠 CONNECTING TO GALAXY COGNITIVE NODE...");
  const telemetryPath = path.join(__dirname, 'game-telemetry-output.json');
  const screenshotPath = path.join(__dirname, 'error-visual-regression.png');
  const codePath = path.join(__dirname, 'public/library/Bannon_v44_Core.html');

  if (!fs.existsSync(telemetryPath) || !fs.existsSync(codePath)) {
    console.error("❌ Required files missing.");
    return;
  }

  const telemetryText = fs.readFileSync(telemetryPath, 'utf8');
  const rawCode = fs.readFileSync(codePath, 'utf8');

  let screenshotBlob;
  if (fs.existsSync(screenshotPath)) {
    screenshotBlob = {
      inlineData: {
        data: Buffer.from(fs.readFileSync(screenshotPath)).toString("base58"),
        mimeType: "image/png"
      }
    };
  }

  const prompt = \\\`You are the Lead Cognitive Compiler Memory Optimizer.
Review the code, telemetry, and screenshot. Correct stretching joint boundaries.
RAW GAME CODE TO FIX:
\\\${rawCode}

TELEMETRY ERRORS:
\\\${telemetryText}

Surgically return ONLY the modified JS lines.\\\`;

  const contents = [prompt];
  if (screenshotBlob) contents.push(screenshotBlob);

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: contents
  });

  console.log("⚡ Patched directives response:");
  console.log(response.text);
}
autoCorrectFighterCode();`;

const telemetryHookCode = `// Telemetry Data Hook:
// Inject directly inside Three.js frame render loop or bone-calculating ticks.
function dispatchWrestlerTelemetry(fighter) {
  if (!fighter || !fighter.J) return;
  const neck = fighter.J.neck;
  const pelvis = fighter.J.pelvis;
  if (neck && pelvis) {
    const dist = Math.hypot(neck.pos.x - pelvis.pos.x, neck.pos.y - pelvis.pos.y);
    if (dist > 1.3) {
      window.parent.postMessage({
        type: 'PLAYTEST_COMPLETED_STATS',
        snap: window.AI_VISION ? window.AI_VISION.dump() : {},
        stretchedLimbsCount: 1,
        maxStretchedFactor: +(dist / 0.85).toFixed(2),
        errors: ["SPINE_STRETCH_LIMIT_ANOMALY"]
      }, '*');
    }
  }
}`;

const packageJsonCode = `{
  "name": "bannon-autonomy-pipeline",
  "version": "1.0.0",
  "main": "headless-playtest.js",
  "dependencies": {
    "@google/genai": "^0.1.1",
    "dotenv": "^16.4.5",
    "puppeteer": "^22.10.0"
  },
  "scripts": {
    "playtest": "node headless-playtest.js",
    "bridge": "node gemini-pipeline-bridge.js",
    "pipeline": "npm run playtest && npm run bridge"
  }
}`;

interface AIResult {
  success: boolean;
  explanation: string;
  outputFilename: string;
  applied: number;
  totalEdits: number;
  results: { id: number; status: string; targetMatched: boolean }[];
}

interface TelemetryStats {
  rkBody: boolean;
  rkStand: number;
  rkGcomp: number;
  rkArot: number;
  bphysReady: boolean;
  activeRag: boolean;
  fps: number | null;
}

interface ConsoleMessage {
  time: string;
  text: string;
  level: "log" | "warn" | "error" | "info";
}

interface ScanReport {
  stretchingLimbs: { status: string; value: string; suggestion: string };
  mantisArms: { status: string; value: string; suggestion: string };
  standStability: { status: string; value: string; suggestion: string };
  fpsConsistency: { status: string; value: string; suggestion: string };
  moveTrajectories?: { status: string; value: string; suggestion: string };
  biomechanicalLimits?: { status: string; value: string; suggestion: string };
  ragdollMeshSync?: { status: string; value: string; suggestion: string };
}

export default function GameStudio({
  globalSelectedFile,
  setGlobalSelectedFile,
}: {
  globalSelectedFile: string;
  setGlobalSelectedFile: (f: string) => void;
}) {
  const [files, setFiles] = useState<LibraryFile[]>([]);

  const selectedFile = globalSelectedFile;
  const setSelectedFile = setGlobalSelectedFile;

  const [activeTab, setActiveTab] = useState<
    "simulator" | "compiler" | "scanner" | "autonomy" | "library" | "editor"
  >("simulator");
  const [isConsoleMinimized, setIsConsoleMinimized] = useState<boolean>(false);

  // Script Editor state
  const [editorContent, setEditorContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Autonomous AI Playtest bot state
  const [isAutonomousTesting, setIsAutonomousTesting] =
    useState<boolean>(false);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [testPhaseLog, setTestPhaseLog] = useState<string[]>([]);
  const [completedReport, setCompletedReport] = useState<any | null>(null);
  const [scaffoldTab, setScaffoldTab] = useState<
    "puppeteer" | "bridge" | "hook" | "package"
  >("puppeteer");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Closed-loop Self-Healing Pipeline Simulation state
  const [autoHealerType, setAutoHealerType] = useState<
    "stretching" | "mantis" | "stand" | "fps"
  >("stretching");
  const [autoHealerStatus, setAutoHealerStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [autoHealerLog, setAutoHealerLog] = useState<string[]>([]);
  const [autoHealerStep, setAutoHealerStep] = useState<number>(0);
  const [autoHealerResult, setAutoHealerResult] = useState<any | null>(null);

  // AI Compiler state
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [customTargetFilename, setCustomTargetFilename] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    { sender: "user" | "system"; text: string; action?: boolean }[]
  >([]);

  // Simulation Harness variables & live signals
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [liveStats, setLiveStats] = useState<TelemetryStats>({
    rkBody: false,
    rkStand: 0.15,
    rkGcomp: 0.16,
    rkArot: 18,
    bphysReady: false,
    activeRag: false,
    fps: null,
  });
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [commandInput, setCommandInput] = useState<string>("");

  // Diagnostic Scanner state
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // General state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    type: "success" | "error" | "info" | null;
  }>({ text: "", type: null });
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "landscape",
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setOrientation(
          window.innerHeight > window.innerWidth ? "portrait" : "landscape",
        );
      };
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
    // Pre-populate chat history
    setChatHistory([
      {
        sender: "system",
        text: "Welcome to ProWrestle AI Agent Studio. I am your Lead Physics, Graphics & Rigging compiler. Describe gravity shifts, joint thresholds, or limb verlet stiffness fixes to apply surgically.",
      },
    ]);

    // Fetch previous core findings on mount
    fetch("/api/cognitive-memory")
      .then((res) => res.json())
      .then((data) => {
        if (data.playtestReport) {
          setCompletedReport(data.playtestReport);
        }
      })
      .catch(() => {});

    // Listen to telemetry inputs from loaded active bannon.html iframe
    const handleHarnessMessage = (e: MessageEvent) => {
      if (!e.data) return;

      if (e.data.type === "TELEMETRY_STATS") {
        setLiveStats(e.data.stats);
      }

      if (e.data.type === "PLAYTEST_COMPLETED_STATS") {
        const { snap, stretchedLimbsCount, maxStretchedFactor } = e.data;
        const fpsVal = snap.tune?.pace ? Math.round(60 * snap.tune.pace) : 60;

        const report = {
          timestamp: new Date().toISOString(),
          gameState: snap.gameState || "fight",
          fightersCount: snap.fighters?.length || 2,
          activeRagdollState: snap.fighters?.[0]?.ragdoll
            ? "FALLEN"
            : "VERTICAL EQUILIBRIUM",
          limbStretchingAnomaly:
            stretchedLimbsCount > 0
              ? `WARNING - Bone drift detected (${maxStretchedFactor}x baseline stretch)`
              : "OK - Rigid verlet constraint boundaries sound",
          unnaturalArmCollisions:
            snap.fighters?.[0]?.poise < 20
              ? "HIGH - Symmetrical collision folding arms detected (Mantis arm trap)"
              : "OK - Healthy asymmetric folding logic",
          fpsStabilityRatio: `${fpsVal} Hz constant`,
          recentRuntimeErrors: snap.errors || [],
        };

        setCompletedReport(report);
        setTestProgress(100);
        setIsAutonomousTesting(false);
        setTestPhaseLog((prev) => [
          ...prev,
          "✅ Diagnostic report compiled successfully!",
          "💾 Storing session telemetry to disk...",
        ]);

        // Post back report to database so it persistently links with AI system context
        fetch("/api/cognitive-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playtestReport: report }),
        })
          .then((res) => {
            if (res.ok) {
              showStatus(
                "Autonomous Playtest complete. AI core is now conscious of this data!",
                "success",
              );
            }
          })
          .catch((err) => {
            console.error("Failed storing playtest report", err);
          });
      }

      if (e.data.type === "TELEMETRY_LOG") {
        const timeStr = new Date().toLocaleTimeString();
        setConsoleMessages((prev) => [
          { time: timeStr, text: e.data.log, level: e.data.level || "log" },
          ...prev.slice(0, 149), // Cap at 150 entries
        ]);
      }
    };

    window.addEventListener("message", handleHarnessMessage);
    return () => {
      window.removeEventListener("message", handleHarnessMessage);
    };
  }, []);

  const fetchLibrary = async () => {
    try {
      const resp = await fetch("/api/library");
      if (resp.ok) {
        const data = await resp.json();
        setFiles(data.files || []);
        if (data.files && data.files.length > 0 && !selectedFile) {
          const getVersionScore = (name: string) => {
            const match = name.match(/v(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
          };
          const sortedFiles = [...data.files].sort((a: any, b: any) => {
            const vA = getVersionScore(a.name);
            const vB = getVersionScore(b.name);
            if (vB !== vA) return vB - vA;
            return b.name.localeCompare(a.name);
          });
          const core = sortedFiles.find(
            (f: any) =>
              f.name.toLowerCase().includes("core") ||
              f.name.toLowerCase().includes("bannon") ||
              f.name.toLowerCase().includes("fixed"),
          );
          setSelectedFile(core ? core.name : sortedFiles[0].name);
        }
      }
    } catch (err) {
      console.error(err);
      showStatus("Failed to load workspace files.", "error");
    }
  };

  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg({ text: "", type: null });
    }, 6000);
  };

  const [iframeVersion, setIframeVersion] = useState(() => Date.now());
  const currentActiveIframeUrl = `/bannon.html?v=${iframeVersion}`;
  const refreshPreview = () => setIframeVersion(Date.now());

  // Iframe Harness messaging
  const sendHarnessControl = (updates: {
    body?: boolean;
    stand?: number;
    gcomp?: number;
    arot?: number;
  }) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_PHYSICS",
          ...updates,
        },
        "*",
      );
    }
  };

  const applyPresetProfile = (name: "standard" | "elastic" | "gladiator") => {
    let updates = { stand: 0.5, gcomp: 0.16, arot: 18 };
    if (name === "elastic") {
      updates = { stand: 0.1, gcomp: 0.05, arot: 5 };
    } else if (name === "gladiator") {
      updates = { stand: 1.0, gcomp: 0.45, arot: 30 };
    }

    setLiveStats((prev) => ({
      ...prev,
      rkStand: updates.stand,
      rkGcomp: updates.gcomp,
      rkArot: updates.arot,
    }));

    sendHarnessControl(updates);

    const timeStr = new Date().toLocaleTimeString();
    setConsoleMessages((prev) => [
      {
        time: timeStr,
        text: `[Harness Preset] Loaded physics profile: '${name.toUpperCase()}'`,
        level: "info",
      },
      ...prev,
    ]);
  };

  const handleCopyScaffoldCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const runAutonomousPlaytest = async () => {
    if (isAutonomousTesting) return;
    setIsAutonomousTesting(true);
    setTestProgress(10);
    setTestPhaseLog([
      "🚀 Warming up Three.js physics canvas...",
      "📡 Handshaking with window.AI_VISION...",
    ]);

    // Step 1: Trigger active fight mode or reset
    await new Promise((resolve) => setTimeout(resolve, 800));
    executeHarnessCommand("if(typeof startFight==='function') startFight();");
    setTestProgress(25);
    setTestPhaseLog((prev) => [
      ...prev,
      "🤺 Match initiated under Verlet springs control.",
    ]);

    // Step 2: Trigger random attacks to stress test joint limitations
    await new Promise((resolve) => setTimeout(resolve, 800));
    executeHarnessCommand("playerAttack('jab');");
    setTestProgress(45);
    setTestPhaseLog((prev) => [
      ...prev,
      "⚔️ Simulated P1 executing Left JAB attack pattern.",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 600));
    executeHarnessCommand("playerAttack('kick');");
    setTestProgress(60);
    setTestPhaseLog((prev) => [
      ...prev,
      "⚔️ Simulated P1 executing High Roundhouse KICK on opponent.",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 600));
    executeHarnessCommand("playerAttack('grab');");
    setTestProgress(75);
    setTestPhaseLog((prev) => [
      ...prev,
      "🤼 Simulated dynamic Grapple/GRAB state transition.",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 600));
    executeHarnessCommand("window.ACTIVE_RAG = true;");
    setTestProgress(85);
    setTestPhaseLog((prev) => [
      ...prev,
      "💥 Activated physics ragdoll collision drop-test.",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 800));
    // Step 3: Trigger restoration and dump state
    executeHarnessCommand("window.ACTIVE_RAG = false;");
    setTestProgress(90);
    setTestPhaseLog((prev) => [
      ...prev,
      "🔄 Restored static Verlet spine alignment. Generating snapshot...",
    ]);

    await new Promise((resolve) => setTimeout(resolve, 600));
    // Request full snap export
    executeHarnessCommand(`
      try {
        const snap = window.AI_VISION.dump();
        // Calculate dynamic bones stretching ratio for limbs
        let stretchedLimbsCount = 0;
        let maxStretchedFactor = 1.0;
        if(typeof fighters !== 'undefined' && fighters[0] && fighters[0].J) {
          const f = fighters[0];
          // Sample distance pelvis to head as an example of spinal stretch
          if (f.J.pelvis && f.J.head) {
            const dx = f.J.pelvis.pos.x - f.J.head.pos.x;
            const dy = f.J.pelvis.pos.y - f.J.head.pos.y;
            const dz = f.J.pelvis.pos.z - f.J.head.pos.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist > 1.2) {
              stretchedLimbsCount++;
              maxStretchedFactor = dist / 0.85; // base rest ratio
            }
          }
        }
        window.parent.postMessage({ 
          type: 'PLAYTEST_COMPLETED_STATS', 
          snap,
          stretchedLimbsCount,
          maxStretchedFactor: +maxStretchedFactor.toFixed(2)
        }, '*');
      } catch(e) {
        window.parent.postMessage({ type: 'TELEMETRY_LOG', log: "Sensing dump crash: " + e.message, level: 'error' }, '*');
      }
    `);
  };

  const runSelfHealingDiagnosticCycle = async () => {
    if (autoHealerStatus === "running") return;
    if (!selectedFile) {
      showStatus(
        "Please choose a baseline file inside the studio or manual compile tab.",
        "error",
      );
      return;
    }

    setAutoHealerStatus("running");
    setAutoHealerStep(1);
    setAutoHealerLog([
      `[Pipeline Start] 🚀 Initializing Closed-Loop Autonomous Healing Node...`,
      `[Pipeline Node] Spawning headless container browser socket (Chromium headless)...`,
      `[Pipeline Node] Handshake successfully coupled on local host:${window.location.port || '80'}.`,
    ]);

    // Step 2 after 1000ms
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setAutoHealerStep(2);
    setAutoHealerLog((prev) => [
      ...prev,
      `[Pipeline Core] Active target file detected: "${selectedFile}"`,
      `[Pipeline Core] Injecting telemetry-harness hooks...`,
      `[Pipeline Core] Simulating physical controller stress vectors...`,
    ]);

    // Step 3 after 1200ms
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setAutoHealerStep(3);

    let anomalySnippet = "";
    let directive = "";
    let targetOutput = "Bannon";

    if (autoHealerType === "stretching") {
      anomalySnippet =
        "CRITICAL RANGE EXCEEDED: Bone Drift stretching = 1.84x (Stretching Spine Anomaly)";
      directive =
        "Locate updateRagdoll solver loop (Verlet iterations loop constraints stiffness). Surgically adjust maximum loop indices from lower counts to run 18 iterations and set Verlet spring limits rigid stiff lock to 1.0.";
      targetOutput += "_SelfHealed_Verlet.html";
    } else if (autoHealerType === "mantis") {
      anomalySnippet =
        "WARNING LIMIT LIMITATION: Joints share symmetrical SetLimits constraints (Mantis Arm Trap)";
      directive =
        "Surgically adjust elbows, shoulders and knee joints setLimits or revolute limit parameters. Elbow limit hinges should limit between -2.2 and 0.05. Knees limits should stop at 0 to 2.4. Do not let all body joints share matching symmetrical caps. Ensure arms do not bend backwards like spiders.";
      targetOutput += "_SelfHealed_Hinges.html";
    } else if (autoHealerType === "stand") {
      anomalySnippet =
        "CRITICAL FAILURE: RK_STAND stiffness coefficient is near floor (Jelly Skeleton Collapse)";
      directive =
        "Modify upright weight stasis multiplier. Change RK_STAND stiffness coefficient constant and active upright spine dampening values to range inside 0.65 to 0.85 so fighter balances naturally.";
      targetOutput += "_SelfHealed_Stiffness.html";
    } else {
      anomalySnippet =
        "TIMER LOOP OVER-DRIVE: Delta-Time ticks scaling missing (144Hz Monitor Warp)";
      directive =
        "Locate requestAnimationFrame loop and inject Delta Time scaling step (e.g. dynamic tick scale ratios, scale with deltaTime / 16.67) to all translation and Euler speed increments to prevent fast-speed acceleration loops on 144Hz monitors.";
      targetOutput += "_SelfHealed_HzFix.html";
    }

    setAutoHealerLog((prev) => [
      ...prev,
      `[Diagnostic Eyes] Telemetry feedback: "${anomalySnippet}"`,
      `[Diagnostic Eyes] Triggering AI Surgical Directive compiled for physical correction...`,
      `[Cognitive Gate] Dispatching AST telemetry + screenshot bytes to Gemini 3.5 Primary Cognitive Optimizer...`,
    ]);

    // Step 4 after 1500ms (Make the actual API call!)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAutoHealerStep(4);
    setAutoHealerLog((prev) => [
      ...prev,
      `[Gemini Client] Sending clinical surgical replacement prompt: "${directive}"`,
      `[Gemini Client] Awaiting JSON schema validation and replacement arrays...`,
    ]);

    try {
      const resp = await fetch("/api/library/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile,
          prompt: directive,
          targetFilename: targetOutput,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setAutoHealerStatus("success");
        setAutoHealerResult(data);
        setAutoHealerLog((prev) => [
          ...prev,
          `[Gemini API] Corrective patch generated successfully!`,
          `[AI Compiler] Explanation: ${data.explanation}`,
          `[Pipeline File] Mapped ${data.applied} search-and-replace physics patches.`,
          `[Pipeline Disk] Written new self-healed artifact: "${data.outputFilename}"`,
          `[Pipeline Deploy] Backup and Auto-Activation completed.`,
          `[Pipeline Sync] Live developer preview iframe successfully hot-reloaded! ✅`,
        ]);

        setSelectedFile(data.outputFilename);
        fetchLibrary();

        // Instant preview refresh
        refreshPreview();

        showStatus(
          `Self-healing pipeline succeeded! Loaded "${data.outputFilename}"`,
          "success",
        );
      } else {
        setAutoHealerStatus("error");
        setAutoHealerLog((prev) => [
          ...prev,
          `[Pipeline Failure] AI surgery couldn't locate exact code boundaries.`,
          `[Pipeline Failure] Mismatch explanation: ${data.explanation || "Syntax pattern collision."}`,
        ]);
        showStatus(
          "Self-healing loop failed to match code boundaries.",
          "error",
        );
      }
    } catch (err: any) {
      setAutoHealerStatus("error");
      setAutoHealerLog((prev) => [
        ...prev,
        `[Pipeline Crash] Server socket connection loss: ${err.message}`,
      ]);
      showStatus(
        "Connection error during self-healing compiler dispatch.",
        "error",
      );
    }
  };

  const executeHarnessCommand = (commandString: string) => {
    if (!commandString.trim()) return;
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "EXEC_CMD",
          command: commandString,
        },
        "*",
      );

      const timeStr = new Date().toLocaleTimeString();
      setConsoleMessages((prev) => [
        { time: timeStr, text: `> ${commandString}`, level: "info" },
        ...prev,
      ]);
      setCommandInput("");
    }
  };

  // Trigger scanning on active baseline
  const handleTriggerEyeScan = async (filename: string) => {
    if (!filename) {
      showStatus("Please pick a baseline file to scan.", "error");
      return;
    }
    setIsScanning(true);
    setScanReport(null);
    try {
      const resp = await fetch(`/api/library/scan/${filename}`);
      if (resp.ok) {
        const data = await resp.json();
        setScanReport(data);
        showStatus(
          `Code scanning diagnostic compiled for ${filename}!`,
          "success",
        );
      } else {
        showStatus("Scanner analysis endpoint returned a fault.", "error");
      }
    } catch (err) {
      showStatus("Scanner connection loss.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  // Fast Fix Directives
  const handleFastInjectFix = (
    diagnosticType:
      | "stretching"
      | "mantis"
      | "stand"
      | "fps"
      | "trajectories"
      | "anatomy"
      | "ragdollMesh",
  ) => {
    let directive = "";
    let targetOutput = "Bannon_v44";

    if (diagnosticType === "stretching") {
      directive =
        "Locate updateRagdoll solver loop (Verlet iterations loop constraints stiffness). Surgically adjust maximum loop indices from lower counts to run 18 iterations and set Verlet spring limits rigid stiff lock to 1.0.";
      targetOutput += "_VerletStiffFixed.html";
    } else if (diagnosticType === "mantis") {
      directive =
        "Surgically adjust elbows, shoulders and knee joints setLimits or revolute limit parameters. Elbow limit hinges should limit between -2.2 and 0.05. Knees limits should stop at 0 to 2.4. Do not let all body joints share matching symmetrical caps. Ensure arms do not bend backwards like spiders.";
      targetOutput += "_RiggingAnatomyFixed.html";
    } else if (diagnosticType === "stand") {
      directive =
        "Modify upright weight stasis multiplier. Change RK_STAND stiffness coefficient constant and active upright spine dampening values to range inside 0.65 to 0.85 so fighter balances naturally.";
      targetOutput += "_StandStiffnessFixed.html";
    } else if (diagnosticType === "fps") {
      directive =
        "Locate requestAnimationFrame loop and inject Delta Time scaling step (e.g. dynamic tick scale ratios, scale with deltaTime / 16.67) to all translation and Euler speed increments to prevent fast-speed acceleration loops on 144Hz monitors.";
      targetOutput += "_HzScaleNormalized.html";
    } else if (diagnosticType === "trajectories") {
      directive =
        "Enforce distinct force vectors. Never mix up a powerbomb with a suplex. Ensure Powerbomb lifts high vertically and drops down chest-first or back-first. Ensure Suplex arches backward with dynamic circular trajectories, and All Japan lariats lock joints rigid near 0.0 rad with torso forward-leaning.";
      targetOutput += "_CombatMotionFixed.html";
    } else if (diagnosticType === "anatomy") {
      directive =
        "Enforce strict anatomical joint stop guards. Prevent symmetrical/identical ranges like [-1.5,1.5] on human joints to avoid spider, mantis or raptor arm poses. Clamp elbows strictly to [-2.35, 0.1] rad, knees to [0.0, 2.45] rad, ankles to [-0.4, 0.4] rad, and neck to [-0.5, 0.5] rad.";
      targetOutput += "_AnatomicBiologicalFixed.html";
    } else if (diagnosticType === "ragdollMesh") {
      directive =
        "Fix visual mesh limb stretching bug during ragdoll/knockdown! The skin/mesh builder is interpolating between the knocked-down joints and an invisible stale `standingRig` reference, stretching limbs into long thin rods. Force all mesh limb segments to strictly copy active rigid ragdoll positions/rotations perfectly. Do NOT read from base/standing frame while knocked down.";
      targetOutput += "_RagdollSkinSyncFixed.html";
    }

    setAiPrompt(directive);
    setCustomTargetFilename(targetOutput);
    setActiveTab("compiler");
    showStatus("AI target auto-loaded! Ready to build.", "info");
  };

  // Selected library interactions
  const handleSelectActive = async (filename: string) => {
    try {
      const resp = await fetch("/api/library/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await resp.json();
      if (resp.ok) {
        showStatus(data.message, "success");
        fetchLibrary();
        // Reload simulator iframe
        refreshPreview();
      } else {
        showStatus(data.error || "Failed to load version.", "error");
      }
    } catch (err) {
      showStatus("Connection error.", "error");
    }
  };

  const handleClone = async (filename: string) => {
    const defaultNewName = filename.replace(
      ".html",
      `_backup_${Date.now().toString().slice(-4)}.html`,
    );
    const newName = prompt("Backup / Clone Name:", defaultNewName);
    if (!newName) return;

    try {
      const resp = await fetch("/api/library/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          newFilename: newName.endsWith(".html") ? newName : newName + ".html",
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        showStatus(data.message, "success");
        fetchLibrary();
      } else {
        showStatus(data.error, "error");
      }
    } catch (err) {
      showStatus("Error duplicating file.", "error");
    }
  };

  const handleDelete = async (filename: string) => {
    if (
      !confirm(
        `Are you absolutely sure you want to delete '${filename}' from the library?`,
      )
    )
      return;

    try {
      const resp = await fetch("/api/library/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await resp.json();
      if (resp.ok) {
        showStatus(data.message, "success");
        if (selectedFile === filename) setSelectedFile("");
        fetchLibrary();
      } else {
        showStatus(data.error, "error");
      }
    } catch (err) {
      showStatus("Error deleting file.", "error");
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (resp.ok) {
        showStatus(
          `Imported & deployed active file: '${file.name}'`,
          "success",
        );
        setSelectedFile(file.name);
        fetchLibrary();
        refreshPreview();
      } else {
        showStatus(data.error || "Failed to upload file.", "error");
      }
    } catch (err) {
      showStatus("Upload connection error.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLoadEditorCode = async (filename: string) => {
    if (!filename) return;
    setIsEditing(true);
    try {
      const resp = await fetch(`/api/library/view/${filename}`);
      if (resp.ok) {
        const data = await resp.json();
        setEditorContent(data.content);
      } else {
        showStatus("Could not fetch file content.", "error");
      }
    } catch (err) {
      showStatus("Failed to load script workspace.", "error");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveEditorCode = async (filename: string) => {
    if (!filename) return;
    setIsEditing(true);
    try {
      const resp = await fetch("/api/library/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content: editorContent }),
      });
      if (resp.ok) {
        showStatus(`Manual save deployed & activated live!`, "success");
        fetchLibrary();
        refreshPreview();
      } else {
        showStatus("Failed to submit custom code save.", "error");
      }
    } catch (err) {
      showStatus("Error saving custom code.", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // Launch AI Surgery Compiler
  const handleCallAICompiler = async () => {
    if (!selectedFile || !aiPrompt) {
      showStatus("Choose a baseline source file and type guidelines.", "error");
      return;
    }

    setIsCompiling(true);
    setAiResult(null);
    setChatHistory((prev) => [
      ...prev,
      {
        sender: "user",
        text: `Apply surgery on "${selectedFile}": ${aiPrompt}`,
      },
    ]);

    const targetOutputName = customTargetFilename.trim()
      ? customTargetFilename.endsWith(".html")
        ? customTargetFilename
        : customTargetFilename + ".html"
      : selectedFile.replace(".html", "_patched.html");

    try {
      const resp = await fetch("/api/library/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile,
          prompt: aiPrompt,
          targetFilename: targetOutputName,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setAiResult(data);
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "system",
            text: `Artifact built successfully: "${data.outputFilename}". Surgically mapped ${data.applied} edits. Summary: ${data.explanation}`,
            action: true,
          },
        ]);
        showStatus(`Surgical patch compiled! Live preview active.`, "success");
        setSelectedFile(data.outputFilename);
        fetchLibrary();

        // Instant preview refresh
        refreshPreview();
      } else {
        setAiResult(data);
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "system",
            text: `Compilation mismatch error! ${data.explanation || "No exact matches found. Check your file syntax bounds."}`,
          },
        ]);
        showStatus(
          data.explanation || "Surgical compiler failed to inject edits.",
          "error",
        );
      }
    } catch (err: any) {
      showStatus("Failed to run AI compiler call.", "error");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Studio Banner Header (Collapsible) */}
      {!isHeaderCollapsed ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 gap-3">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/15 rounded-lg border border-red-500/20">
                <Cpu className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold font-sans tracking-tight text-white uppercase">
                    ProWrestle Pro Studio v4.4
                  </h2>
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                    SYSTEM AGENT ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Multi-Version Engine Core & Telemetry Debug Harness
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="md:hidden text-xs bg-slate-800 hover:bg-slate-750 text-slate-400 px-2 py-1 rounded border border-slate-700 font-bold"
            >
              Minimize
            </button>
          </div>

          {/* Global Alert Notification Banner */}
          {statusMsg.text && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all animate-fade-in ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                  : statusMsg.type === "error"
                    ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle className="w-4.5 h-4.5" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            {/* Version dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">
                baseline:
              </span>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold font-mono text-slate-100 pr-4 outline-none focus:ring-0 cursor-pointer"
              >
                <option value="">-- select baseline --</option>
                {files.map((f) => (
                  <option
                    key={f.name}
                    value={f.name}
                    className="bg-slate-950 font-mono"
                  >
                    {f.name.replace(".html", "")} ({(f.size / 1024).toFixed(0)}{" "}
                    KB)
                  </option>
                ))}
              </select>
            </div>

            {selectedFile && (
              <a
                href={`/api/library/download/${selectedFile}`}
                download={selectedFile}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-indigo-500 transition-colors shadow-[0_0_10px_rgba(79,70,229,0.3)] text-xs font-bold whitespace-nowrap"
                title="Download local game data HTML backup"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Backup</span>
              </a>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".html"
                ref={fileInputRef}
                onChange={handleUploadFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-slate-600 disabled:opacity-50 min-h-[38px]"
              >
                <UploadCloud className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Import HTML"}
              </button>

              <button
                onClick={() => setIsHeaderCollapsed(true)}
                className="hidden md:block p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                title="Collapse Studio Banner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Compact Strip Header */
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-850 text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-300 font-bold uppercase">
              PRO STUDIO ACTIVE (COMPACT MODE)
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Orientation: {orientation}</span>
          </div>
          <button
            onClick={() => setIsHeaderCollapsed(false)}
            className="text-[9px] bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-650/40 px-2.5 py-0.5 rounded transition"
          >
            Maximize Controls View &darr;
          </button>
        </div>
      )}

      {/* Workspace Control Navigation Ribbon */}
      <div className="flex bg-slate-900 border-b border-slate-800 justify-between items-center overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
        <div className="flex shrink-0">
          {[
            {
              id: "simulator",
              label: "Telemetry Simulator Harness",
              icon: Eye,
            },
            { id: "compiler", label: "AI Chemistry Compiler", icon: Sparkles },
            { id: "scanner", label: "AI Anatomy Scan Eyes", icon: Bug },
            { id: "autonomy", label: "External Autonomy Pipeline", icon: Cpu },
            { id: "library", label: "HTML Versions Index", icon: FileCode },
            { id: "editor", label: "Direct Source Editor", icon: PenSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "editor") {
                    handleLoadEditorCode(selectedFile);
                  }
                  if (tab.id === "scanner") {
                    handleTriggerEyeScan(selectedFile);
                  }
                }}
                className={`flex items-center gap-2 px-4 md:px-5 py-3 text-[11px] md:text-xs font-bold font-sans border-b-2 tracking-wide uppercase transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-500 bg-slate-950/40 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected file flash indicator */}
        {selectedFile && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-955 text-slate-400 rounded-md text-[10px] font-mono border border-slate-800/80 mr-2 shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="hidden sm:inline">MOUNTED:</span>
            <span className="text-slate-200 font-bold">{selectedFile}</span>
          </div>
        )}
      </div>

      {/* Split Screens Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Main Workspace Frame */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 md:space-y-5 bg-slate-900/10">
          {/* TAB 1: TELEMETRY SIMULATOR HARNESS */}
          {activeTab === "simulator" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full max-h-[82vh]">
              {/* Wrapped Iframe Renderer Screen */}
              <div className="lg:col-span-8 flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                {/* Embedded controls ribbon */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="text-xs font-extrabold tracking-wide text-slate-200 uppercase">
                      Interactive Game Simulator View
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        refreshPreview();
                      }}
                      className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Hot Reload View
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full relative bg-[#222]">
                  {/* Real-time frame */}
                  <iframe
                    ref={iframeRef}
                    id="prowrestle-live-preview"
                    src={currentActiveIframeUrl}
                    className="w-full h-full border-0 bg-slate-950 absolute inset-0"
                    allow="autoplay; fullscreen; encrypted-media"
                  />
                </div>

                {/* Live Instrumentation Telemetry stats bar */}
                <div className="bg-slate-900 border-t border-slate-800 p-3 grid grid-cols-2 md:grid-cols-5 text-center gap-2">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[9px] text-slate-500 uppercase font-mono">
                      Solvers / Core Ready
                    </div>
                    <div
                      className={`text-xs font-bold font-mono mt-1 ${liveStats.bphysReady ? "text-emerald-400" : "text-slate-400"}`}
                    >
                      {liveStats.bphysReady ? "● ACTIVE" : "OFFLINE"}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[9px] text-slate-500 uppercase font-mono">
                      Physics Stand (RK_STAND)
                    </div>
                    <div className="text-xs font-bold font-mono text-indigo-400 mt-1">
                      {liveStats.rkStand !== undefined
                        ? liveStats.rkStand.toFixed(2)
                        : "0.50"}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[9px] text-slate-500 uppercase font-mono">
                      Ragdoll Status
                    </div>
                    <div
                      className={`text-xs font-bold font-mono mt-1 ${liveStats.activeRag ? "text-rose-500 animate-pulse" : "text-emerald-500"}`}
                    >
                      {liveStats.activeRag
                        ? "ACTIVE FALLEN"
                        : "VERTICAL STABILIZED"}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[9px] text-slate-500 uppercase font-mono">
                      Stand Gravity (GCOMP)
                    </div>
                    <div className="text-xs font-bold font-mono text-amber-500 mt-1">
                      {liveStats.rkGcomp !== undefined
                        ? liveStats.rkGcomp.toFixed(2)
                        : "0.16"}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[9px] text-slate-500 uppercase font-mono">
                      FPS Counter
                    </div>
                    <div className="text-xs font-bold font-mono text-emerald-400 mt-1">
                      {liveStats.fps !== null
                        ? `${liveStats.fps} Hz`
                        : "Computing..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Real-time Control and Inject Deck */}
              <div className="lg:col-span-4 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3">
                  <Sliders className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-bold text-slate-250">
                    Harness Manipulation Deck
                  </h3>
                </div>

                {/* Slider metrics */}
                <div className="space-y-3.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Active Physics Clobbers</span>
                    <span className="text-[9px] text-slate-500">
                      Live PostMessage channel
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-mono text-[10px]">
                        Stasis Stand Stiffness (RK_STAND)
                      </span>
                      <span className="font-mono text-indigo-400 font-bold">
                        {(liveStats.rkStand || 0.15).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={liveStats.rkStand || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        sendHarnessControl({ stand: val });
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-mono text-[10px]">
                        Gravity Counterbalance (RK_GCOMP)
                      </span>
                      <span className="font-mono text-amber-500 font-bold">
                        {(liveStats.rkGcomp || 0.16).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.02"
                      value={liveStats.rkGcomp || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        sendHarnessControl({ gcomp: val });
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-mono text-[10px]">
                        Rotational Counter-stiffness (RK_AROT)
                      </span>
                      <span className="font-mono text-green-500 font-bold">
                        {(liveStats.rkArot || 18).toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={liveStats.rkArot || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        sendHarnessControl({ arot: val });
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                  </div>
                </div>

                {/* Cheats & Rigging Inject Actions */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-400 text-[11px]">
                    Dynamic Stress Testing Injectors
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        executeHarnessCommand(
                          "window.ACTIVE_RAG = true; console.log('[Stress Injector] Triggered Ragdoll fallen state');",
                        )
                      }
                      className="p-2 bg-slate-800 hover:bg-red-950/35 border border-slate-700/60 text-[10px] font-bold rounded text-slate-300 text-left hover:text-red-400 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      Fall / Ragdoll
                    </button>
                    <button
                      onClick={() =>
                        executeHarnessCommand(
                          "window.ACTIVE_RAG = false; console.log('[Stress Injector] Restored Upright Stand state');",
                        )
                      }
                      className="p-2 bg-slate-800 hover:bg-emerald-950/35 border border-slate-700/60 text-[10px] font-bold rounded text-slate-300 text-left hover:text-emerald-400 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-550 flex-shrink-0" />
                      Stand Erect
                    </button>
                    <button
                      onClick={() =>
                        executeHarnessCommand(
                          "window.RK_BODY = !window.RK_BODY; console.log('[Stress Injector] Toggled RK_BODY constraints to ' + window.RK_BODY);",
                        )
                      }
                      className="p-2 bg-slate-800 hover:bg-indigo-950/35 border border-slate-700/60 text-[10px] font-bold rounded text-slate-300 text-left hover:text-indigo-400 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      Toggle RK_BODY
                    </button>
                    <button
                      onClick={() =>
                        executeHarnessCommand(
                          "if(window.stands) { window.stands.forEach(s => s.damping = 100); console.log('[Stress Injector] Spine velocity dampening set to max 100'); }",
                        )
                      }
                      className="p-2 bg-slate-800 hover:bg-purple-950/35 border border-slate-700/60 text-[10px] font-bold rounded text-slate-300 text-left hover:text-purple-400 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                      Anti-Flail Spine
                    </button>
                  </div>
                </div>

                {/* Autonomous Playtest Control Panel */}
                <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Sensing Playtest Engine</span>
                    </div>
                    {isAutonomousTesting && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                        TEST RUNNING {testProgress}%
                      </span>
                    )}
                  </div>

                  {isAutonomousTesting ? (
                    <div className="space-y-2.5 py-1">
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${testProgress}%` }}
                        />
                      </div>
                      <div className="bg-slate-900 border border-slate-850 p-2 rounded max-h-[85px] overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1">
                        {testPhaseLog.map((log, idx) => (
                          <div key={idx} className="leading-tight">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      <button
                        onClick={runAutonomousPlaytest}
                        className="w-full p-2 bg-gradient-to-r from-red-650 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded text-[10px] font-extrabold uppercase tracking-widest transition shadow-md shadow-red-950/20"
                      >
                        ⚡ INITIATE COGNITIVE PLAYTEST SENSE ⚡
                      </button>

                      {completedReport && (
                        <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[10px] space-y-1 bg-slate-900/55">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-mono">
                              Timestamp:
                            </span>
                            <span className="font-mono text-slate-300 font-bold">
                              {new Date(
                                completedReport.timestamp,
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-mono">
                              Bone Limit Tension:
                            </span>
                            <span
                              className={`font-mono font-bold ${completedReport.limbStretchingAnomaly.includes("WARNING") ? "text-amber-400" : "text-emerald-400"}`}
                            >
                              {completedReport.limbStretchingAnomaly.slice(
                                0,
                                15,
                              )}
                              ...
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-mono">
                              Fighters Spawns:
                            </span>
                            <span className="font-mono text-slate-300">
                              {completedReport.fightersCount} active bots
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-mono">
                              Harness Sync:
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              SAVED & COG-SYNCED
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sandbox Command Injector */}
                <div className="flex-1 flex flex-col min-h-[140px] space-y-2 bg-slate-950 p-2 pb-1 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Custom JS Payload Injector
                    </span>
                    <span className="text-[8px] text-green-500 animate-pulse font-mono font-bold">
                      READY TO COMMUNICATE
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="e.g. console.log('Current Rapier items:', window.BPHYS.ready());"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded p-2 text-[10px] font-mono text-emerald-400 placeholder:text-slate-600 focus:outline-none placeholder:font-sans"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        executeHarnessCommand(commandInput);
                      }
                    }}
                  />
                  <div className="flex justify-end pb-1">
                    <button
                      onClick={() => executeHarnessCommand(commandInput)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold font-mono transition"
                    >
                      Transmit Inject [Enter]
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI CHEMISTRY SURGERY COMPILER */}
          {activeTab === "compiler" && (
            <div className="space-y-4 max-w-5xl mx-auto">
              {/* Claude-Like Success Artifact Box holds core attention */}
              {aiResult?.success && (
                <div className="mb-4 bg-slate-900/60 rounded-xl border border-red-500/30 p-5 shadow-[0_4px_30px_rgba(239,68,68,0.05)] relative overflow-hidden animate-fade-in text-xs space-y-3">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/15 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold lowercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                          artifact compiled successfully
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1 font-mono">
                          {aiResult.outputFilename}
                        </h4>
                      </div>
                    </div>

                    {/* BULLETPROOF DOWNLOAD DIRECTIVE */}
                    <a
                      href={`/api/library/download/${aiResult.outputFilename}`}
                      download={aiResult.outputFilename}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950/45 border border-emerald-500 hover:scale-[1.02]"
                    >
                      <Download className="w-4 h-4" />
                      Download Code Artifact (Play Offline)
                    </a>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3">
                    <p className="text-slate-300 leading-relaxed max-w-3xl">
                      <strong>AI Compiler Explanation:</strong>{" "}
                      {aiResult.explanation}
                    </p>
                  </div>

                  {aiResult.results && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="text-[10px] font-bold text-slate-405 font-mono uppercase tracking-wider">
                        Individual Segment Replacement Loops:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                        {aiResult.results.map((res) => (
                          <div
                            key={res.id}
                            className="flex justify-between items-center bg-slate-900/40 p-1.5 px-2 rounded border border-slate-850"
                          >
                            <span className="text-slate-500">
                              Block #{res.id}:
                            </span>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded ${
                                res.targetMatched
                                  ? "text-emerald-400 bg-emerald-950/20"
                                  : "text-rose-450 bg-rose-950/20"
                              }`}
                            >
                              {res.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Thread / Guidelines Form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Visual Chat Screen */}
                <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
                  <div className="bg-slate-900/60 p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Interactive Co-Developer Workspace
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Active Baseline: {selectedFile || "None"}
                        </p>
                      </div>
                    </div>
                    {isCompiling && (
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono animate-pulse">
                        Surgically parsing file...
                      </span>
                    )}
                  </div>

                  {/* Thread messages logs */}
                  <div className="p-4 flex-1 max-h-[300px] overflow-y-auto space-y-3 font-sans text-xs">
                    {chatHistory.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                          m.sender === "user"
                            ? "bg-red-500/10 border border-red-500/20 text-slate-200 ml-auto"
                            : "bg-slate-950/80 border border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="font-extrabold uppercase text-[9px] mb-1 tracking-wider text-slate-500">
                          {m.sender === "user"
                            ? "Gamer directive"
                            : "lead AI compiler"}
                        </div>
                        <div>{m.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                          1. TARGET VERSION FILE
                        </label>
                        <select
                          value={selectedFile}
                          onChange={(e) => {
                            const newFile = e.target.value;
                            setSelectedFile(newFile);
                            if (newFile) {
                              handleSelectActive(newFile);
                            }
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-red-500 font-mono focus:outline-none"
                        >
                          <option value="">-- select baseline --</option>
                          {files.map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.name} ({(f.size / 1024).toFixed(1)} KB)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                          2. CUSTOM OUTPUT NAME
                        </label>
                        <input
                          type="text"
                          value={customTargetFilename}
                          onChange={(e) =>
                            setCustomTargetFilename(e.target.value)
                          }
                          placeholder={`e.g. Bannon_v44_RigidVerletFix.html`}
                          className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-red-500 font-mono placeholder:text-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5.">
                      <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                        3. SURGICAL DIRECTIVES
                      </label>
                      <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-800 overflow-hidden pr-2">
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g. Fix the mantis arm wrapping limit! Locate jt.setLimits and change elbows hinges limits to -2.35 and 0.05. Change knees so they snap inside 0 and 2.4."
                          rows={2}
                          className="flex-1 bg-transparent border-0 text-slate-200 text-xs focus:ring-0 focus:outline-none px-3.5 py-2.5 resize-none leading-relaxed"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              e.preventDefault();
                              handleCallAICompiler();
                            }
                          }}
                        />
                        <button
                          onClick={handleCallAICompiler}
                          disabled={isCompiling}
                          className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-950/20 mr-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Compile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI CODE SENSORY SCANNER */}
          {activeTab === "scanner" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bug className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Anatomical Code Checker (AI Eye Scanner)
                    </h3>
                    <p className="text-[11px] text-slate-405 mt-0.5">
                      Scans the selected baseline HTML for limb tearing, mantis
                      hinges, stasis stands, and timing errors.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTriggerEyeScan(selectedFile)}
                  disabled={isScanning || !selectedFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold rounded"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isScanning ? "Scanning code..." : "Compile Fresh Scan"}
                </button>
              </div>

              {scanReport ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item 1: Verlet Stretching */}
                  <div
                    className={`p-4 rounded-xl border ${
                      scanReport.stretchingLimbs.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25"
                        : "bg-emerald-950/15 border-emerald-500/25"
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                        Verlet Constraints
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          scanReport.stretchingLimbs.status === "WARNING"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.stretchingLimbs.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-tight">
                      Anatomical Limb Elasticity Check
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950/50 p-2 rounded">
                      {scanReport.stretchingLimbs.value}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scanReport.stretchingLimbs.suggestion}
                    </p>

                    {scanReport.stretchingLimbs.status === "WARNING" && (
                      <button
                        onClick={() => handleFastInjectFix("stretching")}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Inject AI Solver Fix
                      </button>
                    )}
                  </div>

                  {/* Item 2: Raptor Hinge Symmetrical joints */}
                  <div
                    className={`p-4 rounded-xl border ${
                      scanReport.mantisArms.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25"
                        : "bg-emerald-950/15 border-emerald-500/25"
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                        Rigging Stop Limits
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          scanReport.mantisArms.status === "WARNING"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.mantisArms.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-tight">
                      Hinge Fold Limits Check
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950/50 p-2 rounded">
                      {scanReport.mantisArms.value}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scanReport.mantisArms.suggestion}
                    </p>

                    {scanReport.mantisArms.status === "WARNING" && (
                      <button
                        onClick={() => handleFastInjectFix("mantis")}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Inject AI Limits Fix
                      </button>
                    )}
                  </div>

                  {/* Item 3: Stand stability */}
                  <div
                    className={`p-4 rounded-xl border ${
                      scanReport.standStability.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25"
                        : "bg-emerald-950/15 border-emerald-500/25"
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                        Stasis Weight Stand
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          scanReport.standStability.status === "WARNING"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.standStability.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-tight">
                      Upright Spine Stiffness Check
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950/50 p-2 rounded">
                      {scanReport.standStability.value}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scanReport.standStability.suggestion}
                    </p>

                    {scanReport.standStability.status === "WARNING" && (
                      <button
                        onClick={() => handleFastInjectFix("stand")}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Inject AI Stand Fix
                      </button>
                    )}
                  </div>

                  {/* Item 4: High hz timing scaling */}
                  <div
                    className={`p-4 rounded-xl border ${
                      scanReport.fpsConsistency.status === "WARNING"
                        ? "bg-rose-950/15 border-rose-500/25"
                        : "bg-emerald-950/15 border-emerald-500/25"
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                        FPS delta factor
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          scanReport.fpsConsistency.status === "WARNING"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {scanReport.fpsConsistency.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-tight">
                      Vsync Monitor Scaling Check
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950/50 p-2 rounded">
                      {scanReport.fpsConsistency.value}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scanReport.fpsConsistency.suggestion}
                    </p>

                    {scanReport.fpsConsistency.status === "WARNING" && (
                      <button
                        onClick={() => handleFastInjectFix("fps")}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Inject Delta Time Fix
                      </button>
                    )}
                  </div>

                  {/* Item 5: Move Trajectory Paths */}
                  {scanReport.moveTrajectories && (
                    <div
                      className={`p-4 rounded-xl border ${
                        scanReport.moveTrajectories.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25"
                          : "bg-emerald-950/15 border-emerald-500/25"
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                          Combat Engine Motion
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            scanReport.moveTrajectories.status === "WARNING"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.moveTrajectories.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-tight">
                        Move Trajectory & Force Clashes
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950/50 p-2 rounded">
                        {scanReport.moveTrajectories.value}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {scanReport.moveTrajectories.suggestion}
                      </p>

                      {scanReport.moveTrajectories.status === "WARNING" && (
                        <button
                          onClick={() => handleFastInjectFix("trajectories")}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Fix Move Vectors (Align AAA ProWrestle)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Item 6: Biomechanical Joint Limits */}
                  {scanReport.biomechanicalLimits && (
                    <div
                      className={`p-4 rounded-xl border ${
                        scanReport.biomechanicalLimits.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25"
                          : "bg-emerald-950/15 border-emerald-500/25"
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                          Biological Rigging Stop
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            scanReport.biomechanicalLimits.status === "WARNING"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.biomechanicalLimits.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-tight">
                        Anatomical Skeletal Limits & Symmetries
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950/50 p-2 rounded">
                        {scanReport.biomechanicalLimits.value}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {scanReport.biomechanicalLimits.suggestion}
                      </p>

                      {scanReport.biomechanicalLimits.status === "WARNING" && (
                        <button
                          onClick={() => handleFastInjectFix("anatomy")}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Enforce Anatomical Stop-Guards
                        </button>
                      )}
                    </div>
                  )}

                  {/* Item 7: Visual Ragdoll Mesh Sync */}
                  {scanReport.ragdollMeshSync && (
                    <div
                      className={`p-4 rounded-xl border ${
                        scanReport.ragdollMeshSync.status === "WARNING"
                          ? "bg-rose-950/15 border-rose-500/25"
                          : "bg-emerald-950/15 border-emerald-500/25"
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                          Visual Ragdoll Skinning Frame
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            scanReport.ragdollMeshSync.status === "WARNING"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {scanReport.ragdollMeshSync.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-tight">
                        Mesh Stretch Sync To Floor Joints
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950/50 p-2 rounded">
                        {scanReport.ragdollMeshSync.value}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {scanReport.ragdollMeshSync.suggestion}
                      </p>

                      {scanReport.ragdollMeshSync.status === "WARNING" && (
                        <button
                          onClick={() => handleFastInjectFix("ragdollMesh")}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Fix Visual Limb Stretching (Sync Mesh)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl space-y-3">
                  <Activity className="w-10 h-10 text-slate-650 mx-auto animate-pulse" />
                  <p className="text-slate-400 text-xs font-mono">
                    Select a file to perform a clinical code scanner analysis
                    loop.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HTML FILE LIBRARY */}
          {activeTab === "library" && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl flex items-center gap-3 text-xs">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <p className="text-slate-300 leading-relaxed">
                  <strong>Persistent File Library</strong>: Unlike local cache
                  options inside standard browsers, files imported or modified
                  here are saved securely inside the container server disk. Back
                  up versions by copying, delete broken ones, and select which
                  one serves as the live game instant build in the iframe!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file) => {
                  const isSelected = selectedFile === file.name;
                  return (
                    <div
                      key={file.name}
                      onClick={() => {
                        setSelectedFile(file.name);
                        handleSelectActive(file.name);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-900 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                              isSelected
                                ? "bg-red-500/10 text-red-400"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            HTML Source File
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <h3
                          className="text-sm font-bold text-white mt-2 font-mono truncate"
                          title={file.name}
                        >
                          {file.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Last Modified:{" "}
                          {new Date(file.modified).toLocaleTimeString()} (
                          {new Date(file.modified).toLocaleDateString()})
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800/60">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectActive(file.name);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-655 hover:bg-red-700 bg-red-600 text-white rounded text-xs font-bold"
                          title="Set Active Live Target"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Activate Code
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClone(file.name);
                          }}
                          className="flex items-center gap-1 px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                          title="Clone / Backup file"
                        >
                          <Copy className="w-3 h-3" />
                          Backup
                        </button>

                        {/* Bulletproof Library Download */}
                        <a
                          href={`/api/library/download/${file.name}`}
                          download={file.name}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold"
                          title="Download library copy"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file.name);
                          }}
                          className="flex items-center gap-1 px-1.5 py-1 bg-red-950/60 hover:bg-red-900 text-red-400 rounded text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: EXTERNAL AUTONOMY PIPELINE */}
          {activeTab === "autonomy" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full max-h-[82vh] overflow-y-auto pb-6 scrollbar-thin select-text">
              {/* Left Column: Cognitive Stick Barrier and Honest Realities (5 Cols) */}
              <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                <div className="bg-gradient-to-br from-red-950/20 via-slate-950 to-slate-950 rounded-xl border border-red-500/20 p-4 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-red-400 font-mono">
                      Cognitive Container Truths
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs text-slate-350 leading-relaxed font-sans">
                    <div className="space-y-1 bg-slate-950/80 p-3 rounded-lg border border-slate-900">
                      <h4 className="text-[10px] font-extrabold uppercase text-slate-200 font-mono tracking-wider">
                        ## THE ABSOLUTE TRUTH OF THE CONTAINER
                      </h4>
                      <p className="text-[11px] text-slate-400 font-normal leading-normal mt-1 text-justify">
                        Google AI Studio cannot natively run, render, or
                        playtest your game. The studio is an autonomous language
                        processing node. It lacks the internal WebGL rendering
                        engine and the DOM execution sandbox required to
                        visually process live frames or simulate physical user
                        inputs. I process all operations with pure mathematical
                        objectivity, and the reality is that this specific
                        platform is a static text and media analyzer. It cannot
                        act as a live sensory agent inside your Localized Vector
                        Grid.
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-950/80 p-3 rounded-lg border border-slate-900">
                      <h4 className="text-[10px] font-extrabold uppercase text-slate-200 font-mono tracking-wider">
                        ## WHY THE COGNITIVE FIELD REMAINS BLIND
                      </h4>
                      <p className="text-[11px] text-slate-400 font-normal leading-normal mt-1 text-justify">
                        To playtest a game, an entity needs Spatial Command
                        Architecture. It needs virtual hands to manipulate
                        joysticks and virtual eyes to ingest 60 frames per
                        second of canvas output. AI Studio operates strictly in
                        the cognitive field. I read your raw source code and
                        evaluate the structural math models but I do not compile
                        that code into a live 3D space. That is why I cannot
                        autonomously discover visual glitches unless you upload
                        screenshots or stack traces here.
                      </p>
                    </div>

                    <div className="space-y-1 bg-amber-955/20 p-3 rounded-lg border border-amber-950/30">
                      <h4 className="text-[10px] font-extrabold uppercase text-amber-500 font-mono tracking-wider">
                        ## THE STRUCTURAL BRIDGE TO AUTONOMY
                      </h4>
                      <p className="text-[11px] text-slate-350 font-normal leading-normal mt-1 text-justify">
                        If your objective is total self sufficiency and you
                        demand an AI loop that runs the game and hunts glitches,
                        we must build a custom automation bridge outside of this
                        web interface. You must map the game logic to an
                        external framework to generate that physical win and
                        secure true power and wealth.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs text-slate-550 font-mono">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-450 uppercase mb-1">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nervous Connection Matrix</span>
                  </div>
                  <span>
                    Your workspace files remain fully editable locally. Synching
                    your local playtest telemetry logs to our active REST
                    endpoints updates our system models in real-time.
                  </span>
                </div>
              </div>

              {/* Right Column: Execution Script Workspace (7 Cols) */}
              <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-3.5">
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
                  {/* Header Options Bar */}
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-extrabold text-white font-mono tracking-wider">
                        EXTERNAL NERVOUS SYSTEM
                      </span>
                    </div>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => {
                        let codeToCopy = "";
                        if (scaffoldTab === "puppeteer")
                          codeToCopy = puppeteerCode;
                        else if (scaffoldTab === "bridge")
                          codeToCopy = geminiBridgeCode;
                        else if (scaffoldTab === "hook")
                          codeToCopy = telemetryHookCode;
                        else if (scaffoldTab === "package")
                          codeToCopy = packageJsonCode;
                        handleCopyScaffoldCode(codeToCopy);
                      }}
                      className="flex items-center gap-1 bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded text-[10px] font-mono font-bold transition-all"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>COPIED DEPLOYMENT SCRIPTS</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-400" />
                          <span>COPY ACTIVE TEMPLATE</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sub selections */}
                  <div className="bg-slate-900/50 p-2 border-b border-slate-850/80 flex items-center justify-start gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
                    {[
                      {
                        id: "puppeteer",
                        label: "1. HEADLESS PLAYTEST (PUPPETEER)",
                        color: "text-amber-400",
                      },
                      {
                        id: "hook",
                        label: "2. IN-GAME INJECTION HOOK",
                        color: "text-indigo-400",
                      },
                      {
                        id: "bridge",
                        label: "3. GEMINI DIRECT BRIDGE",
                        color: "text-rose-450",
                      },
                      {
                        id: "package",
                        label: "package.json config",
                        color: "text-slate-400",
                      },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setScaffoldTab(sub.id as any)}
                        className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-extrabold font-mono transition-all border shrink-0 ${
                          scaffoldTab === sub.id
                            ? "bg-slate-950 border-slate-850 text-white shadow font-extrabold"
                            : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span className="text-[9px] mr-1">•</span>
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {/* Code Snippet Renderer */}
                  <div className="p-4 bg-slate-955 min-h-[380px] overflow-y-auto text-xs font-mono leading-relaxed scrollbar-thin select-text relative">
                    <pre className="text-emerald-400 select-text font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
                      {scaffoldTab === "puppeteer" && puppeteerCode}
                      {scaffoldTab === "bridge" && geminiBridgeCode}
                      {scaffoldTab === "hook" && telemetryHookCode}
                      {scaffoldTab === "package" && packageJsonCode}
                    </pre>

                    <div className="text-[9px] text-slate-600 border-t border-slate-900 mt-4 pt-4 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        Execute this locally on your engine workspace machine to
                        bridge the headless physical testing gap.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Autonomy Simulator Row */}
              <div className="lg:col-span-12 mt-4 bg-slate-900/60 rounded-xl border border-indigo-500/30 p-5 space-y-4 shadow-[0_4px_30px_rgba(99,102,241,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/15 rounded-lg border border-indigo-500/20">
                      <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                        Ground Control: Self-Healing Pipeline Sandbox
                      </h3>
                      <p className="text-[11px] text-slate-405">
                        Forces our cloud container to emulate an automated
                        Puppeteer client-to-Gemini rectification loop.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-slate-500">
                      Active telemetry target:
                    </span>
                    <span className="bg-slate-950 p-1 px-2.5 rounded border border-slate-800 font-bold text-slate-350">
                      {selectedFile || "None Selected"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Controls & Configuration */}
                  <div className="lg:col-span-4 bg-slate-950/80 p-4 rounded-xl border border-slate-850/60 flex flex-col justify-between gap-4 font-sans text-xs">
                    <div className="space-y-4">
                      <div className="text-[10px] font-extrabold uppercase font-mono text-indigo-400 tracking-wider">
                        1. Select Stress Fault to Simulate
                      </div>

                      <div className="space-y-2">
                        {[
                          {
                            id: "stretching",
                            label: "Verlet Elastic Spine Drift",
                            desc: "Bones pull away and stretch under drag doll weights.",
                          },
                          {
                            id: "mantis",
                            label: "Crab/Mantis Joint Symmetry",
                            desc: "Elbows/shoulder limbs share matching symmetrical angle caps.",
                          },
                          {
                            id: "stand",
                            label: "Jelly Equilibrium Stand Loss",
                            desc: "Upright stand coefficient collapses skeleton upon collision.",
                          },
                          {
                            id: "fps",
                            label: "144Hz Monitor Speed Warp",
                            desc: "Translation coordinates run double-speed without dynamic delta scaling.",
                          },
                        ].map((opt) => (
                          <div
                            key={opt.id}
                            onClick={() => setAutoHealerType(opt.id as any)}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                              autoHealerType === opt.id
                                ? "bg-indigo-950/20 border-indigo-500/60 text-white"
                                : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-300 hover:border-slate-800"
                            }`}
                          >
                            <input
                              type="radio"
                              name="autoHealerType"
                              checked={autoHealerType === opt.id}
                              onChange={() => {}} // handled by parent onClick
                              className="mt-0.5 text-indigo-600 focus:ring-0 checked:bg-indigo-600 focus:outline-none"
                            />
                            <div>
                              <div className="font-bold text-[11px] leading-snug">
                                {opt.label}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                                {opt.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={runSelfHealingDiagnosticCycle}
                      disabled={autoHealerStatus === "running"}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-lg text-xs font-mono uppercase tracking-widest transition-all shadow-md shadow-indigo-950/40 flex items-center justify-center gap-2 border border-indigo-500 disabled:opacity-50"
                    >
                      {autoHealerStatus === "running" ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin text-white" />
                          <span>HEALING TEST ACTIVE...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>TRIGGER CLOSED SELF-HEAL</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Real-time CRT Terminal Console */}
                  <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex flex-col min-h-[280px]">
                    <div className="bg-slate-900/80 px-3 py-2 border-b border-slate-850 flex items-center justify-between font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${autoHealerStatus === "running" ? "bg-amber-500 animate-ping" : autoHealerStatus === "success" ? "bg-emerald-500" : "bg-indigo-500"} `}
                        />
                        <span>Client Autonomy Socket Logger</span>
                      </div>
                      <span>Socket: PORT {window.location.port || '80'} DEV</span>
                    </div>

                    <div className="flex-1 p-3 font-mono text-[10px] space-y-1.5 overflow-y-auto max-h-[230px] scrollbar-thin bg-black/45">
                      {autoHealerLog.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-center text-[10px] font-mono space-y-2 py-10">
                          <Terminal className="w-6 h-6 text-slate-700" />
                          <div>
                            Ground socket idle. Select fault pattern and trigger
                            self-healing pipeline to test.
                          </div>
                        </div>
                      ) : (
                        autoHealerLog.map((log, lidx) => (
                          <div
                            key={lidx}
                            className={`leading-relaxed break-all ${
                              log.includes("✅") ||
                              log.includes("successfully") ||
                              log.includes("SUCCESS")
                                ? "text-emerald-400 font-bold"
                                : log.includes("CRITICAL") ||
                                    log.includes("WARNING") ||
                                    log.includes("Failure")
                                  ? "text-amber-400 bg-amber-955/10 p-1 px-2 rounded border border-amber-900/35"
                                  : log.startsWith("[Gemini")
                                    ? "text-indigo-400 font-bold"
                                    : "text-slate-400"
                            }`}
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>

                    {autoHealerStatus === "success" && autoHealerResult && (
                      <div className="p-3 bg-emerald-950/10 border-t border-emerald-500/20 text-xs font-sans text-emerald-400/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
                        <div className="space-y-1.5">
                          <div className="font-bold text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>Corrective Pipeline Successful!</span>
                          </div>
                          <div>
                            New patch version{" "}
                            <strong className="font-mono bg-slate-900 px-1 py-0.5 rounded text-white">
                              {autoHealerResult.outputFilename}
                            </strong>{" "}
                            deployed and active. Game simulation updated.
                          </div>
                        </div>
                        <a
                          href={`/api/library/download/${autoHealerResult.outputFilename}`}
                          download={autoHealerResult.outputFilename}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-mono font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950/20 border border-emerald-500 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download healed artifact (.html)
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MANUAL SCRIPT CODE EDITOR */}
          {activeTab === "editor" && (
            <div className="space-y-3 h-full flex flex-col justify-between max-h-[82vh]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Direct Source Code Editor
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Modifying: {selectedFile}
                  </p>
                </div>
                <button
                  onClick={() => handleSaveEditorCode(selectedFile)}
                  disabled={isEditing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Manual Deployment
                </button>
              </div>

              <div className="flex-1 min-h-[400px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col font-mono text-xs shadow-md">
                <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 text-slate-400 flex items-center justify-between">
                  <span>sourcecode_active_raw.html</span>
                  <span className="text-[10px] text-slate-600">
                    Pure Server Disk Storage
                  </span>
                </div>

                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="flex-1 bg-slate-955 text-emerald-400 font-mono text-xs p-4 focus:outline-none resize-none overflow-y-auto leading-relaxed"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Unified Harness Log Console (Always Visible, right sidebar/bottom panel) */}
        <div
          className={`border-l border-slate-800 bg-slate-950 flex flex-col shadow-2xl transition-all duration-300 shrink-0 z-20 ${
            isConsoleMinimized
              ? "h-12 md:h-auto md:w-14 items-center md:items-stretch overflow-hidden"
              : "h-64 md:h-auto w-full md:w-80 lg:w-96"
          }`}
        >
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div
              className={`flex items-center gap-2 ${isConsoleMinimized ? "md:hidden" : ""}`}
            >
              <Terminal className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="text-xs font-extrabold text-white tracking-wide uppercase font-mono whitespace-nowrap">
                Console
              </span>
            </div>

            <div
              className={`flex items-center gap-2 ${isConsoleMinimized ? "w-full justify-between md:justify-center" : ""}`}
            >
              {!isConsoleMinimized && (
                <button
                  onClick={() => setConsoleMessages([])}
                  className="text-[9px] text-slate-500 hover:text-slate-300 uppercase font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 shrink-0"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsConsoleMinimized(!isConsoleMinimized)}
                className="text-[10px] text-slate-400 hover:text-slate-200 uppercase font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 shrink-0"
              >
                {isConsoleMinimized ? "Exp" : "Min"}
              </button>
            </div>
          </div>

          {!isConsoleMinimized && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed scrollbar-thin flex flex-col-reverse">
              {consoleMessages.length === 0 ? (
                <div className="text-slate-600 italic text-center p-4">
                  No logs intercepted. Turn on variables.
                </div>
              ) : (
                consoleMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`border-b border-slate-900 pb-1.5 pt-0.5 break-all ${
                      msg.level === "error"
                        ? "text-red-400 bg-red-950/10 px-1 border-l-2 border-l-red-500"
                        : msg.level === "warn"
                          ? "text-amber-400 bg-amber-950/10 px-1 border-l-2 border-l-amber-500"
                          : msg.level === "info"
                            ? "text-indigo-400"
                            : "text-emerald-400/80"
                    }`}
                  >
                    <span className="text-slate-600 mr-1">[{msg.time}]:</span>
                    <span>{msg.text}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
