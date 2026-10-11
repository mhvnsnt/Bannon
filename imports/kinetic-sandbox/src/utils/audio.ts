// Procedural Audio Engine for Kinetic Feedback
let audioCtx: AudioContext | null = null;
let globalFormantFilter: BiquadFilterNode | null = null;

let respirationNoiseNode: AudioBufferSourceNode | null = null;
let respirationGainNode: GainNode | null = null;
let respirationFilter: BiquadFilterNode | null = null;
let isRespirationActive = false;

export function updateRespiratoryAudio(chestVolume: number, currentStrain: number, systemSaturation: number) {
    if (!audioCtx) return;

    if (!isRespirationActive) {
        // Init continuous white noise loop
        const bufferSize = audioCtx.sampleRate * 2.0; // 2 seconds
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // White noise
            output[i] = Math.random() * 2 - 1;
        }

        respirationNoiseNode = audioCtx.createBufferSource();
        respirationNoiseNode.buffer = noiseBuffer;
        respirationNoiseNode.loop = true;

        respirationFilter = audioCtx.createBiquadFilter();
        respirationFilter.type = 'bandpass';
        respirationFilter.Q.value = 1.5;

        respirationGainNode = audioCtx.createGain();
        respirationGainNode.gain.value = 0.0;

        respirationNoiseNode.connect(respirationFilter);
        respirationFilter.connect(respirationGainNode);
        
        if (globalFormantFilter) {
            respirationGainNode.connect(globalFormantFilter);
        } else {
            respirationGainNode.connect(audioCtx.destination);
        }
        
        respirationNoiseNode.start(0);
        isRespirationActive = true;
    }

    if (respirationFilter && respirationGainNode) {
        // Map chest volume (0.5 to 0.8) to amplitude
        // It peaks during inhalation and exhalation (derivative of volume)
        // But since we just have volume, we can map High Vol => Exhale peak, Low Vol => Inhale peak.
        // Even simpler: just map the delta. Since we don't have delta here, we can pulse volume based on chestVolume.
        
        // Let's use the raw chestVolume. It oscillates via Math.sin in Autonomic System.
        // It goes from ~0.2 up to ~1.0
        // The sine wave is centered at baseVolume. We can use the absolute slope of the wave,
        // but we only have instantaneous volume.
        // Let's create an artificial derivative hack using time.
        const t = audioCtx.currentTime;
        const breathCycle = (t * (12 + (systemSaturation * 30)) / 60) * Math.PI * 2;
        const chestDeriv = Math.abs(Math.cos(breathCycle)); // Speed of air
        
        // Pitch/Frequency of the gasp: Strain + Arousal shifts it higher (tighter throat)
        const baseFreq = 800 + (systemSaturation * 1500) + (currentStrain * 1000);
        respirationFilter.frequency.setTargetAtTime(baseFreq, t, 0.1);
        
        // Amplitude: Faster air = louder gasp.
        // Arousal (saturation) makes the baseline gasp louder.
        const targetVol = (chestDeriv * 0.1) * (0.1 + systemSaturation * 0.4 + currentStrain * 0.2);
        respirationGainNode.gain.setTargetAtTime(targetVol, t, 0.05);
    }
}

export function initProceduralAudio() {
  if (!audioCtx) {
    audioCtx = new window.AudioContext();
    
    // Audio Context Resurrection
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    });

    // Create the global formant filter for the facial resonance
    globalFormantFilter = audioCtx.createBiquadFilter();
    globalFormantFilter.type = 'lowpass';
    globalFormantFilter.frequency.value = 5000;
    globalFormantFilter.Q.value = 1.0;
    globalFormantFilter.connect(audioCtx.destination);
  }
}

export function updateGlobalFormant(jawOpenAmount: number) {
  if (!audioCtx || !globalFormantFilter) return;
  // Map jawOpen (0 to 1) to frequency shifts
  // Closed (0) -> Nasal/muffled (~500Hz)
  // Open (1) -> Broad/Resonant (~2000Hz up to 5000Hz lowpass)
  const minFreq = 500;
  const maxFreq = 5000;
  const targetFreq = minFreq + (maxFreq - minFreq) * jawOpenAmount;
  globalFormantFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);
}

export function triggerImpactAudio(velocity: number) {
  if (!audioCtx) return;
  
  // Velocity is typically a small number (0.01 to 0.5) based on physics delta
  const normalizedImpact = Math.min(1.0, Math.max(0.0, velocity * 10)); // Scale velocity
  
  if (normalizedImpact < 0.05) return; // Ignore micro-collisions

  const t = audioCtx.currentTime;

  // Synthesize a kick / thud sound
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // Route: Osc -> Gain -> Formant Filter
  if (globalFormantFilter) {
      gainNode.connect(globalFormantFilter);
  } else {
      gainNode.connect(audioCtx.destination);
  }

  // Deep rumble for soft hits, sharper crack for hard hits
  const baseFreq = 50 + (normalizedImpact * 100);
  
  osc.frequency.setValueAtTime(baseFreq, t);
  osc.frequency.exponentialRampToValueAtTime(10, t + 0.1); // pitch drop

  // Volume curve
  gainNode.gain.setValueAtTime(normalizedImpact * 0.5, t); // scale volume by impact
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.2); // short decay

  osc.type = 'sine';
  
  // Add some distortion noise for the tearing/slapping sound with a buffer
  if (normalizedImpact > 0.5) {
      const bufferSize = audioCtx.sampleRate * 0.1; // 100ms noise
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // fade out noise
      }
      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(normalizedImpact * 0.2, t);
      if (globalFormantFilter) {
          noiseGain.connect(globalFormantFilter);
      } else {
          noiseGain.connect(audioCtx.destination);
      }
      noiseSource.start(t);
  }

  osc.start(t);
  osc.stop(t + 0.2);
}

export function applyDopplerEffect(sourceVelocity: {x: number, y: number, z: number}, srcPos: {x: number, y: number, z: number}, cameraPos: {x: number, y: number, z: number}, osc: OscillatorNode) {
    if (!audioCtx) return;
    
    // v = speed of sound (approx 343 m/s)
    const v = 343.0; 
    
    // Project source velocity vector onto the line from source to camera
    const vectorToCamera = {
        x: cameraPos.x - srcPos.x, 
        y: cameraPos.y - srcPos.y,
        z: cameraPos.z - srcPos.z
    };
    
    const magnitude = Math.sqrt(vectorToCamera.x*vectorToCamera.x + vectorToCamera.y*vectorToCamera.y + vectorToCamera.z*vectorToCamera.z);
    if(magnitude > 0) {
        const projVelocity = (sourceVelocity.x * vectorToCamera.x + sourceVelocity.y * vectorToCamera.y + sourceVelocity.z * vectorToCamera.z) / magnitude;
        // The Doppler Equation
        const dopplerShift = v / (v - projVelocity);
        
        // Feed the relative speed directly into the Web Audio playback rate
        const clampedShift = Math.max(0.1, Math.min(dopplerShift, 3.0));
        
        // For oscillators, we shift frequency instead of playbackRate
        const currentFreq = osc.frequency.value;
        osc.frequency.setTargetAtTime(currentFreq * clampedShift, audioCtx.currentTime, 0.05);
    }
}

// Dynamic Formant Acoustic Resonance
// Biquad filter that shifts resonant frequencies based on the jawOpen parameter.
// Wide open jaw = higher frequency resonance, closed jaw/tight cheeks = muffled/nasal
export function createFormantFilter(): BiquadFilterNode | null {
    if (!audioCtx) return null;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 2.0;
    return filter;
}

export function updateFormantFilter(filter: BiquadFilterNode, jawOpenAmount: number) {
    if (!audioCtx) return;
    // Map jawOpen (0 to 1) to frequency shifts
    // Closed (0) -> Nasal/muffled (~500Hz)
    // Open (1) -> Broad/Resonant (~2000Hz)
    const minFreq = 500;
    const maxFreq = 2000;
    const targetFreq = minFreq + (maxFreq - minFreq) * jawOpenAmount;
    
    filter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);
}
