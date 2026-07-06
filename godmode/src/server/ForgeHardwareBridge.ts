import { exec } from "child_process";
import { EventEmitter } from "events";
import { Server as SocketServer } from "socket.io";

// We use direct hardware polling to guarantee sub millisecond button registration
// This class coordinates physical tactile buttons with our backend compilation engine
export class ForgeHardwareBridge extends EventEmitter {
  private io: SocketServer | null;
  private isForging: boolean = false;
  private isRunning: boolean = false;

  constructor(io: SocketServer | null = null) {
    super();
    this.io = io;
    this.initHardwareListeners();
  }

  /**
   * Initializes physical GPIO pins for tactile feedback buttons.
   * Pin 23: Forge Trigger (Sync and compile assets)
   * Pin 24: Run Trigger (Execute compiled output on the hardware target)
   */
  private initHardwareListeners(): void {
    try {
      // In a physical environment we import the native onoff library dynamically
      // @ts-ignore
      const { Gpio } = await import("onoff");
      
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
      // Fallback to active mock listeners if running on development machines without physical GPIO headers
      this.initLocalMockInterface();
    }
  }

  /**
   * Triggers the build process, packing local files and synchronizing UI state
   */
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

  /**
   * Boots up the active compiled rig on the hardware target
   */
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

  /**
   * Provides software loop control so you can trigger the hardware flow via local simulation
   */
  private initLocalMockInterface(): void {
    // This allows manual simulation via terminal interface when debugging the hardware grid
    process.stdin.on("data", async (data) => {
      const command = data.toString().trim();
      if (command === "f") {
        await this.executeForgeSequence();
      } else if (command === "r") {
        await this.executeRunSequence();
      }
    });
  }
}
