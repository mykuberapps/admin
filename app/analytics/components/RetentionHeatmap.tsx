import React from 'react';
import { BarChart2, Database } from 'lucide-react';

interface RetentionHeatmapProps {
  dropOffHeatmap: Record<string, number>;
}

export const RetentionHeatmap = ({ dropOffHeatmap }: RetentionHeatmapProps) => {
  if (!dropOffHeatmap || Object.keys(dropOffHeatmap).length === 0) {
    return (
      <div className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Retention Drop-off</h2>
          <BarChart2 size={14} className="text-gray-400" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
          <Database size={24} className="mb-2 text-gray-300" />
          <span className="text-xs font-medium">Insufficient retention telemetry</span>
        </div>
      </div>
    );
  }

  const total = Object.values(dropOffHeatmap).reduce((a, b) => a + b, 0);

  return (
    <div className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-full font-sans">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Retention Drop-off</h2>
        <BarChart2 size={14} className="text-gray-400" />
      </div>
      
      {/* Data Visualization */}
      <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
        {Object.entries(dropOffHeatmap).map(([range, count]) => {
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={range} className="w-full group">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-mono font-semibold text-gray-600 tracking-tight">
                  {range}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-gray-400 tabular-nums">
                    {count.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-900 tabular-nums w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-sm transition-all duration-500 ease-out group-hover:bg-blue-500"
                  style={{ width: `${percentage}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};