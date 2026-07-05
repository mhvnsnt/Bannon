import React, { useEffect, useState } from "react";

interface SystemNotification {
  id: string;
  agent: string;
  type: string;
  text: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "INFO";
  created_at: string;
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const fetchUpdates = async () => {
    try {
      const res = await fetch("/api/system/notifications");
      const data = await res.json();
      if (data.success) setNotifications(data.list);
    } catch (err) {
      console.error("Failed polling notifications telemetry context.");
    }
  };

  useEffect(() => {
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 3000); // Fast 3-second poll loop
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, decision: "approve" | "deny") => {
    try {
      await fetch(`/api/system/notifications/${decision}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchUpdates(); // Refresh stack instantly
    } catch (err) {
      console.error("Action transmission failure.");
    }
  };

  return (
    <div className="mt-6 border-t border-gray-800 pt-4 font-mono">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-wider">
          System Live Stream
        </h3>
        <span className="bg-red-950 text-red-400 border border-red-900 text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
          {notifications.filter(n => n.status === "PENDING").length} REQ
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="text-gray-600 text-xs py-2 text-center italic">Matrix stream silent...</div>
        ) : (
          notifications.map((item) => (
            <div 
              key={item.id} 
              className={`p-2.5 rounded border text-xs flex flex-col gap-1.5 transition-all ${
                item.status === "PENDING" 
                  ? "bg-amber-950/20 border-amber-900/50" 
                  : "bg-gray-950 border-gray-900"
              }`}
            >
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-purple-400 font-bold uppercase">@{item.agent}</span>
                <span className="text-gray-500">{item.type}</span>
              </div>
              
              <p className="text-gray-300 leading-normal text-[11px]">{item.text}</p>
              
              {item.status === "PENDING" ? (
                <div className="flex gap-2 justify-end mt-1">
                  <button 
                    onClick={() => handleAction(item.id, "deny")}
                    className="px-2 py-0.5 border border-red-900 text-red-400 rounded hover:bg-red-950/40 text-[10px]"
                  >
                    DENY
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, "approve")}
                    className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded hover:bg-emerald-900/40 text-[10px] font-bold"
                  >
                    APPROVE
                  </button>
                </div>
              ) : (
                <div className="text-right text-[9px] uppercase tracking-widest font-semibold text-gray-600">
                  State: <span className={item.status === "APPROVED" ? "text-emerald-500" : "text-red-500"}>{item.status}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
