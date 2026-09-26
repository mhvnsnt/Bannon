import { useState, useEffect, useRef } from 'react';
import { Bot, Send, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Link2, Terminal, Info, BrainCircuit } from 'lucide-react';
import { supabase } from '../lib/supabase';


type ChatMessage = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
};

export default function TelegramIntegration() {
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramVerified, setTelegramVerified] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('http://localhost:11434');
  const [customModelId, setCustomModelId] = useState('qwen2.5-coder:32b');
  const [webhookRegistered, setWebhookRegistered] = useState(() => {
    return localStorage.getItem('bannon_telegram_webhook_registered') === 'true';
  });
  const [registeringWebhook, setRegisteringWebhook] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Bot Simulator State
  const [simMessage, setSimMessage] = useState('');
  const [simChat, setSimChat] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "👋 **Welcome to Bannon Wrestling Asset Manager Bot!**\n\nThis bot is configured to route all queries through your **local Ollama API**.\n\n⚠️ **Setup Step:** Please verify your local server connection by sending `/verify` or clicking 'Verify Local Ollama Connection' above.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [simLoading, setSimLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLoading(true);
        try {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (!error && data) {
            if (data.telegramToken) setTelegramToken(data.telegramToken);
            if (data.telegramVerified !== undefined) setTelegramVerified(data.telegramVerified);
            if (data.customBaseUrl) setCustomBaseUrl(data.customBaseUrl);
            if (data.customModelId) setCustomModelId(data.customModelId);
          }
        } catch (error) {
          console.warn("Failed to load telegram settings:", error);
        }
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simChat]);

  
  const triggerBotMessage = async () => {
    try {
      const res = await fetch('/api/telegram/trigger-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Bannon Asset Manager CO Dev initialized. I am online and ready to pitch research ideas to you before pushing them to the In-Game Agents. What's our first target?" })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: "Bot sent you a message!" });
      } else {
        setStatusMessage({ type: 'error', text: data.error || "Failed to trigger message." });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    }
  };

  const registerTelegramWebhook = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    if (!telegramToken) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Telegram Bot Token first.' });
      return;
    }
    setRegisteringWebhook(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/telegram/register-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          telegramToken,
          origin: window.location.origin
        })
      });
      const data = await response.json();
      if (data.success) {
        setWebhookRegistered(true);
        localStorage.setItem('bannon_telegram_webhook_registered', 'true');
        setStatusMessage({ type: 'success', text: `Webhook registered successfully! Telegram now forwards bot updates to your environment-provided host: ${window.location.origin}` });
      } else {
        setWebhookRegistered(false);
        localStorage.removeItem('bannon_telegram_webhook_registered');
        setStatusMessage({ type: 'error', text: data.error || 'Failed to register webhook' });
      }
    } catch (error: any) {
      setWebhookRegistered(false);
      localStorage.removeItem('bannon_telegram_webhook_registered');
      setStatusMessage({ type: 'error', text: `Webhook registration failed: ${error.message}` });
    }
    setRegisteringWebhook(false);
  };

const saveSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        telegramToken,
        customBaseUrl,
        customModelId
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const verifyConnection = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setVerifying(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/telegram/verify-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          customBaseUrl
        })
      });
      const data = await response.json();
      if (data.success) {
        setTelegramVerified(true);
        setStatusMessage({ type: 'success', text: data.message });
      } else {
        setTelegramVerified(false);
        setStatusMessage({ type: 'error', text: data.error || 'Connection failed' });
      }
    } catch (error: any) {
      setTelegramVerified(false);
      setStatusMessage({ type: 'error', text: `Failed to contact server: ${error.message}` });
    }
    setVerifying(false);
  };

  const handleSimSend = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!simMessage.trim() || !session?.user) return;
    const userText = simMessage;
    setSimMessage('');
    
    const newUserMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString()
    };
    setSimChat(prev => [...prev, newUserMsg]);
    setSimLoading(true);

    try {
      const response = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          text: userText
        })
      });
      const data = await response.json();
      
      const newBotMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'bot',
        text: data.reply || 'No response',
        timestamp: new Date().toLocaleTimeString()
      };
      
      // Update local verified badge if they sent /verify inside the chat
      if (userText.trim().toLowerCase().startsWith('/verify') && data.reply.includes('verified')) {
        setTelegramVerified(true);
      } else if (userText.trim().toLowerCase().startsWith('/verify') && data.reply.includes('failed')) {
        setTelegramVerified(false);
      }

      setSimChat(prev => [...prev, newBotMsg]);
    } catch (e: any) {
      setSimChat(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'bot',
        text: `⚠️ **Simulator Error:** ${e.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setSimLoading(false);
  };

  const [userId, setUserId] = useState<string>('user_id');
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });
  }, []);

  const webhookUrl = `${window.location.origin}/api/telegram/webhook?userId=${userId}`;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7 text-indigo-400" /> Telegram Integration
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Connect and configure your Telegram bot to use local Ollama models.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm bg-neutral-900 border border-neutral-800 p-2 rounded-lg">
            <span className="text-neutral-500">Local LLM:</span>
            {telegramVerified ? (
              <span className="text-green-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Connected & Verified
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Connection Pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm bg-neutral-900 border border-neutral-800 p-2 rounded-lg">
            <span className="text-neutral-500">Brain Sync (BAMBot):</span>
            {webhookRegistered ? (
              <span className="text-indigo-400 font-medium flex items-center gap-1.5 animate-pulse">
                <BrainCircuit className="w-4 h-4" /> Active & Brain-Synced
              </span>
            ) : (
              <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> Webhook Offline
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-neutral-950 p-4 md:p-6 rounded-xl border border-neutral-800 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-neutral-900 pb-3">
              <Cpu className="w-5 h-5 text-indigo-400" /> Bot & LLM Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Obtain a token from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">@BotFather</a> on Telegram.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Local Ollama URL
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Local Model ID
                  </label>
                  <input
                    type="text"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    placeholder="qwen2.5-coder:32b"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={verifyConnection}
                disabled={verifying}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-lg text-white font-medium transition-all"
              >
                {verifying ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <RefreshCw className="w-4 h-4" />}
                Verify Local Ollama Connection
              </button>
              
              <button
                onClick={saveSettings}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-all"
              >
                {saveSuccess ? 'Saved!' : 'Save Settings'}
              </button>

              <button
                onClick={registerTelegramWebhook}
                disabled={registeringWebhook}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-950 border border-indigo-800 hover:border-indigo-500 rounded-lg text-indigo-200 font-medium transition-all"
              >
                {registeringWebhook ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <BrainCircuit className="w-4 h-4" />}
                Auto-Register Webhook
              </button>
              
              <button
                onClick={triggerBotMessage}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-all ml-auto"
              >
                Text Me First
              </button>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-lg border text-sm mt-4 flex items-start gap-2 ${
                statusMessage.type === 'success' 
                  ? 'bg-green-950/20 border-green-800 text-green-300' 
                  : 'bg-red-950/20 border-red-900 text-red-300'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div className="flex-1 whitespace-pre-wrap">{statusMessage.text}</div>
              </div>
            )}
          </div>

          {/* Setup Guide */}
          <div className="bg-neutral-950 p-4 md:p-6 rounded-xl border border-neutral-800 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-neutral-900 pb-3">
              <Terminal className="w-5 h-5 text-indigo-400" /> Webhook Setup Instructions
            </h3>
            <ol className="list-decimal list-inside text-sm text-neutral-300 space-y-3.5 leading-relaxed">
              <li>
                Create a bot via Telegram by chatting with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">@BotFather</a> and save the API token.
              </li>
              <li>
                Paste your API Token in the configuration form above and click <strong>Save Settings</strong>.
              </li>
              <li>
                Set your Telegram webhook to receive real messages by opening your terminal or browser and making a <strong>GET</strong> request to this Telegram endpoint:
                <div className="mt-2 bg-neutral-900 border border-neutral-800 p-2 rounded-lg flex items-center justify-between font-mono text-xs overflow-x-auto text-indigo-300">
                  <span>https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url={webhookUrl}</span>
                </div>
              </li>
              <li>
                Send a message to your Telegram bot! The bot will automatically require you to execute the verification step (by clicking verify or sending <strong>/verify</strong>) to establish a safe, CORS-enabled bridge to your local Ollama instance.
              </li>
            </ol>
          </div>
        </div>

        {/* Live Simulator Chat */}
        <div className="lg:col-span-5 flex flex-col h-[580px] bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
          <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="font-semibold text-sm">Live Bot Chat Simulator</span>
            </div>
            <span className="text-xs text-neutral-500 font-mono">No Token Needed</span>
          </div>

          {/* Chat Bubble List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px] overscroll-contain">
            {simChat.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-bl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}
            {simLoading && (
              <div className="flex items-center gap-2 text-neutral-500 text-sm italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Bot is processing via Ollama...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input footer */}
          <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
            <input
              type="text"
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimSend()}
              placeholder="Send /verify or /help or try chatting..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSimSend}
              className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-lg text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
