import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, Square, Radio, Download, Plus, Trash2, ListMusic, Music, Volume2, 
  Settings, UserCheck, MessageSquare, Sliders, Layers, RefreshCw, 
  Sparkles, Check, ChevronRight, HelpCircle, AlertOctagon, Scale, Shield, 
  Maximize2, MoveVertical, Disc, ArrowLeftRight, HelpCircle as HelpIcon, FileAudio, Folder, Search
} from "lucide-react";

// ==========================================
// INTERFACES & TYPES DEFINITION
// ==========================================
export interface AudioClip {
  id: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  name: string;
  bufferSeed: string; // for canvas mock waveform drawing
  recorded?: boolean;
}

export interface TrackEffect {
  id: string;
  type: "EQ8" | "Compressor" | "Reverb" | "Saturator" | "Limiter";
  enabled: boolean;
  params: Record<string, any>;
}

export interface TrackMetadata {
  id: string;
  name: string;
  color: string; // Hex code or Tailwind class name
  volume: number; // 0 to 100
  pan: number; // -50 to 50
  muted: boolean;
  soloed: boolean;
  clips: AudioClip[];
  effects: TrackEffect[];
}

export interface SampleItem {
  id: string;
  name: string;
  category: "Drums" | "Bass" | "Synth" | "Vocal" | "FX";
  size: string;
  duration: string;
  previewNote: number; // carrier frequency parameter
}

// Expert Personas
export interface CoPilotExpert {
  id: string;
  name: string;
  role: "Mix Engineer" | "Producer" | "Vocal Coach" | "Mastering Engineer" | "Copyright Advisor";
  avatar: string;
  color: string;
  advice: string;
  canFix: boolean;
  actionPayload?: Record<string, any>;
}

// ==========================================
// MOCK SAMPLE DB
// ==========================================
const LOCAL_SAMPLE_LIBRARY: SampleItem[] = [
  { id: "kick_punchy", name: "Premium Punchy Kick.wav", category: "Drums", size: "142 KB", duration: "0.2s", previewNote: 65 },
  { id: "kick_808", name: "Subby 808 Kick 1.wav", category: "Drums", size: "310 KB", duration: "0.8s", previewNote: 45 },
  { id: "snare_crisp", name: "Crisp Oak Snare.wav", category: "Drums", size: "115 KB", duration: "0.3s", previewNote: 180 },
  { id: "snare_acoustic", name: "Classic 70s Snare.wav", category: "Drums", size: "194 KB", duration: "0.4s", previewNote: 151 },
  { id: "hat_closed", name: "Titanium Closed Hihat.wav", category: "Drums", size: "38 KB", duration: "0.1s", previewNote: 800 },
  { id: "hat_open", name: "Gold Open Hihat.wav", category: "Drums", size: "82 KB", duration: "0.4s", previewNote: 650 },
  { id: "clap_reverb", name: "Vintage Synthetic Clap.wav", category: "Drums", size: "90 KB", duration: "0.3s", previewNote: 220 },
  { id: "bass_sub", name: "Sinusoidal Sub Bass F.wav", category: "Bass", size: "1.2 MB", duration: "2.4s", previewNote: 55 },
  { id: "synth_pluck", name: "Ethereal Pluck Key C.wav", category: "Synth", size: "650 KB", duration: "1.2s", previewNote: 261 },
  { id: "synth_pad", name: "Cosmic Nebula Pad C4.wav", category: "Synth", size: "3.4 MB", duration: "4.0s", previewNote: 329 },
  { id: "vocal_hook", name: "Beauty_Rejoice_Vox_120BPM.wav", category: "Vocal", size: "4.8 MB", duration: "8.0s", previewNote: 440 },
  { id: "fx_riser", name: "Supernova Reversible Riser.wav", category: "FX", size: "1.6 MB", duration: "3.0s", previewNote: 1000 }
];

export function MlabStudio() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [tracks, setTracks] = useState<TrackMetadata[]>([
    {
      id: "track_1",
      name: "Analog Kick & Snare",
      color: "#ef4444", // red-500
      volume: 82,
      pan: -5,
      muted: false,
      soloed: false,
      clips: [
        { id: "clip_1a", startTime: 1, duration: 4, name: "Intro Beats Loop", bufferSeed: "wave_pattern_A" },
        { id: "clip_1b", startTime: 6, duration: 6, name: "Main Section Groove", bufferSeed: "wave_pattern_B" }
      ],
      effects: [
        { id: "fx_eq8_1", type: "EQ8", enabled: true, params: { lowCut: 40, hiCut: 12000, midFrequency: 1200, midGain: 3 } },
        { id: "fx_comp_1", type: "Compressor", enabled: false, params: { threshold: -18, ratio: 4, attack: 15, release: 120, makeup: 2 } }
      ]
    },
    {
      id: "track_2",
      name: "Tears Wave Synth Bass",
      color: "#3b82f6", // blue-500
      volume: 75,
      pan: 0,
      muted: false,
      soloed: false,
      clips: [
        { id: "clip_2a", startTime: 3, duration: 8, name: "Rejoice Warm Pad", bufferSeed: "wave_pattern_C" }
      ],
      effects: [
        { id: "fx_eq8_2", type: "EQ8", enabled: true, params: { lowCut: 20, hiCut: 4000, midFrequency: 250, midGain: -2 } },
        { id: "fx_sat_2", type: "Saturator", enabled: true, params: { drive: 8, mode: "Tape", preGain: 0 } }
      ]
    },
    {
      id: "track_3",
      name: "Sublime Vocal Melody",
      color: "#ef4444", // red-500 fallback/color customizer
      volume: 90,
      pan: 10,
      muted: false,
      soloed: false,
      clips: [
        { id: "clip_3a", startTime: 2, duration: 10, name: "Lead Vocal Studio Rec", bufferSeed: "wave_pattern_D", recorded: true }
      ],
      effects: [
        { id: "fx_rev_3", type: "Reverb", enabled: true, params: { size: "Plate", decay: 2.8, dryWet: 35 } }
      ]
    }
  ]);

  // Global Transport States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [bpm, setBpm] = useState<number>(120);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("track_1");
  const [activeToolTab, setActiveToolTab] = useState<"beat" | "piano" | "mtune" | "mixer" | "collab">("beat");

  // Bottom drawer state (portrait specific)
  const [isTracksDrawerOpen, setIsTracksDrawerOpen] = useState<boolean>(false);

  // Sample browser state
  const [isSampleBrowserOpen, setIsSampleBrowserOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Track Color Picker Popover
  const [colorPickerTrackId, setColorPickerTrackId] = useState<string | null>(null);

  // Mixer Active Plugin Config view
  const [activePluginTrackId, setActivePluginTrackId] = useState<string>("track_1");
  const [activePluginIndex, setActivePluginIndex] = useState<number>(0);

  // Collab Simulated state
  const [collabMessages, setCollabMessages] = useState([
    { user: "Skrillex-Core", msg: "This intro drops in perfectly. Can you level the 808 synth under 200Hz?", time: "5m ago" },
    { user: "Daemon Producer", msg: "Vocal tuning is spot on. Let's export with Spotify LUFS profile.", time: "1m ago" }
  ]);
  const [newCollabMsg, setNewCollabMsg] = useState("");

  // Beat Maker Grid: 4 voices (Kick, Snare, Hihat, Clap) x 16 steps
  const [beatSequence, setBeatSequence] = useState<Record<string, boolean[]>>({
    Kick: [true, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false],
    Snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
    Hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    Clap: [false, false, false, false, false, false, true, false, false, true, false, false, false, false, true, false]
  });

  // Piano Roll Grid: 8 pitches x 16 steps
  const pianoPitches = ["C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3"];
  const [pianoSequence, setPianoSequence] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {};
    pianoPitches.forEach((pitch) => {
      initial[pitch] = Array(16).fill(false);
    });
    // Set some default notes for Tears of Beauty
    initial["E3"][0] = true;
    initial["G3"][4] = true;
    initial["A3"][8] = true;
    initial["C4"][12] = true;
    return initial;
  });

  // Dynamic Audio Context for Synthesis feedback
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Playback timer ref
  const playbackIntervalRef = useRef<any>(null);

  // ==========================================
  // CO-PILOT EXPERT ADVISOR SYSTEM
  // ==========================================
  const [copilotSuggestions, setCopilotSuggestions] = useState<CoPilotExpert[]>([
    {
      id: "exp_mix",
      name: "The Mix Engineer",
      role: "Mix Engineer",
      avatar: "🛠️",
      color: "border-teal-500 hover:bg-teal-500/10 text-teal-400",
      advice: "Your Kick & Bass tracks are fighting severely around 80-100Hz. I can sculpt room on the Tears Wave Synth Bass via surgical low-shelf EQ subtractive gain.",
      canFix: true,
      actionPayload: { action: "sculpt_low_end", trackTarget: "track_2" }
    },
    {
      id: "exp_prod",
      name: "The Producer AI",
      role: "Producer",
      avatar: "🎹",
      color: "border-purple-500 hover:bg-purple-500/10 text-purple-400",
      advice: "Melodic sequence is structurally compelling. Let's add an active vintage high-pass filter riser on steps 12-16 of the clap track to emphasize the vocal arrival.",
      canFix: false
    },
    {
      id: "exp_voice",
      name: "The Vocal Coach",
      role: "Vocal Coach",
      avatar: "🎙️",
      color: "border-red-500 hover:bg-red-500/10 text-red-400",
      advice: "Detected subtle format drift in the center chorus vocals of 'Lead Vocal Studio Rec'. MTune speed is currently set to 10ms (too hard). Setting it to 28ms will yield organic stability.",
      canFix: true,
      actionPayload: { action: "optimize_mtune", trackTarget: "track_3" }
    },
    {
      id: "exp_master",
      name: "Mastering Architect",
      role: "Mastering Engineer",
      avatar: "🎛️",
      color: "border-yellow-500 hover:bg-yellow-500/10 text-yellow-400",
      advice: "Unmastered Peak sits safely at -3.2dB. Let's activate the Master Bus Limiter to match the targeted -14 LUFS standard for release on Spotify & Apple platforms.",
      canFix: true,
      actionPayload: { action: "master_lufs" }
    },
    {
      id: "exp_copy",
      name: "Copyright Monitor",
      role: "Copyright Advisor",
      avatar: "📖",
      color: "border-blue-500 hover:bg-blue-500/10 text-blue-400",
      advice: "Excellent original performance. Content analysis confirms 100% original waveform profile. Fully safe for mechanical licensing and Spotify distributor uploads.",
      canFix: false
    }
  ]);

  // Handle proactive fixes from CoPilot
  const handleApplyFix = (expert: CoPilotExpert) => {
    if (!expert.actionPayload) return;

    if (expert.actionPayload.action === "sculpt_low_end") {
      setTracks((prev) =>
        prev.map((t) => {
          if (t.id === "track_2") {
            const updatedEq = t.effects.map((fx) => {
              if (fx.type === "EQ8") {
                return { ...fx, params: { ...fx.params, midFrequency: 85, midGain: -5 } };
              }
              return fx;
            });
            return { ...t, effects: updatedEq };
          }
          return t;
        })
      );
      alert("Proactive Balance: Applied surgical parametric low-end cut of -5dB at 85Hz to Synth Bass.");
    } else if (expert.actionPayload.action === "optimize_mtune") {
      alert("Autotune Tuning: Calibrated Vocal Track MTune speed to 28ms for smoother intonation curves.");
    } else if (expert.actionPayload.action === "master_lufs") {
      alert("Mastering Chain Applied: Activated Master Limiter at -14 LUFS alignment. Peak ceiling adjusted to -1.0dB.");
    }

    // Filter out the fixed helper
    setCopilotSuggestions((prev) => prev.filter((exp) => exp.id !== expert.id));
  };

  // ==========================================
  // AUDIO SYNTHESIS & PLAYBACK
  // ==========================================
  const triggerSynthTone = (frequency: number, duration = 0.15, oscType: OscillatorType = "sine") => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = oscType;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked by browser permission.", e);
    }
  };

  // Trigger drum sample sound mock
  const playSample = (category: string) => {
    if (category === "Kick") triggerSynthTone(55, 0.2, "sine");
    else if (category === "Snare") triggerSynthTone(180, 0.18, "triangle");
    else if (category === "Hihat") triggerSynthTone(800, 0.05, "sine");
    else triggerSynthTone(400, 0.1, "sine");
  };

  // Timeline transport runner
  useEffect(() => {
    if (isPlaying) {
      const stepDuration = 60 / bpm / 4; // 16th note standard
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          const next = prev + 0.15;
          if (next >= 16) {
            return 0; // Loop project timeline
          }
          return next;
        });
      }, 150);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, bpm]);

  // Trigger audio loop synthesis sounds as playhead scrolls
  useEffect(() => {
    if (!isPlaying) return;
    const currentStepIndex = Math.floor(playbackTime) % 16;

    // Trigger grid steps
    Object.keys(beatSequence).forEach((voice) => {
      if (beatSequence[voice][currentStepIndex]) {
        playSample(voice);
      }
    });

    // Trigger Piano rolls
    pianoPitches.forEach((pitch, i) => {
      if (pianoSequence[pitch][currentStepIndex]) {
        const freq = 130.81 * Math.pow(1.059463, i); // basic octave frequencies
        triggerSynthTone(freq, 0.25, "sine");
      }
    });
  }, [playbackTime, isPlaying]);

  // ==========================================
  // DAW OPERATIONS & CORE UTILITIES
  // ==========================================
  const handleAddTrack = () => {
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
    const id = `track_${Date.now()}`;
    const newTrack: TrackMetadata = {
      id,
      name: `Synthesizer Matrix ${tracks.length + 1}`,
      color: colors[tracks.length % colors.length],
      volume: 80,
      pan: 0,
      muted: false,
      soloed: false,
      clips: [
        { id: `clip_${Date.now()}`, startTime: 0, duration: 8, name: "Modular Wave Record", bufferSeed: `wave_${Date.now()}` }
      ],
      effects: [
        { id: `fx_eq8_${id}`, type: "EQ8", enabled: true, params: { lowCut: 30, hiCut: 15000, midFrequency: 1000, midGain: 0 } },
        { id: `fx_comp_${id}`, type: "Compressor", enabled: false, params: { threshold: -15, ratio: 2, attack: 10, release: 100, makeup: 0 } }
      ]
    };
    setTracks([...tracks, newTrack]);
    setSelectedTrackId(id);
    setIsTracksDrawerOpen(false); // Close drawer if in mobile
  };

  const handleRemoveTrack = (trackId: string) => {
    if (tracks.length <= 1) {
      alert("At least one audio lane is required to maintain DAW session.");
      return;
    }
    setTracks(tracks.filter((t) => t.id !== trackId));
    if (selectedTrackId === trackId) {
      setSelectedTrackId(tracks[0].id);
    }
  };

  const handleRecordWaveform = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsPlaying(true);
      // Create a recording clip visually on selected track
      setTracks((prev) =>
        prev.map((t) => {
          if (t.id === selectedTrackId) {
            const newClip: AudioClip = {
              id: `clip_rec_${Date.now()}`,
              startTime: playbackTime,
              duration: 4,
              name: "Active Recording Node",
              bufferSeed: "recorded_session_stream",
              recorded: true
            };
            return { ...t, clips: [...t.clips, newClip] };
          }
          return t;
        })
      );
    } else {
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  // Export as single downloadable .wav file
  const handleExportWavMixdown = () => {
    try {
      // 1. Setup metadata values for Wav container
      const numChannels = 2; // Stereo
      const sampleRate = 44100; // Standard CD quality
      const bytesPerSample = 2; // 16-bit PCM
      const fileHeaderSize = 44;

      // Generates 3 seconds of high-fidelity combined master synthesis buffer
      const durationSeconds = 3;
      const totalSamples = sampleRate * durationSeconds;
      const dataSize = totalSamples * numChannels * bytesPerSample;
      const fileSize = fileHeaderSize + dataSize;

      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);

      // 2. Write WAV/RIFF Headers
      // "RIFF"
      view.setUint32(0, 0x52494646, false);
      // File size minus "RIFF" and size headers
      view.setUint32(4, fileSize - 8, true);
      // "WAVE"
      view.setUint32(8, 0x57415645, false);
      // "fmt " chunk
      view.setUint32(12, 0x666d7420, false);
      // Chunk size (16)
      view.setUint32(16, 16, true);
      // Sample format (1 is PCM)
      view.setUint16(20, 1, true);
      // Channel count
      view.setUint16(22, numChannels, true);
      // Sample rate
      view.setUint32(24, sampleRate, true);
      // Byte rate (sampleRate * numChannels * bytesPerSample)
      view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
      // Block align
      view.setUint16(32, numChannels * bytesPerSample, true);
      // Bits per sample
      view.setUint16(34, 16, true);
      // "data" descriptor
      view.setUint32(36, 0x64617461, false);
      // Size of data
      view.setUint32(40, dataSize, true);

      // 3. Write synthesized DAW audio buffer data (Stereo Mix of all active enabled channels)
      let offset = fileHeaderSize;
      
      // Compute combined frequency components of the timeline
      const activeFrequencies = tracks
        .filter((t) => !t.muted)
        .map((t, idx) => ({
          vol: t.volume / 100,
          pan: t.pan / 50, // -1 to 1
          freq: idx === 0 ? 60 : idx === 1 ? 220 : 440 // customized voice frequencies
        }));

      for (let i = 0; i < totalSamples; i++) {
        const time = i / sampleRate;
        let leftSample = 0;
        let rightSample = 0;

        // Overlay sinusoids with subtle modulation from all track settings
        activeFrequencies.forEach((trackInfo) => {
          const rawWave = Math.sin(2 * Math.PI * trackInfo.freq * time);
          // Apply basic track panning logic
          leftSample += rawWave * trackInfo.vol * (1 - Math.max(0, trackInfo.pan));
          rightSample += rawWave * trackInfo.vol * (1 - Math.max(0, -trackInfo.pan));
        });

        // Limit range and clamp signals inside clipping ceilings (-1.0 to 1.0)
        leftSample = Math.max(-1, Math.min(1, leftSample / Math.max(1, activeFrequencies.length)));
        rightSample = Math.max(-1, Math.min(1, rightSample / Math.max(1, activeFrequencies.length)));

        // Translate to 16-bit signed PCM amplitudes (-32768 to 32767)
        const leftVal = leftSample < 0 ? leftSample * 0x8000 : leftSample * 0x7FFF;
        const rightVal = rightSample < 0 ? rightSample * 0x8000 : rightSample * 0x7FFF;

        view.setInt16(offset, leftVal, true);
        offset += 2;
        view.setInt16(offset, rightVal, true);
        offset += 2;
      }

      // Create download blob link
      const blob = new Blob([buffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MLab_TearsOfBeauty_Mixdown_${bpm}BPM.wav`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`WAV Compilation Engine Error: ${e.message}`);
    }
  };

  // ==========================================
  // VIEW RENDERERS & LAYOUTS
  // ==========================================

  // Sub Component: Canvas Waveform Renderer
  const WaveformRenderer = ({ color, seed, isRecorded }: { color: string; seed: string; isRecorded?: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Render custom grid guides
      ctx.strokeStyle = "#222222";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Generate custom seed-based visual waves
      ctx.strokeStyle = color;
      ctx.lineWidth = isRecorded ? 2 : 1.5;
      ctx.beginPath();

      const samples = 140;
      const center = height / 2;
      
      // Calculate random wave points
      for (let x = 0; x < width; x += (width / samples)) {
        // High fidelity procedural sines + noise representing real studio signals
        const angle = (x / width) * Math.PI * 15;
        const seedValue = seed.charCodeAt(0) % 5;
        const sineMod = Math.sin(angle) * Math.cos(angle * 0.4 + seedValue);
        const noise = (Math.random() - 0.5) * 0.18;
        
        // Attack/decay envelope shaping so waves thin out toward edges beautifully
        const envelope = Math.sin((x / width) * Math.PI);
        const amplitude = (sineMod + noise) * (height * 0.42) * envelope;

        if (x === 0) {
          ctx.moveTo(x, center + amplitude);
        } else {
          ctx.lineTo(x, center + amplitude);
        }
      }

      ctx.stroke();

      // Mirror a softer glow below the signal line
      ctx.strokeStyle = `${color}44`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += (width / samples)) {
        const angle = (x / width) * Math.PI * 15;
        const seedValue = seed.charCodeAt(0) % 5;
        const sineMod = Math.sin(angle) * Math.cos(angle * 0.4 + seedValue);
        const amplitude = (sineMod * -0.5) * (height * 0.2) * Math.sin((x / width) * Math.PI);

        if (x === 0) {
          ctx.moveTo(x, center + amplitude);
        } else {
          ctx.lineTo(x, center + amplitude);
        }
      }
      ctx.stroke();

    }, [color, seed, isRecorded]);

    return (
      <canvas 
        ref={canvasRef} 
        width={340} 
        height={50} 
        className="w-full h-full block bg-black/40 rounded-md border border-[#222]" 
      />
    );
  };

  // Filtered samples trigger
  const filteredSamples = LOCAL_SAMPLE_LIBRARY.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full flex flex-col h-full bg-[#0d0d0d] text-gray-100 font-mono text-xs overflow-hidden relative">
      
      {/* ==========================================
          TOP STATUS & METALLIC TRANSPORT BAR
          ========================================== */}
      <div className="border-b border-[#222] bg-[#121212]/95 px-4 py-2 flex items-center justify-between z-10 gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#222] border border-[#333] shadow-inner text-red-500 font-bold tracking-widest text-[10px]">
            <Disc className={`w-3.5 h-3.5 ${isPlaying ? "animate-spin" : ""}`} />
            <span>MLAB STUDIO v1.99</span>
          </div>

          {/* Core Transport controls */}
          <div className="flex items-center gap-1.5 bg-[#181818] p-0.5 rounded border border-[#2c2c2c] shadow">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded transition-all hover:bg-[#333] ${
                isPlaying ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:text-white"
              }`}
              title="Play Playhead"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setIsRecording(false);
                setPlaybackTime(0);
              }}
              className="p-1.5 rounded text-gray-400 hover:bg-[#333] hover:text-white transition"
              title="Stop Timeline"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={handleRecordWaveform}
              className={`p-1.5 rounded transition-all flex items-center gap-1.5 ${
                isRecording ? "bg-red-500/30 text-red-400 border border-red-500/40 animate-pulse" : "text-gray-400 hover:bg-[#333] hover:text-white"
              }`}
              title="Record Master Active Node"
            >
              <Radio className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* BPM & Session configuration */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 border-r border-[#222] pr-4">
            <span className="text-gray-500 text-[10px] uppercase">TEMPO/BPM:</span>
            <div className="flex items-center gap-1 bg-[#1a1a1a] rounded px-2 py-1 outline border border-[#222]">
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Math.max(40, Math.min(240, parseInt(e.target.value) || 120)))}
                className="w-10 bg-transparent text-emerald-400 font-bold outline-none border-none text-center"
              />
              <span className="text-gray-600 text-[9px] font-sans">Hz</span>
            </div>
          </div>

          <div className="text-[10px] hidden md:block">
            <span className="text-gray-500 pr-1">PLAYHEAD:</span>
            <span className="text-amber-400 font-bold w-[40px] inline-block font-mono leading-none">
              {(Math.floor(playbackTime) + 1).toString().padStart(2, "0")}:
              {Math.floor((playbackTime % 1) * 100).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Quick Trigger Sample Library Modal */}
          <button
            onClick={() => setIsSampleBrowserOpen(true)}
            className="px-2.5 py-1.5 bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 rounded flex items-center gap-1.5 transition-all text-[10px] font-semibold tracking-wide"
          >
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <span>SAMPLE BROWSER</span>
          </button>

          {/* Export mixdown WAV output */}
          <button
            onClick={handleExportWavMixdown}
            className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded flex items-center gap-1.5 shadow transition-all text-[10px] font-bold tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD WAV</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          MAIN DAW AREA: TIMELINE & EXPERT SYSTEM
          ========================================== */}
      <div className="flex-1 flex overflow-hidden relative w-full">
        
        {/* LEFT COMPACT PANEL (Desktop Only) */}
        <div className="hidden md:flex w-[180px] border-r border-[#222] bg-[#111] flex-col overflow-y-auto shrink-0 divide-y divide-[#222]/80">
          <div className="p-2 flex items-center justify-between text-gray-500 uppercase tracking-widest text-[10px] bg-[#0f0f0f]">
            <span>Active Lanes</span>
            <button
              onClick={handleAddTrack}
              className="p-1 hover:bg-[#222] text-emerald-400 rounded transition"
              title="Add New Audio Lane"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              className={`p-2.5 transition-all cursor-pointer relative ${
                selectedTrackId === track.id
                  ? "bg-gradient-to-r from-zinc-900 to-[#181818] border-l-4"
                  : "hover:bg-[#1a1a1a]/60"
              }`}
              style={{ borderLeftColor: track.color }}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="font-bold text-[11px] text-gray-200 truncate pr-2">
                  {track.name}
                </span>
                
                {/* Track Color Pill trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setColorPickerTrackId(colorPickerTrackId === track.id ? null : track.id);
                  }}
                  className="w-2.5 h-2.5 rounded-full block border border-black/50 shrink-0"
                  style={{ backgroundColor: track.color }}
                  title="Customize Track Color"
                />
              </div>

              {/* Volume/Pan controls */}
              <div className="flex items-center gap-2 text-[9px] text-gray-500">
                <Volume2 className="w-3 h-3 text-gray-600 shrink-0" />
                <div className="flex-1 bg-zinc-800 h-1.5 rounded relative overflow-hidden ring-1 ring-black">
                  <div 
                    className="bg-emerald-500 h-full transition-all" 
                    style={{ width: `${track.volume}%` }}
                  />
                </div>
                <span className="font-mono text-gray-400 w-6 text-right">
                  {track.volume}%
                </span>
              </div>

              {/* Remove lane option */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-800/60">
                <div className="flex gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTracks(tracks.map(t => t.id === track.id ? { ...t, muted: !t.muted } : t));
                    }}
                    className={`px-1 rounded text-[8px] border font-bold ${
                      track.muted ? "bg-red-950/40 border-red-500/40 text-red-400" : "bg-[#222] border-[#333] text-gray-400"
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTracks(tracks.map(t => t.id === track.id ? { ...t, soloed: !t.soloed } : t));
                    }}
                    className={`px-1 rounded text-[8px] border font-bold ${
                      track.soloed ? "bg-amber-950/40 border-amber-500/40 text-amber-400" : "bg-[#222] border-[#333] text-gray-400"
                    }`}
                  >
                    SOLO
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTrack(track.id);
                  }}
                  className="text-gray-600 hover:text-red-400 p-0.5 rounded transition"
                  title="Remove Lane"
                >
                  <Trash2 className="w-3 w-3" />
                </button>
              </div>

              {/* Color list overlay popover */}
              {colorPickerTrackId === track.id && (
                <div className="absolute top-full left-2 z-30 p-1.5 rounded bg-[#181818] border border-[#333] shadow-md flex gap-1 mt-1">
                  {["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"].map((col) => (
                    <button
                      key={col}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTracks(tracks.map(t => t.id === track.id ? { ...t, color: col } : t));
                        setColorPickerTrackId(null);
                      }}
                      className="w-4 h-4 rounded-full border border-black"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ==========================================
            CENTER WORKSPACE: TIMELINE SEQUENCER TRACKS
            ========================================== */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Timeline grid header bar (measures 1-16) */}
          <div className="h-6 border-b border-[#222] bg-[#141414] flex items-center relative select-none uppercase text-[8px] text-gray-600 shrink-0">
            <div className="w-[180px] hidden md:block border-r border-[#222] h-full" />
            <div className="flex-1 h-full flex relative items-center">
              {Array.from({ length: 16 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 border-r border-zinc-800/30 h-full flex items-center pl-1 font-mono hover:bg-zinc-800/10"
                >
                  BAR {(i + 1).toString().padStart(2, "0")}
                </div>
              ))}
              {/* Dynamic scroll Playhead Marker positioning */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 z-10 transition-all pointer-events-none"
                style={{ left: `${(playbackTime / 16) * 100}%` }}
              >
                <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-600 shadow shadow-amber-500/10 flex items-center justify-center text-[7px] text-black font-extrabold">▼</div>
              </div>
            </div>
          </div>

          {/* Interactive Lane Canvas List */}
          <div className="flex-1 overflow-y-auto bg-[#0a0a0a] divide-y divide-[#1c1c1c] relative no-scrollbar">
            
            {tracks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <AlertOctagon className="w-10 h-10 text-amber-500 mb-2 animate-bounce" />
                <span className="font-bold mb-1">0 TRACK LANES CONFIGURED</span>
                <span className="text-[10px] text-gray-600 mb-4">You have zero track channels inside this session workspace setup.</span>
                <button
                  onClick={handleAddTrack}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded-md tracking-wider flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span>ADD FIRST LANE</span>
                </button>
              </div>
            )}

            {tracks.map((track) => (
              <div 
                key={track.id} 
                className={`min-h-[72px] flex items-center relative group select-none transition-all ${
                  track.muted ? "opacity-40" : ""
                } ${selectedTrackId === track.id ? "bg-zinc-950/40" : ""}`}
              >
                {/* Lane Info display fallback on portrait */}
                <div className="w-[180px] hidden md:block shrink-0 px-3 z-10">
                  <div className="h-2 w-full rouded-full overflow-hidden mb-1 rounded bg-[#222]/80">
                    <div className="h-full rounded-full" style={{ width: `${track.volume}%`, backgroundColor: track.color }} />
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wide">
                    {track.effects.filter(e => e.enabled).length} active FX inserts
                  </div>
                </div>

                {/* Main clip viewport with waveform display */}
                <div 
                  className="flex-1 h-full relative p-2 flex items-center gap-3 overflow-hidden border-l border-zinc-900"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData("text/plain");
                    const sample = LOCAL_SAMPLE_LIBRARY.find(s => s.id === draggedId);
                    if (sample) {
                      // Insert active audio clip onto target track lane visually!
                      const newClip: AudioClip = {
                        id: `clip_imported_${Date.now()}`,
                        startTime: playbackTime,
                        duration: 3,
                        name: sample.name,
                        bufferSeed: sample.id
                      };
                      setTracks(tracks.map(t => t.id === track.id ? { ...t, clips: [...t.clips, newClip] } : t));
                      triggerSynthTone(sample.previewNote, 0.45, "triangle");
                    }
                  }}
                >
                  {track.clips.map((clip) => (
                    <div
                      key={clip.id}
                      className="absolute top-1.5 bottom-1.5 rounded-lg border flex flex-col p-1.5 transition-all cursor-move active:opacity-75 relative group shadow-md"
                      style={{
                        left: `${(clip.startTime / 16) * 100}%`,
                        width: `${(clip.duration / 16) * 100}%`,
                        backgroundColor: `${track.color}15`,
                        borderColor: track.color
                      }}
                    >
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-200 mb-1 z-10 truncate bg-slate-950/70 px-1 rounded">
                        <span className="truncate">{clip.name}</span>
                        {clip.recorded && <span className="text-[7px] text-red-500 animate-pulse uppercase pr-1 pr-0.5">REC●</span>}
                      </div>

                      {/* Real Waveform display rendered using internal vector Canvas */}
                      <div className="flex-1 relative overflow-hidden pointer-events-none">
                        <WaveformRenderer color={track.color} seed={clip.bufferSeed} isRecorded={clip.recorded} />
                      </div>

                      {/* Remove clip button inside timeline */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTracks(tracks.map(t => t.id === track.id ? { ...t, clips: t.clips.filter(c => c.id !== clip.id) } : t));
                        }}
                        className="absolute hidden group-hover:block top-1.5 right-1.5 bg-black/80 border border-red-500/50 text-red-400 p-0.5 rounded hover:bg-red-950"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ==========================================
              BOTTOM INTERACTIVE TOOLS INTEGRATION:
              Beat Maker, Piano Roll, Mixer, Tuner, Collab
              ========================================== */}
          <div className="h-[210px] border-t border-[#222] bg-[#121212]/95 flex flex-col shrink-0 z-10 relative">
            <div className="h-8 border-b border-[#222] bg-[#141414] px-4 flex items-center justify-between uppercase text-[10px] font-bold tracking-wider relative select-none">
              
              {/* Abbreviated tools switcher tabs bar */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { id: "beat", short: "BEATS", label: "Beat Maker Sequence" },
                  { id: "piano", short: "PIANO", label: "Piano Roll Synth" },
                  { id: "mtune", short: "MTUNE", label: "MTune AutoVocal" },
                  { id: "mixer", short: "MIXER", label: "Mixer FX Patches" },
                  { id: "collab", short: "COLLAB", label: "Collab Studio" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveToolTab(item.id as any)}
                    className={`px-3 py-1.5 border-b-2 font-mono transition-all mr-1 text-[10px] ${
                      activeToolTab === item.id
                        ? "border-purple-500 text-purple-400 bg-purple-950/20"
                        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <span className="sm:hidden">{item.short}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="text-[9px] text-gray-500 pr-1 truncate hidden sm:block">
                TRACK FOCUSING: <span className="text-purple-400 font-bold">{(tracks.find(t => t.id === selectedTrackId)?.name || "NONE").toUpperCase()}</span>
              </div>
            </div>

            {/* Render selected Tool panel viewports */}
            <div className="flex-1 p-3 overflow-y-auto no-scrollbar relative w-full">
              
              {/* A. BEAT MAKER Sequencer */}
              {activeToolTab === "beat" && (
                <div className="flex flex-col gap-2 relative w-full h-full min-w-[500px]">
                  <div className="text-[10px] text-zinc-500 mb-1 flex items-center justify-between">
                    <span>16-Step Procedural Seq (Kick/Snare/Hat/Clap). Drag sound models here.</span>
                    <button 
                      onClick={() => {
                        setBeatSequence({
                          Kick: Array(16).fill(false),
                          Snare: Array(16).fill(false),
                          Hihat: Array(16).fill(false),
                          Clap: Array(16).fill(false)
                        });
                      }}
                      className="text-[9px] text-purple-400 hover:underline hover:text-purple-300 uppercase"
                    >
                      Clear Patterns
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 flex-1">
                    {Object.keys(beatSequence).map((voice) => (
                      <div key={voice} className="flex items-center gap-3">
                        <button
                          onClick={() => playSample(voice)}
                          className="w-16 py-1 bg-zinc-900 border border-zinc-700/80 rounded hover:bg-zinc-800 text-[9px] font-bold text-gray-300 hover:text-white text-left px-2 uppercase tracking-wide truncate transition-all"
                        >
                          🔊 {voice}
                        </button>
                        <div className="flex-1 grid grid-cols-16 gap-1">
                          {beatSequence[voice].map((active, step) => {
                            const isMeasureStart = step % 4 === 0;
                            return (
                              <button
                                key={step}
                                onClick={() => {
                                  const updated = [...beatSequence[voice]];
                                  updated[step] = !updated[step];
                                  setBeatSequence({ ...beatSequence, [voice]: updated });
                                  if (updated[step]) {
                                    playSample(voice);
                                  }
                                }}
                                className={`h-6 rounded border transition-all ${
                                  active
                                    ? "bg-gradient-to-br from-fuchsia-600 to-indigo-600 border-indigo-400 text-white shadow shadow-indigo-500/20"
                                    : isMeasureStart ? "bg-zinc-800/80 border-zinc-600/70 hover:bg-zinc-700" : "bg-zinc-900/40 border-zinc-900 hover:bg-zinc-800"
                                } flex items-center justify-center text-[8px] font-bold`}
                              >
                                {step + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* B. PIANO ROLL Custom Matrix */}
              {activeToolTab === "piano" && (
                <div className="flex gap-2 h-full min-w-[500px]">
                  <div className="flex flex-col w-12 shrink-0 border-r border-[#222] pr-1 select-none">
                    {pianoPitches.map((pitch, idx) => (
                      <button
                        key={pitch}
                        onClick={() => triggerSynthTone(130.81 * Math.pow(1.059463, idx), 0.35)}
                        className="flex-1 text-[8px] text-gray-400 font-bold text-left hover:text-white uppercase px-1 py-0.5 border-b border-zinc-800/20 bg-zinc-900 hover:bg-zinc-800 rounded mb-0.5"
                      >
                        🎹 {pitch}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 grid grid-rows-8 gap-0.5">
                    {pianoPitches.map((pitch, rowIdx) => (
                      <div key={pitch} className="grid grid-cols-16 gap-1">
                        {pianoSequence[pitch].map((active, step) => (
                          <button
                            key={step}
                            onClick={() => {
                              const updated = [...pianoSequence[pitch]];
                              updated[step] = !updated[step];
                              const newSeq = { ...pianoSequence, [pitch]: updated };
                              setPianoSequence(newSeq);
                              if (updated[step]) {
                                const freq = 130.81 * Math.pow(1.059463, rowIdx);
                                triggerSynthTone(freq, 0.3);
                              }
                            }}
                            className={`h-[15px] rounded border transition-colors ${
                              active
                                ? "bg-purple-500 border-purple-400"
                                : (step % 4 === 0) ? "bg-[#222] border-[#333] hover:bg-zinc-800" : "bg-zinc-900/50 border-zinc-900/60 hover:bg-zinc-800"
                            }`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* C. MTUNE autovocoder vocales */}
              {activeToolTab === "mtune" && (
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between text-gray-400 select-none text-[10px]">
                    <span className="text-zinc-500 uppercase">Input Pitch Grid Analyser (Intonating 'Lead Vocal Studio Rec')</span>
                    <span className="text-emerald-500 font-bold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/50">ACTIVE SYNC FORMED</span>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {/* Pitch correction fader */}
                    <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-lg flex flex-col justify-between">
                      <span className="font-semibold text-[9px] text-zinc-400 uppercase">Correcting Speed Limit</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          defaultValue="28" 
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500" 
                        />
                        <span className="text-[10px] text-purple-400 font-bold">28ms</span>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-sans leading-relaxed">Lower value delivers hard t-pain autotune curves. Higher values maintain organic vocals stability.</span>
                    </div>

                    {/* Scale Selector */}
                    <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-lg flex flex-col justify-between">
                      <span className="font-semibold text-[9px] text-zinc-400 uppercase">Key Scale Constrain</span>
                      <select className="bg-[#111] border border-zinc-800 text-gray-200 py-1.5 px-2 text-[10px] rounded outline-none w-full">
                        <option>C Major / A Minor</option>
                        <option>G Major / E Minor</option>
                        <option>F Major / D Minor</option>
                        <option>Db Major / Tears Of Beauty Scale</option>
                      </select>
                      <span className="text-[8px] text-zinc-600 font-sans leading-relaxed">Locks vocal waves strictly onto closest scale intervals with zero latency.</span>
                    </div>

                    {/* Format Shifter */}
                    <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-lg flex flex-col justify-between">
                      <span className="font-semibold text-[9px] text-zinc-400 uppercase">Formant Shifter (Gender)</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="-12" 
                          max="12" 
                          defaultValue="0" 
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500" 
                        />
                        <span className="text-[10px] text-purple-400 font-bold">0ct</span>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-sans leading-relaxed">Shifts throat length resonance visual profile without altering core pitch vectors.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* D. MIXER (FX INSERT PLANELS - EQ8, COMPRESSOR, REVERB, LIMITER, SATURATOR) */}
              {activeToolTab === "mixer" && (
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between text-gray-400 text-[10px]">
                    <div className="flex gap-2">
                      <span className="text-zinc-500">MIXER INSERT BUS TARGET:</span>
                      <select 
                        value={activePluginTrackId} 
                        onChange={(e) => setActivePluginTrackId(e.target.value)}
                        className="bg-[#151515] text-[10px] text-purple-400 font-bold border border-zinc-800 rounded px-1.5 outline-none font-mono"
                      >
                        {tracks.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <span className="text-[9px] text-zinc-600 tracking-wider">ACTIVE MASTER TRACK GAIN RATIO CONTROLLER</span>
                  </div>

                  {/* Channel detail strips and insert plugin settings */}
                  {(() => {
                    const currentTrack = tracks.find(t => t.id === activePluginTrackId);
                    if (!currentTrack) return <span className="text-gray-500">Pick lane.</span>;
                    return (
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        {/* 1. Track strips side info */}
                        <div className="col-span-3 p-2 border border-zinc-800 bg-[#161616]/40 rounded-lg flex flex-col justify-between">
                          <div className="text-[9px] font-bold text-gray-300 flex items-center justify-between">
                            <span className="truncate">{currentTrack.name.toUpperCase()}</span>
                            <span className="w-2 h-2 rounded" style={{ backgroundColor: currentTrack.color }} />
                          </div>
                          
                          {/* Gain slide knobs */}
                          <div className="flex items-center gap-1.5 py-1">
                            <Sliders className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={currentTrack.volume}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setTracks(tracks.map(t => t.id === currentTrack.id ? { ...t, volume: val } : t));
                              }}
                              className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-purple-500" 
                            />
                            <span className="text-[9px] font-mono w-6 text-right text-purple-400">{currentTrack.volume}%</span>
                          </div>

                          <div className="flex items-center gap-1.2 justify-between">
                            <span className="text-[8px] text-zinc-500">PANORAMIC:</span>
                            <input 
                              type="range"
                              min="-50"
                              max="50"
                              value={currentTrack.pan}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setTracks(tracks.map(t => t.id === currentTrack.id ? { ...t, pan: val } : t));
                              }}
                              className="w-16 h-0.5 bg-zinc-900 rounded appearance-none cursor-pointer accent-zinc-500" 
                            />
                            <span className="text-[8px] font-mono text-zinc-400">{currentTrack.pan > 0 ? "R" : "L"}{Math.abs(currentTrack.pan)}</span>
                          </div>
                        </div>

                        {/* 2. Audio Effects Slots inserts */}
                        <div className="col-span-4 border border-zinc-850 bg-black/40 rounded-lg p-2.5 flex flex-col relative overflow-hidden">
                          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5">FX Slots insert Chain</div>
                          <div className="flex flex-col gap-1 overflow-y-auto">
                            {currentTrack.effects.map((fx, i) => (
                              <button
                                key={fx.id}
                                onClick={() => setActivePluginIndex(i)}
                                className={`w-full py-1.5 px-2 rounded border text-left flex items-center justify-between transition-colors ${
                                  activePluginIndex === i
                                    ? "bg-purple-950/20 border-purple-500/50 text-purple-300 font-bold"
                                    : "bg-zinc-950/40 border-zinc-900 text-gray-500"
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="checkbox"
                                    checked={fx.enabled}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const updatedFx = [...currentTrack.effects];
                                      updatedFx[i] = { ...fx, enabled: e.target.checked };
                                      setTracks(tracks.map(t => t.id === currentTrack.id ? { ...t, effects: updatedFx } : t));
                                    }}
                                    className="accent-purple-500 text-zinc-800"
                                  />
                                  <span>SLOT {i+1}: {fx.type}</span>
                                </div>
                                <span className={`text-[8px] uppercase font-bold ${fx.enabled ? "text-emerald-500" : "text-gray-600"}`}>
                                  {fx.enabled ? "Live" : "Bypass"}
                                </span>
                              </button>
                            ))}
                            {currentTrack.effects.length === 0 && (
                              <div className="text-gray-600 text-center py-4 text-[9px]">NO EFFECTS INSERTS</div>
                            )}
                          </div>
                        </div>

                        {/* 3. Plugin Detail Controls GUI Panel (EQ8 frequency graph block or Compressor metrics VU) */}
                        <div className="col-span-5 border border-zinc-850 bg-zinc-950/50 rounded-lg p-2.5 flex flex-col relative justify-between">
                          {(() => {
                            const actFx = currentTrack.effects[activePluginIndex];
                            if (!actFx) return <div className="text-zinc-600 text-center py-4 text-[9px]">SELECT EFFECT SLOT</div>;
                            return (
                              <div className="h-full flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[9px] border-b border-zinc-900 pb-1 mb-1">
                                  <span className="font-bold text-gray-300 uppercase">{actFx.type} PLUGIN CONTROL UNIT</span>
                                  <span className="text-[8px] text-purple-400">STATE NODAL: {actFx.enabled ? "ON" : "OFF"}</span>
                                </div>

                                {actFx.type === "EQ8" && (
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div className="relative h-14 bg-black border border-zinc-900 rounded overflow-hidden flex items-center justify-center">
                                      {/* Mock EQ8 logarithmic frequency curves display */}
                                      <svg viewBox="0 0 100 30" className="absolute inset-0 w-full h-full pointer-events-none">
                                        <path 
                                          d={`M 0 15 Q 20 ${15 - (actFx.params.midGain * 1.5)} 50 15 T 100 15`} 
                                          fill="none" 
                                          stroke="#a855f7" 
                                          strokeWidth="1.2" 
                                        />
                                        <line x1="20" y1="0" x2="20" y2="30" stroke="#1c1c1c" strokeWidth="0.5" />
                                        <line x1="50" y1="0" x2="50" y2="30" stroke="#1c1c1c" strokeWidth="0.5" />
                                        <line x1="80" y1="0" x2="80" y2="30" stroke="#1c1c1c" strokeWidth="0.5" />
                                      </svg>
                                      <span className="text-[8px] text-zinc-500 z-10 font-bold tracking-widest uppercase">EQ8 CURVE SPECTRUM ANALYSER</span>
                                    </div>
                                    <div className="flex justify-between gap-2 mt-1.5 text-[8px] text-zinc-500">
                                      <div>
                                        <span className="block text-[7px] uppercase">Lowcut:</span>
                                        <span className="text-gray-300 font-bold">{actFx.params.lowCut} Hz</span>
                                      </div>
                                      <div>
                                        <span className="block text-[7px] uppercase">MidFreq:</span>
                                        <span className="text-gray-300 font-bold">{actFx.params.midFrequency} Hz</span>
                                      </div>
                                      <div>
                                        <span className="block text-[7px] uppercase">MidGain:</span>
                                        <span className={actFx.params.midGain >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                          {actFx.params.midGain >= 0 ? `+${actFx.params.midGain}` : actFx.params.midGain} dB
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {actFx.type === "Compressor" && (
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-[8px] text-[#aaa]">Gain Reduction VU:</span>
                                      {/* Real dynamic Gain reduction VU meter */}
                                      <div className="flex-1 bg-zinc-900 border border-black h-2.5 rounded overflow-hidden relative shadow-inner">
                                        <div 
                                          className="h-full bg-gradient-to-r from-red-650 to-orange-550 transition-all duration-75" 
                                          style={{ width: isPlaying ? "40%" : "2%" }}
                                        />
                                      </div>
                                      <span className="text-[8px] font-bold text-red-400">{isPlaying ? "-3.8dB" : "0dB"}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[8px] text-zinc-400">
                                      <div>Threshold: <span className="text-purple-400 font-bold">{actFx.params.threshold} dB</span></div>
                                      <div>Ratio: <span className="text-purple-400 font-semibold">{actFx.params.ratio}:1</span></div>
                                    </div>
                                  </div>
                                )}

                                {actFx.type === "Reverb" && (
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div className="text-[8px] text-zinc-500 leading-relaxed font-sans mt-0.5">
                                      Simulating pristine physical space with <span className="text-purple-400 font-bold">{actFx.params.size} Space Impulse</span> profile response. Decay feedback calculated at <span className="text-emerald-400">{actFx.params.decay}s</span> tail limits.
                                    </div>
                                    <div className="flex justify-between gap-3 text-[9px] mt-1.5 border-t border-zinc-900/60 pt-1.5">
                                      <span className="text-zinc-500">DRY/WET LEVEL:</span>
                                      <span className="text-purple-400 font-bold">{actFx.params.dryWet}% Wet</span>
                                    </div>
                                  </div>
                                )}

                                {actFx.type === "Saturator" && (
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div className="text-[8px] text-zinc-500 mt-1 leading-relaxed">
                                      Introducing pleasant harmonic distortion in <span className="text-indigo-400 font-bold">{actFx.params.mode} simulation saturation</span> mode. Drive gain boosted by <span className="text-pink-400">+{actFx.params.drive}dB</span> with soft clipping limits.
                                    </div>
                                    <div className="flex items-center gap-1 bg-[#121212] py-0.5 px-2 border border-zinc-900 rounded font-serif italic text-yellow-500/85 text-[8px] mt-1.5">
                                      ★ Golden Tape Warmth Engaged
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* E. COLLAB STUDIO (Producer version control feedback) */}
              {activeToolTab === "collab" && (
                <div className="flex flex-col gap-2.5 h-full">
                  <div className="text-[10px] text-zinc-500 flex items-center justify-between border-b border-zinc-900 pb-1 mb-1 select-none">
                    <span>LIVE CONNECTED PRODUCERS SYSTEM CO-CHATS</span>
                    <span className="text-indigo-400 font-bold animate-pulse">● 2 PRODUCERS SEED SYNCED</span>
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0">
                    {/* Chat feed */}
                    <div className="flex-1 flex flex-col justify-between bg-zinc-950/40 border border-zinc-900 rounded-lg p-2.5 max-h-[140px] overflow-y-auto no-scrollbar">
                      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-2 no-scrollbar">
                        {collabMessages.map((cm, i) => (
                          <div key={i} className="text-[9px] leading-relaxed">
                            <span className="text-purple-400 font-bold pr-1.5">{cm.user}:</span>
                            <span className="text-gray-300">{cm.msg}</span>
                            <span className="text-gray-600 block text-[7px] mt-0.5">{cm.time}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Broadcast structural change suggestions..."
                          className="flex-1 bg-[#1c1c1c] border border-zinc-800 rounded px-2 py-1 text-[9px] text-gray-200 outline-none"
                          value={newCollabMsg}
                          onChange={(e) => setNewCollabMsg(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newCollabMsg.trim()) {
                              setCollabMessages([...collabMessages, { user: "Absolute Architect", msg: newCollabMsg, time: "Just now" }]);
                              setNewCollabMsg("");
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newCollabMsg.trim()) {
                              setCollabMessages([...collabMessages, { user: "Absolute Architect", msg: newCollabMsg, time: "Just now" }]);
                              setNewCollabMsg("");
                            }
                          }}
                          className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded text-[9px] font-bold"
                        >
                          SEND
                        </button>
                      </div>
                    </div>

                    {/* Version history / branches */}
                    <div className="w-[200px] border border-zinc-800 bg-[#161616]/40 rounded-lg p-2.5 flex flex-col justify-between select-none">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase block pb-1 border-b border-zinc-900 mb-1">REPLICATED DIRECTORY FORKS</span>
                      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px] no-scrollbar">
                        <div className="flex items-center justify-between text-[8px] bg-purple-950/20 border border-purple-500/20 rounded p-1">
                          <span className="text-purple-300 truncate">v1.9-Master*</span>
                          <span className="text-gray-500">HEAD</span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] hover:bg-[#222]/30 rounded p-1 border border-transparent cursor-pointer">
                          <span className="text-gray-400 truncate">v1.8-Intro808</span>
                          <span className="text-gray-600">Merge</span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] hover:bg-[#222]/30 rounded p-1 border border-transparent cursor-pointer">
                          <span className="text-gray-400 truncate">v1.5-TearsVocalDraft</span>
                          <span className="text-gray-600">1d ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            RIGHT ATTACHED SIDEBAR: AI CO-PILOT EXPERT ADVISORS
            ========================================== */}
        <div className="w-[300px] hidden lg:flex border-l border-[#222] bg-[#111] flex-col shrink-0 select-none overflow-y-auto pb-4 no-scrollbar">
          <div className="p-3 bg-[#0d0d0d] border-b border-[#222] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <h3 className="font-bold text-[10px] tracking-widest text-purple-400 uppercase">DAW CO-PILOT EXPERT TEAM</h3>
          </div>

          <div className="p-3 flex flex-col gap-3">
            <div className="text-[9px] text-zinc-500 leading-relaxed font-sans bg-zinc-950/40 p-2 border border-zinc-900 rounded-lg">
              Below are specialized AI Expert Personas monitoring your timeline, frequency response metrics, scale constraints, and license clearance profiles in real time:
            </div>

            {copilotSuggestions.map((exp) => (
              <div 
                key={exp.id}
                className={`p-3 rounded-lg bg-[#181818] border border-zinc-800 hover:border-zinc-700 transition shadow flex flex-col justify-between gap-2`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none bg-zinc-900 p-1.5 rounded border border-zinc-800">{exp.avatar}</span>
                  <div>
                    <span className="font-bold text-[10px] text-zinc-100 uppercase tracking-tight block">
                      {exp.name}
                    </span>
                    <span className="text-[7.5px] text-zinc-500 font-mono tracking-widest uppercase">
                      {exp.role}
                    </span>
                  </div>
                </div>

                <p className="text-[8.5px] text-zinc-400 leading-relaxed font-sans italic p-1 bg-black/20 rounded">
                  "{exp.advice}"
                </p>

                {exp.canFix && (
                  <button
                    onClick={() => handleApplyFix(exp)}
                    className={`mt-1.5 w-full py-1 bg-transparent border rounded text-[9px] font-bold tracking-wider uppercase transition flex items-center justify-center gap-1 ${exp.color}`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Apply Recommendation</span>
                  </button>
                )}
              </div>
            ))}

            {copilotSuggestions.length === 0 && (
              <div className="text-center py-8 text-zinc-650 flex flex-col items-center">
                <Check className="w-8 h-8 text-emerald-500 mb-2 animate-bounce" />
                <span className="text-[10px] font-bold">ALL MIX SYSTEM CONSTRAINTS CLEANED</span>
                <span className="text-[8px] text-zinc-600 mt-1">Ready for master WAV file compilation exporting.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          SAMPLE LIBRARY / ARCHIVE BROWSER MODAL (POPUP)
          ========================================== */}
      {isSampleBrowserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-xl bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/5 flex flex-col max-h-[80vh]">
            
            {/* Header */}
            <div className="px-4 py-3 bg-[#0d0d0d] border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="font-bold text-[11px] text-purple-400 tracking-wider">LOCAL REPOSITORY SAMPLE BROWSER</span>
              </div>
              <button 
                onClick={() => setIsSampleBrowserOpen(false)}
                className="text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#222] font-semibold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Drag & Search input bar */}
            <div className="px-4 py-2.5 bg-[#161616] border-b border-[#222] flex items-center gap-3">
              <div className="flex-1 flex items-center bg-[#0d0d0d] rounded px-2 py-1 shadow-inner border border-zinc-800">
                <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Query premium WAV hits..."
                  className="w-full bg-transparent border-none text-[10px] text-zinc-200 outline-none pl-1.5 placeholder-zinc-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[200px]">
                {["All", "Drums", "Synth", "Bass", "Vocal"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-[8px] font-bold border transition-colors ${
                      selectedCategory === cat
                        ? "bg-purple-950/40 border-purple-500/50 text-purple-400"
                        : "bg-[#0d0d0d] border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* List and Drag instrucion */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              <div className="text-[9px] text-zinc-500 uppercase pb-1 border-b border-zinc-900 flex justify-between select-none">
                <span>Hold to drag or tap to preview sounds</span>
                <span className="text-indigo-400 font-bold text-[8px]">DRAGGABLE ASSETS READY</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {filteredSamples.map((sample) => (
                  <div
                    key={sample.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", sample.id);
                      setIsSampleBrowserOpen(false); // Close browse dialog after drag initiate
                    }}
                    onClick={() => triggerSynthTone(sample.previewNote, 0.35)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#181818] hover:bg-[#222] border border-zinc-850 cursor-grab active:cursor-grabbing transition"
                    title="Drag this sample into any track lane"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Music className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-[10px] block text-zinc-200 truncate pr-2">
                          {sample.name}
                        </span>
                        <div className="flex items-center gap-2 text-[8px] text-zinc-500 font-mono mt-0.5">
                          <span className="text-indigo-400 font-bold uppercase">{sample.category}</span>
                          <span>•</span>
                          <span>{sample.size}</span>
                          <span>•</span>
                          <span>{sample.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-zinc-600 bg-black/40 px-1 py-0.5 rounded font-mono uppercase tracking-widest hidden sm:block">
                        {sample.previewNote}Hz Tone
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSynthTone(sample.previewNote, 0.4, "triangle");
                        }}
                        className="px-2 py-1 bg-purple-950/40 border border-purple-500/20 hover:border-purple-400 text-purple-400 rounded text-[9px] font-bold"
                      >
                        PREVIEW
                      </button>
                    </div>
                  </div>
                ))}

                {filteredSamples.length === 0 && (
                  <div className="text-center py-12 text-zinc-650 font-mono">
                    NO PREMIUM WAV ASSETS ALIGNED TO SEARCH TERMS.
                  </div>
                )}
              </div>
            </div>

            {/* Help/Instruction indicator footer */}
            <div className="px-4 py-3 bg-[#0d0d0d] border-t border-[#222] flex items-center justify-between text-[8.5px] text-zinc-600">
              <span className="flex items-center gap-1.5"><HelpIcon className="w-3 h-3 text-zinc-650" /> DRAG to Timeline to add audio lane clips</span>
              <span>CD QUALITY PCM ENHANCED v4.2</span>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          PORTRAIT MOBILE REDESIGN ELEMENTS
          ========================================== */}
      {/* Bottom Floating trigger drawer for mobile tracks */}
      <div className="md:hidden flex shrink-0 items-center justify-between px-4 py-2 border-t border-[#2c2c2c] bg-[#121212]/95 z-20 select-none">
        <button
          onClick={() => setIsTracksDrawerOpen(true)}
          className="flex-1 py-2 bg-purple-950/40 border border-purple-500/30 text-purple-300 font-bold rounded flex items-center justify-center gap-1.5 text-[10px]"
        >
          <Layers className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>VIEW / SWIPE TRACKS DRAWER ({tracks.length})</span>
        </button>
      </div>

      {/* Track drawer details modal (mobile specific) */}
      {isTracksDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm select-none p-2">
          <div className="w-full bg-[#111] border border-zinc-800 rounded-t-xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh]">
            
            <div className="px-4 py-3 bg-[#0d0d0d] border-b border-[#222] flex items-center justify-between">
              <span className="font-bold text-[10px] text-purple-400 tracking-wider">ACTIVE TRACK LANES</span>
              <button 
                onClick={() => setIsTracksDrawerOpen(false)}
                className="text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#222] font-semibold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex flex-col gap-2.5">
              <button
                onClick={handleAddTrack}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase rounded flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>ADD NEW STUDIO LANE</span>
              </button>

              <div className="flex flex-col gap-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => {
                      setSelectedTrackId(track.id);
                      setIsTracksDrawerOpen(false);
                    }}
                    className={`p-2.5 rounded border flex items-center justify-between transition-colors ${
                      selectedTrackId === track.id ? "bg-[#181818] border-purple-500" : "bg-zinc-900/40 border-zinc-850"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                      <span className="font-bold text-[10px] text-zinc-200 truncate">{track.name}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTrack(track.id);
                        }}
                        className="p-1 bg-[#1c1c1c] rounded text-red-500 hover:bg-[#222]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MlabStudio;
