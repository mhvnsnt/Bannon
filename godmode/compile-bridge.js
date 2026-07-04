// compile-bridge.js
// Direct deployment script to write the bridge file to your local workspace
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, 'src', 'server');
const targetFile = path.join(targetDir, 'ForgeHardwareBridge.ts');

const bridgeCode = \`import { exec } from "child_process";
import { EventEmitter } from "events";
import { Server as SocketServer } from "socket.io";

export class ForgeHardwareBridge extends EventEmitter {
  private io: SocketServer | null;
  private isForging: boolean = false;
  private isRunning: boolean = false;

  constructor(io: SocketServer | null = null) {
    super();
    this.io = io;
    this.initHardwareListeners();
  }

  private initHardwareListeners(): void {
    try {
      const { Gpio } = require("onoff");
      
      const forgeButton = new Gpio(23, "in", "rising", { debounceTimeout: 10 });
      const runButton = new Gpio(24, "in", "rising", { debounceTimeout: 10 });

      forgeButton.watch(async (err: any, value: number) => {
        if (err) return;
        if (value === 1) {
          await this.executeForgeSequence();
        }
      });

      runButton.watch(async (err: any, value: number) => {
        if (err) return;
        if (value === 1) {
          await this.executeRunSequence();
        }
      });

    } catch (e) {
      this.initLocalMockInterface();
    }
  }

  public async executeForgeSequence(): Promise<void> {
    if (this.isForging) return;
    this.isForging = true;
    
    if (this.io) {
      this.io.emit("forge:status", { status: "syncing", message: "Synchronizing workspace assets" });
    }
    this.emit("status", "syncing");

    exec("npm run build", (error, stdout, stderr) => {
      this.isForging = false;
      if (error) {
        if (this.io) {
          this.io.emit("forge:status", { status: "failed", message: error.message });
        }
        this.emit("error", error);
        return;
      }
      if (this.io) {
        this.io.emit("forge:status", { status: "ready", message: "Forge complete. Assets compiled." });
      }
      this.emit("status", "ready");
    });
  }

  public async executeRunSequence(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    if (this.io) {
      this.io.emit("run:status", { status: "launching", message: "Booting execution engine" });
    }
    
    exec("npm run start", (error, stdout, stderr) => {
      this.isRunning = false;
      if (error) {
        if (this.io) {
          this.io.emit("run:status", { status: "error", message: error.message });
        }
        return;
      }
      if (this.io) {
        this.io.emit("run:status", { status: "running", message: "Execution live on target hardware" });
      }
    });
  }

  private initLocalMockInterface(): void {
    process.stdin.on("data", async (data) => {
      const command = data.toString().trim();
      if (command === "f") {
        await this.executeForgeSequence();
      } else if (command === "r") {
        await this.executeRunSequence();
      }
    });
  }
}\`;

try {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetFile, bridgeCode, 'utf8');
  console.log("-> Bridge file written to src/server/ForgeHardwareBridge.ts");
  
  console.log("-> Installing hardware hooks (onoff)...");
  execSync('npm install onoff --save-optional', { stdio: 'inherit' });
  
  console.log("-> Installation complete. Core active.");
} catch (err) {
  console.error("-> Setup failed:", err.message);
}
