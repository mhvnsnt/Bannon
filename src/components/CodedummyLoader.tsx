import React from 'react';
import { motion } from 'motion/react';

type AgentStatus = 'typing' | 'analyzing' | 'error' | 'searching' | 'collapse' | 'entangled';

interface CodedummyLoaderProps {
  status?: AgentStatus;
  taskDescription?: string;
  isGodMode?: boolean;
}

export function CodedummyLoader({ status = 'analyzing', taskDescription = 'Analyzing...', isGodMode = false }: CodedummyLoaderProps) {
  const getSprite = () => {
    switch (status) {
      case 'typing': 
        return (
          <g>
            <rect x="20" y="30" width="60" height="40" fill="#6366f1" rx="8" />
            <rect x="25" y="40" width="10" height="5" fill="white" />
            <rect x="40" y="40" width="10" height="5" fill="white" />
            <rect x="55" y="40" width="10" height="5" fill="white" />
          </g>
        );
      case 'searching': 
        return (
          <g>
            <circle cx="50" cy="50" r="30" fill="#10b981" />
            <path d="M65 65 L80 80" stroke="white" strokeWidth="5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="15" fill="white" />
          </g>
        );
      case 'error': 
        return (
          <g>
            <path d="M50 20 L85 85 L15 85 Z" fill="#ef4444" />
            <rect x="47" y="40" width="6" height="25" fill="white" rx="3" />
            <circle cx="50" cy="75" r="3" fill="white" />
          </g>
        );
      case 'collapse':
        // Quantum Collapse: High-speed, chromatic glitch-style transition representing core failure or system compression
        return (
          <g id="quantum-collapse">
            <defs>
              <linearGradient id="glitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff007f" />
                <stop offset="100%" stopColor="#7f00ff" />
              </linearGradient>
            </defs>
            {/* Chromatic Aberration Shadows */}
            <motion.rect 
              x="20" y="30" width="60" height="40" fill="#00ffff" rx="6" opacity="0.8"
              animate={{ x: [18, 22, 19, 21, 18, 20], y: [29, 31, 32, 28, 30, 30] }}
              transition={{ repeat: Infinity, duration: 0.12, ease: "linear" }}
            />
            <motion.rect 
              x="20" y="30" width="60" height="40" fill="#ff0055" rx="6" opacity="0.8"
              animate={{ x: [22, 18, 21, 19, 22, 20], y: [31, 29, 28, 32, 31, 30] }}
              transition={{ repeat: Infinity, duration: 0.14, ease: "linear" }}
            />
            {/* Main Glitching Core */}
            <motion.rect 
              x="20" y="30" width="60" height="40" fill="url(#glitchGrad)" rx="6"
              animate={{ scaleY: [1, 0.2, 1.1, 0.4, 1], skewX: [0, 15, -15, 20, 0] }}
              transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
            />
            {/* Glitch Slices */}
            <motion.line 
              x1="10" y1="40" x2="90" y2="40" stroke="#00ffff" strokeWidth="4"
              animate={{ y: [35, 65, 45, 55, 35], opacity: [0.3, 0.9, 0.2, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.18 }}
            />
            <motion.line 
              x1="10" y1="55" x2="90" y2="55" stroke="#ffff00" strokeWidth="2"
              animate={{ y: [60, 30, 50, 40, 60], opacity: [0.8, 0.2, 0.9, 0.4, 0.8] }}
              transition={{ repeat: Infinity, duration: 0.22 }}
            />
            {/* Binary Noise */}
            <text x="50" y="54" fill="#ffffff" fontSize="8" fontWeight="black" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
              COLLAPSE
            </text>
          </g>
        );
      case 'entangled':
        // Entangled State: Pulsating, multi-node glow and sub-atomic connection grid representing concurrent multi-thread execution
        return (
          <g id="entangled-state">
            <defs>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                <stop offset="60%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glowing Aura Rings */}
            <motion.circle 
              cx="50" cy="50" r="35" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.3"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.6, 0.2] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
            <motion.circle 
              cx="50" cy="50" r="25" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            />

            {/* Quantum Communication Channels (Connecting Nodes) */}
            <motion.line 
              x1="25" y1="35" x2="75" y2="35" stroke="#f43f5e" strokeWidth="2"
              animate={{ strokeDasharray: ["0 50", "25 25", "50 0"] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            />
            <motion.line 
              x1="25" y1="35" x2="50" y2="70" stroke="#a855f7" strokeWidth="1.5"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.line 
              x1="75" y1="35" x2="50" y2="70" stroke="#06b6d4" strokeWidth="1.5"
              animate={{ opacity: [0.9, 0.4, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />

            {/* Pulsating multi-node elements */}
            {/* Node Alpha (Top Left) */}
            <g>
              <circle cx="25" cy="35" r="14" fill="url(#nodeGlow)" />
              <motion.circle 
                cx="25" cy="35" r="6" fill="#a855f7"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            </g>

            {/* Node Beta (Top Right) */}
            <g>
              <circle cx="75" cy="35" r="14" fill="url(#cyanGlow)" />
              <motion.circle 
                cx="75" cy="35" r="6" fill="#06b6d4"
                animate={{ scale: [1.3, 1, 1.3] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            </g>

            {/* Node Gamma (Bottom Center) */}
            <g>
              <circle cx="50" cy="70" r="16" fill="url(#nodeGlow)" />
              <motion.circle 
                cx="50" cy="70" r="7" fill="#ec4899"
                animate={{ scale: [1.1, 1.4, 1.1], y: [68, 72, 68] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              />
            </g>
          </g>
        );
      default: 
        return (
          <g>
            <rect x="30" y="30" width="40" height="40" fill="#f59e0b" rx="5" />
            <path d="M40 40 L60 40 M40 50 L60 50 M40 60 L60 60" stroke="white" strokeWidth="3" />
          </g>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="120" height="120" viewBox="0 0 100 100" className={isGodMode ? 'drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]' : ''}>
        {isGodMode && (
          <motion.g
            animate={{ opacity: [0, 1, 0], scale: [1, 1.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="gold" strokeWidth="2" strokeDasharray="5 5" />
          </motion.g>
        )}
        <motion.g
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {getSprite()}
        </motion.g>
      </svg>
      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">{status}</div>
      <div className="text-[12px] font-bold text-slate-100 animate-pulse text-center max-w-[250px] leading-relaxed">
        {taskDescription}
      </div>
    </div>
  );
}
