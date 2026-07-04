// src/server/audio-streamer.ts
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';

export function initializeAudioStreamer(server: any) {
  const wss = new WebSocketServer({ server, path: '/audio-stream' });

  wss.on('connection', (ws) => {
    console.log('[AUDIO STREAMER] Autonomous low-latency connection established');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'request_stream' && data.trackId) {
          const filePath = path.join(process.cwd(), 'music_vault', `${data.trackId}.wav`);
          console.log(`[AUDIO STREAMER] Requested track: ${filePath}`);

          if (fs.existsSync(filePath)) {
             // Establish read stream with high water mark for low latency chunks
             const readStream = fs.createReadStream(filePath, { highWaterMark: 16384 });

             readStream.on('data', (chunk) => {
                 // Broadcast raw audio bytes autonomously to the connected socket
                 if (ws.readyState === ws.OPEN) {
                     ws.send(chunk);
                 }
             });

             readStream.on('end', () => {
                 console.log(`[AUDIO STREAMER] Track finished streaming.`);
                 if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'stream_end' }));
                 }
             });

             readStream.on('error', (err) => {
                 console.error('[AUDIO STREAMER] Stream read error:', err);
                 if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'stream_error', error: err.message }));
                 }
             });

             ws.on('close', () => {
                 // Cleanup stream if client disconnects abruptly
                 readStream.destroy();
                 console.log('[AUDIO STREAMER] Connection closed, destroyed stream.');
             });

          } else {
             console.warn(`[AUDIO STREAMER] File not found: ${filePath}`);
             ws.send(JSON.stringify({ type: 'stream_error', error: 'File not found' }));
          }
        }
      } catch (error) {
        console.error('[AUDIO STREAMER] Error parsing message:', error);
      }
    });

    ws.on('error', (error) => {
       console.error('[AUDIO STREAMER] WebSocket Error:', error);
    });
  });

  return wss;
}
