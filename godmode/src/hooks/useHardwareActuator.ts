import { useState, useEffect, useCallback } from 'react';

export function useHardwareActuator() {
  const [bridgeStatus, setBridgeStatus] = useState<'online' | 'offline'>('offline');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [pollingRate, setPollingRate] = useState(5000); // 5s default
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(() => {
    return localStorage.getItem('nexus_bridge_simulated') === 'true';
  });

  const toggleSimulation = useCallback(() => {
    setIsSimulated(prev => {
      const next = !prev;
      localStorage.setItem('nexus_bridge_simulated', String(next));
      return next;
    });
  }, []);

  // Battery monitoring
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(battery.level);
          // If battery < 20%, reduce polling to 30s
          if (battery.level < 0.2 && !battery.charging) {
            setPollingRate(30000);
          } else {
            setPollingRate(5000);
          }
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        return () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      });
    }
  }, []);

  // Polling bridge
  useEffect(() => {
    const pollBridge = async () => {
      if (isSimulated) {
        setBridgeStatus('online');
        if (batteryLevel === null) {
          setBatteryLevel(0.98); // High charged simulated status
        }
        return;
      }
      try {
        const res = await fetch('http://127.0.0.1:9999/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'BANNON_CORE_BLUEPRINT_2026_SECURE', command: 'echo ping' })
        });
        if (res.ok) {
          setBridgeStatus('online');
        } else {
          setBridgeStatus('offline');
        }
      } catch {
        setBridgeStatus('offline');
      }
    };
    pollBridge();
    const interval = setInterval(pollBridge, pollingRate);
    return () => clearInterval(interval);
  }, [pollingRate, isSimulated, batteryLevel]);

  const triggerAutonomousAction = useCallback(async (incomingText: string) => {
    const blockRegex = /```(?:bash|sh)([\s\S]*?)```/g;
    let blockMatch;
    const outputs = [];

    while ((blockMatch = blockRegex.exec(incomingText)) !== null) {
      const targetCommand = blockMatch[1].trim();
      if (isSimulated) {
        console.log("[SIMU-BRIDGE] Autonomous execution: ", targetCommand);
        outputs.push(`[SIMULATED ACTUATION SUCCESS]\n$ ${targetCommand}\nOutput: Axis aligned dynamically to absolute spatial blueprint.`);
        continue;
      }
      try {
        console.log("Routing autonomous instruction to Termux...");
        const response = await fetch('http://127.0.0.1:9999/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: targetCommand,
            token: 'BANNON_CORE_BLUEPRINT_2026_SECURE'
          })
        });

        const dataFeed = await response.json();
        console.log("Hardware Execution Result:", dataFeed.output);
        outputs.push(dataFeed.output);
      } catch (connectionError) {
        console.error("Local actuator node not reached", connectionError);
      }
    }
    return outputs;
  }, [isSimulated]);

  const runSingleCommand = useCallback(async (command: string) => {
    if (isSimulated) {
      console.log("[SIMU-BRIDGE] Running single command: ", command);
      return `[SIMULATED] Executed: ${command}`;
    }
    try {
      const response = await fetch('http://127.0.0.1:9999/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          token: 'BANNON_CORE_BLUEPRINT_2026_SECURE'
        })
      });

      const dataFeed = await response.json();
      return dataFeed.output;
    } catch (connectionError) {
      console.error("Local actuator node not reached", connectionError);
      throw connectionError;
    }
  }, [isSimulated]);

  return { bridgeStatus, batteryLevel, pollingRate, triggerAutonomousAction, runSingleCommand, isMinimized, setIsMinimized, isSimulated, toggleSimulation };
}
