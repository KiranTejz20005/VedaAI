'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  TrendingUp, 
  BrainCircuit, 
  DollarSign, 
  Cpu, 
  Database,
  Award,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsData {
  totals: {
    users: number;
    activeUsers: number;
    papersGenerated: number;
    assignmentsCreated: number;
  };
  aiAnalytics: {
    totalTokens: number;
    totalCost: number;
    providerUsage: Record<string, { tokens: number; cost: number }>;
  };
  departmentPerformance: Array<{
    departmentId: string;
    name: string;
    papersCount: number;
    averageScore: number;
  }>;
}

export default function AnalyticsAdmin() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load system analytics');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totals = data?.totals || { users: 0, activeUsers: 0, papersGenerated: 0, assignmentsCreated: 0 };
  const aiStats = data?.aiAnalytics || { totalTokens: 0, totalCost: 0, providerUsage: {} };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">System Telemetry Control Room</h2>
        <p className="text-gray-500 text-xs md:text-sm">Extended platform performance indicators, LLM response loads, and cost metrics.</p>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cost Summary card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">AI Costs</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-gray-900">${aiStats.totalCost.toFixed(2)}</span>
            <p className="text-gray-400 text-[10px] mt-1">Total estimated API expenses across LLMs.</p>
          </div>
        </div>

        {/* Tokens Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tokens Processed</span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Cpu size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-gray-900">{aiStats.totalTokens.toLocaleString()}</span>
            <p className="text-gray-400 text-[10px] mt-1">Total input and completion token tallies.</p>
          </div>
        </div>

        {/* Efficiency ratio */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Generations Count</span>
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <BrainCircuit size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-gray-900">{totals.papersGenerated}</span>
            <p className="text-gray-400 text-[10px] mt-1">Finalized papers generated successfully.</p>
          </div>
        </div>

      </div>

      {/* Detailed Telemetry grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Token allocation */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">AI Provider Load Breakdown</h3>
            <p className="text-gray-400 text-[10px]">Comparing processed tokens and API response metrics.</p>
          </div>

          <div className="space-y-4">
            {Object.entries(aiStats.providerUsage).map(([provider, details]) => {
              const percentage = aiStats.totalTokens > 0 
                ? (details.tokens / aiStats.totalTokens) * 100 
                : 0;

              const colors: Record<string, { bar: string; badge: string }> = {
                openai: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
                anthropic: { bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700' },
                gemini: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
                nvidia: { bar: 'bg-lime-500', badge: 'bg-lime-50 text-lime-700' },
                groq: { bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700' }
              };
              
              const current = colors[provider] || { bar: 'bg-gray-500', badge: 'bg-gray-50 text-gray-700' };

              return (
                <div key={provider} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="capitalize font-semibold text-gray-800">{provider}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{(details.tokens / 1000).toFixed(0)}K tokens</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${current.bar}`} style={{ width: `${percentage}%` }} />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${current.badge}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic metrics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Growth & Performance Summary</h3>
            <p className="text-gray-400 text-[10px]">Comparative evaluation scores across divisions.</p>
          </div>

          <div className="space-y-4">
            {data?.departmentPerformance.map((dept) => {
              return (
                <div key={dept.departmentId} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                      <Award size={16} />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-gray-900 block">{dept.name}</strong>
                      <span className="text-[10px] text-gray-400 font-semibold">{dept.papersCount} exam templates</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600 block">{dept.averageScore}%</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase block tracking-wider">Avg Grade</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
