import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Gamepad2, Settings, Shield, Workflow, Camera, Mic, LogOut, Menu, X, ChevronLeft, ChevronRight, User as UserIcon, Bot, Play, BrainCircuit, Search, Eye, History as HistoryIcon, Bone, BookOpen, Globe } from 'lucide-react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GitHubSync from './pages/GitHubSync';
import Workspace from './pages/Workspace';
import Manifesto from './pages/Manifesto';
import AIChat from './pages/AIChat';
import KnowledgeBase from './pages/KnowledgeBase';
import ResearchDashboard from './pages/ResearchDashboard';
import OmnaraDashboard from './pages/OmnaraDashboard';
import PromptLibrary from './pages/PromptLibrary';
import AICreative from './pages/AICreative';
import LiveVoice from './pages/LiveVoice';
import CreationSuite from './pages/CreationSuite';
import UniverseHub from './pages/UniverseHub';
import TelegramIntegration from './pages/TelegramIntegration';
import GameClient from './pages/GameClient';
import BlenderPipeline from './pages/BlenderPipeline';
import GlobalSyncIndicator from './components/GlobalSyncIndicator';
import { User } from './types';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await logout();
  };

  if (loading) {
    return <div className="flex h-[100dvh] items-center justify-center bg-neutral-950 text-white">Loading...</div>;
  }

  if (!user) {
    return <Routes><Route path="*" element={<Auth />} /></Routes>;
  }

  const isGameClient = location.pathname === '/' || location.pathname === '/play';

  return (
    <div className="flex h-[100dvh] w-full bg-neutral-900 text-neutral-100 font-sans overflow-hidden relative">
      
      {/* Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Asset Manager Drawer */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 flex flex-col w-80 shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-400" />
            <h1 className="font-black text-lg tracking-widest uppercase italic text-white drop-shadow">Asset Manager</h1>
          </div>
          <button className="text-neutral-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-neutral-800">
          <div className="pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Core Engine</div>
          
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-2.5 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 rounded-lg transition-colors group">
            <Play className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" /> <span className="text-sm font-semibold">Play Client</span>
          </Link>
          
          <Link to="/asset-manager" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Settings className="w-4 h-4 shrink-0" /> <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link to="/creation-suite" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <UserIcon className="w-4 h-4 shrink-0" /> <span className="text-sm font-medium">Creation Suite</span>
          </Link>
          <Link to="/universe" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Globe className="w-4 h-4 shrink-0" /> <span className="text-sm font-medium">Universe Hub</span>
          </Link>
          <Link to="/github" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Shield className="w-4 h-4 shrink-0" /> <span className="text-sm font-medium">GitHub Sync</span>
          </Link>
          <Link to="/manifesto" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-indigo-400 hover:text-indigo-300">
            <BookOpen className="w-4 h-4 shrink-0" /> <span className="text-sm font-medium">System Manifesto</span>
          </Link>

          <div className="pt-6 pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">AI & Knowledge</div>
          
          <Link to="/chat" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Workflow className="w-4 h-4 text-indigo-400 shrink-0" /> <span className="text-sm font-medium">AI Assistant</span>
          </Link>
          <Link to="/knowledge" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <BrainCircuit className="w-4 h-4 text-green-400 shrink-0" /> <span className="text-sm font-medium">Knowledge Base</span>
          </Link>
          <Link to="/research-dashboard" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Search className="w-4 h-4 text-pink-400 shrink-0" /> <span className="text-sm font-medium">Research</span>
          </Link>
          <Link to="/omnara" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Eye className="w-4 h-4 text-indigo-400 shrink-0" /> <span className="text-sm font-medium">Omnara Stream</span>
          </Link>
          <Link to="/prompts" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <HistoryIcon className="w-4 h-4 text-pink-400 shrink-0" /> <span className="text-sm font-medium">Prompt Library</span>
          </Link>

          <div className="pt-6 pb-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tools & Pipeline</div>
          
          <Link to="/workspace" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Settings className="w-4 h-4 shrink-0" /> <span className="text-sm font-medium">Workspace</span>
          </Link>
          <Link to="/creative" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Camera className="w-4 h-4 text-pink-400 shrink-0" /> <span className="text-sm font-medium">Creative Studio</span>
          </Link>
          <Link to="/voice" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Mic className="w-4 h-4 text-green-400 shrink-0" /> <span className="text-sm font-medium">Live Voice</span>
          </Link>
          <Link to="/telegram" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Bot className="w-4 h-4 text-purple-400 shrink-0" /> <span className="text-sm font-medium">Telegram Bot</span>
          </Link>
          <Link to="/blender" className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/50 rounded-lg transition-colors text-neutral-300 hover:text-white">
            <Bone className="w-4 h-4 text-amber-500 shrink-0" /> <span className="text-sm font-medium">Blender Rigging</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-neutral-800/50 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full shrink-0 border border-neutral-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-800 shrink-0 border border-neutral-700" />
            )}
            <div className="flex-1 truncate">
              <div className="text-sm font-bold text-white truncate">{user.displayName}</div>
              <div className="text-xs text-neutral-500 truncate">{user.email}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="text-neutral-400 hover:text-red-400 p-2 shrink-0 transition-colors" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content / Viewport */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-neutral-950">
        
        {/* Floating Controls Overlay (Visible only in GameClient or always accessible) */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
            <GlobalSyncIndicator userId={user.uid} />
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="bg-black/50 hover:bg-black/80 backdrop-blur-md border border-neutral-800 text-white p-2.5 rounded-xl shadow-2xl transition-all group flex items-center gap-2"
                title="Open Asset Manager"
            >
                <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400 group-hover:text-white transition-colors">Asset Manager</span>
                <Menu className="w-4 h-4" />
            </button>
        </div>

        {/* Content Wrapper */}
        <div className="w-full h-full overflow-y-auto overscroll-contain">
          <Routes>
            <Route path="/" element={<GameClient />} />
            <Route path="/asset-manager" element={<Dashboard />} />
            <Route path="/github" element={<GitHubSync />} />
            <Route path="/creation-suite" element={<CreationSuite />} />
            <Route path="/universe" element={<UniverseHub />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/research-dashboard" element={<ResearchDashboard />} />
            <Route path="/omnara" element={<OmnaraDashboard />} />
            <Route path="/prompts" element={<PromptLibrary />} />
            <Route path="/creative" element={<AICreative />} />
            <Route path="/voice" element={<LiveVoice />} />
            <Route path="/telegram" element={<TelegramIntegration />} />
            <Route path="/blender" element={<BlenderPipeline />} />
            <Route path="/manifesto" element={<Manifesto />} />
            <Route path="/auth" element={<Dashboard />} />
            <Route path="*" element={<GameClient />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
