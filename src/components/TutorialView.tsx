import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../App';
import {  Menu, ChevronDown, Check, RotateCcw, ArrowLeft, ArrowRight, BookOpen , Volume2, VolumeX, AlertTriangle, Sparkles, Cpu, Wand2, Moon, Sun } from 'lucide-react';
import { CoachIcon } from './CoachIcon';
import { AutonomousMascot } from './AutonomousMascot';
import { executeInWasmSandbox } from '../utils/WasmSandbox';
import { CodedummyLoader } from './CodedummyLoader';

const LESSONS = [
  { id: 1, title: 'The Intro', subtitle: 'print("I\'m a dummy")' },
  { id: 2, title: 'The Response', subtitle: 'print("I\'m here to teach you")' },
  { id: 3, title: 'The Big Three', subtitle: 'Python vs JS vs C++' },
  { id: 4, title: 'CODEDUMMY', subtitle: 'Visual Identity' },
  { id: 5, title: 'Break the Code', subtitle: 'Bubble Text Customizer' },
  { id: 6, title: 'First Assignment', subtitle: 'The Objectives' },
  { id: 7, title: 'Fetching Data', subtitle: 'Live API Testing' },
  { id: 8, title: 'The Code Runner', subtitle: 'Interactive JS Sandbox' }
];

export default function TutorialView({ 
  currentScreen, 
  setCurrentScreen, 
  totalScreens, 
  completedLessons,
  setCompletedLessons,
  onComplete 
}: { 
  currentScreen: number, 
  setCurrentScreen: React.Dispatch<React.SetStateAction<number>>, 
  totalScreens: number, 
  completedLessons: number[],
  setCompletedLessons: React.Dispatch<React.SetStateAction<number[]>>,
  onComplete?: () => void 
}) {
  const [customWord, setCustomWord] = useState('TEST');
  const [color1, setColor1] = useState('#FF3366');
  const [color2, setColor2] = useState('#33CCFF');
  const [apiData, setApiData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [codeTheme, setCodeTheme] = useState<'light' | 'dark'>('dark');
  const [dailyGoalCompleted, setDailyGoalCompleted] = useState(() => {
    return localStorage.getItem('codedummy-daily-goal') === new Date().toISOString().split('T')[0];
  });
  const [dailyGoalText, setDailyGoalText] = useState(() => {
    return localStorage.getItem('codedummy-daily-goal-text') || 'Complete one new lesson';
  });

  const toggleDailyGoal = () => {
    const today = new Date().toISOString().split('T')[0];
    if (dailyGoalCompleted) {
      setDailyGoalCompleted(false);
      localStorage.removeItem('codedummy-daily-goal');
    } else {
      setDailyGoalCompleted(true);
      localStorage.setItem('codedummy-daily-goal', today);
    }
  };

  const handleGoalTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDailyGoalText(e.target.value);
    localStorage.setItem('codedummy-daily-goal-text', e.target.value);
  };

  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentScreen]);

  const getTextToSpeak = (screen: number) => {
    switch (screen) {
      case 1: return "Welcome to the Machine. Before you build, you must understand the environment. This is an interactive training sequence. You must complete the challenges to proceed.";
      case 2: return "The DOM is your canvas. Here is a simple string manipulation challenge. Enter a word below and watch it warp in real-time.";
      case 3: return "CSS Variables are the puppet strings of design. Adjust the hex codes below to override the global gradient in real-time.";
      case 4: return "You can store state securely in the browser. Type a secret code below, and we will write it to localStorage.";
      case 5: return "Timers dictate the flow of execution. Click the button to start a 5-second countdown. Notice how the UI updates every 100 milliseconds.";
      case 6: return "Your objective: Create an application that utilizes the concepts you have just learned. We will provide a sandbox and AI assistance.";
      case 7: return "We can fetch real-time data using the browser's Fetch API. Click the button to retrieve live data from a placeholder API.";
      case 8: return "This is your Code Runner. Test small JavaScript snippets directly in the browser. Execute the code to see the console output below.";
      default: return "";
    }
  };

  const [jumpMenuOpen, setJumpMenuOpen] = useState(false);
  const [showCoachPrompt, setShowCoachPrompt] = useState(false);
  
  // Track completions
  useEffect(() => {
    if (!completedLessons.includes(currentScreen)) {
      const newCompletions = [...completedLessons, currentScreen];
      setCompletedLessons(newCompletions);
      localStorage.setItem('codedummy-completed-lessons', JSON.stringify(newCompletions));
    }
  }, [currentScreen, completedLessons, setCompletedLessons]);

  // CodeRunner State
  const [code, setCode] = useState(() => {
    return localStorage.getItem('tutorial_code_save') || `// Type some JavaScript here!\nconst message = "Hello from CODEDUMMY";\nconsole.log(message);\n\n// Try doing some math:\nconsole.log(10 + 5);\n`;
  });
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  // AI Self-Healing Core states
  const [isHealing, setIsHealing] = useState(false);
  const [healExplanation, setHealExplanation] = useState('');
  const [healedCode, setHealedCode] = useState('');
  const [healError, setHealError] = useState('');
  const [lastSandboxError, setLastSandboxError] = useState('');

  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem('tutorial_code_save', code);
    }, 1000);
    return () => clearTimeout(handler);
  }, [code]);

  const triggerSelfHealing = async (brokenCode: string, errorString: string) => {
    setIsHealing(true);
    setHealError('');
    try {
      const response = await fetch('/api/sandbox/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: brokenCode, error: errorString })
      });
      if (response.ok) {
        const data = await response.json();
        setHealExplanation(data.explanation);
        setHealedCode(data.fixedCode);
      } else {
        const errData = await response.json();
        setHealError(errData.error || 'Failed to communicate with Self-Healing Daemon.');
      }
    } catch (err: any) {
      setHealError(`Connection error to Self-Healing Daemon: ${err.message}`);
    } finally {
      setIsHealing(false);
    }
  };

  const applySelfHeal = () => {
    if (!healedCode) return;
    
    // Play high-speed "Quantum Collapse" glitch hot-swap
    setCode(healedCode);
    setConsoleOutput([
      `🌌 [QUANTUM COLLAPSE DETECTED] Compressing broken semantic dimensions...`,
      `🧬 [SELF-HEAL COGNITION ENERGISED] Hot-swapping secure abstract syntax tree...`,
      `✨ Re-running newly compiled clean code snippet...`
    ]);

    setTimeout(() => {
      codeRef.current = healedCode;
      
      try {
        const result = executeInWasmSandbox(healedCode);
        const outLogs = [
          `🔒 [WASM Sandbox Active] Isolated Heap memory: ${result.memoryUsageBytes} bytes`,
          `⚙️ [WASM Sandbox Telemetry] Executed in ${result.executionTimeMs}ms`,
          ...result.logs
        ];
        if (result.securityViolations.length > 0) {
          result.securityViolations.forEach(v => {
            outLogs.push(`🛑 [SECURITY COMPROMISE ATTEMPT BLOCKED]: ${v}`);
          });
        }
        setConsoleOutput(outLogs);
      } catch (err: any) {
        setConsoleOutput([`🛑 [WASM Core Fault]: ${err.message}`]);
      }
      
      // Keep explanation but reset compiled codes
      setHealedCode('');
    }, 1500); // 1.5 seconds glitch transition duration
  };

  const runCode = () => {
    setHealExplanation('');
    setHealedCode('');
    setHealError('');
    setLastSandboxError('');

    try {
      const result = executeInWasmSandbox(codeRef.current);
      
      const outLogs = [
        `🔒 [WASM Sandbox Active] Isolated Heap memory: ${result.memoryUsageBytes} bytes`,
        `⚙️ [WASM Sandbox Telemetry] Executed in ${result.executionTimeMs}ms`,
        ...result.logs
      ];

      if (result.securityViolations.length > 0) {
        result.securityViolations.forEach(v => {
          outLogs.push(`🛑 [SECURITY COMPROMISE ATTEMPT BLOCKED]: ${v}`);
        });
      }

      setConsoleOutput(outLogs);

      if (!result.success) {
        // Extract exact fault statement
        const errorLine = result.logs.find(l => l.includes('🛑') || l.includes('❌') || l.includes('Failure') || l.includes('Error')) || 'Execution halted due to runtime exception.';
        setLastSandboxError(errorLine);
        // Dispatch autonomous Self-Healing background job
        triggerSelfHealing(codeRef.current, errorLine);
      }
    } catch (err: any) {
      const faultMsg = `🛑 [WASM Core Fault]: ${err.message}`;
      setConsoleOutput([faultMsg]);
      setLastSandboxError(faultMsg);
      // Dispatch autonomous Self-Healing background job
      triggerSelfHealing(codeRef.current, faultMsg);
    }
  };

  // Keyboard shortcut for Ctrl+Enter / Cmd+Enter to run code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (currentScreen === 8) {
          e.preventDefault();
          runCode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen]);

  // Stop propagating clicks if we click inside an interactive element
  const handleNextScreen = () => {
    // Prevent the index from exceeding the total number of lessons
    if (currentScreen < totalScreens) {
      setCurrentScreen(prev => prev + 1);
    } else if (onComplete) {
      // Trigger a safe completion state instead of trying to load a non-existent slide
      onComplete();
    }
  };

  const renderBubbleWord = (word: string, c1?: string, c2?: string, useMultiColor = true, isMainTitle = false) => {
    const defaultColors = [
      '#FF3366', // Pink-red
      '#FF9933', // Orange
      '#FFCC33', // Yellow
      '#33FF66', // Green
      '#33CCFF', // Light Blue
      '#3333FF', // Blue
      '#9933FF', // Purple
      '#FF33CC', // Violet-pink
      '#FF5555'  // Coral Red
    ];
    
    return (
      <div className="flex flex-row flex-nowrap items-center justify-center whitespace-nowrap gap-1 md:gap-2.5 select-none overflow-visible max-w-full">
        {word.split('').map((char, i) => {
          const isEven = i % 2 === 0;
          const color = useMultiColor 
            ? defaultColors[i % defaultColors.length] 
            : (isEven ? c1 || '#FF3366' : c2 || '#33CCFF');
            
          return (
            <span
              key={i}
              className={cn(
                "inline-block font-black bubble-text transform transition-all duration-300 hover:scale-125 hover:rotate-6",
                isMainTitle 
                  ? "text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem] xl:text-[12rem]"
                  : "text-4xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[10rem]",
                isEven ? "-rotate-6" : "rotate-6"
              )}
              style={{
                color: color,
                fontFamily: '"Comic Sans MS", "Arial Black", sans-serif',
                textShadow: '4px 4px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
    );
  };

  const fetchApiData = async () => {
    setApiLoading(true);
    try {
      // Changed to fetch multiple users to demonstrate card list
      const response = await fetch('https://jsonplaceholder.typicode.com/users?_limit=3');
      const data = await response.json();
      setApiData(data);
    } catch (e) {
      setApiData({ error: 'Failed to fetch' });
    }
    setApiLoading(false);
  };


  return (
    <>
      <div 
        className={cn(
          "flex-1 flex flex-col h-full overflow-y-auto w-full text-[#1d1d1f] relative pb-28 pt-20",
          currentScreen === 3 || currentScreen === 7 || currentScreen === 8 ? "items-start justify-start p-4 md:p-8" : "items-center justify-center p-4"
        )}
        style={{
          background: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #f5f5f7 100%)',
          perspective: '1200px'
        }}
      >
        {/* Dynamic Syllabus / Progress Navigation Menu (ONLY visible on mobile/tablet) */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[80] pointer-events-auto">
          <div className="relative lg:hidden">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-full border border-black/10 shadow-lg text-xs font-bold uppercase tracking-wider backdrop-blur transition-all active:scale-95 cursor-pointer"
            >
              <Menu className="w-4 h-4 text-slate-600" />
              <span>Course Menu</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", menuOpen && "rotate-180")} />
            </button>

        <button
          onClick={() => toggleSpeech(getTextToSpeak(currentScreen))}
          className="p-2 ml-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-black/5"
          title={isSpeaking ? "Stop Narration" : "Read Aloud"}
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

            
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-white border border-black/10 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 px-3 py-1.5 flex justify-between items-center">
                    <span>Syllabus & Assignments</span>
                    <span className="font-bold text-black">{Math.round((completedLessons.length / totalScreens) * 100)}% Done</span>
                  </div>
                  <div className="px-3 pb-3 mb-2 border-b border-black/5">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-visible relative">
                      <motion.div 
                        key={`progress-${completedLessons.length}`}
                        className="bg-emerald-500 h-full rounded-full absolute left-0 top-0" 
                        initial={{ width: `${(Math.max(0, completedLessons.length - 1) / totalScreens) * 100}%` }}
                        animate={{ 
                          width: `${(completedLessons.length / totalScreens) * 100}%`,
                          boxShadow: [
                            "0 0 0 0 rgba(16, 185, 129, 0)",
                            "0 0 0 6px rgba(16, 185, 129, 0.4)",
                            "0 0 0 0 rgba(16, 185, 129, 0)"
                          ]
                        }}
                        transition={{ 
                          width: { type: 'spring', stiffness: 50, damping: 15 },
                          boxShadow: { duration: 1, ease: "easeOut" }
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1 max-h-[320px] overflow-y-auto">
                    {LESSONS.map((lesson) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isActive = currentScreen === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setCurrentScreen(lesson.id);
                            setMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl transition-colors text-xs font-medium cursor-pointer",
                            isActive 
                              ? "bg-black text-white" 
                              : "hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className={cn("font-bold text-sm", isActive ? "text-white" : "text-black")}>
                              {lesson.id}. {lesson.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{lesson.subtitle}</span>
                          </div>
                          {isCompleted && (
                            <Check className={cn("w-4 h-4 shrink-0 ml-2", isActive ? "text-white" : "text-emerald-500")} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Daily Goal</span>
                        {dailyGoalCompleted && <span className="text-emerald-500">Achieved! 🎉</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={toggleDailyGoal}
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                            dailyGoalCompleted 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "bg-white border-slate-300 hover:border-slate-400"
                          )}
                        >
                          {dailyGoalCompleted && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <input 
                          type="text"
                          value={dailyGoalText}
                          onChange={handleGoalTextChange}
                          className={cn(
                            "flex-1 bg-transparent text-xs font-medium focus:outline-none placeholder:text-slate-400",
                            dailyGoalCompleted ? "text-slate-400 line-through" : "text-slate-700"
                          )}
                          placeholder="Set a daily goal..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentScreen(1);
                          setCompletedLessons([1]);
                          localStorage.setItem('codedummy-completed-lessons', JSON.stringify([1]));
                          setMenuOpen(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-red-600 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Course
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Active lesson subtitle info on top right */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/5 text-slate-600 px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-wider ml-auto">
            <BookOpen className="w-3.5 h-3.5" />
            Lesson {currentScreen} of {totalScreens}: {LESSONS[currentScreen - 1]?.title}
          </div>
        </div>

      <div 
        className={cn(
          "w-full max-w-5xl transition-transform duration-500",
          currentScreen >= 4 ? "flex flex-col" : "block"
        )}
        style={{ transform: currentScreen >= 4 ? 'rotateX(2deg)' : 'none' }}
      >
        {currentScreen === 1 && (
          <div className="text-center w-full animate-in fade-in zoom-in duration-500">
            <h1 className="text-4xl md:text-6xl p-5 font-semibold text-black uppercase tracking-widest">print("I don't know the languages, I'm a dummy.")</h1>
          </div>
        )}

        {currentScreen === 2 && (
          <div className="text-center w-full animate-in fade-in zoom-in duration-500">
            <h1 className="text-4xl md:text-6xl p-5 font-semibold text-black uppercase tracking-widest">print("well, dummy. I'm here to teach you.")</h1>
          </div>
        )}

        {currentScreen === 3 && (
          <div className="max-w-3xl mx-auto text-left text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-500 w-full bg-white/80 p-8 rounded-xl border border-black/5 shadow-xl backdrop-blur-md">
            <h2 className="text-black text-2xl font-bold mb-6">Here is what "I don't know the languages, I'm a dummy" looks like in three of the biggest languages right now.</h2>
            
            <h3 className="text-black text-xl font-bold mt-8 mb-2">1. Python</h3>
            <pre className={cn("p-4 rounded-md font-mono overflow-x-auto mb-4 border transition-colors duration-300", codeTheme === 'dark' ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-200")}><code>print("I don't know the languages, I'm a dummy.")</code></pre>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>The Vibe:</strong> The Swiss Army knife. It reads almost like plain English.</li>
              <li><strong>What it does:</strong> AI, data analysis, and building the behind-the-scenes logic of apps.</li>
            </ul>

            <h3 className="text-black text-xl font-bold mt-8 mb-2">2. JavaScript (JS)</h3>
            <pre className={cn("p-4 rounded-md font-mono overflow-x-auto mb-4 border transition-colors duration-300", codeTheme === 'dark' ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-200")}><code>console.log("I don't know the languages, I'm a dummy.");</code></pre>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>The Vibe:</strong> The language of the internet.</li>
              <li><strong>What it does:</strong> Makes websites actually do stuff.</li>
            </ul>

            <h3 className="text-black text-xl font-bold mt-8 mb-2">3. C++</h3>
            <pre className={cn("p-4 rounded-md font-mono overflow-x-auto mb-4 border transition-colors duration-300", codeTheme === 'dark' ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-200")}><code>{`#include <iostream>\nint main() {\n    std::cout << "I don't know the languages, I'm a dummy.\\n";\n    return 0;\n}`}</code></pre>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>The Vibe:</strong> The heavy machinery.</li>
              <li><strong>What it does:</strong> High-performance systems. AAA video games, complex physics engines.</li>
            </ul>

            <hr className="border-slate-200 my-10" />

            <h3 className="text-black text-xl font-bold mb-4">The House Analogy</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>HTML</strong> is the framing and drywall.</li>
              <li><strong>CSS</strong> is the paint, lighting, and interior design.</li>
              <li><strong>JavaScript</strong> is the electricity and plumbing.</li>
              <li><strong>Python</strong> is the city infrastructure miles away.</li>
            </ul>
          </div>
        )}

        {currentScreen === 4 && (
          <div className="text-center w-full animate-in fade-in zoom-in duration-500 max-w-full px-4 overflow-hidden">
            <div className="font-['Comic_Sans_MS','Arial_Black',sans-serif] text-2xl sm:text-3xl md:text-4xl uppercase mb-6 text-black tracking-widest">Welcome To</div>
            <div className="flex justify-center items-center w-full overflow-visible py-4">
               {renderBubbleWord('CODEDUMMY', undefined, undefined, true, true)}
            </div>
          </div>
        )}

        {currentScreen === 5 && (
          <div className="text-center w-full animate-in fade-in slide-in-from-bottom-10 duration-500 p-8">
            <div className="font-['Comic_Sans_MS','Arial_Black',sans-serif] text-2xl md:text-3xl uppercase mb-8 text-black">Now you try. Break the code.</div>
            
            <div className="mt-5 bg-white p-6 rounded-xl inline-block shadow-2xl border border-black/10 backdrop-blur-md">
              <input 
                type="text" 
                value={customWord} 
                onChange={(e) => setCustomWord(e.target.value.toUpperCase().slice(0, 12))}
                maxLength={12}
                className="text-2xl md:text-3xl p-3 rounded-lg border border-slate-200 text-center uppercase mb-4 font-['Comic_Sans_MS','Arial_Black',sans-serif] w-full max-w-[300px] text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <br />
              <div className="flex justify-center gap-4">
                <input 
                  type="color" 
                  value={color1} 
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-16 h-16 border-none cursor-pointer bg-transparent rounded-lg"
                />
                <input 
                  type="color" 
                  value={color2} 
                  onChange={(e) => setColor2(e.target.value)}
                  className="w-16 h-16 border-none cursor-pointer bg-transparent rounded-lg"
                />
              </div>
            </div>

            <div className="mt-12 min-h-[150px] flex justify-center items-center overflow-visible py-4">
              {renderBubbleWord(customWord, color1, color2, false)}
            </div>
          </div>
        )}

        {currentScreen === 6 && (
          <div className="text-center w-full animate-in fade-in zoom-in duration-500 p-8 flex flex-col items-center">
            <h1 className="font-['Comic_Sans_MS','Arial_Black',sans-serif] text-5xl md:text-7xl text-black mb-8" style={{textShadow: '4px 4px 0 rgba(0,0,0,0.1)'}}>CODEDUMMY 101</h1>
            <div className="bg-white/80 p-10 rounded-2xl border border-black/5 shadow-2xl backdrop-blur-xl">
              <h2 className="text-2xl md:text-3xl text-slate-500 font-normal mb-3">First Class.</h2>
              <h2 className="text-2xl md:text-3xl text-slate-500 font-normal mb-3">First Lesson.</h2>
              <h2 className="text-2xl md:text-3xl text-slate-500 font-normal mb-10">First Objective.</h2>
              <h2 className="text-3xl md:text-4xl text-black font-bold">First Assignment.</h2>
            </div>
          </div>
        )}

        {currentScreen === 7 && (
          <div className="max-w-3xl mx-auto text-left text-lg leading-relaxed animate-in fade-in slide-in-from-right-10 duration-500 w-full bg-white/80 p-8 rounded-xl border border-black/5 shadow-xl backdrop-blur-md">
             <h1 className="font-['Comic_Sans_MS','Arial_Black',sans-serif] text-4xl md:text-5xl text-black mb-4">Fetching Data</h1>
             <p className="mb-6 text-slate-700">This is the bridge. You can't just build UI; you need to pull live data from the outside world. This is called an API.</p>
             
             <h3 className="text-black text-2xl font-bold mt-8 mb-4">The Request</h3>
             <p className="mb-4 text-slate-500 text-sm">We are asking a public server for a random list of users.</p>
             <pre className={cn("p-4 rounded-md font-mono overflow-x-auto mb-6 text-sm border transition-colors duration-300", codeTheme === 'dark' ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-200")}>
<code>{`fetch('https://jsonplaceholder.typicode.com/users?_limit=3')
  .then(response => response.json())
  .then(data => console.log(data));`}</code>
             </pre>

             <div className="bg-white p-6 rounded-xl border border-black/10 shadow-lg mb-8 relative z-10 hover:-translate-y-1 transition-transform">
               <div className="flex justify-between items-center mb-6">
                 <span className="font-bold text-black uppercase tracking-wider text-sm">Live API Test</span>
                 <button 
                   onClick={fetchApiData}
                   disabled={apiLoading}
                   className="bg-black text-white px-6 py-2.5 rounded-md font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-md cursor-pointer"
                 >
                   {apiLoading ? 'Fetching...' : 'FETCH DATA'}
                 </button>
               </div>
               
               {apiData && Array.isArray(apiData) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-5">
                    {apiData.map((user: any) => (
                      <div key={user.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-sm">
                        <div className="font-bold text-slate-900 truncate">{user.name}</div>
                        <div className="text-sm text-slate-500 mb-2 truncate">@{user.username}</div>
                        <div className="text-xs text-slate-600 truncate">📧 {user.email}</div>
                        <div className="text-xs text-slate-600 truncate mt-1">🏢 {user.company?.name}</div>
                      </div>
                    ))}
                  </div>
               )}
               {!apiData && (
                  <div className="text-slate-500 text-sm italic p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">Click the fetch button to pull live data...</div>
               )}
               {apiData && !Array.isArray(apiData) && (
                  <div className="text-red-500 text-sm p-4 bg-red-50 rounded border border-red-200">Error loading data.</div>
               )}
             </div>
          </div>
        )}

        {currentScreen === 8 && (
          <div className="max-w-4xl mx-auto text-left animate-in fade-in slide-in-from-right-10 duration-500 w-full bg-white/80 p-8 rounded-xl border border-black/5 shadow-xl backdrop-blur-md">
             <h1 className="font-['Comic_Sans_MS','Arial_Black',sans-serif] text-4xl md:text-5xl text-black mb-4">The Code Runner</h1>
             <p className="mb-6 text-slate-700">Write your own JavaScript. Press <kbd className="bg-slate-200 px-2 py-1 rounded text-sm font-mono border border-slate-300 text-slate-800 shadow-sm mx-1">Ctrl</kbd> + <kbd className="bg-slate-200 px-2 py-1 rounded text-sm font-mono border border-slate-300 text-slate-800 shadow-sm mx-1">Enter</kbd> (or click Run) to execute it.</p>
             
             <div className="flex flex-col lg:flex-row gap-6">
                {/* Editor */}
                <div className={cn("flex-1 flex flex-col border rounded-xl overflow-hidden shadow-sm transition-colors duration-300", codeTheme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-300")}>
                  <div className={cn("border-b px-4 py-3 flex justify-between items-center transition-colors duration-300", codeTheme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-300")}>
                    <span className={cn("font-bold text-sm tracking-wide", codeTheme === 'dark' ? "text-slate-300" : "text-slate-700")}>EDITOR (JS)</span>
                    <button 
                      onClick={runCode}
                      className="bg-emerald-500 text-white px-5 py-1.5 rounded-md text-sm font-bold shadow hover:bg-emerald-600 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      ▶ RUN CODE
                    </button>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      window.dispatchEvent(new CustomEvent('editor-code-changed', { detail: { code: e.target.value } }));
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        runCode();
                      }
                    }}
                    className={cn("w-full h-[300px] lg:h-[400px] p-5 font-mono text-sm focus:outline-none resize-none leading-relaxed transition-colors duration-300", codeTheme === 'dark' ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900")}
                    spellCheck={false}
                  />
                </div>

                {/* Console */}
                <div className="flex-1 flex flex-col bg-slate-950 rounded-xl overflow-hidden shadow-xl border border-slate-800">
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
                    <span className="font-bold text-slate-400 text-sm tracking-wide">CONSOLE OUTPUT</span>
                  </div>
                  <div className="flex-1 p-5 font-mono text-sm overflow-y-auto bg-slate-950 text-emerald-400 min-h-[300px] lg:min-h-[400px] leading-relaxed">
                    {consoleOutput.length === 0 ? (
                      <span className="text-slate-600 italic">Waiting for execution...</span>
                    ) : (
                      consoleOutput.map((line, i) => (
                        <div key={i} className="mb-2 border-b border-slate-800/50 pb-2 break-words">{line}</div>
                      ))
                    )}
                  </div>
                </div>
             </div>

             {/* Holographic AI Self-Healing Panel */}
             {(isHealing || healedCode || healError) && (
               <div className="mt-8 border border-indigo-500/30 bg-slate-950/90 text-slate-100 rounded-xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                 {/* Glowing cyan background vector or line */}
                 <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 animate-pulse" />
                 
                 <div className="flex flex-col md:flex-row gap-6 items-start">
                   {/* Loader Graphic status */}
                   <div className="shrink-0 flex items-center justify-center p-2 bg-slate-900 border border-slate-800 rounded-lg">
                     {isHealing ? (
                       <CodedummyLoader status="collapse" taskDescription="AI HEALING DEEP CORE WORKER" />
                     ) : healError ? (
                       <CodedummyLoader status="error" taskDescription="HEALING DEEP CORE FAULT" />
                     ) : (
                       <CodedummyLoader status="entangled" taskDescription="CORRECTION SOLUTION RECONCILED" />
                     )}
                   </div>

                   <div className="flex-1 space-y-4">
                     <div className="flex items-center gap-2">
                       <Cpu className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                       <span className="font-bold tracking-wider uppercase text-cyan-400 text-sm">CODEDUMMY Autopilot System Healing Core</span>
                     </div>

                     {isHealing && (
                       <div className="space-y-2">
                         <p className="text-sm font-bold text-slate-300 animate-pulse">🤖 Analyzing syntax violation tree and stack trace via Gemini-3.5...</p>
                         <p className="text-xs text-slate-500 leading-relaxed font-mono">Comparing variables, compiling strict sandbox-friendly alternatives, and repairing abstract state machine...</p>
                       </div>
                     )}

                     {healError && (
                       <div className="space-y-2">
                         <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                           <AlertTriangle className="w-4 h-4" />
                           <span>AI HEALING CORE DEVIATION:</span>
                         </div>
                         <p className="text-sm text-slate-400">{healError}</p>
                       </div>
                     )}

                     {healedCode && (
                       <div className="space-y-4">
                         <div className="space-y-1">
                           <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">EXPLANATION OF EXCEPTION:</span>
                           <p className="text-sm text-slate-300 leading-relaxed font-mono">{healExplanation}</p>
                         </div>

                         <div className="space-y-2">
                           <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">RECONCILED CODE PREVIEW:</span>
                           <pre className="bg-slate-900/80 p-4 rounded-lg font-mono text-xs overflow-x-auto text-emerald-400 border border-slate-800 max-h-[160px]">
                             <code>{healedCode}</code>
                           </pre>
                         </div>

                         <button
                           onClick={applySelfHeal}
                           className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:brightness-110 shadow-lg active:scale-95 transition-all cursor-pointer"
                         >
                           <Wand2 className="w-3.5 h-3.5 text-white" /> Apply Quantum Auto-Fix & Compile
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Beautiful Scrollable Bottom Navigation Dock (Navigation Controller) - Placed inside the scrollable container so it scrolls naturally with the page */}
        <div className="relative flex justify-center w-full mt-24 mb-12">
          <div className="flex items-center gap-3 z-30 bg-white/95 border border-black/10 px-4 py-2.5 rounded-full shadow-2xl pointer-events-auto backdrop-blur">
            <CoachIcon onClick={() => setShowCoachPrompt(!showCoachPrompt)} />

            {showCoachPrompt && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[95] w-64 bg-white p-4 rounded-xl border border-black/5 shadow-2xl animate-in slide-in-from-bottom-4">
                <h4 className="text-xs font-bold mb-2">Agent Hint</h4>
                <p className="text-[10px] text-slate-500 mb-3">Try checking the console output if the code doesn't run!</p>
                <button onClick={() => setShowCoachPrompt(false)} className="w-full text-[10px] bg-indigo-600 text-white rounded p-1 cursor-pointer">Got it</button>
              </div>
            )}

            {/* Optional Spoken Narration (Web Speech API) */}
            <button
              onClick={() => toggleSpeech(getTextToSpeak(currentScreen))}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer",
                isSpeaking 
                  ? "bg-emerald-500 text-white animate-pulse" 
                  : "text-slate-600 hover:text-black hover:bg-slate-100"
              )}
              title={isSpeaking ? "Stop Narration" : "Listen to Narration (Spoken Aloud)"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Back Button */}
            <button
              onClick={() => setCurrentScreen(prev => Math.max(1, prev - 1))}
              disabled={currentScreen === 1}
              className="flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:text-black hover:bg-slate-100 transition-all disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              title="Previous Lesson"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Theme Toggle Button */}
            <button
              onClick={() => setCodeTheme(codeTheme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer",
                codeTheme === 'dark'
                  ? "text-slate-600 hover:text-black hover:bg-slate-100"
                  : "bg-amber-100 text-amber-600 hover:bg-amber-200"
              )}
              title="Toggle Code Snippet Theme"
            >
              {codeTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Custom Navigation Controller Dropdown */}
            <div className="relative">
              <button
                onClick={() => setJumpMenuOpen(!jumpMenuOpen)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-full border border-black/5 text-xs font-bold font-mono tracking-tight transition-all active:scale-95 cursor-pointer"
              >
                <span>LESSON {currentScreen}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", jumpMenuOpen && "rotate-180")} />
              </button>

              {jumpMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setJumpMenuOpen(false)} />
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 bg-white border border-black/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 px-2.5 py-1.5 border-b border-black/5 mb-1">
                      Jump to Lesson
                    </div>
                    <div className="space-y-0.5 max-h-[220px] overflow-y-auto">
                      {LESSONS.map((lesson) => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        // Next lesson is available to jump to
                        const isNextAvailable = lesson.id === Math.max(...completedLessons) + 1;
                        const isAvailable = isCompleted || isNextAvailable || lesson.id === 1;
                        const isActive = currentScreen === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            disabled={!isAvailable}
                            onClick={() => {
                              setCurrentScreen(lesson.id);
                              setJumpMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                              isActive 
                                ? "bg-black text-white" 
                                : isAvailable
                                  ? "hover:bg-slate-100 text-slate-700"
                                  : "text-slate-300 cursor-not-allowed"
                            )}
                          >
                            <span className="truncate">
                              {lesson.id}. {lesson.title}
                            </span>
                            {isCompleted && (
                              <Check className={cn("w-3.5 h-3.5 shrink-0 ml-2", isActive ? "text-white" : "text-emerald-500")} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Next / Finish Button */}
            {currentScreen < totalScreens ? (
              <button
                onClick={handleNextScreen}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white hover:bg-slate-800 transition-all shadow cursor-pointer"
                title="Next Lesson"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              onComplete && (
                <button
                  onClick={onComplete}
                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow cursor-pointer"
                >
                  Finish
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
      {currentScreen >= 3 && (
        <div className="fixed bottom-24 right-8 z-[100]">
           <AutonomousMascot isAdmin={false} />
        </div>
      )}
    </>
  );
}
