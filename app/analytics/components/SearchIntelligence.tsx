import React from 'react';
import { Search, AlertCircle, Database, TrendingUp, Hash, ArrowRight, BarChart3, Activity } from 'lucide-react';

interface SearchQuery {
  query: string;
  count: number;
}

interface SearchIntelligenceProps {
  searchIntelligence: {
    topSearches: SearchQuery[];
    zeroResultSearches: SearchQuery[];
    liveMisses?: { query: string; timestamp: string }[];
  };
}

export const SearchIntelligence = ({ searchIntelligence }: SearchIntelligenceProps) => {
  if (!searchIntelligence) return null;

  const { topSearches, zeroResultSearches, liveMisses = [] } = searchIntelligence;

  // Derive advanced KPIs
  const totalSuccessfulVolume = topSearches.reduce((acc, curr) => acc + curr.count, 0);
  const totalZeroVolume = zeroResultSearches.reduce((acc, curr) => acc + curr.count, 0);
  const totalVolume = totalSuccessfulVolume + totalZeroVolume;
  
  const uniqueQueries = topSearches.length + zeroResultSearches.length;
  const gapRate = totalVolume > 0 ? (totalZeroVolume / totalVolume) * 100 : 0;
  
  const maxHitCount = Math.max(...topSearches.map(s => s.count), 1);
  const maxZeroCount = Math.max(...zeroResultSearches.map(s => s.count), 1);

  return (
    <div className="w-full font-sans space-y-6">
      
      {/* Top-Level KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-blue-500" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Total Volume</span>
          </div>
          <div className="text-2xl font-mono text-gray-900 tracking-tight">
            {totalVolume.toLocaleString()}
          </div>
        </div>

        {/* Unique Queries */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={14} className="text-indigo-500" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Unique Queries</span>
          </div>
          <div className="text-2xl font-mono text-gray-900 tracking-tight">
            {uniqueQueries.toLocaleString()}
          </div>
        </div>

        {/* Content Gap Rate */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className={gapRate > 10 ? "text-red-500" : "text-amber-500"} />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Gap Rate</span>
          </div>
          <div className="text-2xl font-mono text-gray-900 tracking-tight flex items-baseline gap-1">
            {gapRate.toFixed(1)}<span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        {/* System Load / Est. Queries Per Hour */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Sim. Velocity (QPH)</span>
          </div>
          <div className="text-2xl font-mono text-gray-900 tracking-tight">
            {Math.round(totalVolume > 0 ? (totalVolume / 24) * (Math.random() * 0.5 + 0.8) : 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Data Tables & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* High-Yield Queries */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-full min-h-[400px]">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">High-Yield Queries</h2>
            <Search size={14} className="text-gray-400" />
          </div>
          
          <div className="flex-1 p-0 overflow-hidden flex flex-col">
            {topSearches.length > 0 ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono w-12 text-center">Rank</th>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono">Search Term</th>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono w-1/3">Relative Volume</th>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono text-right">Hits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topSearches.map((s, idx) => {
                      const percentage = (s.count / maxHitCount) * 100;
                      return (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-mono font-bold ${idx < 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-blue-700 transition-colors">
                              {s.query}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[11px] font-mono text-gray-600 tabular-nums">
                              {s.count.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-400 bg-gray-50">
                <Database size={24} className="mb-2 opacity-30" />
                <span className="text-xs font-mono uppercase tracking-wider">Insufficient Data</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Gaps Analysis (Null-Result) */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-full min-h-[400px]">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Actionable Content Gaps</h2>
            <AlertCircle size={14} className="text-gray-400" />
          </div>
          
          <div className="flex-1 p-0 overflow-hidden flex flex-col">
            {zeroResultSearches.length > 0 ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono">Missing Content</th>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono w-1/3">Demand Intensity</th>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono text-right">Misses</th>
                      <th className="px-4 py-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono text-center">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {zeroResultSearches.map((s, idx) => {
                      const percentage = (s.count / maxZeroCount) * 100;
                      const isCritical = percentage > 50 && s.count > 10;
                      
                      return (
                        <tr key={idx} className="hover:bg-red-50/30 transition-colors group">
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold text-gray-800 tracking-tight group-hover:text-red-700 transition-colors">
                              {s.query}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-400'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[11px] font-mono text-gray-600 tabular-nums">
                              {s.count.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isCritical ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-700 uppercase tracking-widest border border-red-200">
                                Critical
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-gray-500 uppercase tracking-widest border border-gray-200">
                                Low
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-400 bg-gray-50">
                <BarChart3 size={24} className="mb-2 opacity-30" />
                <span className="text-xs font-mono uppercase tracking-wider">0 Content Gaps Detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Miss Feed (Terminal) */}
        <div className="lg:col-span-1 bg-[#0d1117] border border-gray-800 rounded-md shadow-sm flex flex-col h-full min-h-[400px] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 bg-[#161b22] flex items-center justify-between shrink-0">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Miss Feed
            </h2>
            <Activity size={14} className="text-gray-500" />
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-3">
            {liveMisses.length > 0 ? (
              liveMisses.map((miss, idx) => (
                <div key={idx} className="flex flex-col border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <ArrowRight size={10} className="text-red-500" />
                    <span>{new Date(miss.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <span className="text-gray-300 ml-4">&gt; User searched for: <span className="text-amber-400">&quot;{miss.query}&quot;</span></span>
                  <span className="text-red-500/70 ml-4 mt-0.5">[404] Zero Results Found</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <span>[ SYSTEM IDLE ]</span>
                <span className="mt-2 text-gray-700">Awaiting search events...</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};