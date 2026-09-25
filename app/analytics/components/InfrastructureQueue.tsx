import React from 'react';
import { Server, AlertCircle } from 'lucide-react';

interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

interface InfrastructureQueueProps {
  queueStats: QueueStats;
}

export const InfrastructureQueue = ({ queueStats }: InfrastructureQueueProps) => {
  if (!queueStats) return null;

  return (
    <div className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col font-sans h-full min-h-[300px]">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
          Transcoding Queue
        </h2>
        <Server size={14} className="text-gray-400" />
      </div>

      {/* Workspace Area */}
      <div className="p-5 flex-1 flex flex-col">
        
        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatBox 
            label="Pending" 
            value={queueStats.pending} 
            indicatorColor="bg-amber-400" 
          />
          <StatBox 
            label="Processing" 
            value={queueStats.processing} 
            indicatorColor="bg-blue-500" 
            isPulsing={queueStats.processing > 0} 
          />
          <StatBox 
            label="Completed" 
            value={queueStats.completed} 
            indicatorColor="bg-green-500" 
          />
          <StatBox 
            label="Faulted" 
            value={queueStats.failed} 
            indicatorColor="bg-red-500" 
          />
        </div>

        {/* System Alert Overlay (conditionally rendered) */}
        {queueStats.failed > 0 && (
          <div className="mt-auto p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs font-mono text-red-700 leading-relaxed break-words">
              <span className="font-bold">SYSTEM_WARN:</span> {queueStats.failed} execution fault{queueStats.failed === 1 ? '' : 's'} detected in pipeline.
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

// Internal sub-component for uniform stat boxes
function StatBox({ 
  label, 
  value, 
  indicatorColor, 
  isPulsing = false 
}: { 
  label: string; 
  value: number; 
  indicatorColor: string; 
  isPulsing?: boolean; 
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-3 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex items-center justify-center w-2 h-2 shrink-0">
          <div className={`absolute w-full h-full rounded-full ${indicatorColor} ${isPulsing ? 'animate-ping opacity-75' : ''}`} />
          <div className={`relative w-2 h-2 rounded-full ${indicatorColor}`} />
        </div>
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono truncate">
          {label}
        </span>
      </div>
      <div className="text-xl font-mono text-gray-900 tracking-tight tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}