// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  panelName: string;
}

interface State {
  hasError: boolean;
}

export class PanelErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PanelErrorBoundary] Error in ${this.props.panelName}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300 relative shadow-lg m-2">
          <button 
             onClick={() => this.setState({ hasError: false })}
             className="absolute top-2 right-2 px-2 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 rounded text-[10px] font-bold uppercase"
          >
            ✕ Dismiss
          </button>
          <h3 className="font-bold text-sm tracking-wide text-red-400">Component Fault: {this.props.panelName}</h3>
          <p className="text-xs mt-1 text-red-400/70">A rendering fault forced a sandbox reload for this module.</p>
          <div className="mt-3 flex gap-2">
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-200 text-xs font-bold rounded uppercase transition-colors"
            >
              Reset Module
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
