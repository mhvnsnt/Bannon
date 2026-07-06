import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AgentView from './components/AgentView';
import TutorialView from './components/TutorialView';
import ProjectSelection from './components/ProjectSelection';
import LegalModal from './components/LegalModal';
import FeedbackForm from './components/FeedbackForm';
import UserAnalytics from './components/UserAnalytics';
import SignInModal from './components/SignInModal';
import CommandPalette from './components/CommandPalette';
import { Bot, BookOpen, LayoutGrid, AlertTriangle, BarChart3, Users, RotateCcw, Check, LogIn, Shield, LogOut, Search, Zap, Mic, MicOff, HelpCircle, Sun, Moon, Menu, X } from 'lucide-react';
import { SyncStatus } from './components/SyncStatus';
import { VoiceCommandModal } from './components/VoiceCommandModal';
import { NavMascot } from './components/NavMascot';
import { AgentToolsModal } from './components/AgentToolsModal';
import { OfflineLogModal } from './components/OfflineLogModal';
import { ShortcutHelpModal } from './components/ShortcutHelpModal';
import { useLoading } from './components/LoadingProvider';
import { CodedummyLoader } from './components/CodedummyLoader';
import { MascotLibraryDrawer } from './components/MascotLibraryDrawer';
import { OmniSandboxModal } from './components/OmniSandboxModal';
import { KineticDOM } from './components/KineticDOM';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { INITIAL_SKILL_TREE } from './types';
import { HardwareDetector } from './utils/hardware';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { TutorialViewSkeleton, ProjectSelectionSkeleton, AgentViewSkeleton } from './components/Skeleton';

export const LESSONS = [
  { id: 1, title: 'The Intro', subtitle: 'print("I\'m a dummy")' },
  { id: 2, title: 'The Response', subtitle: 'print("I\'m here to teach you")' },
  { id: 3, title: 'The Big Three', subtitle: 'Python vs JS vs C++' },
  { id: 4, title: 'CODEDUMMY', subtitle: 'Visual Identity' },
  { id: 5, title: 'Break the Code', subtitle: 'Bubble Text Customizer' },
  { id: 6, title: 'First Assignment', subtitle: 'The Objectives' },
  { id: 7, title: 'Fetching Data', subtitle: 'Live API Testing' },
  { id: 8, title: 'The Code Runner', subtitle: 'Interactive JS Sandbox' }
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PROJECT_META: Record<string, { title: string; description: string; image: string }> = {
  audio_visualizer: {
    title: "Audio Visualizer Blueprint | Orion",
    description: "Witness my audio visualizer that generates expanding neon circles pulsing perfectly to the bass, built in Orion!",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  crypto_ticker: {
    title: "Crypto Panic Ticker Blueprint | Orion",
    description: "Check out my live Crypto Ticker tracking real-time Bitcoin and Ethereum prices, built in Orion!",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  micro_clicker: {
    title: "Micro-Clicker Blueprint | Orion",
    description: "Can you beat my score? Play the frantic teleporting micro-clicker game created in Orion!",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  beat_pad: {
    title: "Hertz Beat Pad Blueprint | Orion",
    description: "Tap and trigger raw 808 sub-bass frequencies and light up the screen on my Hertz Beat Pad in Orion!",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  matrix_scrambler: {
    title: "Matrix Scrambler Blueprint | Orion",
    description: "Translate text into leetspeak with dripping green Matrix style, built in Orion!",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  physics_ball_pit: {
    title: "Physics Ball Pit Blueprint | Orion",
    description: "An interactive gravity simulation and bouncing physics ball pit built in Orion!",
    image: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  color_clock: {
    title: "Color Clock Blueprint | Orion",
    description: "A gorgeous clock that converts the time to a HEX color code and shifts backgrounds dynamically in Orion!",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  paintbrush_tool: {
    title: "Paintbrush Tool Blueprint | Orion",
    description: "An elegant interactive drawing canvas with shifting rainbow colors created in Orion!",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  css_3d_cube: {
    title: "CSS 3D Cube Blueprint | Orion",
    description: "Watch and interact with this stunning spinning 3D CSS cube built in Orion!",
    image: "https://images.unsplash.com/photo-1516116211223-4c359a36beec?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  password_cracker: {
    title: "Password Cracker Blueprint | Orion",
    description: "Simulating high-speed JS brute force loops to guess passwords in real-time in Orion!",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=630&q=80"
  },
  god_build: {
    title: "The God Build Blueprint | Orion",
    description: "The ultimate hybrid experience: micro-clicker with live crypto tracking background and 808 audio triggers in Orion!",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80"
  }
};


function useStreakTracker() {
  const [streak, setStreak] = useState(1);
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = localStorage.getItem('lastLoginDate');
    const savedStreak = parseInt(localStorage.getItem('currentStreak') || '1', 10);
    
    if (lastLogin) {
      if (lastLogin !== today) {
        const last = new Date(lastLogin);
        const now = new Date(today);
        const diffTime = Math.abs(now.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) {
          setStreak(savedStreak + 1);
          localStorage.setItem('currentStreak', (savedStreak + 1).toString());
        } else if (diffDays > 1) {
          setStreak(1);
          localStorage.setItem('currentStreak', '1');
        } else {
          setStreak(savedStreak);
        }
        localStorage.setItem('lastLoginDate', today);
      } else {
         setStreak(savedStreak);
      }
    } else {
      localStorage.setItem('currentStreak', '1');
      localStorage.setItem('lastLoginDate', today);
    }
  }, []);
  
  return streak;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'tutorial' | 'projects' | 'agent' | 'analytics'>('tutorial');
  const streak = useStreakTracker();
  const [isOfflineLogModalOpen, setIsOfflineLogModalOpen] = useState(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAgentToolsOpen, setIsAgentToolsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Telegram remote control status and daemon verification
  const [telegramStatus, setTelegramStatus] = useState<{
    configured: boolean;
    tokenPresent: boolean;
    chatIdPresent: boolean;
    botToken: string;
    chatId: string;
    gatewayUrl: string;
  } | null>(null);

  // System Metrics and Stress Telemetry
  const [systemMetrics, setSystemMetrics] = useState<{
    cpu_load: number;
    memory_usage: number;
    active_jobs: number;
    active_concurrency: number;
    limit: number;
    status: 'HEALTHY' | 'STRESSED' | 'CRITICAL';
  } | null>(null);

  useEffect(() => {
    const checkTelegramStatus = async () => {
      try {
        const response = await fetch('/api/telegram/status');
        if (response.ok) {
          const data = await response.json();
          setTelegramStatus(data);
        }
      } catch (err) {
        console.warn("⚠️ [Telegram Shell] Failed client-side remote integration probe:", err);
      }
    };
    checkTelegramStatus();
    const interval = setInterval(checkTelegramStatus, 15000); // Poll server every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkMetrics = async () => {
      try {
        const response = await fetch('/api/system/metrics');
        if (response.ok) {
          const data = await response.json();
          setSystemMetrics({
            cpu_load: data.current.cpu_load,
            memory_usage: data.current.memory_usage,
            active_jobs: data.current.active_jobs,
            active_concurrency: data.current.active_concurrency,
            limit: data.limit,
            status: data.status
          });
        }
      } catch (err) {
        console.warn("⚠️ Failed to fetch system metrics:", err);
      }
    };
    checkMetrics();
    const interval = setInterval(checkMetrics, 4000); // Poll metrics every 4s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && e.target instanceof HTMLElement && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        setIsShortcutModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  
  const [completedLessons, setCompletedLessons] = useState<number[]>(() => {
    const saved = localStorage.getItem('codedummy-completed-lessons');
    return saved ? JSON.parse(saved) : [1];
  });

  const [viewLoading, setViewLoading] = useState<string | null>(null);

  useEffect(() => {
    setViewLoading(currentView);
    const timer = setTimeout(() => {
      setViewLoading(null);
    }, 850);
    return () => clearTimeout(timer);
  }, [currentView]);

  const [inviteCode, setInviteCode] = useState(() => {
    const saved = localStorage.getItem('orion-invite-code');
    if (saved) return saved;
    const newCode = 'INVITE-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    localStorage.setItem('orion-invite-code', newCode);
    return newCode;
  });

  const handleShareReferral = async () => {
     try {
       if (isSupabaseConfigured) {
         // Simulate saving referral to DB
         const { error } = await supabase.from('referrals').insert([{
           code: inviteCode,
           user_id: 'demo_user_123'
         }]);
         if (error) {
           console.warn('Simulated DB referral insert failed, likely no DB connected', error);
         }
       }
       showToast(`Code ${inviteCode} copied to clipboard! Share it for bonus XP.`);
       navigator.clipboard.writeText(`Join Orion Enterprises with my code: ${inviteCode}`);
     } catch(e) {
       console.error(e);
     }
  };

  const [skillTree, setSkillTree] = useState(() => {
    const saved = localStorage.getItem('codedummy-skilltree');
    return saved ? JSON.parse(saved) : INITIAL_SKILL_TREE;
  });
  
  const unlockSkill = (skillId: keyof typeof INITIAL_SKILL_TREE.skills) => {
    setSkillTree((prev: any) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: { unlocked: true }
      }
    }));
  };

  const [currentScreen, setCurrentScreen] = useState(() => {
    const saved = localStorage.getItem('codedummy-progress');
    return saved ? parseInt(saved, 10) : 1;
  });
  const totalScreens = 8;

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('project');
  });

  // Whenever active project changes, we can sync the URL parameter silently
  useEffect(() => {
    if (activeProjectId) {
      const url = new URL(window.location.href);
      url.searchParams.set('project', activeProjectId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeProjectId]);

  // If a shared project link is opened, land directly on projects page
  useEffect(() => {
    if (activeProjectId) {
      setCurrentView('projects');
    }
  }, []);


  // Legal Modal State
  const [activeLegal, setActiveLegal] = useState<'tos' | 'privacy' | 'refunds' | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addXp = (amount: number) => {
    setSkillTree(prev => {
      const newXp = prev.xp + amount;
      const oldLevel = Math.floor(prev.xp / 100);
      const newLevel = Math.floor(newXp / 100);
      if (newLevel > oldLevel) {
         showToast(`Level Up! You are now Level ${newLevel + 1}`);
      }
      return { ...prev, xp: newXp };
    });
  };

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsSupabaseConnected(false);
      return;
    }

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('chat_history').select('id').limit(1);
        if (error) {
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      } catch {
        setIsSupabaseConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  // Global hotkey listener for switching views
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 't') {
          e.preventDefault();
          setCurrentView('tutorial');
        } else if (key === 'p') {
          e.preventDefault();
          setCurrentView('projects');
        } else if (key === 'l') {
          e.preventDefault();
          setCurrentView('agent');
        } else if (key === 'a') {
          e.preventDefault();
          setCurrentView('analytics');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, []);

  // Voice command state & control loop using Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any = null;

    if (isListening) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const lastResultIdx = event.results.length - 1;
          const text = event.results[lastResultIdx][0].transcript.trim().toLowerCase();
          showToast(`Voice heard: "${text}"`);

          if (
            text.includes('switch to lab') || 
            text.includes('go to lab') || 
            text.includes('show lab') || 
            text.includes('agent') || 
            text.includes('the lab')
          ) {
            setCurrentView('agent');
            showToast('Voice Command: Switched to The Lab!');
          } else if (
            text.includes('switch to projects') || 
            text.includes('go to projects') || 
            text.includes('show projects') || 
            text.includes('projects')
          ) {
            setCurrentView('projects');
            showToast('Voice Command: Switched to Projects!');
          } else if (
            text.includes('switch to tutorial') || 
            text.includes('go to tutorial') || 
            text.includes('show tutorial') || 
            text.includes('tutorial') || 
            text.includes('dummy')
          ) {
            setCurrentView('tutorial');
            showToast('Voice Command: Switched to CODEDUMMY 101!');
          } else if (
            text.includes('switch to analytics') || 
            text.includes('go to analytics') || 
            text.includes('show analytics') || 
            text.includes('analytics')
          ) {
            setCurrentView('analytics');
            showToast('Voice Command: Switched to Analytics!');
          } else if (
            text.includes('god mode') || 
            text.includes('enable god mode') || 
            text.includes('marquis')
          ) {
            setUserEmail('marquiswhitacre@gmail.com');
            setIsBuyer(true);
            localStorage.setItem('codedummy-user-email', 'marquiswhitacre@gmail.com');
            localStorage.setItem('codedummy-is-buyer', 'true');
            showToast('Voice Command: Activated God Mode Marquis Whitacre!');
          } else if (text.includes('optimize codebase') || text.includes('optimize code')) {
            setCurrentView('agent');
            setTimeout(() => {
              const btn = document.querySelector('button[title*="Optimize Codebase"]');
              if (btn) (btn as HTMLButtonElement).click();
            }, 300);
            showToast('Voice Command: Triggering codebase optimization...');
          } else if (text.includes('run tests') || text.includes('run lab tests')) {
            setCurrentView('agent');
            setTimeout(() => {
              const btn = document.querySelector('button[title*="Run Lab Tests"]');
              if (btn) (btn as HTMLButtonElement).click();
            }, 300);
            showToast('Voice Command: Running automated lab validation...');
          } else if (text.includes('ask qwable')) {
            setCurrentView('agent');
            showToast('Voice Command: Routing via Qwable Assistant for architecture brainstorming...');
            setTimeout(() => {
              const input = document.querySelector('textarea[placeholder*="Provide a URL and instructions..."]') || document.querySelector('textarea[placeholder*="Add a task"]');
              if (input) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                nativeInputValueSetter?.call(input, "QWABLE-ROUTING-MODE: Please brainstorm the high-level architecture before handing this off to an agent.");
                const ev2 = new Event('input', { bubbles: true});
                input.dispatchEvent(ev2);
              }
            }, 300);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          if (e.error === 'not-allowed') {
            setSpeechError('Microphone permission denied');
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          if (isListening) {
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
      } catch (err) {
        console.error('Speech recognition startup failed:', err);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.stop();
        } catch {}
      }
    };
  }, [isListening]);

  // Sync Outbox Action tracker
  const [pendingSyncCount, setPendingSyncCount] = useState(() => {
    try {
      const queue = localStorage.getItem('orion-sync-queue');
      return queue ? JSON.parse(queue).length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const checkQueue = () => {
      try {
        const queue = localStorage.getItem('orion-sync-queue');
        setPendingSyncCount(queue ? JSON.parse(queue).length : 0);
      } catch {
        setPendingSyncCount(0);
      }
    };
    const interval = setInterval(checkQueue, 1500);
    return () => clearInterval(interval);
  }, []);

  // User ID and Buyer Status
  const [userId] = useState<string>(() => {
    let saved = localStorage.getItem('codedummy-user-id');
    if (!saved) {
      saved = 'usr_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      localStorage.setItem('codedummy-user-id', saved);
    }
    return saved;
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('codedummy-user-email') || '';
  });

  const [showSignIn, setShowSignIn] = useState(false);

  const [isBuyer, setIsBuyer] = useState<boolean>(() => {
    const isMarquis = (localStorage.getItem('codedummy-user-email') || '').trim().toLowerCase() === 'marquiswhitacre@gmail.com';
    return isMarquis || localStorage.getItem('codedummy-is-buyer') === 'true';
  });

  // Auto-unlock if logged in as admin Marquis Whitacre
  useEffect(() => {
    if (userEmail.trim().toLowerCase() === 'marquiswhitacre@gmail.com') {
      setIsBuyer(true);
      localStorage.setItem('codedummy-is-buyer', 'true');
    }
  }, [userEmail]);

  // Listen to Supabase auth state changes for Google login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        const email = session.user.email;
        setUserEmail(email);
        localStorage.setItem('codedummy-user-email', email);
        
        // Auto unlock for admin
        if (email.trim().toLowerCase() === 'marquiswhitacre@gmail.com') {
          setIsBuyer(true);
          localStorage.setItem('codedummy-is-buyer', 'true');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle payment redirects and Supabase sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setIsBuyer(true);
      localStorage.setItem('codedummy-is-buyer', 'true');
      showToast('🎉 Premium Access Activated! Welcome to The Lab.');
      // Clean query params
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('success');
      cleanUrl.searchParams.delete('session_id');
      window.history.replaceState({}, '', cleanUrl.toString());
    } else {
      if (!isSupabaseConfigured) {
        return;
      }
      // Sync from Supabase tables (profiles or user_profiles)
      const syncStatus = async () => {
        try {
          // Check "profiles" first as configured in webhook
          const { data: pData, error: pErr } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', userId)
            .maybeSingle();
            
          if (!pErr && pData && pData.status === 'buyer') {
            setIsBuyer(true);
            localStorage.setItem('codedummy-is-buyer', 'true');
            return;
          }

          // Fallback check on "user_profiles"
          const { data: upData, error: upErr } = await supabase
            .from('user_profiles')
            .select('status')
            .eq('id', userId)
            .maybeSingle();

          if (!upErr && upData && upData.status === 'buyer') {
            setIsBuyer(true);
            localStorage.setItem('codedummy-is-buyer', 'true');
          }
        } catch (err) {
          console.warn('Could not sync premium profile status:', err);
        }
      };
      syncStatus();
    }
  }, [userId]);

  // Hardware State
  const [hardwareCheck, setHardwareCheck] = useState<{ canRunLocalModels: boolean; reason?: string }>({ canRunLocalModels: true });

  useEffect(() => {
    HardwareDetector.checkCapabilities().then(result => {
      setHardwareCheck(result);
      if (!result.canRunLocalModels) {
        showToast(`⚠️ Low-End Hardware detected: Switched to Cloud Mode (Gemini) for maximum stability!`);
      }
    });
  }, []);

  React.useEffect(() => {
    localStorage.setItem('codedummy-progress', currentScreen.toString());
  }, [currentScreen]);

  React.useEffect(() => {
    localStorage.setItem('codedummy-skilltree', JSON.stringify(skillTree));
  }, [skillTree]);

  // When tutorial completes (screen 8), we can unlock some skills and move to projects
  React.useEffect(() => {
    if (currentScreen === totalScreens) {
      // Reveal Audio API and string manipulation upon completing tutorial for demo purposes
      unlockSkill('audio_api');
      unlockSkill('string_manipulation');
    }
  }, [currentScreen]);

  const projectMeta = activeProjectId ? PROJECT_META[activeProjectId] : null;
  const pageTitle = projectMeta ? projectMeta.title : "Orion Enterprises | Premium Coding Sandbox";
  const pageDesc = projectMeta ? projectMeta.description : "A premium developer coding sandbox and agentic data extraction platform.";
  const pageImg = projectMeta ? projectMeta.image : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        {/* OpenGraph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={pageImg} />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={pageImg} />
      </Helmet>
      {/* Top Navigation Menu */}
      <nav className="flex flex-wrap md:flex-nowrap items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-black/5 bg-white/80 backdrop-blur-md shrink-0 z-50 shadow-sm gap-y-3">
        <div className="flex flex-col gap-1 w-auto md:w-1/3 min-w-0 md:min-w-[150px] lg:min-w-[200px] shrink-0 order-1">
          <div className="flex items-center gap-1.5 sm:gap-2 animate-in fade-in duration-300">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-black flex items-center justify-center font-bold text-white shadow-lg shrink-0">
              O
            </div>
            <span className="font-bold tracking-widest text-black uppercase text-xs sm:text-sm hidden min-[360px]:inline">Orion</span>
            <span className="font-bold tracking-widest text-black uppercase text-xs sm:text-sm min-[360px]:hidden">O</span>
            <span className="font-bold tracking-widest text-black uppercase text-xs sm:text-sm hidden md:inline"> Enterprises</span>
          </div>
          {currentView === 'tutorial' && (
             <div className="hidden md:flex items-center gap-3">
               <div className="text-[10px] text-slate-500 font-mono shrink-0">PROGRESS {currentScreen}/{totalScreens}</div>
               <div className="h-1.5 bg-slate-200 rounded-full flex-1 overflow-hidden">
                 <div 
                   className="h-full bg-black transition-all duration-500 ease-out" 
                   style={{ width: `${(currentScreen / totalScreens) * 100}%` }}
                 />
               </div>
             </div>
          )}
        </div>
        
        <div className="flex bg-slate-100 rounded-lg p-0.5 sm:p-1 border border-black/5 overflow-x-auto w-full md:w-auto order-3 md:order-2 scrollbar-none shrink-0 justify-start sm:justify-center mt-1 md:mt-0">
          <button
            onClick={() => setCurrentView('tutorial')}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-2 rounded-md text-[10px] sm:text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0",
              currentView === 'tutorial' 
                ? "bg-white text-black shadow-sm" 
                : "text-slate-500 hover:text-black hover:bg-black/5"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">CODEDUMMY 101</span>
            <span className="sm:hidden">101</span>
          </button>
          <button
            onClick={() => setCurrentView('projects')}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-2 rounded-md text-[10px] sm:text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0",
              currentView === 'projects' 
                ? "bg-white text-black shadow-sm" 
                : "text-slate-500 hover:text-black hover:bg-black/5"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Projects</span>
          </button>
          <button
            onClick={() => setCurrentView('agent')}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-2 rounded-md text-[10px] sm:text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0",
              currentView === 'agent' 
                ? "bg-black text-white shadow-sm" 
                : "text-slate-500 hover:text-black hover:bg-black/5"
            )}
          >
            <NavMascot active={currentView === 'agent'} status={systemMetrics ? systemMetrics.status : 'STABLE'} />
            <span className="hidden sm:inline">The Lab (Agent)</span>
            <span className="sm:hidden">Lab</span>
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-2 rounded-md text-[10px] sm:text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0",
              currentView === 'analytics' 
                ? "bg-black text-white shadow-sm" 
                : "text-slate-500 hover:text-black hover:bg-black/5"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </button>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 w-auto md:w-1/3 min-w-0 md:min-w-[200px] justify-end shrink-0 order-2 md:order-3">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-500 shrink-0"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Telegram Remote Shell Status Indicator */}
          {telegramStatus && (
            <div className="hidden md:block relative group shrink-0" id="telegram-status-indicator">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border shadow-sm cursor-pointer",
                telegramStatus.configured 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" 
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
              )}>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  telegramStatus.configured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                )} />
                <span className="hidden md:inline text-[9px]">{telegramStatus.configured ? 'Remote Active' : 'Remote Config'}</span>
              </div>
              
              {/* Tooltip detail card */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-4 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[100] font-mono text-[10px] space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-100 tracking-wider">📡 SOVEREIGN SHELL</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                    telegramStatus.configured ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  )}>
                    {telegramStatus.configured ? "CONNECTED" : "INACTIVE"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">BOT VECTOR:</span>
                    <span className="text-slate-300 font-bold">@CODEDUMMYBOT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">BOT TOKEN:</span>
                    <span className="text-slate-300">{telegramStatus.botToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CHAT ID:</span>
                    <span className="text-slate-300 truncate max-w-[120px] text-right">{telegramStatus.chatId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SMS GATEWAY:</span>
                    <span className="text-slate-300 truncate max-w-[120px] text-right">{telegramStatus.gatewayUrl}</span>
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-2 text-[9px] text-slate-400 space-y-1">
                  <span className="block font-bold text-slate-300">📱 Telegram Command Shell:</span>
                  <span className="block">• Send <code className="text-indigo-400 bg-slate-800 px-1 rounded">status</code> for real-time telemetry</span>
                  <span className="block">• Send <code className="text-indigo-400 bg-slate-800 px-1 rounded">run scrape</code> for Crawl4AI updater</span>
                </div>
              </div>
            </div>
          )}

          {/* System Stress Monitor */}
          <div className="hidden md:block relative group shrink-0" id="system-stress-monitor">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border shadow-sm cursor-pointer",
              !systemMetrics 
                ? "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-900/50"
                : systemMetrics.status === 'CRITICAL'
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 animate-pulse ring-2 ring-red-300 dark:ring-red-950"
                  : systemMetrics.status === 'STRESSED'
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                    : "bg-slate-50 text-slate-600 border-black/5 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800/50"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                !systemMetrics 
                  ? "bg-slate-300"
                  : systemMetrics.status === 'CRITICAL'
                    ? "bg-red-500 animate-ping"
                    : systemMetrics.status === 'STRESSED'
                      ? "bg-amber-500 animate-pulse"
                      : "bg-emerald-500"
              )} />
              <span className="text-[9px]">
                {!systemMetrics 
                  ? 'Sys Loading...' 
                  : systemMetrics.status === 'CRITICAL' 
                    ? '⚠️ LIMIT WARN' 
                    : `${systemMetrics.active_jobs} JOBS`}
              </span>
            </div>

            {/* Stress monitor tooltip */}
            {systemMetrics && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-4 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-[100] font-mono text-[10px] space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-100 tracking-wider">⚡ HARDWARE STRESS MONITOR</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                    systemMetrics.status === 'CRITICAL' ? "bg-red-500/20 text-red-400" : systemMetrics.status === 'STRESSED' ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {systemMetrics.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {/* CPU load bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-500">CPU LOAD:</span>
                      <span className="text-slate-300 font-bold">{systemMetrics.cpu_load}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          systemMetrics.status === 'CRITICAL' ? "bg-red-500" : systemMetrics.status === 'STRESSED' ? "bg-amber-500" : "bg-emerald-400"
                        )}
                        style={{ width: `${systemMetrics.cpu_load}%` }}
                      />
                    </div>
                  </div>

                  {/* Heap memory bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-500">MEMORY ALLOCATION:</span>
                      <span className="text-slate-300 font-bold">{systemMetrics.memory_usage} MB / 512 MB</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${(systemMetrics.memory_usage / 512) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Concurrency slots */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-500">CONCURRENT JOBS:</span>
                      <span className="text-slate-300 font-bold">{systemMetrics.active_jobs} / {systemMetrics.limit} ACTIVE</span>
                    </div>
                    <div className="flex gap-1 pt-1">
                      {Array.from({ length: systemMetrics.limit }).map((_, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "h-2 flex-1 rounded-sm transition-all duration-300",
                            i < systemMetrics.active_jobs 
                              ? systemMetrics.status === 'CRITICAL' ? "bg-red-500" : "bg-amber-500"
                              : "bg-slate-800"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {systemMetrics.status === 'CRITICAL' && (
                  <div className="border-t border-red-950 pt-2 text-[8px] text-red-400 leading-normal animate-pulse">
                    🚨 <strong>WARNING:</strong> Maximum concurrent thread pool capacity reached. Code execution speed may throttle.
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Global voice command toggle using Web Speech API */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => {
                const nextListening = !isListening;
                setIsListening(nextListening);
                showToast(nextListening ? "🎤 Voice command listening..." : "🎤 Voice commands disabled");
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border shadow-sm cursor-pointer",
                isListening 
                  ? "bg-indigo-600 text-white border-indigo-500 animate-pulse ring-2 ring-indigo-300" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-black/5"
              )}
            >
              {isListening ? <Mic className="w-3.5 h-3.5 text-white animate-bounce" /> : <MicOff className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden md:inline text-[9px]">{isListening ? 'Listening' : 'Voice'}</span>
            </button>
            <button 
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              title="Voice Command Reference"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-black/5"
            title="Open Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cmd</span>
            <kbd className="hidden sm:inline bg-white px-1 rounded shadow-sm">⌘K</kbd>
          </button>
          
          <div className="hidden md:block shrink-0">
            <SyncStatus 
              pendingCount={pendingSyncCount} 
              isConnected={isSupabaseConnected}
              onFlush={() => showToast('Flushing sync queue...')} 
              onViewLogs={() => setIsOfflineLogModalOpen(true)}
            />
          </div>

          <div className="hidden md:flex items-center gap-1 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full font-bold text-xs border border-orange-100 font-mono">
             🔥 {streak} {streak === 1 ? 'Day' : 'Days'}
          </div>

          {userEmail ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {userEmail.trim().toLowerCase() === 'marquiswhitacre@gmail.com' ? (
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 border-none px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest uppercase shadow shimmer-effect shrink-0" title="Marquis Whitacre (God Mode Access Authorized)">
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-900 shrink-0" />
                  <span className="hidden sm:inline">GOD MODE</span>
                  <span className="sm:hidden">GOD</span>
                </div>
              ) : (
                <div className="text-slate-400 text-[10px] font-mono max-w-[60px] sm:max-w-[100px] truncate shrink-0" title={userEmail}>
                  {userEmail}
                </div>
              )}
              <button
                onClick={() => {
                  setUserEmail('');
                  setIsBuyer(false);
                  localStorage.removeItem('codedummy-user-email');
                  localStorage.removeItem('codedummy-is-buyer');
                  showToast('Logged out of Access Terminal');
                }}
                className="p-1.5 sm:p-2 rounded-full hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowSignIn(true)}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-slate-800 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg transition-all shadow cursor-pointer shrink-0"
            >
              <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Sign In</span>
            </button>
          )}

          <button 
            onClick={handleShareReferral}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-slate-900 text-white px-3.5 py-1.5 rounded-full hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Invite & Earn</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            title="Open Control Panel"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Persistent Left Sidebar for Desktop (only shown during Tutorial view and when not loading) */}
        {currentView === 'tutorial' && !viewLoading && (
          <aside className="hidden lg:flex flex-col w-72 border-r border-black/5 bg-white shrink-0 h-full p-4 justify-between z-20 shadow-sm font-sans">
            <div className="flex flex-col gap-5 overflow-y-auto pr-1">
              {/* Sidebar Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-black/5">
                <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-black text-sm tracking-tight leading-tight">CODEDUMMY 101</h2>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Interactive Syllabus</p>
                </div>
              </div>

              {/* Progress Indicator Card */}
              <div className="bg-slate-50 border border-black/5 p-3 rounded-xl">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1.5 font-bold">
                  <span>Syllabus Progress</span>
                  <span className="text-black">{Math.round((completedLessons.length / totalScreens) * 100)}% Done</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black transition-all duration-500 ease-out"
                    style={{ width: `${(completedLessons.length / totalScreens) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">
                  Completed {completedLessons.length} of {totalScreens} lessons
                </p>
              </div>

              {/* Lessons List - Fully interactive jump-to-lesson */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono px-1 mb-1 block">Lessons</span>
                {LESSONS.map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isActive = currentScreen === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentScreen(lesson.id)}
                      className={cn(
                        "w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl transition-all text-xs font-medium border cursor-pointer",
                        isActive 
                          ? "bg-black text-white border-black shadow-md scale-[1.02]" 
                          : "bg-transparent text-slate-600 hover:text-black border-transparent hover:bg-slate-50 hover:border-black/5"
                      )}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={cn("font-bold text-xs truncate", isActive ? "text-white" : "text-black")}>
                          {lesson.id}. {lesson.title}
                        </span>
                        <span className={cn("text-[10px] font-mono mt-0.5 truncate", isActive ? "text-white/70" : "text-slate-400")}>
                          {lesson.subtitle}
                        </span>
                      </div>
                      {isCompleted && (
                        <Check className={cn("w-4 h-4 shrink-0 ml-2", isActive ? "text-white" : "text-emerald-500")} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer Reset button */}
            <div className="pt-3 border-t border-black/5">
              <button
                onClick={() => {
                  setCurrentScreen(1);
                  setCompletedLessons([1]);
                  localStorage.setItem('codedummy-completed-lessons', JSON.stringify([1]));
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Course
              </button>
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto relative bg-transparent flex flex-col">
            {viewLoading === 'tutorial' ? (
              <TutorialViewSkeleton />
            ) : viewLoading === 'projects' ? (
              <ProjectSelectionSkeleton />
            ) : viewLoading === 'agent' ? (
              <AgentViewSkeleton />
            ) : (
              <>
                {currentView === 'analytics' && (
                  <UserAnalytics streak={streak} skillTree={skillTree} addXp={addXp} />
                )}
                {currentView === 'agent' && (
                  <AgentView 
                    hardwareCheck={hardwareCheck} 
                    activeProjectId={activeProjectId} 
                    setActiveProjectId={setActiveProjectId} 
                    onOpenAgentTools={() => setIsAgentToolsOpen(true)} 
                  />
                )}
                {currentView === 'projects' && (
                  <ProjectSelection 
                    skillTree={skillTree} 
                    onProjectStart={() => {}} 
                    onUnlockLab={() => setCurrentView('agent')}
                    addXp={addXp}
                    activeProjectId={activeProjectId}
                    setActiveProjectId={setActiveProjectId}
                    userId={userId}
                    isBuyer={isBuyer}
                    onOpenSignIn={() => setShowSignIn(true)}
                  />
                )}
                {currentView === 'tutorial' && (
                  <TutorialView 
                    currentScreen={currentScreen} 
                    setCurrentScreen={setCurrentScreen} 
                    totalScreens={totalScreens} 
                    completedLessons={completedLessons}
                    setCompletedLessons={setCompletedLessons}
                    onComplete={() => setCurrentView('projects')}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer for Legal Links (Required for Stripe/Coinbase) - Pinned as a safety boundary */}
          <footer className="w-full border-t border-black/5 p-4 text-center shrink-0 bg-white/80 backdrop-blur z-40">
             <div className="flex items-center justify-center gap-6 text-[10px] md:text-xs font-mono uppercase tracking-wider text-slate-400">
               <button onClick={() => setActiveLegal('tos')} className="hover:text-black transition-colors cursor-pointer">Terms of Service</button>
               <button onClick={() => setActiveLegal('privacy')} className="hover:text-black transition-colors cursor-pointer">Privacy Policy</button>
               <button onClick={() => setActiveLegal('refunds')} className="hover:text-black transition-colors cursor-pointer">Refund Policy</button>
             </div>
          </footer>
        </div>
      </div>

      {/* Mobile control panel sliding drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Container */}
          <div className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-slate-50 dark:bg-slate-950 border-l border-black/5 dark:border-slate-800 shadow-2xl z-[160] overflow-y-auto flex flex-col font-sans text-slate-800 dark:text-slate-100 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-black/5 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex flex-col">
                <span className="font-bold tracking-widest text-black dark:text-white uppercase text-xs">Orion Autonomous Panel</span>
                <span className="text-[9px] uppercase font-mono tracking-wider text-indigo-500 dark:text-indigo-400">Mobile Control Center</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Drawer Scrollable Content */}
            <div className="flex-1 p-4 space-y-5 overflow-y-auto">
              {/* Profile / Account Section */}
              <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-slate-800 rounded-xl p-3 space-y-3">
                <div className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500">Access Terminal</div>
                {userEmail ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {userEmail.trim().toLowerCase() === 'marquiswhitacre@gmail.com' ? (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 border-none px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow animate-pulse">
                          <Shield className="w-3 h-3 text-slate-900" />
                          GOD MODE
                        </div>
                      ) : (
                        <div className="text-slate-600 dark:text-slate-300 text-xs font-mono truncate max-w-[160px]">
                          {userEmail}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setUserEmail('');
                          setIsBuyer(false);
                          localStorage.removeItem('codedummy-user-email');
                          localStorage.removeItem('codedummy-is-buyer');
                          showToast('Logged out of Access Terminal');
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-100 transition-colors shrink-0"
                      >
                        <LogOut className="w-3 h-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowSignIn(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-slate-800 rounded-lg transition-all shadow"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In To Terminal
                  </button>
                )}
                
                {/* Referral Share Button */}
                <button 
                  onClick={() => {
                    handleShareReferral();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-slate-900 text-white dark:bg-slate-800 px-3.5 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Invite & Earn Bonus XP</span>
                </button>
              </div>

              {/* Streak Indicator Widget */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-orange-500 font-bold">Activity Streak</span>
                  <span className="text-sm font-black text-orange-700 dark:text-orange-400 mt-0.5">🔥 Daily Commits Safe</span>
                </div>
                <div className="text-sm font-black text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/50">
                  {streak} {streak === 1 ? 'Day' : 'Days'}
                </div>
              </div>

              {/* Active View Syllabus Progress (if applicable) */}
              {currentView === 'tutorial' && (
                <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-slate-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500 font-bold font-mono">
                    <span>Syllabus Progress</span>
                    <span className="text-black dark:text-white font-black">{currentScreen} / {totalScreens}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black dark:bg-indigo-500 transition-all duration-500 ease-out" 
                      style={{ width: `${(currentScreen / totalScreens) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Hardware Stress Monitor Widget */}
              <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex justify-between items-center border-b border-black/5 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500 font-mono">⚡ Hardware Stress</span>
                  {systemMetrics && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      systemMetrics.status === 'CRITICAL' ? "bg-red-500/20 text-red-400 animate-pulse" : systemMetrics.status === 'STRESSED' ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {systemMetrics.status}
                    </span>
                  )}
                </div>
                
                {systemMetrics ? (
                  <div className="space-y-3 font-mono text-[10px]">
                    {/* CPU Load */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">CPU LOAD:</span>
                        <span className="text-slate-700 dark:text-slate-200 font-bold">{systemMetrics.cpu_load}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            systemMetrics.status === 'CRITICAL' ? "bg-red-500" : systemMetrics.status === 'STRESSED' ? "bg-amber-500" : "bg-emerald-400"
                          )}
                          style={{ width: `${systemMetrics.cpu_load}%` }}
                        />
                      </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">MEM ALLOCATION:</span>
                        <span className="text-slate-700 dark:text-slate-200 font-bold">{systemMetrics.memory_usage}MB / 512MB</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${(systemMetrics.memory_usage / 512) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Concurrency Slots */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">ACTIVE JOBS:</span>
                        <span className="text-slate-700 dark:text-slate-200 font-bold">{systemMetrics.active_jobs}/{systemMetrics.limit}</span>
                      </div>
                      <div className="flex gap-1 pt-1">
                        {Array.from({ length: systemMetrics.limit }).map((_, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "h-2 flex-1 rounded-sm transition-all duration-300",
                              i < systemMetrics.active_jobs 
                                ? systemMetrics.status === 'CRITICAL' ? "bg-red-500" : "bg-amber-500"
                                : "bg-slate-200 dark:bg-slate-800"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 font-mono animate-pulse">Waiting for system telemetry...</div>
                )}
              </div>

              {/* Telegram Remote Shell Panel */}
              <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex justify-between items-center border-b border-black/5 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500 font-mono">📡 Remote Shell</span>
                  {telegramStatus && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      telegramStatus.configured ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {telegramStatus.configured ? "CONNECTED" : "INACTIVE"}
                    </span>
                  )}
                </div>
                
                {telegramStatus ? (
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">BOT VECTOR:</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold">@CODEDUMMYBOT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CHAT ID:</span>
                      <span className="text-slate-700 dark:text-slate-200 truncate max-w-[140px] font-bold">{telegramStatus.chatId || "None"}</span>
                    </div>
                    <div className="border-t border-black/5 dark:border-slate-800/80 pt-2 text-[9px] text-slate-400 space-y-1">
                      <span className="block font-bold text-slate-500">Commands Reference:</span>
                      <span className="block">• Send <code className="text-indigo-500 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">status</code> for telemetry</span>
                      <span className="block">• Send <code className="text-indigo-500 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">run scrape</code> for Crawl4AI</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 font-mono animate-pulse">Waiting for network telemetry...</div>
                )}
              </div>

              {/* Interactive System Tools Panel */}
              <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-slate-800 rounded-xl p-3 space-y-3.5">
                <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-slate-400 dark:text-slate-500 block">🎛️ System Controls</span>
                
                {/* Voice Command Widget */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Voice Assistant</span>
                    <button 
                      onClick={() => {
                        setIsVoiceModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                      title="Voice Command Reference"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const nextListening = !isListening;
                      setIsListening(nextListening);
                      showToast(nextListening ? "🎤 Voice command listening..." : "🎤 Voice commands disabled");
                    }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border shadow-sm cursor-pointer",
                      isListening 
                        ? "bg-indigo-600 text-white border-indigo-500 animate-pulse" 
                        : "bg-slate-50 text-slate-600 border-black/5 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    {isListening ? <Mic className="w-4 h-4 text-white animate-bounce" /> : <MicOff className="w-4 h-4 text-slate-500" />}
                    <span>{isListening ? 'Listening (Click to Stop)' : 'Start Listening'}</span>
                  </button>
                </div>

                {/* Database Sync Status */}
                <div className="border-t border-black/5 dark:border-slate-800/80 pt-3 space-y-2">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 block">Database Synchronization</span>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-black/5 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Supabase:</span>
                      <span className={cn("font-bold uppercase text-[9px] font-mono", isSupabaseConnected ? "text-emerald-500" : "text-amber-500")}>
                        {isSupabaseConnected ? "CONNECTED" : "OFFLINE QUEUE"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-400">Queue size:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{pendingSyncCount} operations</span>
                    </div>
                    <div className="flex gap-2 mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          showToast('Flushing sync queue...');
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 py-1 px-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider text-center rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        Flush Queue
                      </button>
                      <button
                        onClick={() => {
                          setIsOfflineLogModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex-1 py-1 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider text-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Logs
                      </button>
                    </div>
                  </div>
                </div>

                {/* Agent Tools Trigger */}
                <div className="border-t border-black/5 dark:border-slate-800/80 pt-3 pb-3">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAgentToolsOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-900 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Open Agent Tools</span>
                  </button>
                </div>
                
                {/* Command Palette Trigger */}
                <div className="border-t border-black/5 dark:border-slate-800/80 pt-3">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setTimeout(() => setIsCommandPaletteOpen(true), 250);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-black/5 dark:border-slate-800 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Open Command Palette</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-black/5 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest bg-white dark:bg-slate-900">
              Orion enterprises • v1.0.1
            </div>
          </div>
        </>
      )}

      <VoiceCommandModal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />

      <LegalModal
        isOpen={activeLegal === 'tos'}
        onClose={() => setActiveLegal(null)}
        title="Terms of Service"
        content={
          <>
            <p><strong>1. Introduction</strong><br/>Welcome to CODEDUMMY / Orion Enterprises. By accessing our website, you agree to these Terms of Service.</p>
            <p><strong>2. Use License</strong><br/>Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.</p>
            <p><strong>3. Disclaimer</strong><br/>The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability.</p>
            <p><strong>4. Limitations</strong><br/>In no event shall Orion Enterprises or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.</p>
          </>
        }
      />

      <LegalModal
        isOpen={activeLegal === 'privacy'}
        onClose={() => setActiveLegal(null)}
        title="Privacy Policy"
        content={
          <>
            <p><strong>1. Information Collection</strong><br/>We only collect information about you if we have a reason to do so—for example, to provide our Services, to communicate with you, or to make our Services better.</p>
            <p><strong>2. Telemetry and Local Data</strong><br/>Our autonomous agent nodes process data primarily on your local hardware. Any telemetry sent back to our servers is strictly anonymized and used for algorithmic curriculum generation.</p>
            <p><strong>3. Third-Party Access</strong><br/>We do not sell your private personal information. We only share information in limited circumstances as required by law or to protect our rights.</p>
          </>
        }
      />

      <LegalModal
        isOpen={activeLegal === 'refunds'}
        onClose={() => setActiveLegal(null)}
        title="Refund Policy"
        content={
          <>
            <p><strong>1. Digital Goods</strong><br/>Due to the digital and downloadable nature of our autonomous agents and training modules, all sales are considered final once the software has been accessed or deployed.</p>
            <p><strong>2. Exceptional Circumstances</strong><br/>We may grant refunds at our sole discretion if there is a verified technical failure on our end that prevents you from accessing the service entirely within the first 14 days.</p>
            <p><strong>3. Subscription Cancellations</strong><br/>If you are on a recurring billing cycle, you may cancel at any time to prevent future charges, but past charges will not be retroactively refunded.</p>
          </>
        }
      />

      {/* Floating Level Up Toast */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-black text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 font-bold tracking-widest uppercase text-sm border border-white/20">
          {toastMessage}
        </div>
      )}

      <FeedbackForm />

      <AgentToolsModal isOpen={isAgentToolsOpen} onClose={() => setIsAgentToolsOpen(false)} userId={userId} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        setIsOpen={setIsCommandPaletteOpen}
        setCurrentView={setCurrentView}
        resetProgress={() => {
          setCurrentScreen(1);
          setCompletedLessons([1]);
          localStorage.setItem('codedummy-completed-lessons', JSON.stringify([1]));
        }}
      />
      
      <OfflineLogModal isOpen={isOfflineLogModalOpen} onClose={() => setIsOfflineLogModalOpen(false)} />
      <ShortcutHelpModal isOpen={isShortcutModalOpen} onClose={() => setIsShortcutModalOpen(false)} />
      <KineticDOM targetElementId="main-lab-chat-panel" />

      <SignInModal 
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={(email, isPremium) => {
          setUserEmail(email);
          localStorage.setItem('codedummy-user-email', email);
          if (isPremium) {
            setIsBuyer(true);
            localStorage.setItem('codedummy-is-buyer', 'true');
            showToast('👑 GOD MODE ADMIN ACCESS GRANTED.');
          } else {
            showToast(`Sign in successful: ${email}`);
          }
        }}
      />
    </div>
  );
}
