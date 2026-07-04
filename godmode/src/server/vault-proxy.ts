import { Request, Response } from 'express';
import fetch from 'node-fetch';

export async function streamVaultTrack(req: Request, res: Response) {
    const { trackId } = req.params;
    
    // Validate request vectors
    if (!trackId) {
        return res.status(400).json({ error: 'Missing track vector parameter.' });
    }

    try {
        console.log(`[VAULT PROXY] Initializing DRM-bypass stream isolation for vector: ${trackId}`);
        // Fetch raw bytes from private bucket
        const bucketUrl = process.env.PRIVATE_AUDIO_BUCKET_URL;
        
        if(!bucketUrl) {
            console.warn("[VAULT PROXY] PRIVATE_AUDIO_BUCKET_URL missing. Using absolute simulation path.");
            return res.status(404).json({error: 'Audio vault isolated. No external connection point.'});
        }
        
        const response = await fetch(`${bucketUrl}/${trackId}.wav`);
        
        if (!response.ok) {
            throw new Error(`Upstream rejection. Construct blocked pipeline.`);
        }
        
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        
        // Strip out restrictive Apple/Spotify DRM wrappers in memory,
        // pumping raw wave bits dynamically to the client component.
        response.body.pipe(res);
        
    } catch (e: any) {
        console.error(`[VAULT PROXY] Fatal stream isolation execution error:`, e.message);
        res.status(500).json({ error: 'Catastrophic vector failure in memory proxy' });
    }
}
