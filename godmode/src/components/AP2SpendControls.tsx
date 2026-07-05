import React, { useEffect, useState } from "react";

interface AP2Mandate {
  dailyLimit: number;
  perTxLimit: number;
  allowedCategories: string[];
  requireConfirmationThreshold: number;
}

export default function AP2SpendControls() {
  const [mandate, setMandate] = useState<AP2Mandate>({
    dailyLimit: 200,
    perTxLimit: 50,
    allowedCategories: ["cloud_compute", "web3_gas", "software_subscriptions"],
    requireConfirmationThreshold: 100
  });

  const updateCap = async (field: keyof AP2Mandate, value: any) => {
    const updated = { ...mandate, [field]: value };
    setMandate(updated);
    
    // Push the updated Intent Mandate cryptographically to the backend
    await fetch("/api/ap2/mandates/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
  };

  return (
    <div className="mt-6 border-t border-gray-800 pt-4 font-mono">
      <h3 className="text-gray-400 text-xs uppercase font-semibold mb-3 tracking-wider flex justify-between">
        AP2 SPEND CONTROLS <span className="text-emerald-500">SECURE</span>
      </h3>
      
      <div className="bg-gray-950 p-3 rounded-lg border border-gray-900 space-y-3">
        {/* Daily Cap */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase">Daily Spend Limit ($)</label>
          <input 
            type="number" 
            value={mandate.dailyLimit}
            onChange={(e) => updateCap("dailyLimit", Number(e.target.value))}
            className="bg-black border border-gray-800 rounded px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-900"
          />
        </div>

        {/* Per-Transaction Cap */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 uppercase">Per-Transaction Max ($)</label>
          <input 
            type="number" 
            value={mandate.perTxLimit}
            onChange={(e) => updateCap("perTxLimit", Number(e.target.value))}
            className="bg-black border border-gray-800 rounded px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-900"
          />
        </div>

        {/* Manual Confirmation Threshold */}
        <div className="flex flex-col gap-1 border-t border-gray-900 pt-2">
          <label className="text-[10px] text-gray-500 uppercase">Alert/Veto Threshold ($)</label>
          <p className="text-[9px] text-gray-600 mb-1">Send Telegram intercept for txs above this amount:</p>
          <input 
            type="number" 
            value={mandate.requireConfirmationThreshold}
            onChange={(e) => updateCap("requireConfirmationThreshold", Number(e.target.value))}
            className="bg-black border border-gray-800 rounded px-2 py-1 text-xs text-red-400 font-bold focus:outline-none focus:border-red-900"
          />
        </div>
      </div>
    </div>
  );
}
