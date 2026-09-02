require('dotenv').config();
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Configuration
const M_ENGINE_URL = process.env.M_ENGINE_URL || 'http://localhost:3000/api/worker';
const WORKER_SECRET = process.env.WORKER_SECRET || 'dev-secret';
const WORKER_ID = `ue5-worker-${os.hostname()}-${crypto.randomBytes(4).toString('hex')}`;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.resolve(__dirname, '../../');
const UNREAL_CMD_PATH = process.env.UNREAL_CMD_PATH || discoverUnrealPath();

let workerState = 'UNAVAILABLE'; // UNAVAILABLE -> PARTIALLY_VERIFIED -> AVAILABLE -> BUSY

function discoverUnrealPath() {
    // Basic heuristic for UE5 path on Windows/Mac/Linux
    const commonPaths = [
        'C:\\Program Files\\Epic Games\\UE_5.3\\Engine\\Binaries\\Win64\\UnrealEditor-Cmd.exe',
        '/Users/Shared/Epic Games/UE_5.3/Engine/Binaries/Mac/UnrealEditor-Cmd',
        '/opt/unreal-engine/Engine/Binaries/Linux/UnrealEditor-Cmd'
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function runCmd(command, cwd = WORKSPACE_DIR) {
    try {
        const output = execSync(command, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
        return { success: true, output: output.trim() };
    } catch (err) {
        return { success: false, error: err.message, output: err.stdout ? err.stdout.toString().trim() : '', stderr: err.stderr ? err.stderr.toString().trim() : '' };
    }
}

async function reportState(payload) {
    console.log(`[STATE] ${payload.state || workerState} | Action: ${payload.action || 'Heartbeat'}`);
    // In a real environment, this would axios.post(M_ENGINE_URL, payload)
    // For this physical staging environment, we output structured logs for M. Engine to parse.
    fs.appendFileSync(path.join(WORKSPACE_DIR, 'worker_evidence.log'), JSON.stringify({ timestamp: new Date().toISOString(), workerId: WORKER_ID, ...payload }) + '\n');
}

async function initializeWorker() {
    console.log('--- M. ENGINE UNREAL WORKER INITIATING ---');
    workerState = 'PARTIALLY_VERIFIED';

    // 1. Probe Unreal Version
    let ueVersion = 'Unknown';
    if (UNREAL_CMD_PATH && fs.existsSync(UNREAL_CMD_PATH)) {
        const ueProbe = runCmd(`"${UNREAL_CMD_PATH}" -version`);
        ueVersion = ueProbe.success ? ueProbe.output : 'Probe Failed';
    } else {
        console.warn('CAPABILITY GAP: UnrealEditor-Cmd not found. Operations requiring UBT/Editor will be rejected.');
    }

    // 2. Discover Bannon Repository
    const gitProbe = runCmd('git log -1 --format="%H | %B"');
    const branchProbe = runCmd('git rev-parse --abbrev-ref HEAD');

    // 3. Verify Submodules
    const submodulesProbe = runCmd('git submodule status');

    const capabilities = {
        os: os.platform(),
        unrealVersion: ueVersion,
        gitInstalled: gitProbe.success,
        repository: branchProbe.success ? 'Bannon' : 'Unknown',
        currentBranch: branchProbe.success ? branchProbe.output : 'N/A',
        currentCommit: gitProbe.success ? gitProbe.output.split('|')[0].trim() : 'N/A'
    };

    if (capabilities.unrealVersion !== 'Unknown' && capabilities.unrealVersion !== 'Probe Failed' && capabilities.gitInstalled) {
        workerState = 'AVAILABLE';
    }

    await reportState({
        action: 'ENROLLMENT',
        state: workerState,
        capabilities,
        submodules: submodulesProbe.success ? submodulesProbe.output : 'Uninitialized'
    });
}

// Bounded Allowlisted Operations
const ALLOWLIST = {
    'SYNC_REPO': async (jobParams) => {
        const res = runCmd(`git fetch origin ${jobParams.branch} && git checkout ${jobParams.branch} && git submodule update --init --recursive`);
        return { evidence: 'PHYSICAL_LOCAL_EVIDENCE', result: res };
    },
    'COMPILE_BANNON': async (jobParams) => {
        if (!UNREAL_CMD_PATH) return { evidence: 'CAPABILITY_GAP', error: 'UnrealEditor-Cmd not found' };
        // e.g. Engine/Build/BatchFiles/Build.bat BannonEditor Win64 Development -Project="..."
        const buildScript = os.platform() === 'win32' ? 'Build.bat' : 'Build.sh';
        const buildBatPath = path.resolve(UNREAL_CMD_PATH, '../../../../Build/BatchFiles/', buildScript);
        const uprojectPath = path.resolve(WORKSPACE_DIR, 'unreal/Bannon.uproject');
        const res = runCmd(`"${buildBatPath}" BannonEditor Win64 Development -Project="${uprojectPath}" -WaitMutex -FromMsBuild`);
        return { evidence: 'BUILD_EVIDENCE_OBSERVED', result: res };
    },
    'IMPORT_ASSET': async (jobParams) => {
        if (!UNREAL_CMD_PATH) return { evidence: 'CAPABILITY_GAP', error: 'UnrealEditor-Cmd not found' };
        // Emulate asset import commandlet logic
        const uprojectPath = path.resolve(WORKSPACE_DIR, 'unreal/Bannon.uproject');
        const importScript = path.resolve(WORKSPACE_DIR, 'tools/unreal-worker/import_script.py');
        const res = runCmd(`"${UNREAL_CMD_PATH}" "${uprojectPath}" -run=pythonscript -script="${importScript}" -asset="${jobParams.asset}" -target="${jobParams.target}" -NoUI`);
        return { evidence: 'IMPORT_EVIDENCE_OBSERVED', result: res };
    }
};

async function executeJob(job) {
    if (workerState !== 'AVAILABLE') {
        await reportState({ action: 'JOB_REJECTED', reason: `Worker state is ${workerState}` });
        return;
    }

    if (!ALLOWLIST[job.operation]) {
        await reportState({ action: 'JOB_REJECTED', reason: 'Operation not allowlisted', operation: job.operation });
        return;
    }

    workerState = 'BUSY';
    await reportState({ action: 'JOB_STARTED', operation: job.operation, jobId: job.id });

    const outcome = await ALLOWLIST[job.operation](job.params);

    workerState = 'AVAILABLE';
    await reportState({
        action: 'JOB_COMPLETED',
        operation: job.operation,
        jobId: job.id,
        evidenceLevel: outcome.evidence,
        outcome: outcome.result || outcome.error
    });
}

// Simulated Entry Point
(async () => {
    await initializeWorker();
    console.log(`Worker ${WORKER_ID} ready.`);
})();
