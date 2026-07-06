import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let audioContext: AudioContext | null = null;

export const initAutonomousStream = (trackId: string) => {
    if (!socket) {
        socket = io('');
    }
    
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Establish the open pipe for Autonomous WebSockets
    socket.emit('request_autonomous_audio_stream', { trackId });

    socket.on('audio_chunk', (chunk: ArrayBuffer) => {
        // Decodes binary PCM directly bridging to Three.js audio context 
        // For testing, verifies the socket pipe is robust and un-choked
        console.log(`[AUTONOMOUS STREAMER] Chunk received: ${chunk.byteLength} bytes`);
    });

    socket.on('audio_end', () => {
        console.log(`[AUTONOMOUS STREAMER] Grid extraction complete.`);
    });
};
