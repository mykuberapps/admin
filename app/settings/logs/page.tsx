"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  Database, RefreshCw, Search, ShieldAlert, Cpu, 
  Terminal, ShieldCheck, Play, X, Filter, ChevronLeft, ChevronRight, 
  Layers, FileText, Calendar, Clock, User, Shield, Info,
  Download, Copy, Check, Eye, ExternalLink, ArrowRight,
  Globe, Laptop, FileCode, CheckCircle2
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface AuditLog {
  id: string;
  project: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function SystemLogsPage() {
  const { showToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(30);

  // Filters
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [userRole, setUserRole] = useState("");
  const [preset, setPreset] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isLiveReload, setIsLiveReload] = useState(true);
  const [copied, setCopied] = useState(false);

  const getAdminHeaders = useCallback(() => {
    const adminKey = typeof window !== 'undefined'
      ? (localStorage.getItem('admin_api_key') || process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026')
      : (process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026');
    return {
      'Content-Type': 'application/json',
      'X-Admin-API-Key': adminKey
    };
  }, []);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(project && { project }),
        ...(userRole && { userRole }),
        ...(search && { search }),
      });

      const res = await fetch(`${apiUrl}/admin/logs?${queryParams.toString()}`, {
        headers: getAdminHeaders()
      });
      if (!res.ok) throw new Error("Could not fetch log matrix");
      
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err: any) {
      if (!silent) showToast("Telemetry Sync Error: Failed to fetch system logs.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, page, limit, project, userRole, search, getAdminHeaders, showToast]);

  useEffect(() => {
    setPage(1);
    fetchLogs();
  }, [search, project, userRole]);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  useEffect(() => {
    if (!isLiveReload) return;
    const timer = setInterval(() => {
      fetchLogs(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [isLiveReload, fetchLogs]);

  const applyPreset = (key: string) => {
    setPreset(key);
    setPage(1);
    if (key === "ALL") {
      setProject("");
      setSearch("");
    } else if (key === "SECURITY") {
      setSearch("AUTH");
      setProject("");
    } else if (key === "MEDIA") {
      setSearch("UPLOAD");
      setProject("");
    } else if (key === "TRANSCODE") {
      setSearch("TRANSCODE");
      setProject("");
    } else if (key === "ADMIN") {
      setUserRole("admin");
      setSearch("");
    }
  };

  const exportLogs = (format: 'json' | 'csv') => {
    if (logs.length === 0) {
      showToast("No logs available to export.", "error");
      return;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kuber_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported JSON audit logs.", "success");
    } else {
      const headers = ["ID", "CreatedAt", "Project", "UserEmail", "UserRole", "Action", "IPAddress", "Details"];
      const rows = logs.map(l => [
        l.id,
        `"${l.createdAt}"`,
        l.project,
        `"${l.userEmail || 'system'}"`,
        l.userRole,
        `"${l.action}"`,
        l.ipAddress || '',
        `"${(l.details || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kuber_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported CSV audit logs.", "success");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const getProjectBadge = (proj: string) => {
    switch (proj) {
      case "backend":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase">Backend</span>;
      case "backend-admin":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-50 border border-purple-200 text-purple-700 uppercase">Admin API</span>;
      case "web-admin":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 border border-blue-200 text-blue-700 uppercase">Web Admin</span>;
      case "security":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 border border-rose-200 text-rose-700 uppercase">Security</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 border border-slate-200 text-slate-700 uppercase">{proj}</span>;
    }
  };

  const getActionBadge = (act: string) => {
    if (act.includes("FAIL") || act.includes("ERROR") || act.includes("DELETE") || act.includes("BAN")) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 border border-rose-200 text-rose-700">{act}</span>;
    }
    if (act.includes("UPLOAD") || act.includes("TRANSCODE") || act.includes("CREATE")) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">{act}</span>;
    }
    if (act.includes("LOGIN") || act.includes("AUTH")) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">{act}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 border border-slate-200 text-slate-700">{act}</span>;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">

      {/* ── Sub-Navigation / Header ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Terminal size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">System Audit & Access Logs</h1>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Immutable Operational Event Stream</p>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              <Link 
                href="/settings/sentry"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert size={13} className="text-slate-400" />
                Exceptions Feed
              </Link>
              <Link 
                href="/settings/logs"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 transition-colors flex items-center gap-1.5"
              >
                <Terminal size={13} className="text-indigo-600" />
                System Logs
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-200/50 text-indigo-800">
                  {total}
                </span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Reload Toggle */}
            <button
              onClick={() => setIsLiveReload(!isLiveReload)}
              className={`h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors shadow-2xs ${
                isLiveReload 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveReload ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {isLiveReload ? 'Live Tailing' : 'Polling Paused'}
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => exportLogs('csv')}
                className="h-8.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
                title="Download CSV report"
              >
                <Download size={13} className="text-slate-500" />
                CSV
              </button>
              <button
                onClick={() => exportLogs('json')}
                className="h-8.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
                title="Download JSON telemetry"
              >
                <Download size={13} className="text-slate-500" />
                JSON
              </button>
            </div>

            <button
              onClick={() => fetchLogs()}
              disabled={isLoading}
              className="h-8.5 w-8.5 bg-white border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs"
              title="Refresh logs"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-indigo-600" : "text-slate-600"} />
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full space-y-6">

        {/* ── Filter Presets Bar ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'ALL', label: 'All Operations' },
              { key: 'SECURITY', label: 'Security & Auth' },
              { key: 'MEDIA', label: 'Media & Uploads' },
              { key: 'TRANSCODE', label: 'Transcoding' },
              { key: 'ADMIN', label: 'Admin Actions' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none whitespace-nowrap ${
                  preset === p.key
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by action, email, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

        </div>

        {/* ── Table Container ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px]">
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Subsystem</th>
                  <th className="px-4 py-3 font-semibold">Actor / User</th>
                  <th className="px-4 py-3 font-semibold">Action Directive</th>
                  <th className="px-4 py-3 font-semibold">Contextual Details</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-5 py-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>

                      {/* Subsystem / Project */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getProjectBadge(log.project)}
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {log.userEmail || (log.userId ? log.userId.slice(0, 8) : 'system')}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          role: {log.userRole}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Context Details */}
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate text-[11px]">
                        {log.details || <span className="text-slate-400 italic">No metadata</span>}
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {log.ipAddress || 'internal'}
                      </td>

                      {/* Inspect Button */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-mono text-xs">
                      {search ? "No log events match your search query." : "No system logs recorded."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono text-[11px]">
              Showing page {page} of {totalPages} ({total} total recorded events)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page <= 1 || isLoading}
                className="h-7.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
              >
                <ChevronLeft size={13} /> Previous
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || isLoading}
                className="h-7.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* ── Log Inspector Modal ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Terminal size={16} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    Audit Event: {selectedLog.action}
                  </h2>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans text-xs">
              
              {/* Event Attributes Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Subsystem</span>
                  <div className="mt-1">{getProjectBadge(selectedLog.project)}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">User / Actor</span>
                  <p className="text-xs font-mono font-semibold text-slate-800 mt-1 truncate">
                    {selectedLog.userEmail || selectedLog.userId || 'system'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">User Role</span>
                  <p className="text-xs font-mono font-semibold text-slate-800 mt-1 uppercase">
                    {selectedLog.userRole}
                  </p>
                </div>
              </div>

              {/* Client Network Environment */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Globe size={12} /> IP Address:
                  </span>
                  <span className="font-semibold text-slate-800">{selectedLog.ipAddress || 'Internal Loopback'}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Laptop size={12} /> User Agent:
                  </span>
                  <span className="text-slate-700 truncate max-w-xs text-[11px]">{selectedLog.userAgent || 'Server Runtime'}</span>
                </div>
              </div>

              {/* JSON / Context Details Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                    <FileCode size={12} className="text-slate-400" /> Event Details Payload
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedLog.details || '')}
                    className="text-[11px] text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1"
                  >
                    {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-cyan-300 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                  {(() => {
                    if (!selectedLog.details) return <span className="text-slate-500 italic">No extra metadata payload captured.</span>;
                    try {
                      const parsed = JSON.parse(selectedLog.details);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })()}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-[11px] font-mono text-slate-400 text-right pt-2 border-t border-slate-100">
                Logged At: {new Date(selectedLog.createdAt).toLocaleString()}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
