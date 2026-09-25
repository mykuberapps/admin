import React from 'react';
import { PieChart, Database } from 'lucide-react';

interface GenreDonutProps {
  genreStats: Record<string, number>;
}

const ALL_GENRES = [
  'Action', 'Adventure', 'Romance', 'Horror', 'Thriller', 'Drama', 
  'Crime', 'Documentary', 'Comedy', 'Sci-Fi', 'Fantasy', 'Mystery', 
  'Animation', 'Kids', 'Sports', 'Music', 'Biography', 'History', 
  'War', 'Short Film'
];

export const GenreDonut = ({ genreStats }: GenreDonutProps) => {
  // Merge backend stats with ALL_GENRES initialized to 0
  const completeStats: Record<string, number> = {};
  ALL_GENRES.forEach(g => completeStats[g] = 0);
  
  if (genreStats) {
    Object.entries(genreStats).forEach(([genre, count]) => {
      // Find matching genre case-insensitively, or just add it
      const match = ALL_GENRES.find(g => g.toLowerCase() === genre.toLowerCase());
      completeStats[match || genre] = (completeStats[match || genre] || 0) + count;
    });
  }

  const total = Object.values(completeStats).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Genre Distribution</h2>
          <PieChart size={14} className="text-gray-400" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
          <Database size={24} className="mb-2 text-gray-300" />
          <span className="text-xs font-medium">Insufficient telemetry data</span>
        </div>
      </div>
    );
  }
  
  // Professional, accessible data visualization palette for 20 categories
  const colors = [
    '#ef4444', '#f97316', '#ec4899', '#475569', '#6366f1', '#3b82f6', 
    '#1f2937', '#14b8a6', '#eab308', '#06b6d4', '#8b5cf6', '#64748b', 
    '#f43f5e', '#22c55e', '#84cc16', '#a855f7', '#d946ef', '#b45309', 
    '#78716c', '#0ea5e9', '#10b981', '#f59e0b'
  ];
  
  let currentPercentage = 0;
  const gradientStops = Object.entries(completeStats)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, val]) => val > 0) // Only plot non-zero values on the donut
    .map(([_, val], i) => {
      const percentage = (val / total) * 100;
      const color = colors[i % colors.length];
      const start = currentPercentage;
      const end = currentPercentage + percentage;
      currentPercentage = end;
      return `${color} ${start}% ${end}%`;
    })
    .join(', ');

  const sortedGenres = Object.entries(completeStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-full font-sans">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Category Topology</h2>
        <PieChart size={14} className="text-gray-400" />
      </div>
      
      <div className="p-5 flex flex-col items-center gap-6 flex-1 h-full min-h-[400px]">
        
        {/* CSS Conic Gradient Chart */}
        <div 
          className="w-36 h-36 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `conic-gradient(${gradientStops || 'transparent'})` }}
        >
          {/* Inner cutout for donut effect */}
          <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center border border-gray-100 shadow-inner">
            <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider font-mono mb-0.5">
              Total Count
            </span>
            <span className="text-lg font-mono font-bold text-gray-900 tracking-tight">
              {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* High-Density Data Legend */}
        <div className="w-full flex flex-col gap-0.5 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
          {sortedGenres.map(([genre, val], i) => {
            const percentage = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div 
                key={genre} 
                className="flex items-center justify-between p-1.5 hover:bg-gray-50 rounded transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div 
                    className="w-2.5 h-2.5 rounded-[2px] shrink-0" 
                    style={{ backgroundColor: colors[i % colors.length] }} 
                  />
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {genre}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-gray-500 tabular-nums text-right">
                    {val.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-gray-900 w-8 text-right tabular-nums">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};