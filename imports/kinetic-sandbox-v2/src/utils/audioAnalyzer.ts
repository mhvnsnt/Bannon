import * as THREE from 'three';

export class AudioFormantAnalyzer {
    private ctx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Float32Array | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    public isActive: boolean = false;

    async initialize() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 2048; // crisp resolution
            this.analyser.smoothingTimeConstant = 0.8; 
            
            this.source = this.ctx.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
            
            this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
            this.isActive = true;
        } catch(e: any) {
            console.warn("Audio capture failed:", e);
            alert(`Microphone error: ${e.message || ''}`);
        }
    }

    getFormants() {
        if (!this.isActive || !this.analyser || !this.dataArray || !this.ctx) return { jawOpen: 0, mouthSmile: 0, amplitude: 0 };
        
        this.analyser.getFloatFrequencyData(this.dataArray);
        
        // Find rough frequency bands
        // Formant 1 (jaw drop/openness) ~ 300Hz to 1000Hz
        // Formant 2 (tongue/smile) ~ 1000Hz to 2500Hz
        
        const sampleRate = this.ctx.sampleRate;
        const binSize = (sampleRate / 2) / this.analyser.frequencyBinCount;
        
        let f1Sum = 0;
        let f2Sum = 0;
        let totalAmpSum = 0;
        let count1 = 0;
        let count2 = 0;

        for(let i=0; i<this.dataArray.length; i++) {
            const freq = i * binSize;
            const amp = Math.max(0, this.dataArray[i] + 100); // normalize somewhat above noise floor
            
            totalAmpSum += amp;

            if (freq >= 300 && freq <= 1000) {
                f1Sum += amp;
                count1++;
            } else if (freq > 1000 && freq <= 2500) {
                f2Sum += amp;
                count2++;
            }
        }
        
        const f1Avg = count1 > 0 ? f1Sum / count1 : 0;
        const f2Avg = count2 > 0 ? f2Sum / count2 : 0;
        const totalAvg = totalAmpSum / this.dataArray.length;

        // Map these roughly to blendshapes:
        // Huge amplitude = raw aggression scream, max jaw
        const normalizedAmp = Math.min(1.0, totalAvg / 40.0); 
        const jawOpen = Math.min(1.0, f1Avg / 50.0) * normalizedAmp * 2.0;
        const mouthSmile = Math.min(1.0, f2Avg / 40.0) * normalizedAmp;

        return {
            jawOpen: Math.min(1.0, jawOpen),
            mouthSmile: Math.min(1.0, mouthSmile),
            amplitude: normalizedAmp
        };
    }

    destroy() {
        if (this.ctx) this.ctx.close();
        this.isActive = false;
    }
}
