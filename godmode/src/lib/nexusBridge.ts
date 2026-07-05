import { useState, useCallback } from 'react';

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export function useNexusBridge() {
  const [isBridging, setIsBridging] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const callTool = useCallback(async (toolCall: ToolCall, userInput: string = "", currentSessionContext: any[] = []) => {
    setIsBridging(true);
    setError(null);
    try {
      const response = await fetch("/api/quantum-chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userInput,
          currentSessionContext,
          toolCall
        })
      });
      
      const json = await response.json();
      setLastResult(json);
      return json;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to call Nexus Bridge";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsBridging(false);
    }
  }, []);

  return { callTool, isBridging, lastResult, error };
}
