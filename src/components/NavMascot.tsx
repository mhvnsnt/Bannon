import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../App';

interface NavMascotProps {
  active: boolean;
  status?: 'CRITICAL' | 'STRESSED' | 'STABLE' | string;
}

export function NavMascot({ active, status = 'STABLE' }: NavMascotProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    }, 3500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  let mascotAnimation: any = { scale: 1, rotate: 0, y: 0 };
  let eyeColor = active ? "bg-indigo-400" : "bg-slate-400 dark:bg-slate-500";
  let bodyColor = active 
    ? "bg-slate-900 border-indigo-400 text-indigo-400" 
    : "bg-white border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-700";

  if (status === 'CRITICAL') {
    mascotAnimation = { scale: 0.85, rotate: [0, -10, 10, -10, 10, 0], y: 2 };
    eyeColor = "bg-red-500";
    bodyColor = "bg-slate-900 border-red-500 text-red-500";
  } else if (status === 'STRESSED') {
    mascotAnimation = { scale: 0.95, rotate: -5, y: 0 };
    eyeColor = "bg-amber-400";
    bodyColor = "bg-slate-900 border-amber-400 text-amber-400";
  }

  return (
    <motion.div 
      animate={mascotAnimation}
      whileHover={status === 'CRITICAL' ? {} : { scale: 1.25, rotate: 10 }}
      whileTap={{ scale: 0.9 }}
      className="relative w-5 h-5 flex items-center justify-center shrink-0"
    >
      <motion.div
        animate={active ? {
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3]
        } : { scale: 1, opacity: 0.1 }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className={cn(
          "absolute inset-0 rounded-full bg-indigo-500 blur-[2px] pointer-events-none",
          active ? "bg-indigo-400" : "bg-slate-400"
        )}
      />
      <div className={cn(
        "w-4 h-4 rounded-full border flex items-center justify-center relative shadow-sm transition-all duration-300 overflow-hidden",
        bodyColor
      )}>
        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white opacity-40 pointer-events-none" />
        <motion.div 
          animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
          className={cn(
            "w-2 h-2 rounded-full flex items-center justify-center transition-colors",
            eyeColor
          )}
        >
          {!isBlinking && (
            <div className="w-0.5 h-0.5 rounded-full bg-white absolute top-1.5 left-1.5" />
          )}
        </motion.div>
      </div>
      {active && status !== 'CRITICAL' && (
        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
        </span>
      )}
    </motion.div>
  );
}
