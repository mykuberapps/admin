import React from 'react';
import { Activity } from 'lucide-react';

interface TrendData {
  date: string;
  value: number; // either minutes or count
}

interface TrendChartProps {
  title: string;
  icon: React.ReactNode;
  color?: string;
  data: TrendData[];
}

export const TrendChart = ({ title, icon, color = '#2563eb', data }: TrendChartProps) => {
  const maxValue = data && data.length > 0 ? Math.max(...data.map(d => d.value), 0.1) : 0.1;

  const formatValue = (val: number) => {
    if (val === undefined || val === null) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'm';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toLocaleString();
  };

  return (
    <div className="col-span-12 lg:col-span-8 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col font-sans min-h-[320px]">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
          {title}
        </h2>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 p-5 flex flex-col justify-end">
        {(!data || data.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 rounded border border-dashed border-gray-200">
            <Activity size={20} className="mb-2 text-gray-300" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Insufficient Time-Series Data</span>
          </div>
        ) : (
          <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 h-full border-b border-gray-200 pt-6 pb-1">
            {data.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                
                {/* Value Label (Static for desktop, tooltips could be added here if needed) */}
                <span className="text-[9px] font-mono text-gray-500 mb-1.5 tabular-nums transition-colors group-hover:text-gray-900">
                  {formatValue(day.value)}
                </span>
                
                {/* Bar */}
                <div 
                  className="w-full max-w-[32px] rounded-t-[2px] transition-all duration-300 ease-in-out hover:brightness-90 hover:ring-2 ring-blue-100"
                  style={{ 
                    height: `${Math.max((day.value / maxValue) * 100, 1)}%`,
                    backgroundColor: color 
                  }} 
                />
                
                {/* X-Axis Label */}
                <span className="text-[9px] font-mono text-gray-400 mt-2 truncate w-full text-center">
                  {day.date.split('-').slice(1).join('/')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};