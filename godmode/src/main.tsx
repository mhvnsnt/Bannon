import React, { Component, ErrorInfo, ReactNode } from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- Storage Check ---
try {
  const needsPurge = !localStorage.getItem('cache_purged_v4');
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      totalSize += localStorage.getItem(key)?.length || 0;
    }
  }
  
  if (totalSize > 2 * 1024 * 1024 || needsPurge) {
    console.warn("[GodMode OS] Purging local cache to prevent crash loop.");
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('cache_purged_v4', 'true');
    // Also clear IndexedDB
    indexedDB.databases().then(dbs => {
      dbs.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
      console.log("IndexedDB purged.");
    }).catch(() => {});
  }
} catch (e) {
  console.error("Failed to check storage size", e);
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    const errMsg = error.message;
    if (errMsg.includes('indexedDB') && errMsg.includes('full disk')) return;
    fetch('/api/log_error?error=' + encodeURIComponent(error.message + '\n' + error.stack));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#111', color: '#ff5555', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2>React Error Boundary Caught an Error</h2>
          <p>{this.state.error?.toString()}</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
          >
            Clear Local Storage & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener('error', (event) => {
  const errMsg = event.error?.message || event.message || '';
  if (errMsg.includes('indexedDB') && errMsg.includes('full disk')) {
    console.warn('[Error Interceptor] Ignored full disk IndexedDB error:', errMsg);
    event.preventDefault();
    return;
  }
  fetch('/api/log_error?error=' + encodeURIComponent(errMsg));
  console.error('[Error Interceptor] Caught error, preventing crash/reload:', event.error);
  
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100vw';
  errorDiv.style.height = '100vh';
  errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  errorDiv.style.color = 'red';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.padding = '20px';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.overflow = 'auto';
  
  errorDiv.innerHTML = `
    <h2>Global Error Caught</h2>
    <p><b>Message:</b> ${event.error?.message || event.message}</p>
    <pre>${event.error?.stack || 'No stack trace'}</pre>
    <button onclick="this.parentElement.remove()">Dismiss</button>
  `;
  document.body.appendChild(errorDiv);
  
  event.preventDefault(); // prevents default browser error handling which might trigger reload loops
});

window.addEventListener('unhandledrejection', (event) => {
  const errMsg = event.reason?.message || event.reason?.toString() || 'unhandled rejection';
  if (errMsg.includes('indexedDB') && errMsg.includes('full disk')) {
    console.warn('[Error Interceptor] Ignored full disk IndexedDB error:', errMsg);
    event.preventDefault();
    return;
  }
  fetch('/api/log_error?error=' + encodeURIComponent(errMsg));
  console.error('[Error Interceptor] Caught unhandled rejection:', event.reason);
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
