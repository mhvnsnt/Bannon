const { Worker } = require('bullmq');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Connect to Redis for BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

console.log("[BlendForge] Microservice starting up...");
console.log(`[BlendForge] Connecting to Redis at ${connection.host}:${connection.port}`);

const worker = new Worker('blend-conversion-queue', async job => {
    console.log(`[BlendForge] Received job ${job.id}: Converting ${job.data.filename}`);
    
    const inputPath = job.data.inputPath;
    const outputFileName = job.data.filename.replace('.blend', '.glb');
    const outputPath = path.join('/tmp', outputFileName);

    return new Promise((resolve, reject) => {
        // Execute headless Blender conversion
        const cmd = `blender -b ${inputPath} --python convert.py -- ${outputPath}`;
        
        console.log(`[BlendForge] Executing: ${cmd}`);
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`[BlendForge] Conversion failed: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.warn(`[BlendForge] Blender warnings: ${stderr}`);
            }
            
            console.log(`[BlendForge] Conversion successful: ${outputPath}`);
            
            // Upload to S3/R2 bucket (mocked via reading the file buffer here)
            const fileBuffer = fs.readFileSync(outputPath);
            console.log(`[BlendForge] Preparing ${fileBuffer.length} bytes for S3 transmission...`);
            
            // Clean up
            fs.unlinkSync(outputPath);
            if (fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath);
            }
            
            resolve({
                status: 'success',
                message: 'Converted and uploaded to cloud.',
                originalName: job.data.filename,
                glbUrl: `https://mock-s3-bucket.orion.net/assets/${outputFileName}`
            });
        });
    });
}, { connection });

worker.on('completed', job => {
  console.log(`[BlendForge] Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`[BlendForge] Job ${job?.id} failed with error ${err.message}`);
});
