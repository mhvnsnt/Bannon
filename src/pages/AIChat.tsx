import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Brain, Search, Sparkles, FolderGit2, Key, Paperclip, X, File as FileIcon, Image as ImageIcon, Video } from 'lucide-react';
import Markdown from 'react-markdown';

import { supabase } from '../lib/supabase';
import { ResearchAgent } from '../components/ResearchAgent';

type Message = { role: 'user' | 'model', text: string };

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini-3.5-flash');
  const [thinking, setThinking] = useState(false);
  const [searchGrounding, setSearchGrounding] = useState(false);
  const [useRepoContext, setUseRepoContext] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('http://localhost:11434');
  const [customModelId, setCustomModelId] = useState('qwen2.5-coder:32b');
  const [aiProvider, setAiProvider] = useState<'gemini'|'local'>('local');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [evolvingContext, setEvolvingContext] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [attachments, setAttachments] = useState<{file: File, dataUrl: string, type: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const loadTokens = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (!error && data) {
             if (data.githubToken) setGithubToken(data.githubToken);
             if (data.openRouterKey) setOpenRouterKey(data.openRouterKey);
             setCustomBaseUrl(data.customBaseUrl || 'http://localhost:11434');
             setCustomModelId(data.customModelId || 'qwen2.5-coder:32b');
             setAiProvider(data.aiProvider || 'local');
             if (data.evolvingContext) setEvolvingContext(data.evolvingContext);
          }
        } catch (error) {
          console.warn("Failed to load chat settings (possibly offline):", error);
        }
      }
    };
    loadTokens();
  }, []);

  const saveOpenRouterSettings = async (key: string, url: string, modelId: string) => {
    setOpenRouterKey(key);
    setCustomBaseUrl(url);
    setCustomModelId(modelId);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        await supabase.from('profiles').upsert({ id: session.user.id, openRouterKey: key, customBaseUrl: url, customModelId: modelId });
      } catch (error) {
        console.warn("Failed to save settings (possibly offline):", error);
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Streaming pipeline simulation for large multimodal files
      // Processes them concurrently instead of dropping connection with massive sync reads
      const processChunks = async (file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
               resolve(event.target.result as string);
            } else {
               resolve('');
            }
          };
          reader.readAsDataURL(file);
        });
      };

      try {
        const processedResults = await Promise.allSettled(newFiles.map(processChunks));
        
        const newAttachments = processedResults.map((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const file = newFiles[index];
            return {
              file,
              dataUrl: result.value,
              type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file'
            };
          }
          return null;
        }).filter(Boolean) as any[];

        setAttachments(prev => [...prev, ...newAttachments]);
      } catch (e) {
        console.error("Chunk processing failed", e);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    if (input.startsWith('/research ')) {
      const query = input.replace('/research ', '');
      setLoading(true);
      setInput('');
      const newMsg: Message = { role: 'user', text: input };
      setMessages(prev => [...prev, newMsg]);
      
      try {
        const summary = await ResearchAgent.processQuery(query, 'search');
        setMessages(prev => [...prev, { role: 'model', text: `[ResearchAgent Activated]\n\n${summary}\n\nI've saved these findings directly to the Knowledge Base for future reference.` }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "ResearchAgent failed to process query." }]);
      }
      setLoading(false);
      return;
    }
    
    if (input.startsWith('/video ')) {
      const query = input.replace('/video ', '');
      setLoading(true);
      setInput('');
      const newMsg: Message = { role: 'user', text: input };
      setMessages(prev => [...prev, newMsg]);
      
      try {
        const summary = await ResearchAgent.processQuery(query, 'video');
        setMessages(prev => [...prev, { role: 'model', text: `[ResearchAgent Video Analysis]\n\n${summary}\n\nVideo parsed successfully. Data stored in Knowledge Base.` }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "ResearchAgent failed to analyze video." }]);
      }
      setLoading(false);
      return;
    }

    if (input.startsWith('/scan ')) {
      const query = input.replace('/scan ', '');
      setLoading(true);
      setInput('');
      const newMsg: Message = { role: 'user', text: input };
      setMessages(prev => [...prev, newMsg]);
      
      try {
        const summary = await ResearchAgent.processQuery(query, 'scan');
        setMessages(prev => [...prev, { role: 'model', text: `[Deep Research Protocol - Asset Scan]\n\n${summary}\n\nScan complete. Initial asset integrity report saved to Knowledge Base.` }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "ResearchAgent failed to scan assets." }]);
      }
      setLoading(false);
      return;
    }

    if (!input.trim() && attachments.length === 0) return;
    
    const newMsg: Message = { role: 'user', text: input };
    const chatHistory = [...messages, newMsg];
    setMessages(chatHistory);
    setInput('');
    setAttachments([]);
    setLoading(true);

    let repoContext = '';
    if (useRepoContext && githubToken) {
      try {
        const repoRes = await fetch('/api/github/repo/Mhvnsnt/Bannon/contents/', {
          headers: { Authorization: `Bearer ${githubToken}` }
        });
        const repoData = await repoRes.json();
        if (Array.isArray(repoData)) {
          repoContext = JSON.stringify(repoData.map((file: any) => ({ name: file.name, type: file.type, path: file.path })));
        }
      } catch (e) {
        console.error("Failed to fetch repo context", e);
      }
    }

    try {
      const isDirectLocal = aiProvider === 'local' && 
        (!customBaseUrl || customBaseUrl.includes('localhost') || customBaseUrl.includes('127.0.0.1'));

      let replyText = '';

      if (isDirectLocal) {
        let localURL = customBaseUrl || 'http://localhost:11434';
        if (!localURL.endsWith('/v1') && !localURL.endsWith('/api')) {
          localURL = localURL.replace(/\/$/, '') + '/v1';
        }
        const modelId = customModelId || 'qwen2.5-coder:32b';

        const instructions = "You are an AI assistant for Bannon Wrestling Game development." + 
          (evolvingContext ? "\n\nUser/Project Evolving Context:\n" + evolvingContext : "") +
          (repoContext ? "\n\nGitHub Repo Context:\n" + repoContext : "");

        const localMessages = [
          { role: 'system', content: instructions },
          ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
          { role: 'user', content: input }
        ];

        try {
          const localRes = await fetch(`${localURL.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            attachments: attachments.map(a => ({ mimeType: a.file.type, data: a.dataUrl.split(',')[1] })),

              model: modelId,
              messages: localMessages,
            })
          });

          if (!localRes.ok) {
            throw new Error(`Local server responded with status ${localRes.status}`);
          }

          const localData = await localRes.json();
          replyText = localData.choices?.[0]?.message?.content || 'No response from local model';
        } catch (localError: any) {
          console.error("Local direct fetch failed:", localError);
          replyText = `⚠️ **Connection to local Ollama server failed.**\n\n` +
            `To connect your local LLM, please ensure:\n` +
            `1. **Ollama is running** on your machine.\n` +
            `2. **CORS is enabled** so this browser can reach it. Launch Ollama in your terminal using:\n` +
            `   \`\`\`bash\n` +
            `   OLLAMA_ORIGINS="*" ollama serve\n` +
            `   \`\`\`\n` +
            `3. If you still have issues, enter an **ngrok public URL** in your Custom Local URL settings so the backend can proxy it securely.`;
        }
      } else {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input,
            history: messages,
            model,
            thinking,
            searchGrounding,
            repoContext,
            openRouterKey,
            customBaseUrl,
            customModelId,
            evolvingContext,
            aiProvider
          })
        });
        const data = await res.json();
        replyText = data.text || data.error || 'Error generated response';
      }
      
      const memoryMatch = replyText.match(/<memory_update>([\s\S]*?)<\/memory_update>/);
      
      
      let finalEvolvingContext = evolvingContext;
      if (memoryMatch) {
        const newMemory = memoryMatch[1].trim();
        finalEvolvingContext = evolvingContext ? evolvingContext + "\n" + newMemory : newMemory;
        setEvolvingContext(finalEvolvingContext);
        replyText = replyText.replace(/<memory_update>[\s\S]*?<\/memory_update>/, '').trim();
      }

      // Check for research updates
      let finalResearch = [];
      const researchMatch = replyText.match(/<research_update>[\s\S]*?<topic>(.*?)<\/topic>[\s\S]*?<summary>(.*?)<\/summary>[\s\S]*?(?:<url>(.*?)<\/url>)?<\/research_update>/);
      if (researchMatch) {
        const topic = researchMatch[1].trim();
        const summary = researchMatch[2].trim();
        const url = researchMatch[3] ? researchMatch[3].trim() : '';
        const newResearch = { topic, summary, url, timestamp: new Date().toISOString() };
        finalResearch = [newResearch]; // will be appended below
        replyText = replyText.replace(/<research_update>[\s\S]*?<\/research_update>/, '').trim();
      }

      // Save to supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data } = await supabase.from('profiles').select('chatHistoryLog, researchNotes').eq('id', session.user.id).single();
          const existingLog = data?.chatHistoryLog || [];
          const existingResearch = data?.researchNotes || [];
          
          const newLogEntry = {
            timestamp: new Date().toISOString(),
            prompt: input,
            response: replyText,
          };
          
          const updatedLog = [...existingLog, newLogEntry];
          const updatedResearch = finalResearch.length > 0 ? [...existingResearch, ...finalResearch] : existingResearch;

          await supabase.from('profiles').upsert({ 
            id: session.user.id, 
            evolvingContext: finalEvolvingContext,
            chatHistoryLog: updatedLog,
            researchNotes: updatedResearch
          });
        } catch (error) {
          console.warn("Failed to save history/context:", error);
        }
      }


      setMessages([...chatHistory, { role: 'model', text: replyText }]);
    } catch (e) {
      console.error(e);
      setMessages([...chatHistory, { role: 'model', text: 'Connection error' }]);
    } finally {
      setLoading(false);
    }
  };

  const isOpenRouterModel = aiProvider !== 'local' && ['qwen-coder-32b', 'qwable', 'abliterated'].includes(model);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-neutral-950">
        <h2 className="text-xl font-bold flex items-center gap-2 shrink-0">
          <Bot className="w-5 h-5 text-indigo-400" /> AI Assistant
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-sm w-full md:w-auto">
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded p-2 focus:outline-none max-w-[200px] truncate"
          >
            <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option>
            <option value="qwen-coder-32b">No Limit Coder Qwen</option>
            <option value="qwable">Qwable</option>
            <option value="abliterated">Abliterated</option>
          </select>

          {isOpenRouterModel && (
            <div className="flex items-center relative">
              <button onClick={() => setShowKeyInput(!showKeyInput)} className="p-2 bg-neutral-900 rounded border border-neutral-800 text-neutral-400 hover:text-indigo-400" title="Custom Server Settings">
                <Key className="w-4 h-4" />
              </button>
              {showKeyInput && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-10 w-72 space-y-3">
                   <div>
                     <label className="block text-xs mb-1 text-neutral-400">OpenRouter API Key (Optional if local)</label>
                     <input type="password" value={openRouterKey} onChange={e => saveOpenRouterSettings(e.target.value, customBaseUrl, customModelId)} placeholder="sk-or-v1-..." className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
                   </div>
                   <div>
                     <label className="block text-xs mb-1 text-neutral-400">Local Base URL (e.g. ngrok to Ollama)</label>
                     
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative group shrink-0 w-16 h-16 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                  {att.type === 'image' ? (
                    <img src={att.dataUrl} alt="attachment" className="w-full h-full object-cover" />
                  ) : att.type === 'video' ? (
                    <Video className="w-6 h-6 text-indigo-400" />
                  ) : (
                    <FileIcon className="w-6 h-6 text-neutral-400" />
                  )}
                  <button onClick={() => removeAttachment(i)} className="absolute top-0 right-0 p-0.5 bg-red-500/80 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            type="text" value={customBaseUrl} onChange={e => saveOpenRouterSettings(openRouterKey, e.target.value, customModelId)} placeholder="https://yourapp.ngrok.io/v1" className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
                   </div>
                   <div>
                     <label className="block text-xs mb-1 text-neutral-400">Custom Model ID (Optional override)</label>
                     <input type="text" value={customModelId} onChange={e => saveOpenRouterSettings(openRouterKey, customBaseUrl, e.target.value)} placeholder="hf.co/huihui-ai/..." className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
                   </div>
                   <p className="text-[10px] text-neutral-500 leading-tight">To use Ollama or a local server without an API key, expose your local port with a tunnel (like ngrok or localtunnel) because this cloud app cannot reach your localhost directly. Example Ollama Model: <code className="bg-neutral-800 p-0.5 rounded">hf.co/huihui-ai/Huihui-Qwable-3.6-27b-abliterated-MTP-GGUF:Q4_K_M</code></p>
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 p-2 rounded border border-neutral-800">
            <input type="checkbox" checked={thinking} onChange={(e) => setThinking(e.target.checked)} className="rounded" />
            <Brain className="w-4 h-4 text-pink-400" /> <span className="hidden sm:inline">High Thinking</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 p-2 rounded border border-neutral-800">
            <input type="checkbox" checked={searchGrounding} onChange={(e) => setSearchGrounding(e.target.checked)} className="rounded" />
            <Search className="w-4 h-4 text-green-400" /> <span className="hidden sm:inline">Search</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 p-2 rounded border border-neutral-800">
            <input type="checkbox" checked={useRepoContext} onChange={(e) => setUseRepoContext(e.target.checked)} className="rounded" />
            <FolderGit2 className="w-4 h-4 text-indigo-400" /> <span className="hidden sm:inline">Repo Context</span>
          </label>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-center px-4">
            <Sparkles className="w-12 h-12 mb-4 text-indigo-400/50" />
            <p>How can I assist with your Bannon Wrestling Game assets today?</p>
            {isOpenRouterModel && !openRouterKey && !customBaseUrl && (
              <p className="mt-4 text-sm text-pink-400 bg-pink-400/10 p-3 rounded-lg max-w-sm">
                You selected a community model. Please click the Key icon above to enter your OpenRouter API key or a Custom Local URL (like ngrok).
              </p>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-2xl p-4 flex gap-3 ${msg.role === 'user' ? 'bg-indigo-600/20 text-indigo-100' : 'bg-neutral-800 text-neutral-200'}`}>
              {msg.role === 'model' && <Bot className="w-6 h-6 shrink-0 mt-1" />}
              <div className="prose prose-invert prose-p:leading-relaxed overflow-x-auto w-full">
                {msg.role === 'user' ? msg.text : <Markdown>{msg.text}</Markdown>}
              </div>
              {msg.role === 'user' && <User className="w-6 h-6 shrink-0 mt-1" />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 rounded-2xl p-4 flex gap-3 items-center">
              <Bot className="w-6 h-6 animate-pulse" />
              <span className="text-neutral-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about assets, write lore, or generate code..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <input type="file" multiple accept="image/*,video/*,.pdf,.txt,.csv,.json" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()} className="absolute right-12 top-2 p-2 text-neutral-400 hover:text-indigo-400 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>

          <button onClick={handleSend} disabled={loading || (!input.trim() && attachments.length === 0) || (isOpenRouterModel && !openRouterKey && !customBaseUrl)} className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
