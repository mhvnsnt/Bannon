import React, { useState } from 'react';
import { Network, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function TelegramDiagnostics() {
  const [getMeResult, setGetMeResult] = useState<any>(null);
  const [getUpdatesResult, setGetUpdatesResult] = useState<any>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [errorMe, setErrorMe] = useState<string | null>(null);
  const [errorUpdates, setErrorUpdates] = useState<string | null>(null);

  const checkGetMe = async () => {
    setLoadingMe(true);
    setErrorMe(null);
    try {
      const res = await fetch('/api/telegram/diagnostics/getMe');
      const data = await res.json();
      setGetMeResult(data);
    } catch (err: any) {
      setErrorMe(err.message || 'Failed to fetch /getMe');
    } finally {
      setLoadingMe(false);
    }
  };

  const checkGetUpdates = async () => {
    setLoadingUpdates(true);
    setErrorUpdates(null);
    try {
      const res = await fetch('/api/telegram/diagnostics/getUpdates');
      const data = await res.json();
      setGetUpdatesResult(data);
    } catch (err: any) {
      setErrorUpdates(err.message || 'Failed to fetch /getUpdates');
    } finally {
      setLoadingUpdates(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-[#333] pb-4">
        <Network className="w-8 h-8 text-blue-400" />
        <h1 className="text-2xl font-bold text-white tracking-wider">TELEGRAM NODE DIAGNOSTICS</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* getMe Panel */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <span className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400">
                <RefreshCw className="w-4 h-4" />
              </span>
              /getMe Check
            </h2>
            <div className="flex items-center gap-3">
              {getMeResult && (
                <div className={`px-2 py-1 rounded text-xs font-bold ${getMeResult.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {getMeResult.ok ? 'Active' : 'Inactive'}
                </div>
              )}
              <button 
                onClick={checkGetMe} 
                disabled={loadingMe}
                className="px-4 py-1.5 bg-[#222] hover:bg-[#333] border border-[#444] rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loadingMe ? 'TESTING...' : 'RUN TEST'}
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            Validates if the TELEGRAM_BOT_TOKEN is correct and the bot is active.
          </div>

          <div className="flex-1 bg-black border border-[#222] rounded-lg p-4 font-mono text-xs overflow-auto relative">
            {errorMe ? (
              <div className="text-red-400 flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMe}</span>
              </div>
            ) : getMeResult ? (
              <div>
                <pre className="text-gray-300">{JSON.stringify(getMeResult, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-gray-600 flex h-full items-center justify-center">Awaiting execution...</div>
            )}
          </div>
        </div>

        {/* getUpdates Panel */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <span className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400">
                <RefreshCw className="w-4 h-4" />
              </span>
              /getUpdates Check
            </h2>
            <button 
              onClick={checkGetUpdates} 
              disabled={loadingUpdates}
              className="px-4 py-1.5 bg-[#222] hover:bg-[#333] border border-[#444] rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loadingUpdates ? 'TESTING...' : 'RUN TEST'}
            </button>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            Validates if there are pending messages stuck in the queue.
          </div>

          <div className="flex-1 bg-black border border-[#222] rounded-lg p-4 font-mono text-xs overflow-auto relative">
            {errorUpdates ? (
              <div className="text-red-400 flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorUpdates}</span>
              </div>
            ) : getUpdatesResult ? (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#222]">
                  {getUpdatesResult.ok ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> SUCCESS</span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> FAILED</span>
                  )}
                </div>
                <pre className="text-gray-300">{JSON.stringify(getUpdatesResult, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-gray-600 flex h-full items-center justify-center">Awaiting execution...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
