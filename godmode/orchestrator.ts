// orchestrator.ts - Integrated Swarm Pipeline Manager
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

class LocalSwarmOrchestrator {
  private activeProcessesArray: ChildProcess[] = [];

  public launchSystemMesh() {
    console.log('// INITIALIZING OFFLINE SYSTEM MESH RUNTIME //');

    // 1. Boot up the hardware telemetry tracking thread
    this.startBackgroundWorker('python3', [path.resolve('./daemon/daemon_telemetry.py')], 'Telemetry Driver');

    // 2. Boot the compilation checking self-healing engine loop
    this.startBackgroundWorker('python3', [path.resolve('./daemon/swarm_self_healing_core.py')], 'Self-Healing System');

    // 3. Verify in-memory folder structures are ready for action
    const workspaceTargetFolder = path.resolve('./public/library');
    if (!fs.existsSync(workspaceTargetFolder)) {
      fs.mkdirSync(workspaceTargetFolder, { recursive: true });
    }
    
    console.log('[System Engine] Mesh fully assembled. Real-time data pipes open and streaming.');
  }

  private startBackgroundWorker(runtimeExecutable: string, commandArguments: string[], identifierTag: string) {
    const workerProcess = spawn(runtimeExecutable, commandArguments);

    workerProcess.stdout?.on('data', (bufferedData) => {
      console.log(`[${identifierTag} Out]: ${bufferedData.toString().trim()}`);
    });

    workerProcess.stderr?.on('data', (bufferedData) => {
      console.error(`[${identifierTag} Error Diagnostics]: ${bufferedData.toString().trim()}`);
    });

    workerProcess.on('close', (terminationCode) => {
      console.log(`[System Notice] ${identifierTag} thread exited with tracking index [${terminationCode}]`);
    });

    this.activeProcessesArray.push(workerProcess);
  }

  public shutdownSystemMesh() {
    console.log('[System Notice] Killing all background sub-threads safely...');
    this.activeProcessesArray.forEach((activeProcess) => {
      activeProcess.kill('SIGTERM');
    });
  }
}

// Instantiate and start the execution loop
const orchestratorInstance = new LocalSwarmOrchestrator();
orchestratorInstance.launchSystemMesh();

// Catch terminal termination signals to prevent background process or port leaking
process.on('SIGINT', () => {
  orchestratorInstance.shutdownSystemMesh();
  process.exit(0);
});
