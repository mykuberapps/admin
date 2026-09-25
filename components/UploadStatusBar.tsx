"use client";

import React, { useState } from 'react';
import { useUpload } from './UploadProvider';
import { CloudUpload, ChevronUp, ChevronDown, Loader2, X, AlertCircle, CheckCircle2, Minus, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from './toast-provider';

export const UploadStatusBar = () => {
  const { tasks, removeTask, cancelTask, isWidgetHidden, setWidgetHidden } = useUpload();
  const [isExpanded, setIsExpanded] = useState(true);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const { showToast } = useToast();

  if (tasks.length === 0 || isWidgetHidden) return null;

  const activeCount = tasks.filter(t => !['COMPLETED', 'FAILED'].includes(t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const failedCount = tasks.filter(t => t.status === 'FAILED').length;

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWidgetHidden(true);
    showToast("Upload continuing in background. Click Cloud icon in top bar to reopen.", "info");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-88 max-w-[calc(100vw-2rem)] bg-white border border-gray-300 shadow-xl rounded-lg flex flex-col font-sans overflow-hidden">
      
      {/* Telemetry Header */}
      <div 
        className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100/80 transition-colors shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center shadow-xs">
            {activeCount > 0 ? (
              <Loader2 size={13} className="text-blue-600 animate-spin" />
            ) : completedCount > 0 ? (
              <CheckCircle2 size={13} className="text-green-600" />
            ) : (
              <CloudUpload size={13} className="text-gray-500" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-gray-900 tracking-tight leading-tight">
              {activeCount > 0 ? `Background Uploads (${activeCount} active)` : 'Upload Center (Idle)'}
            </span>
            <span className="text-[9px] text-gray-500 font-mono leading-tight">
              {completedCount} completed · {failedCount} faulted
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Minimize to Navbar */}
          <button 
            type="button"
            onClick={handleMinimize}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            title="Minimize to top navbar (Upload continues in background)"
          >
            <Minus size={14} />
          </button>
          
          {/* Collapse/Expand Accordion */}
          <button 
            type="button"
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Upload Queue Manifest */}
      {isExpanded && (
        <div className="max-h-84 overflow-y-auto bg-white custom-scrollbar flex flex-col divide-y divide-gray-100">
          {tasks.map(task => {
            const isActive = !['COMPLETED', 'FAILED'].includes(task.status);
            const isCancelling = confirmCancelId === task.id;

            return (
              <div key={task.id} className="p-3 hover:bg-gray-50/70 transition-colors">
                
                <div className="flex items-start justify-between mb-1.5 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate" title={task.title}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border uppercase tracking-wider font-medium ${
                        task.status === 'FAILED' ? 'bg-red-50 border-red-200 text-red-700' :
                        task.status === 'COMPLETED' ? 'bg-green-50 border-green-200 text-green-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] font-mono text-gray-400 uppercase">
                        {task.type === 'SERIES' ? 'SERIES' : 'FEATURE'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isActive && (
                      <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {Math.round(task.overallProgress)}%
                      </span>
                    )}

                    {/* Active task cancel vs completed task clear */}
                    {isActive ? (
                      <button 
                        type="button"
                        onClick={() => setConfirmCancelId(task.id)}
                        className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                        title="Cancel this upload"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        title="Dismiss notification"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Confirmation for Cancelling Active Upload */}
                {isCancelling && (
                  <div className="my-2 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                      <AlertTriangle size={13} className="text-red-600 shrink-0" />
                      <span>Cancel and abort upload?</span>
                    </div>
                    <p className="text-[10px] text-red-700 leading-tight">
                      All uploaded chunks for &ldquo;{task.title}&rdquo; will be discarded and pipeline halted.
                    </p>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(null)}
                        className="px-2 py-0.5 bg-white border border-gray-300 text-gray-700 rounded text-[10px] font-medium hover:bg-gray-50"
                      >
                        Keep Uploading
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmCancelId(null);
                          cancelTask(task.id);
                        }}
                        className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-medium hover:bg-red-700"
                      >
                        Yes, Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Linear Progress Indicator */}
                <div className="h-1.5 bg-gray-100 w-full overflow-hidden rounded-full mt-1.5">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      task.status === 'FAILED' ? 'bg-red-500' : 
                      task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${task.overallProgress}%` }}
                  />
                </div>

                {/* Faulted / Error State Actions */}
                {task.error && (
                  <div className="mt-2 text-[10px] font-mono text-red-700 bg-red-50 border border-red-200 p-2 rounded flex flex-col gap-1.5 break-words">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle size={12} className="shrink-0 mt-0.5 text-red-600" />
                      <span className="leading-snug">{task.error}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-200">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/studio/upload?id=${task.mediaId || task.id}&tab=studio`;
                        }}
                        className="px-2 py-0.5 bg-white border border-red-300 text-red-800 rounded hover:bg-red-100 transition-colors text-[10px] font-sans font-semibold flex items-center gap-1"
                      >
                        <ExternalLink size={10} /> Re-upload in Studio
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-[10px] font-sans font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      )}

      {/* Helpful Background Guarantee Banner */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-gray-200 text-[10px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info size={11} className="text-blue-500 shrink-0" />
          <span>Uploads continue safely in background</span>
        </div>
        <button
          type="button"
          onClick={handleMinimize}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-[10px]"
        >
          Hide panel
        </button>
      </div>
    </div>
  );
};