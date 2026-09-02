const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');

const M_ENGINE_URL = 'http://localhost:8081/api/v1/worker';
const WORKER_ID = 'test-verification-worker';

async function testArtifactTransport() {
    console.log("Starting Physical Verification Test for Artifact Transport");

    // 1. Create actual bytes & temporary file
    const tempPath = path.join(os.tmpdir(), `test_artifact_${crypto.randomBytes(4).toString('hex')}.txt`);
    const fileContent = "This is a physical test artifact proving byte transport.";
    fs.writeFileSync(tempPath, fileContent);
    console.log(`[TEST] Wrote actual temporary file at: ${tempPath}`);

    // 2. Hash the file
    const fileBuffer = fs.readFileSync(tempPath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const sha256 = hashSum.digest('hex');
    const size = fs.statSync(tempPath).size;
    console.log(`[TEST] Hashed file: ${sha256} (${size} bytes)`);

    // 3. Register it through the artifact transport
    const payload = {
        jobId: "TEST-JOB-PROVENANCE",
        workerId: WORKER_ID,
        sha256,
        size,
        path: tempPath,
        contentBase64: fileBuffer.toString('base64')
    };

    console.log(`[TEST] Uploading artifact to M. Engine Governor...`);
    let res;
    try {
        res = await axios.post(`${M_ENGINE_URL}/artifacts`, payload);
    } catch (err) {
        console.error("Transport failed:", err.message);
        process.exit(1);
    }

    const { artifactId, uri } = res.data;
    console.log(`[TEST] Server registered artifact as: ${artifactId}, URI: ${uri}`);

    // Clean up local temp
    fs.unlinkSync(tempPath);
    
    // 4. Validate the actual stored content
    const serverFilePath = uri.replace('file://', '');
    if (!fs.existsSync(serverFilePath)) {
        console.error("[TEST] FAILED: Server claims artifact is stored but file does not exist.");
        process.exit(1);
    }

    const serverBuffer = fs.readFileSync(serverFilePath);
    const serverHashSum = crypto.createHash('sha256');
    serverHashSum.update(serverBuffer);
    const serverSha256 = serverHashSum.digest('hex');

    // 5. Verify hash equality
    if (sha256 === serverSha256) {
        console.log(`[TEST] VERIFIED: Hash equality confirmed (${sha256})`);
    } else {
        console.error(`[TEST] FAILED: Hash mismatch. Expected ${sha256}, got ${serverSha256}`);
        process.exit(1);
    }

    console.log("[TEST] SUCCESS: Artifact Transport proven end-to-end without fabricating Unreal.");
}

testArtifactTransport();
