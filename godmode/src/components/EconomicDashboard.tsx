import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';
import { 
  DollarSign, Activity, Cpu, ShieldAlert, FileText, 
  RefreshCw, TrendingUp, TrendingDown, Layers, CheckCircle 
} from 'lucide-react';

interface EconomicStats {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  totalBuildSales: number;
  totalSubscriptions: number;
  marginHealth: 'EXCELLENT' | 'STABLE' | 'CAUTIOUS' | 'CRITICAL';
  transactionsCount: number;
}

interface Transaction {
  id: string;
  timestamp: number;
  project_id: string;
  type: 'REVENUE' | 'COST';
  category: string;
  amount: number;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  description: string;
}

interface ChartPoint {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export default function EconomicDashboard() {
  const [stats, setStats] = useState<EconomicStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('marquiswhitacre@gmail.com');
  const [testTier, setTestTier] = useState<'ONCE' | 'PRO'>('ONCE');
  const [testAmount, setTestAmount] = useState('7.99');
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const fetchEconomicData = async () => {
    setLoading(true);
    try {
      const [statsRes, ledgerRes, clRes] = await Promise.all([
        fetch('/api/economic/stats'),
        fetch('/api/economic/ledger?limit=30'),
        fetch(`/api/economic/pl?timeframe=${timeframe}`)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ledgerRes.ok) setTransactions(await ledgerRes.json());
      if (clRes.ok) setChartData(await clRes.json());
    } catch (err) {
      console.error('Failed to lift economic logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEconomicData();
  }, [timeframe]);

  const handleSimulatePayment = async () => {
    setSimulationStatus('Sending payment packet...');
    try {
      const res = await fetch('/api/payment/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          tier: testTier,
          amount: parseFloat(testAmount) || 7.99,
          stripeId: 'ch_mock_' + Math.random().toString(36).substring(2, 10)
        })
      });

      if (res.ok) {
        setSimulationStatus('Payment archived successfully! Live metrics updated.');
        setTimeout(() => setSimulationStatus(null), 4000);
        fetchEconomicData();
      } else {
        const err = await res.json();
        setSimulationStatus('Simulation Failed: ' + err.error);
      }
    } catch (e: any) {
      setSimulationStatus('Simulation Failed: ' + e.message);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'EXCELLENT': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'STABLE': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'CAUTIOUS': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'BUILD_SALE': return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5';
      case 'SUBSCRIPTION': return 'text-purple-400 border-purple-500/25 bg-purple-500/5';
      case 'MODEL_COST': return 'text-orange-400 border-orange-500/25 bg-orange-500/5';
      case 'COMPUTE_COST': return 'text-amber-400 border-amber-500/25 bg-amber-500/5';
      default: return 'text-slate-400 border-slate-500/25 bg-slate-500/5';
    }
  };

  return (
    <div className="w-full bg-slate-950/20 text-slate-100 p-6 rounded-2xl border border-slate-800/60 backdrop-blur-md">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-sans">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Forge Ledger & Economy Terminal
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time financial audits, model compilation expenses, and profit margin auto-scaling metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg py-1 px-3 text-sm text-slate-200 outline-none focus:border-slate-700 font-mono transition-all"
          >
            <option value="DAILY">Daily Timeline</option>
            <option value="WEEKLY">Weekly Timeline</option>
            <option value="MONTHLY">Monthly Timeline</option>
          </select>
          <button 
            onClick={fetchEconomicData} 
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 font-medium py-1.5 px-3 rounded-lg text-sm border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Revenue */}
          <div 
            className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:border-fuchsia-500/30"
          >
            <div className="absolute right-4 top-4 text-emerald-500/20">
              <DollarSign className="w-12 h-12" />
            </div>
            <span className="text-slate-400 uppercase text-xs font-mono font-semibold tracking-wider block">Gross Revenue</span>
            <span className="text-3xl font-extrabold text-white mt-1.5 block tracking-tight font-sans">
              ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] font-mono py-0.5 px-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sales: ${stats.totalBuildSales.toFixed(0)}
              </span>
              <span className="text-[11px] font-mono py-0.5 px-2 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Subs: ${stats.totalSubscriptions.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Card 2: Cost */}
          <div 
            className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:border-fuchsia-500/30"
          >
            <div className="absolute right-4 top-4 text-orange-500/20">
              <Cpu className="w-12 h-12" />
            </div>
            <span className="text-slate-400 uppercase text-xs font-mono font-semibold tracking-wider block">Compute Expense</span>
            <span className="text-3xl font-extrabold text-orange-400 mt-1.5 block tracking-tight font-sans">
              ${stats.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Activity className="w-3 h-3 text-orange-400" />
              <span>{stats.transactionsCount} operational entries matched</span>
            </div>
          </div>

          {/* Card 3: Margin Profit */}
          <div 
            className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:border-fuchsia-500/30"
          >
            <div className="absolute right-4 top-4 text-purple-500/20">
              <TrendingUp className="w-12 h-12" />
            </div>
            <span className="text-slate-400 uppercase text-xs font-mono font-semibold tracking-wider block">Total Net Profit</span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1.5 block tracking-tight font-sans">
              ${stats.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time surplus positive</span>
            </div>
          </div>

          {/* Card 4: Profit Margin Health */}
          <div 
            className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:border-fuchsia-500/30"
          >
            <div className="absolute right-4 top-4 text-slate-500/20">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <span className="text-slate-400 uppercase text-xs font-mono font-semibold tracking-wider block">Profit Margin %</span>
            <span className="text-3xl font-extrabold text-white mt-1.5 block tracking-tight font-sans">
              {stats.margin}%
            </span>
            <div className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-mono py-0.5 px-2.5 rounded-full border ${getHealthColor(stats.marginHealth)}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
              <span>Profile Status: {stats.marginHealth}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-850 p-5 rounded-xl backdrop-blur-sm h-[320px] flex flex-col">
          <h3 className="text-sm font-mono tracking-wide text-slate-400 mb-4 flex items-center justify-between">
            <span>P&L BALANCE TIMELINE GRAPH</span>
            <span className="text-[10px] text-emerald-500 uppercase font-bold py-0.5 px-2 border border-emerald-500/20 bg-emerald-500/5 rounded">Live SQL Sync</span>
          </h3>
          <div className="flex-1 w-full text-xs">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...chartData].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                    labelClassName="font-mono text-slate-400 text-xs"
                  />
                  <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ paddingBottom: '16px' }} />
                  <Area type="monotone" name="Revenue ($)" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" name="Expense ($)" dataKey="cost" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono">
                Computing data vectors...
              </div>
            )}
          </div>
        </div>

        {/* Live Simulator Widget */}
        <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono tracking-wide text-slate-300 mb-3 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              SANDBOX SIMULATOR
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Simulate checkout events directly to verify that transactions lock securely in the Economic Ledger and update the scaling ratios in real-time.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-mono font-semibold text-slate-500 mb-1">Customer Email</label>
                <input 
                  type="email" 
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-3 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-mono font-semibold text-slate-500 mb-1">Billing Tier</label>
                  <select 
                    value={testTier}
                    onChange={(e) => {
                      const t = e.target.value as 'ONCE' | 'PRO';
                      setTestTier(t);
                      setTestAmount(t === 'PRO' ? '49.00' : '7.99');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono transition-all"
                  >
                    <option value="ONCE">Single Build</option>
                    <option value="PRO">Monthly Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-mono font-semibold text-slate-500 mb-1">Price ($ USD)</label>
                  <input 
                    type="number" 
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-3 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono transition-all"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/50">
            {simulationStatus && (
              <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-2 mb-3 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{simulationStatus}</span>
              </div>
            )}
            <button 
              onClick={handleSimulatePayment}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 px-4 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Dispatch Payment Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Recent Ledger Audit Trail */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/20">
          <h3 className="text-xs font-mono tracking-wide text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            LEDGER TRANSACTION JOURNAL (REAL-TIME AUDIT FIELD)
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">{transactions.length} matched transactions</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 uppercase text-[10px] tracking-wider bg-slate-950/10">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">LLM Model Context</th>
                <th className="py-3 px-4 text-right">Credits ($)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tr) => {
                  const isRevenue = tr.type === 'REVENUE';
                  return (
                    <tr key={tr.id} className="border-b border-slate-850/40 hover:bg-slate-900/20 transition-all">
                      <td className="py-2.5 px-4 text-slate-400 text-[10px]">
                        {new Date(tr.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block py-0.5 px-2 rounded text-[10px] font-bold ${
                          isRevenue ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}>
                          {tr.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block py-0.5 px-2 rounded-full text-[9px] border ${getCategoryColor(tr.category)}`}>
                          {tr.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 max-w-xs truncate" title={tr.description}>
                        {tr.description}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {tr.model || 'N/A'}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-bold text-sm ${isRevenue ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {isRevenue ? '+' : '-'}${tr.amount.toFixed(tr.type === 'COST' ? 4 : 2)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    No transactions currently registered in database ledger
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
