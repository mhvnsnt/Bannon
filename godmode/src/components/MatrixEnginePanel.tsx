import React, { useEffect, useState, useRef } from "react"

interface TelemetryRow {
  id: string
  agent: string
  type: string
  text: string
  created_at: string
}

export default function MatrixEnginePanel() {
  const [logs, setLogs] = useState<TelemetryRow[]>([])
  const [redActive, setRedActive] = useState(true)
  const [blueActive, setBlueActive] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const streamMetrics = async () => {
    try {
      const res = await fetch("/api/system/notifications")
      const data = await res.json()
      if (data.success && data.list) {
        // Filter for engine logs only
        const filtered = data.list.filter((n: any) => n.agent === "RED_ENG" || n.agent === "BLUE_ENG").reverse()
        setLogs(filtered)
      }
    } catch (err) {
      console.error("Sidebar polling failed")
    }
  }

  useEffect(() => {
    streamMetrics()
    const poll = setInterval(streamMetrics, 2000)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="mt-4 border-t border-gray-800 pt-4 font-mono text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 font-bold uppercase tracking-wider">Matrix Engine Status</span>
      </div>

      {/* Control Toggles */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button 
          onClick={() => setRedActive(!redActive)}
          className={`p-1.5 border text-center rounded transition-all font-bold ${
            redActive ? "bg-red-950/30 border-red-800 text-red-400" : "bg-black border-gray-900 text-gray-600"
          }`}
        >
          RED ENG: {redActive ? "HUNTIN" : "OFFLINE"}
        </button>
        <button 
          onClick={() => setBlueActive(!blueActive)}
          className={`p-1.5 border text-center rounded transition-all font-bold ${
            blueActive ? "bg-blue-950/30 border-blue-800 text-blue-400" : "bg-black border-gray-900 text-gray-600"
          }`}
        >
          BLUE ENG: {blueActive ? "ARMED" : "OFFLINE"}
        </button>
      </div>

      {/* Telemetry Log Output */}
      <div ref={scrollRef} className="max-h-48 overflow-y-auto space-y-1 bg-black p-2 rounded border border-gray-900 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-gray-700 text-center py-2 italic">Waitin for state updates</div>
        ) : (
          <>
            {logs.slice(-50).map((log) => (
              <div key={log.id} className="text-[11px] border-b border-gray-950 pb-1 last:border-0">
                <div className="flex justify-between text-[9px]">
                  <span className={log.agent === "RED_ENG" ? "text-red-500 font-bold" : "text-blue-500 font-bold"}>
                    {log.agent}
                  </span>
                  <span className="text-gray-600">{log.type}</span>
                </div>
                <p className="text-gray-300 mt-0.5">{log.text}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
