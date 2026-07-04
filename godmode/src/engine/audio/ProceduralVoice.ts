export class WebAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  
  constructor() {
    // Lazy-load AudioContext to avoid browser autoplay restrictions blocking instantiation
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.oscillator = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      
      this.oscillator.type = 'sine';
      this.oscillator.start();
      this.gainNode.gain.value = 0; // start muted
    }
  }

  public updateVocalTract(basePitch: number, saturation: number) {
    if (!this.ctx) this.init();
    if (this.ctx && this.oscillator && this.gainNode) {
        // Modulate pitch based on clinical physics and strain
        this.oscillator.frequency.setTargetAtTime(basePitch, this.ctx.currentTime, 0.1);
        
        // Saturation directly impacts gain volume
        const volumeTarget = Math.min(0.5, saturation * 0.5);
        this.gainNode.gain.setTargetAtTime(volumeTarget, this.ctx.currentTime, 0.1);
    }
  }
}
