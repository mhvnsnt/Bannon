// audioEngine.ts
import { useGodModeStore } from '../store/useGodModeStore';

export class AudioStimulusEngine {
  private audioCtx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // Core infrastructure remains uninitialized until explicit user command
  }

  public initializeEngine() {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.connect(this.audioCtx.destination);
  }

  public deployFrequencyVector(carrier: number, entrainmentOffset: number, type: OscillatorType) {
    if (!this.audioCtx || !this.masterGain) return;

    this.terminateActiveWaves();

    const splitter = this.audioCtx.createChannelMerger(2);
    
    // Left Channel: Carrier Frequency
    this.leftOsc = this.audioCtx.createOscillator();
    this.leftOsc.type = type;
    this.leftOsc.frequency.value = carrier;

    // Right Channel: Carrier + Targeted Entrainment Offset (Delta, Theta, Beta)
    this.rightOsc = this.audioCtx.createOscillator();
    this.rightOsc.type = type;
    this.rightOsc.frequency.value = carrier + entrainmentOffset;

    // Route signals to discrete stereo channels
    this.leftOsc.connect(splitter, 0, 0);
    this.rightOsc.connect(splitter, 0, 1);
    
    splitter.connect(this.masterGain);

    this.leftOsc.start();
    this.rightOsc.start();
  }

  public adjustVolume(intensity: number) {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.linearRampToValueAtTime(intensity, this.audioCtx.currentTime + 0.1);
    }
  }

  public terminateActiveWaves() {
    if (this.leftOsc) { try { this.leftOsc.stop(); } catch(e){} this.leftOsc.disconnect(); }
    if (this.rightOsc) { try { this.rightOsc.stop(); } catch(e){} this.rightOsc.disconnect(); }
  }
}

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;

export const initializeGlobalAudio = (audioElement: HTMLAudioElement) => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.78;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const source = audioCtx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
    
    return { audioCtx, analyser, dataArray };
};

export const analyzeFrequencies = () => {
    if (!analyser || !dataArray) return;
    analyser.getByteFrequencyData(dataArray);
    
    let bassSum = 0;
    const bassLimit = Math.floor(dataArray.length * 0.10);
    for (let i = 0; i < bassLimit; i++) {
        bassSum += dataArray[i];
    }
    
    const rawBass = (bassSum / bassLimit) / 255;
    // Broadcast the raw frequency directly to the global nervous system
    useGodModeStore.getState().setAudioPulse(rawBass);
};
