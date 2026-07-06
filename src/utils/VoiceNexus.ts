export class VoiceNexus {
    private audioCtx: AudioContext;
    private analyser: AnalyserNode;
    private dataArray: Uint8Array;
    private source: AudioNode | null = null;
    private isSpeakingState: boolean = false;
    
    constructor() {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    /**
     * Algorithmic Formant Speech Synthesizer
     * Uses real-time oscillator waves and formant filter bands (F1, F2) to procedurally synthesize
     * phonetic human speech. Connects directly to the FFT AnalyserNode to drive real physics.
     */
    public async synthesizeWASM(text: string) {
        if (this.isSpeakingState) {
            this.stop();
        }
        this.isSpeakingState = true;

        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        const words = text.toLowerCase().split(/\s+/);
        let timeOffset = this.audioCtx.currentTime + 0.1;

        for (const word of words) {
            for (let i = 0; i < word.length; i++) {
                const char = word[i];
                let f1 = 500;
                let f2 = 1500;
                let duration = 0.08;
                let noiseMix = 0.1; // Consonants get more noise

                if (char === 'a') { f1 = 730; f2 = 1090; duration = 0.15; noiseMix = 0.01; }
                else if (char === 'e') { f1 = 530; f2 = 1840; duration = 0.14; noiseMix = 0.01; }
                else if (char === 'i') { f1 = 270; f2 = 2290; duration = 0.14; noiseMix = 0.01; }
                else if (char === 'o') { f1 = 570; f2 = 840; duration = 0.16; noiseMix = 0.01; }
                else if (char === 'u') { f1 = 300; f2 = 870; duration = 0.15; noiseMix = 0.01; }
                else if (['s', 'f', 'h', 'x', 'c'].includes(char)) {
                    f1 = 2000; f2 = 4000; duration = 0.07; noiseMix = 0.9;
                } else if (['p', 't', 'k', 'b', 'd', 'g'].includes(char)) {
                    f1 = 100; f2 = 300; duration = 0.04; noiseMix = 0.8;
                } else {
                    f1 = 400; f2 = 1200; duration = 0.06; noiseMix = 0.3;
                }

                this.playPhoneme(f1, f2, noiseMix, duration, timeOffset);
                timeOffset += duration + 0.02;
            }
            timeOffset += 0.15; // Space between words
        }

        setTimeout(() => {
            this.isSpeakingState = false;
        }, (timeOffset - this.audioCtx.currentTime) * 1000);
    }

    private playPhoneme(f1: number, f2: number, noiseMix: number, duration: number, startTime: number) {
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, startTime);
        osc.frequency.linearRampToValueAtTime(115, startTime + duration);

        const bufferSize = Math.max(1, Math.floor(this.audioCtx.sampleRate * duration));
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        const oscGain = this.audioCtx.createGain();
        const noiseGain = this.audioCtx.createGain();

        oscGain.gain.setValueAtTime(1.0 - noiseMix, startTime);
        noiseGain.gain.setValueAtTime(noiseMix, startTime);

        const filter1 = this.audioCtx.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.Q.setValueAtTime(8, startTime);
        filter1.frequency.setValueAtTime(f1, startTime);

        const filter2 = this.audioCtx.createBiquadFilter();
        filter2.type = 'bandpass';
        filter2.Q.setValueAtTime(8, startTime);
        filter2.frequency.setValueAtTime(f2, startTime);

        const envelope = this.audioCtx.createGain();
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        envelope.gain.setValueAtTime(0.3, startTime + duration - 0.01);
        envelope.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(oscGain);
        noise.connect(noiseGain);

        oscGain.connect(filter1);
        noiseGain.connect(filter1);

        oscGain.connect(filter2);
        noiseGain.connect(filter2);

        filter1.connect(envelope);
        filter2.connect(envelope);

        envelope.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        noise.start(startTime);
        noise.stop(startTime + duration);
    }

    public async speak(text: string) {
        await this.synthesizeWASM(text);
    }

    public playAudioBuffer(buffer: AudioBuffer) {
        this.stop();
        
        const bufferSource = this.audioCtx.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        bufferSource.start(0);
        this.source = bufferSource;
    }

    public getMouthOpenness(): number {
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let sum = 0;
        const startBin = 2;
        const endBin = 20;
        for (let i = startBin; i < endBin; i++) {
            sum += this.dataArray[i];
        }
        const avg = sum / (endBin - startBin);
        const maxExpected = 130; 
        
        return Math.min(Math.max(avg / maxExpected, 0.0), 1.0);
    }

    public stop() {
        if (this.source) {
            try {
                (this.source as AudioScheduledSourceNode).stop();
            } catch (e) {}
            this.source.disconnect();
            this.source = null;
        }
        this.isSpeakingState = false;
    }
    
    public dispose() {
        this.stop();
        this.audioCtx.close();
    }
}
