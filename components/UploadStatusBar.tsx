"use client";

import React, { useState } from 'react';
import { useUpload } from './UploadProvider';
import { CloudUpload, ChevronUp, ChevronDown, Loader2, X, AlertCircle } from 'lucide-react';

export const UploadStatusBar = () => {
  const { tasks, removeTask, isWidgetHidden, setWidgetHidden } = useUpload();
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0 || isWidgetHidden) return null;

  const activeCount = tasks.filter(t => !['COMPLETED', 'FAILED'].includes(t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const failedCount = tasks.filter(t => t.status === 'FAILED').length;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 bg-white border border-gray-300 shadow-lg rounded flex flex-col font-sans">
      
      {/* Telemetry Header */}
      <div 
        className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            {activeCount > 0 ? (
              <Loader2 size={12} className="text-blue-600 animate-spin" />
            ) : (
              <CloudUpload size={12} className="text-gray-500" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-800 uppercase tracking-wider font-mono leading-tight">
              {activeCount > 0 ? `Active Streams: ${activeCount}` : 'Ingestion Idle'}
            </span>
            <span className="text-[9px] text-gray-500 font-mono leading-tight">
              SUCCESS: {completedCount} | FAULTED: {failedCount}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setWidgetHidden(true); }}
            className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Minimize to Navbar"
          >
            <X size={14} />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Upload Queue Manifest */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto bg-white custom-scrollbar flex flex-col">
          {tasks.map(task => (
            <div key={task.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
              
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xs font-semibold text-gray-900 truncate" title={task.title}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider ${
                      task.status === 'FAILED' ? 'bg-red-50 border-red-200 text-red-700' :
                      task.status === 'COMPLETED' ? 'bg-green-50 border-green-200 text-green-700' :
                      'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">
                      {task.type === 'SERIES' ? 'SERIES' : 'FEATURE'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!['COMPLETED', 'FAILED'].includes(task.status) && (
                    <span className="text-[10px] font-mono font-medium text-gray-600 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">
                      {Math.round(task.overallProgress)}%
                    </span>
                  )}
                  <button 
                    onClick={() => removeTask(task.id)}
                    className="p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-gray-300"
                    title={['COMPLETED', 'FAILED'].includes(task.status) ? "Clear Task" : "Cancel Task"}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Linear Progress Indicator */}
              <div className="h-1 bg-gray-200 w-full overflow-hidden rounded-sm">
                <div 
                  className={`h-full transition-all duration-500 ${
                    task.status === 'FAILED' ? 'bg-red-500' : 
                    task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${task.overallProgress}%` }}
                />
              </div>

              {/* Error Output Stream & Direct Actions */}
              {task.error && (
                <div className="mt-2 text-[9px] font-mono text-red-700 bg-red-50 border border-red-200 px-2.5 py-2 rounded flex flex-col gap-1.5 break-words shadow-xs">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle size={11} className="shrink-0 mt-0.5 text-red-600" />
                    <span className="leading-snug">{task.error}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-red-200">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/studio/upload?id=${task.mediaId || task.id}`;
                      }}
                      className="px-2 py-0.5 bg-white border border-red-300 text-red-800 rounded hover:bg-red-100 transition-colors text-[9px] font-sans font-semibold"
                    >
                      Re-open in Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-[9px] font-sans font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
};