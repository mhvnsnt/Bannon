import React, { useState, useEffect } from "react";
import { Terminal, ShieldAlert, X, ChevronDown, ChevronUp, Trash2, Send, Copy, Check, Filter } from "lucide-react";
import { db, auth, offlineMode, setOfflineMode } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export interface CaughtError {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  type: "error" | "rejection" | "console";
}

// Module-level array to capture errors from the absolute beginning
let globalCaughtErrors: CaughtError[] = [];
const globalListeners = new Set<(errors: CaughtError[]) => void>();

const registerGlobalHandlers = () => {
  if (typeof window === "undefined" || (window as any).__error_handlers_registered) return;
  (window as any).__error_handlers_registered = true;

  const addError = (message: string, stack: string | undefined, type: CaughtError["type"]) => {
    // Exclude noise like benign Vite HMR websocket connection failures
    if (message.includes("websocket") || message.includes("Vite") || message.includes("HMR")) return;

    const newErr: CaughtError = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      stack: stack || new Error().stack?.split("\n").slice(2).join("\n"),
      timestamp: new Date().toLocaleTimeString(),
      type,
    };
    globalCaughtErrors = [newErr, ...globalCaughtErrors].slice(0, 50); // Keep last 50
    globalListeners.forEach((listener) => listener(globalCaughtErrors));
  };

  window.addEventListener("error", (event) => {
    addError(event.message || "Uncaught runtime exception", event.error?.stack, "error");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || String(event.reason) || "Unhandled promise rejection";
    addError(msg, event.reason?.stack, "rejection");
  });

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    const msg = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");
    addError(msg, undefined, "console");
  };
};

// Initialize handlers
registerGlobalHandlers();

export function GlobalErrorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<CaughtError[]>(globalCaughtErrors);
  const [filter, setFilter] = useState<"all" | "error" | "rejection" | "console">("all");
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = (updatedErrors: CaughtError[]) => {
      setErrors([...updatedErrors]);
    };
    globalListeners.add(handleUpdate);
    setErrors([...globalCaughtErrors]);
    return () => {
      globalListeners.delete(handleUpdate);
    };
  }, []);

  const handleClear = () => {
    globalCaughtErrors = [];
    setErrors([]);
    setExpandedErrorId(null);
  };

  const handleCopy = (error: CaughtError) => {
    const text = `[${error.type.toUpperCase()}] ${error.message}\nTime: ${error.timestamp}\nStack: ${error.stack || "No trace available"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(error.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReport = async (error: CaughtError) => {
    setReportingId(error.id);
    setReportSuccess(null);

    const logId = `err-${Math.random().toString(36).substring(2, 9)}`;
    const userUid = auth?.currentUser?.uid || "anonymous-node";

    const payload = {
      ownerId: userUid,
      action: `REPORTED_ISSUE: [${error.type.toUpperCase()}] ${error.message.substring(0, 200)}... Stack: ${error.stack ? error.stack.substring(0, 250) : "None"}`,
      timestamp: new Date().toISOString(),
    };

    try {
      if (db && !offlineMode) {
        // Direct write to /logs/{logId} conforming to Firestore schemas
        await setDoc(doc(db, "logs", logId), payload);
        console.log("[DIAGNOSTIC CORE] Issue registered securely in remote telemetry log ledger:", logId);
        setReportSuccess(`Logged securely! Action ID: ${logId}`);
      } else {
        throw new Error("Offline mode active");
      }
    } catch (err: any) {
      console.warn("[DIAGNOSTIC CORE] Failed to post telemetry log (falling back to offline mode):", err.message || err);
      setOfflineMode(true);
      // Offline simulation / storage backup
      const offlineLogs = JSON.parse(localStorage.getItem("offline-telemetry-logs") || "[]");
      offlineLogs.unshift({ ...payload, id: logId });
      localStorage.setItem("offline-telemetry-logs", JSON.stringify(offlineLogs.slice(0, 100)));
      setReportSuccess(`Logged to offline log matrix. Issue ID: ${logId}`);
    } finally {
      setReportingId(null);
      setTimeout(() => setReportSuccess(null), 4000);
    }
  };

  // Generate mock errors quickly when testing
  const triggerMockError = () => {
    console.error("DIAGNOSTIC TEST: Subsystem neural flux anomaly triggered on channel 0x" + Math.floor(Math.random() * 256).toString(16));
  };

  const filteredErrors = errors.filter((e) => filter === "all" || e.type === filter);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      {/* Badge / Activator */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 rounded-xl border text-xs font-semibold shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            errors.length > 0
              ? "px-3.5 py-2.5 bg-[#991b1b]/20 hover:bg-[#991b1b]/35 border-red-500/50 text-red-400 animate-pulse opacity-100"
              : "px-2 py-1.5 bg-[#111111]/50 hover:bg-[#1a1a1a]/90 border-transparent hover:border-[#333333] text-gray-600 hover:text-white opacity-40 hover:opacity-100"
          }`}
          title="Open Diagnostics Console"
        >
          <Terminal className={`w-4 h-4 ${errors.length > 0 ? '' : 'hidden sm:block'}`} />
          <span className={`${errors.length > 0 ? '' : 'hidden sm:block'}`}>DIAGNOSTICS</span>
          {errors.length === 0 && <span className="sm:hidden tracking-[0.2em] font-mono mx-1">DX</span>}
          {errors.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white leading-none">
              {errors.length}
            </span>
          )}
        </button>
      )}

      {/* Main Console Box */}
      {isOpen && (
        <div className="w-[380px] sm:w-[450px] max-h-[500px] bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#141414] p-3 flex items-center justify-between border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-gray-200 uppercase tracking-widest">
                AI Studio Diagnostic Console
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={triggerMockError}
                className="text-[10px] text-purple-400 hover:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40"
              >
                TEST ERR
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#222] text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#171717] border-b border-[#222222] text-[10px]">
            <div className="flex items-center gap-1 overflow-x-auto select-none">
              <Filter className="w-3 h-3 text-gray-500 mr-1 shrink-0" />
              {(["all", "error", "rejection", "console"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-2 py-0.5 rounded uppercase text-[9px] ${
                    filter === type
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                      : "text-gray-500 hover:text-gray-300 hover:bg-[#222] border border-transparent"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {errors.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>
            )}
          </div>

          {/* Logs View */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[220px] max-h-[350px] bg-[#0c0c0c]/80">
            {filteredErrors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-center">
                <Terminal className="w-8 h-8 text-gray-700 mb-2" />
                <span className="text-[10px] text-gray-500">System operating within absolute nominal boundaries.</span>
                <span className="text-[9px] text-gray-600 mt-1">Ready for real-time trace outputs.</span>
              </div>
            ) : (
              filteredErrors.map((err) => {
                const isExpanded = expandedErrorId === err.id;
                const badgeColor =
                  err.type === "error"
                    ? "bg-red-950/40 text-red-400 border border-red-800/40"
                    : err.type === "rejection"
                    ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                    : "bg-blue-950/40 text-blue-400 border border-blue-800/30";

                return (
                  <div
                    key={err.id}
                    className="border border-[#222222] bg-[#121212]/90 rounded-lg overflow-hidden transition-all text-[11px]"
                  >
                    {/* Item Row Header */}
                    <div
                      onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                      className="p-2 flex items-start gap-2 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                    >
                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase shrink-0 ${badgeColor}`}>
                        {err.type}
                      </span>
                      <span className="text-gray-500 text-[9px] shrink-0 mt-0.5">{err.timestamp}</span>
                      <span className="text-gray-200 break-all select-all font-medium flex-1 line-clamp-2">
                        {err.message}
                      </span>
                      <div className="text-gray-500 shrink-0 mt-0.5">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isExpanded && (
                      <div className="p-2 border-t border-[#1f1f1f] bg-[#0a0a0a] space-y-2 select-text">
                        {err.stack ? (
                          <pre className="text-[9px] text-gray-400 overflow-x-auto whitespace-pre p-2 bg-[#050505] rounded-md max-h-40 border border-[#1a1a1a]">
                            {err.stack}
                          </pre>
                        ) : (
                          <div className="text-[9px] text-gray-500 italic px-2">No stack trace trace ledger available.</div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1a1a1a]">
                          <button
                            onClick={() => handleCopy(err)}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#1c1c1c] hover:bg-[#252525] border border-[#2c2c2c] text-gray-300 hover:text-white transition-colors"
                          >
                            {copiedId === err.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>COPY</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleReport(err)}
                            disabled={reportingId === err.id}
                            className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/30 text-purple-300 hover:text-white transition-all disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>{reportingId === err.id ? "REPORTING..." : "REPORT ISSUE"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info / Status Alert */}
          {reportSuccess && (
            <div className="p-2 text-center text-[10px] text-emerald-400 bg-emerald-950/30 border-t border-emerald-500/20 animate-pulse">
              {reportSuccess}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
