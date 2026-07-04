// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorObj?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorObj: error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="p-4 bg-red-950/40 border-2 border-red-500/50 rounded-xl text-red-400 m-4 w-full max-w-3xl relative shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in duration-300">
          <button 
             onClick={() => this.setState({ hasError: false })}
             className="absolute top-3 right-3 px-3 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 rounded-lg text-xs font-bold text-red-200 uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            ✕ Dismiss
          </button>
          
          <div className="flex items-center gap-3 border-b border-red-900/50 pb-3 mb-3">
             <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center border border-red-500/30">
               <span className="font-bold text-xl">!</span>
             </div>
             <div>
               <h2 className="font-bold text-lg tracking-wide">System UI Recovery Mode</h2>
               <p className="text-xs text-red-400/80 uppercase tracking-widest mt-0.5">Component failure intercepted</p>
             </div>
          </div>
          
          <pre className="text-[11px] font-mono mt-2 overflow-x-auto whitespace-pre-wrap bg-black/60 p-3 rounded border border-red-900/30 max-h-48 custom-scrollbar relative z-10">{this.state.errorObj?.message || "Unknown rendering exception"}</pre>
          
          <div className="mt-4 flex gap-3">
             <button 
               onClick={() => console.log("Reload requested but blocked.")}
               className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all"
             >
               Hard Reset
             </button>
             <button 
               onClick={() => this.setState({ hasError: false })}
               className="px-4 py-2 bg-transparent text-red-400 border border-red-500/40 hover:bg-red-950/40 text-xs font-bold uppercase tracking-widest rounded-lg transition-all"
             >
               Ignore & Continue
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
