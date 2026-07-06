import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Battery, BatteryCharging, Activity, RefreshCw, Mic, Server, UserSquare } from "lucide-react";
import { useOSTheme } from "./SystemOverseer";
import { useLivingNexus } from "../hooks/useLivingNexus";
import { auth, signInUser, signOutUser } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export function StatusBar() {
  const { theme, setTheme } = useOSTheme();
  const [user, loading] = useAuthState(auth);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [networkSpeed, setNetworkSpeed] = useState<string>("STABLE");
  const [isListening, setIsListening] = useState(false);
  const { bridgeStatus } = useLivingNexus();

  const handleVoiceCommand = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      window.dispatchEvent(new CustomEvent("insert-voice-command", { detail: transcript }));
    };
    
    recognition.onerror = () => {
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  // Keep track of connection health
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitor battery life
  useEffect(() => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        const updateBatteryInfo = () => {
          setBattery({
            level: Math.round(bat.level * 100),
            charging: bat.charging,
          });
        };

        updateBatteryInfo();
        bat.addEventListener("levelchange", updateBatteryInfo);
        bat.addEventListener("chargingchange", updateBatteryInfo);

        return () => {
          bat.removeEventListener("levelchange", updateBatteryInfo);
          bat.removeEventListener("chargingchange", updateBatteryInfo);
        };
      });
    }
  }, []);

  // Ping monitor for active latency & stability
  useEffect(() => {
    let active = true;
    const testLatency = async () => {
      if (!isOnline) {
        setLatency(null);
        return;
      }
      const start = performance.now();
      try {
        await fetch("/api/health", { cache: "no-store", method: "HEAD" });
        const end = performance.now();
        if (active) {
          const rtt = Math.round(end - start);
          setLatency(rtt);
          if (rtt < 80) setNetworkSpeed("EXCELLENT");
          else if (rtt < 200) setNetworkSpeed("GOOD");
          else setNetworkSpeed("DAMPED");
        }
      } catch (err) {
        if (active) {
          setLatency(null);
          setNetworkSpeed("UNSTABLE");
        }
      }
    };

    testLatency();
    const interval = setInterval(testLatency, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOnline]);

  const [ollamaInfo, setOllamaInfo] = useState<{ online: boolean; availableCount: number; totalCount: number; readyToTrain?: boolean }>({
    online: false,
    availableCount: 0,
    totalCount: 5,
    readyToTrain: false
  });

  useEffect(() => {
    let active = true;
    const fetchOllamaStatus = async () => {
      try {
        const res = await fetch('/api/armada/model_router/local_status');
        if (res.ok) {
          const data = await res.json();
          if (active && data.success) {
            setOllamaInfo({
              online: data.online,
              availableCount: data.availableCount,
              totalCount: data.totalCount,
              readyToTrain: !!data.readyToTrain
            });
          }
        }
      } catch (err) {
        if (active) {
          setOllamaInfo(prev => ({ ...prev, online: false }));
        }
      }
    };

    fetchOllamaStatus();
    const interval = setInterval(fetchOllamaStatus, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const getBatteryIcon = () => {
    if (!battery) return <Battery className="w-4 h-4 text-gray-400" />;
    if (battery.charging) return <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />;
    if (battery.level < 20) return <Battery className="w-4 h-4 text-red-500 animate-bounce" />;
    if (battery.level < 60) return <Battery className="w-4 h-4 text-amber-400" />;
    return <Battery className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div id="os-status-bar" className="flex items-center gap-4 text-xs font-mono select-none px-3 py-1 rounded-md border border-[#222] bg-[#111]/80 backdrop-blur-sm shadow-md transition-all">
      {/* SWARM BRIDGE STATUS */}
      <div className="flex items-center space-x-4 border-r border-[#222] pr-3">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${bridgeStatus === 'ONLINE' ? 'border-green-500 text-green-400 bg-green-950/30' : 'border-red-500 text-red-400 bg-red-950/30 animate-pulse'}`}>
          <span className={`w-2 h-2 rounded-full ${bridgeStatus === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{bridgeStatus === 'ONLINE' ? 'SWARM ONLINE' : 'BRIDGE OFFLINE'}</span>
        </div>
      </div>

      {/* Network Stability */}
      <div className="flex items-center gap-1.5 border-r border-[#222] pr-3">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
        )}
        <span className={isOnline ? "text-emerald-400 font-medium" : "text-red-500 font-medium"}>
          {isOnline ? "ONLINE" : "OFFLINE"}
        </span>
        {isOnline && latency !== null && (
          <span className="text-gray-500 text-[10px]">
            ({latency}ms)
          </span>
        )}
      </div>

      {/* Network performance */}
      {isOnline && (
        <div className="hidden sm:flex items-center gap-1.5 border-r border-[#222] pr-3 text-gray-400">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] text-gray-400">SIG:</span>
          <span className={`font-semibold text-[10px] ${
            networkSpeed === "EXCELLENT" ? "text-emerald-400" :
            networkSpeed === "GOOD" ? "text-cyan-400" :
            "text-amber-500"
          }`}>
            {networkSpeed}
          </span>
        </div>
      )}

      {/* Device Battery */}
      <div className="flex items-center gap-1.5 border-r border-[#222] pr-3">
        {getBatteryIcon()}
        <span className="text-gray-300">
          {battery ? `${battery.level}%` : "PWR"}
        </span>
      </div>

      {/* OS Theme Control inside status bar */}
      <button
        onClick={() => setTheme(theme === "deep-obsidian" ? "standard" : "deep-obsidian")}
        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors border-r border-[#222] pr-3"
      >
        <span className="text-[10px] text-gray-500">THEME:</span>
        <span className="font-semibold text-indigo-400 text-[10px] hover:underline uppercase">
          {theme === "deep-obsidian" ? "OBSIDIAN" : "STANDARD"}
        </span>
      </button>

      {/* Local Ollama Models Health Status */}
      <div id="os-statusBar-locals" className="flex items-center gap-1.5 border-r border-[#222] pr-3 text-gray-400" title="Local node connectivity status">
        <Server className={`w-3.5 h-3.5 ${ollamaInfo.online ? "text-emerald-400 animate-pulse" : "text-amber-500 animate-pulse"}`} />
        <span className="text-[10px] text-gray-500">LOCALS:</span>
        <span className={`font-semibold text-[10px] ${
          !ollamaInfo.online ? "text-amber-500 animate-pulse" :
          ollamaInfo.availableCount === ollamaInfo.totalCount ? "text-emerald-400" :
          "text-yellow-500"
        }`}>
          {ollamaInfo.online ? `${ollamaInfo.availableCount}/${ollamaInfo.totalCount} ONLINE` : "OFFLINE"}
        </span>
      </div>

      {/* Dataset Ready for Fine-Tuning indicator */}
      {ollamaInfo.readyToTrain && (
        <div id="os-statusBar-dataset-ready" className="flex items-center gap-1 border-r border-[#222] pr-3 text-amber-400 animate-pulse animate-duration-1000" title="A source dataset has exceeded 500 training pairs. Local fine-tuning is ready.">
          <span className="text-[9px] bg-amber-950/40 text-amber-400 font-extrabold px-1.5 py-0.5 rounded border border-amber-800/30">
            READY_TO_TRAIN
          </span>
        </div>
      )}
      
      {/* Voice Command Bridge */}
      <button
        onClick={handleVoiceCommand}
        className={`flex items-center gap-1.5 transition-all text-[10px] font-semibold uppercase ${isListening ? "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]" : "text-gray-400 hover:text-gray-200"} border-r border-[#222] pr-3`}
        title="Trigger Voice-to-Text for Quantum Chat"
      >
        <Mic className={`w-3.5 h-3.5 ${isListening ? "animate-pulse" : ""}`} />
        <span>{isListening ? "Listening" : "Voice.Bridge"}</span>
      </button>

      {/* Auth Control */}
      <div className="flex items-center gap-1.5">
        {!loading && (
          user ? (
            <button
              onClick={signOutUser}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors tooltip uppercase text-[10px] font-semibold"
              title="Sign Out"
            >
              <UserSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">{user.email?.split('@')[0] || "Auth"}</span>
            </button>
          ) : (
            <button
              onClick={signInUser}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors uppercase text-[10px] font-semibold"
              title="Sign In with Google"
            >
              <UserSquare className="w-4 h-4 text-amber-500" />
              <span>Login</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
