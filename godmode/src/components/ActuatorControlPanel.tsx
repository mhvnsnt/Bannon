import React, { useEffect, useState } from "react";

interface ActuatorMetrics {
  forgeActive: boolean;
  interceptedExcuses: number;
  activeDynamicTools: number;
  diagnosticStatus: string;
}

export default function ActuatorControlPanel() {
  const [telemetry, setTelemetry] = useState<ActuatorMetrics>({
    forgeActive: true,
    interceptedExcuses: 0,
    activeDynamicTools: 4,
    diagnosticStatus: "STABLE"
  });

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/actuators/telemetry");
        const data = await response.json();
        if (data.success) setTelemetry(data.metrics);
      } catch (err) {
        console.error("Actuator telemetry link interrupted");
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <h3 className="text-gray-400 text-xs uppercase font-semibold mb-3 tracking-wider">
        Autonomous Actuator Suite
      </h3>
      <div className="bg-gray-950 rounded-lg p-3 border border-red-900/30 font-mono text-xs flex flex-col gap-2.5">
        <div className="flex justify-between">
          <span className="text-gray-500">Dynamic Tool Forge:</span>
          <span className={telemetry.forgeActive ? "text-emerald-400 font-bold" : "text-red-400"}>
            {telemetry.forgeActive ? "READY" : "OFFLINE"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Intercepted Excuses:</span>
          <span className="text-amber-500 font-bold">{telemetry.interceptedExcuses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Synthesized Actuators:</span>
          <span className="text-purple-400 font-bold">{telemetry.activeDynamicTools} Active</span>
        </div>
        <div className="text-center text-[10px] text-gray-500 uppercase tracking-widest mt-1 border-t border-gray-900 pt-2">
          Diagnostic System State: <span className="text-emerald-400">{telemetry.diagnosticStatus}</span>
        </div>
      </div>
    </div>
  );
}
