import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function EliteAnalytics({ data }: { data: any[] }) {
  return (
    <div className="bg-black text-white p-6 rounded-3xl shadow-2xl">
      <h2 className="text-xl font-black mb-4">Elite God-Mode Analytics</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="tokens" fill="#6366f1" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
