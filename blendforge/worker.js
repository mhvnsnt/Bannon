const { Worker } = require('bullmq');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

console.log(`[BlendForge Worker] Starting queue receiver. Connecting to Redis on ${REDIS_HOST}:${REDIS_PORT}...`);

const worker = new Worker('blender-pipeline', async (job) => {
    const { blendFilePath, outputGlbPath } = job.data;
    
    console.log(`[BlendForge Worker] [Job ${job.id}] Ingesting .blend asset: ${blendFilePath}`);
    
    if (!fs.existsSync(blendFilePath)) {
        throw new Error(`Input file does not exist at path: ${blendFilePath}`);
    }

    // Ensure the output directory exists
    const outputDir = path.dirname(outputGlbPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Run headless Blender command
    const command = `blender --background --python convert.py -- "${blendFilePath}" "${outputGlbPath}"`;
    
    console.log(`[BlendForge Worker] [Job ${job.id}] Executing core pipeline: ${command}`);

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            console.log(`[Blender Process Stdout]:\n${stdout}`);
            if (error) {
                console.error(`[Blender Process Error]:\n${stderr}`);
                return reject(new Error(`Blender pipeline execution crashed: ${error.message}`));
            }
            
            if (fs.existsSync(outputGlbPath)) {
                console.log(`[BlendForge Worker] [Job ${job.id}] Asset successfully compiled and optimized!`);
                resolve({
                    status: 'OPTIMIZED',
                    glbPath: outputGlbPath,
                    sizeBytes: fs.statSync(outputGlbPath).size
                });
            } else {
                reject(new Error(`Blender execution succeeded but output .glb file was not found.`));
            }
        });
    });
}, {
    connection: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT)
    }
});

worker.on('completed', (job, result) => {
    console.log(`[BlendForge Worker] [Job ${job.id}] Completed successfully:`, result);
});

worker.on('failed', (job, err) => {
    console.error(`[BlendForge Worker] [Job ${job.id}] Failed processing task:`, err.message);
});
