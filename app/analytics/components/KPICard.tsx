import React from 'react';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string; // Hex code or valid CSS color
}

export const KPICard = ({ icon, label, value, color = '#6b7280' }: KPICardProps) => (
  <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm flex flex-col justify-between min-h-[90px]">
    <div className="flex items-start justify-between mb-2">
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono truncate pr-2">
        {label}
      </span>
      <div 
        className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 bg-gray-50 border border-gray-100"
        style={{ color }}
        aria-hidden="true"
      >
        {icon}
      </div>
    </div>
    <div className="text-2xl font-mono text-gray-900 truncate tracking-tight">
      {value}
    </div>
  </div>
);