import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { MemoryService } from '../services/memory';

interface SearchMemoryProps {
  onResults: (results: any[] | null) => void;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
}

export default function SearchMemory({ onResults, isSearching, setIsSearching }: SearchMemoryProps) {
  const [query, setQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      onResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      // Pass a dummy userId for demonstration
      const results = await MemoryService.search(query, 'demo_user_123');
      onResults(results);
    } catch (err) {
      console.error(err);
      onResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full md:w-64 shrink-0">
      {isSearching ? (
        <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
      ) : (
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input 
        type="text"
        placeholder="Search local memory..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value === '') {
            onResults(null);
          }
        }}
        className="w-full bg-slate-50 border border-black/5 rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/20 transition-all placeholder:text-slate-400 disabled:opacity-50"
        disabled={isSearching}
      />
    </form>
  );
}
