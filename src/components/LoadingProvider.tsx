import React, { createContext, useContext, useState } from 'react';
import { CodedummyLoader } from './CodedummyLoader';
import { cn } from '../App';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean, text?: string) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('CODEDUMMY // SYSTEM ANALYZING');

  const setLoading = (loading: boolean, text?: string) => {
    setIsLoading(loading);
    if (text) setLoadingText(text);
  };

  const getLoadingState = () => {
    const t = loadingText.toLowerCase();
    if (t.includes('type') || t.includes('typing')) return 'typing';
    if (t.includes('search') || t.includes('searching')) return 'searching';
    if (t.includes('collapse') || t.includes('fail') || t.includes('vibe')) return 'collapse';
    if (t.includes('entangle') || t.includes('trauma') || t.includes('bond')) return 'entangled';
    return 'analyzing';
  };

  const isGodMode = false; // Mocking authentication status for demo

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/90 backdrop-blur-md animate-in fade-in duration-300">
          <CodedummyLoader status={getLoadingState()} isGodMode={isGodMode} />
        </div>
      )}
    </LoadingContext.Provider>
  );
}
