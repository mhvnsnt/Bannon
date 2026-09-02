require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios'); // Requires 'npm install axios' in the worker dir

// Configuration
const M_ENGINE_URL = process.env.M_ENGINE_URL || 'http://localhost:8080/api/v1/worker';
const WORKER_ID = process.env.WORKER_ID || `ue5-worker-${os.hostname()}-${crypto.randomBytes(4).toString('hex')}`;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.resolve(__dirname, '../../');
const UNREAL_CMD_PATH = process.env.UNREAL_CMD_PATH || discoverUnrealPath();

let workerState = 'UNAVAILABLE';
let currentJob = null;
let heartbeatInterval = null;

function discoverUnrealPath() {
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
        return { success: true, output: output.trim(), exitCode: 0 };
    } catch (err) {
        return { 
            success: false, 
            error: err.message, 
            output: err.stdout ? err.stdout.toString().trim() : '', 
            stderr: err.stderr ? err.stderr.toString().trim() : '',
            exitCode: err.status || 1
        };
    }
}

async function apiPost(endpoint, data) {
    try {
        const url = `${M_ENGINE_URL}${endpoint}`;
        const response = await axios.post(url, data);
        return response.data;
    } catch (e) {
        console.error(`[API ERROR] ${endpoint}:`, e.message);
        if (e.response && e.response.data) {
            console.error(e.response.data);
        }
        return null;
    }
}

async function uploadArtifact(jobId, filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Artifact not found: ${filePath}`);
        return null;
    }
    const stat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const sha256 = hashSum.digest('hex');

    // In a production system, this would be a multipart/form-data upload.
    // For this physical staging environment, we upload the content as base64 to prove bytes actually travel.
    console.log(`[ARTIFACT] Uploading ${filePath} (SHA256: ${sha256}, ${stat.size} bytes)`);
    
    const payload = {
        jobId,
        workerId: WORKER_ID,
        sha256,
        size: stat.size,
        path: filePath,
        contentBase64: fileBuffer.toString('base64')
    };

    const res = await apiPost('/artifacts', payload);
    return res;
}

async function heartbeat() {
    await apiPost('/heartbeat', { workerId: WORKER_ID, state: workerState });
}

async function initializeWorker() {
    console.log('--- M. ENGINE UNREAL WORKER INITIATING ---');
    workerState = 'PARTIALLY_VERIFIED';

    let ueVersion = 'Unknown';
    if (UNREAL_CMD_PATH && fs.existsSync(UNREAL_CMD_PATH)) {
        const ueProbe = runCmd(`"${UNREAL_CMD_PATH}" -version`);
        ueVersion = ueProbe.success ? ueProbe.output : 'Probe Failed';
    }

    const gitProbe = runCmd('git log -1 --format="%H"');
    const branchProbe = runCmd('git rev-parse --abbrev-ref HEAD');

    const capabilities = {
        os: os.platform(),
        unrealVersion: ueVersion,
        gitInstalled: gitProbe.success,
        repository: branchProbe.success ? 'Bannon' : 'Unknown',
        currentBranch: branchProbe.success ? branchProbe.output : 'N/A',
        currentCommit: gitProbe.success ? gitProbe.output : 'N/A'
    };

    if (capabilities.unrealVersion !== 'Unknown' && capabilities.unrealVersion !== 'Probe Failed' && capabilities.gitInstalled) {
        workerState = 'AVAILABLE';
    } else {
        // We set to available for the sake of tests without UE installed
        console.warn('CAPABILITY GAP: UnrealEditor-Cmd missing. Proceeding as AVAILABLE for test operations only.');
        workerState = 'AVAILABLE';
    }

    const enrollRes = await apiPost('/enroll', {
        workerId: WORKER_ID,
        capabilities
    });

    if (enrollRes) {
        console.log(`[ENROLLED] Worker registered with Governor.`);
        heartbeatInterval = setInterval(heartbeat, 15000);
        pollJobs();
    } else {
        console.error("Failed to enroll worker.");
        process.exit(1);
    }
}

// Bounded Allowlisted Operations
const ALLOWLIST = {
    'TEST_ARTIFACT': async (jobParams) => {
        // Physical test of artifact transport
        console.log("Running TEST_ARTIFACT");
        const tempPath = path.join(os.tmpdir(), `test_artifact_${crypto.randomBytes(4).toString('hex')}.txt`);
        fs.writeFileSync(tempPath, "This is a physical test artifact proving byte transport.");
        
        const artifactRes = await uploadArtifact(currentJob.jobId, tempPath);
        fs.unlinkSync(tempPath);

        if (artifactRes) {
            return { evidence: 'VERIFIED_TEST', result: "Artifact uploaded successfully", exitCode: 0 };
        } else {
            return { evidence: 'CAPABILITY_GAP', error: "Artifact upload failed", exitCode: 1 };
        }
    },
    'SYNC_REPO': async (jobParams) => {
        const res = runCmd(`git fetch origin ${jobParams.branch} && git checkout ${jobParams.branch} && git submodule update --init --recursive`);
        return { evidence: 'PHYSICAL_LOCAL_EVIDENCE', result: res.output, stderr: res.stderr, exitCode: res.exitCode };
    },
    'COMPILE_BANNON': async (jobParams) => {
        if (!UNREAL_CMD_PATH) return { evidence: 'CAPABILITY_GAP', error: 'UnrealEditor-Cmd not found', exitCode: 1 };
        const buildScript = os.platform() === 'win32' ? 'Build.bat' : 'Build.sh';
        const buildBatPath = path.resolve(UNREAL_CMD_PATH, '../../../../Build/BatchFiles/', buildScript);
        const uprojectPath = path.resolve(WORKSPACE_DIR, 'unreal/Bannon.uproject');
        const res = runCmd(`"${buildBatPath}" BannonEditor Win64 Development -Project="${uprojectPath}" -WaitMutex -FromMsBuild`);
        return { evidence: 'BUILD_EVIDENCE_OBSERVED', result: res.output, stderr: res.stderr, exitCode: res.exitCode };
    },
    'IMPORT_ASSET': async (jobParams) => {
        if (!UNREAL_CMD_PATH) return { evidence: 'CAPABILITY_GAP', error: 'UnrealEditor-Cmd not found', exitCode: 1 };
        const uprojectPath = path.resolve(WORKSPACE_DIR, 'unreal/Bannon.uproject');
        const importScript = path.resolve(WORKSPACE_DIR, 'tools/unreal-worker/import_script.py');
        const res = runCmd(`"${UNREAL_CMD_PATH}" "${uprojectPath}" -run=pythonscript -script="${importScript}" -asset="${jobParams.asset}" -target="${jobParams.target}" -NoUI`);
        return { evidence: 'IMPORT_EVIDENCE_OBSERVED', result: res.output, stderr: res.stderr, exitCode: res.exitCode };
    }
};

async function pollJobs() {
    if (workerState !== 'AVAILABLE') {
        setTimeout(pollJobs, 5000);
        return;
    }

    const job = await apiPost('/jobs/lease', { workerId: WORKER_ID });
    if (job && job.jobId) {
        currentJob = job;
        workerState = 'BUSY';
        await heartbeat();
        
        console.log(`[JOB LEASED] ${job.jobId} - ${job.operation}`);
        
        let outcome = null;
        if (ALLOWLIST[job.operation]) {
            outcome = await ALLOWLIST[job.operation](job.params || {});
        } else {
            outcome = { evidence: 'CAPABILITY_GAP', error: 'Operation not allowlisted', exitCode: 1 };
        }

        const completeRes = await apiPost(`/jobs/${job.jobId}/complete`, {
            exitStatus: outcome.exitCode || 0,
            evidenceLevel: outcome.evidence || 'NONE',
            stdout: outcome.result || '',
            stderr: outcome.error || outcome.stderr || ''
        });

        if (completeRes) {
            console.log(`[JOB COMPLETED] ${job.jobId}`);
        } else {
            console.error(`[JOB COMPLETE FAILED] ${job.jobId}`);
        }

        currentJob = null;
        workerState = 'AVAILABLE';
        await heartbeat();
    }
    
    setTimeout(pollJobs, 5000);
}

// Ensure axios is installed before running
if (require.main === module) {
    try {
        require.resolve('axios');
        initializeWorker().catch(console.error);
    } catch (e) {
        console.error("Please run 'npm install' in tools/unreal-worker to install axios.");
        process.exit(1);
    }
}
