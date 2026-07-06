import { cn } from '../App';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/50", className)} />
  );
}

// 1. TutorialViewSkeleton with sidebar layout matching the upgraded jump-to-lesson design
export function TutorialViewSkeleton() {
  return (
    <div className="flex h-full w-full bg-[#f5f5f7] overflow-hidden animate-in fade-in duration-300">
      {/* Sidebar Skeleton (lg only) */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-black/5 bg-white shrink-0 h-full p-4 justify-between z-20">
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-black/5">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>

          {/* Progress Card */}
          <div className="border border-black/5 p-3 rounded-xl bg-slate-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-2.5 w-24" />
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-2 pt-2">
            <Skeleton className="h-3 w-16 mb-1" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl border border-transparent">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="w-4 h-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col h-full items-center justify-center p-6 relative">
        {/* Subtitle / Header right proxy */}
        <div className="absolute top-4 right-4 hidden sm:block">
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
        
        <div className="flex flex-col items-center justify-center w-full max-w-2xl text-center space-y-8">
          <Skeleton className="h-10 w-48 rounded" />
          
          {/* Bubble Word proxy */}
          <div className="flex gap-2.5 justify-center items-center py-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="w-10 h-14 sm:w-16 sm:h-20 rounded-2xl" />
            ))}
          </div>

          <Skeleton className="h-4 w-80 max-w-full mx-auto" />
          <Skeleton className="h-4 w-60 max-w-full mx-auto" />
        </div>

        {/* Navigation Dock */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white border border-black/10 px-5 py-3 rounded-full shadow-lg">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// 2. AgentViewSkeleton
export function AgentViewSkeleton() {
  return (
    <div className="flex flex-col h-full text-black bg-transparent animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 border-b border-black/5 bg-white/80 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-44" />
          </div>
        </div>

        <div className="w-full lg:w-48">
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>

        <div className="w-full lg:w-64">
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 p-4 md:p-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="p-4 border border-black/5 bg-white rounded-2xl space-y-3 shadow-sm">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Message block user */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl bg-black/5 p-4 space-y-2">
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Message block agent */}
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl bg-white border border-black/5 p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </main>

      {/* Bottom input section */}
      <div className="border-t border-black/5 bg-white p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// 3. ProjectSelectionSkeleton
export function ProjectSelectionSkeleton() {
  return (
    <div className="flex flex-col items-center justify-start w-full min-h-full py-12 px-4 md:px-8 bg-transparent animate-in fade-in duration-300">
      <header className="w-full max-w-5xl mb-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3 w-28 mx-auto md:mx-0" />
          <Skeleton className="h-8 w-64 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-5/6 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-4/6 mx-auto md:mx-0" />
        </div>
        <Skeleton className="w-24 h-16 rounded-xl shrink-0" />
      </header>

      <div className="container mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-black/5 bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-12 h-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
