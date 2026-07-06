import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity } from 'lucide-react';

const data = [
  { name: 'Core JS', time: 120 },
  { name: 'DOM', time: 80 },
  { name: 'Async/Fetch', time: 45 },
  { name: 'Audio API', time: 30 },
  { name: 'Canvas', time: 60 },
];

export default function ProjectAnalytics() {
  return (
    <div className="panel w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-black" />
        <h2>Time Invested (Minutes)</h2>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              stroke="#86868b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#86868b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
              itemStyle={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#86868b', fontSize: '10px', marginBottom: '4px' }}
            />
            <Bar dataKey="time" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#000' : '#d1d1d6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
