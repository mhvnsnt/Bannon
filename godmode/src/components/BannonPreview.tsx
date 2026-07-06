import React, { useEffect, useRef } from 'react';

export function BannonPreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Basic initialization for preview
  }, []);

  return (
    <div className="w-full h-full relative">
      <iframe 
        ref={iframeRef}
        src="/bannon.html" 
        className="w-full h-full border-0 absolute inset-0"
        title="Bannon AAA preview"
      />
    </div>
  );
}
