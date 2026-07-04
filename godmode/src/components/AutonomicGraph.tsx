import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EyeOff, Eye } from 'lucide-react';

export const AutonomicGraph = ({ data }: { data: { time: string, systemSaturation: number }[] }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <button 
        onClick={() => setVisible(true)}
        className="text-[10px] bg-[#111] border border-[#333] text-emerald-500 px-2 flex items-center gap-1 rounded tracking-widest uppercase hover:bg-[#222]"
      >
        <Eye className="w-3 h-3" /> Show Autonomic Telemetry
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col pt-2 pb-4">
      <div className="flex justify-between items-center mb-2 px-2">
        <h4 className="text-[10px] text-emerald-400 tracking-widest font-bold">AUTONOMIC SATURATION (P-DECAY MATRIX)</h4>
        <button 
          onClick={() => setVisible(false)}
          className="text-emerald-700 hover:text-emerald-400"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>
      <div className="w-full h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#112211" vertical={false} />
            <XAxis dataKey="time" stroke="#224422" fontSize={10} tickFormatter={(val) => val.split(':')[1]} />
            <YAxis stroke="#224422" fontSize={10} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #114411', fontSize: '10px', color: '#00ff00' }}
              itemStyle={{ color: '#00ff00' }}
            />
            <Line 
              type="monotone" 
              dataKey="systemSaturation" 
              stroke="#00ff00" 
              strokeWidth={1.5} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
