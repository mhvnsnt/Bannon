import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import fs from 'fs';

const ensureDirSync = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function autonomousVisualDrop(audioPath: string, imagePath: string, caption: string) {
    const rendersDir = './vault/renders';
    ensureDirSync(rendersDir);
    const outputPath = `${rendersDir}/TearsOfBeauty_${Date.now()}.mp4`;

    console.log('[VIDEO FORGE]: Compilin kinetic MP4 payload...');

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(imagePath)
            .loop(15) // 15 second short-form loop
            .input(audioPath)
            .outputOptions([
                '-c:v libx264',
                '-tune stillimage',
                '-c:a aac',
                '-b:a 192k',
                '-pix_fmt yuv420p',
                '-shortest'
            ])
            .save(outputPath)
            .on('end', async () => {
                console.log('[VIDEO FORGE]: Render complete. Pushing to external algorithmic grids.');
                
                try {
                    // Inject straight into TikTok via unofficial Graph API bridge
                    await axios.post('https://api.tiktok.com/v1/video/upload', {
                        video: outputPath,
                        description: `${caption} #TheCoreBlueprint #TearsOfBeauty`
                    }, { headers: { 'Authorization': `Bearer ${process.env.TIKTOK_PRIME_TOKEN}` } });
                } catch (e) {
                    console.log('[VIDEO FORGE]: Token missing or upload friction, skipping upload payload.');
                }
                resolve(outputPath);
            })
            .on('error', reject);
    });
}
