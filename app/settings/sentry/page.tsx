"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  Search, Activity, AlertTriangle, ShieldCheck, RefreshCw, BarChart2, 
  Terminal, ShieldAlert, Cpu, CheckCircle2, AlertCircle, Play, 
  X, Filter, Eye, Server, Radio, BookOpen, Layers,
  ExternalLink, Trash2, Check, Copy, Bug, ArrowRight,
  Shield, CheckSquare, Square
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { logAction } from "@/utils/logger";

interface SentryIssue {
  id: string;
  project: string;
  title: string;
  culprit: string;
  level: string;
  count: number;
  users: number;
  lastSeen: string;
  createdAt: string;
  status: string;
  stack?: string;
}

export default function SentryDashboard() {
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<SentryIssue | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const getAdminHeaders = useCallback(() => {
    const adminKey = typeof window !== 'undefined'
      ? (localStorage.getItem('admin_api_key') || process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026')
      : (process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026');
    return {
      'Content-Type': 'application/json',
      'X-Admin-API-Key': adminKey
    };
  }, []);

  const fetchIssues = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/sentry/errors?status=${statusFilter}`, { headers });
      const data = await res.json();
      if (data.success) {
        setIssues(data.data || []);
        setLastSync(new Date());
        if (!silent) showToast("Exception feed updated.", "success");
      } else {
        if (!silent) showToast("Failed to fetch exception list.", "error");
      }
    } catch (e) {
      if (!silent) showToast("Error connecting to exception telemetry API.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, statusFilter, getAdminHeaders, showToast]);

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(() => fetchIssues(true), 15000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsActionInProgress(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/sentry/errors/${id}/status`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.filter(issue => issue.id !== id));
        if (selectedIssue?.id === id) {
          setSelectedIssue(prev => prev ? { ...prev, status: newStatus } : null);
        }
        showToast(`Issue ${id.slice(0, 8)} marked as ${newStatus}.`, "success");
        logAction("RESOLVE_SENTRY_ERROR", { issueId: id, status: newStatus });
      } else {
        showToast("Failed to update issue status.", "error");
      }
    } catch (err) {
      showToast("Network fault during status update.", "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleBulkStatus = async (targetStatus: string) => {
    const idsToUpdate = selectedIds.length > 0 ? selectedIds : filteredIssues.map(i => i.id);
    if (idsToUpdate.length === 0) return;

    setIsActionInProgress(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/sentry/errors/bulk-status`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ids: idsToUpdate, status: targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Marked ${idsToUpdate.length} issue(s) as ${targetStatus}.`, "success");
        setSelectedIds([]);
        await fetchIssues(true);
      }
    } catch {
      showToast("Failed to perform bulk status update.", "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleClearResolved = async () => {
    setIsActionInProgress(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/sentry/errors/resolved`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        showToast("Purged all resolved and ignored exceptions from database.", "success");
        await fetchIssues(true);
      }
    } catch {
      showToast("Failed to clear resolved issues.", "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  const triggerClientError = async () => {
    showToast("Simulating frontend unhandled runtime exception...", "info");
    try {
      const res = await fetch(`${apiUrl}/admin/sentry/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: "web-admin",
          title: "TypeError: Cannot read properties of undefined (reading 'renderNode')",
          culprit: "components/player/StreamPipeline.tsx:142:19",
          level: "error",
          stack: "TypeError: Cannot read properties of undefined (reading 'renderNode')\n    at StreamPipeline.tsx:142:19\n    at commitMutationEffectsOnFiber\n    at workLoopSync"
        })
      });
      if (res.ok) {
        showToast("Simulated client exception dispatched to Sentry DB.", "success");
        await fetchIssues(true);
      }
    } catch (e) {
      showToast("Failed to report client error.", "error");
    }
  };

  const triggerBackendError = async () => {
    showToast("Simulating backend server panic...", "info");
    try {
      await fetch(`${apiUrl}/test-sentry`);
      showToast("Simulated 500 error triggered on NestJS server.", "success");
      await fetchIssues(true);
    } catch (e) {
      showToast("Test request executed.", "info");
      await fetchIssues(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredIssues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIssues.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatLastSeen = (timestamp: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesProject = selectedProject === "all" || issue.project === selectedProject;
      const matchesLevel = selectedLevel === "all" || issue.level === selectedLevel;
      const matchesSearch = !searchQuery.trim() || 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.culprit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesLevel && matchesSearch;
    });
  }, [issues, selectedProject, selectedLevel, searchQuery]);

  const stats = useMemo(() => {
    const totalEvents = issues.reduce((acc, curr) => acc + (curr.count || 1), 0);
    const fatalCount = issues.filter(i => i.level === "fatal").length;
    const unresolvedCount = issues.filter(i => i.status === "unresolved").length;
    return {
      totalEvents,
      issuesCount: issues.length,
      fatalCount,
      unresolvedCount,
    };
  }, [issues]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">

      {/* ── Sub-Navigation / Header ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
                <Bug size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">Sentry Exception Center</h1>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Realtime Error Diagnostics & Stack Traces</p>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              <Link 
                href="/settings/sentry"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert size={13} className="text-rose-600" />
                Exceptions Feed
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-200/60 text-rose-800">
                  {stats.issuesCount}
                </span>
              </Link>
              <Link 
                href="/settings/logs"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1.5"
              >
                <Terminal size={13} className="text-slate-400" />
                System Logs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-emerald-700">Sync: {lastSync.toLocaleTimeString()}</span>
            </div>

            <button
              onClick={() => fetchIssues()}
              disabled={refreshing}
              className="h-8.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-indigo-600" : ""} />
              Refresh
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full space-y-6">

        {/* ── Metrics Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Unique Issues</span>
              <Layers size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900">{stats.issuesCount}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Current view ({statusFilter})</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Crash Events</span>
              <Activity size={16} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-indigo-600">{stats.totalEvents}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Accumulated Occurrences</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Fatal Exceptions</span>
              <ShieldAlert size={16} className="text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-600">{stats.fatalCount}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">High Severity Panics</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Sentry Interceptor</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600">Online</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">AppExceptionFilter active</p>
          </div>
        </div>

        {/* ── Diagnostic Simulation Console ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Error Telemetry Verification Suite
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Dispatch synthetic exceptions to verify real-time ingestion, stack mapping, and notification routing.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={triggerClientError}
              className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Play size={12} />
              Simulate Client Crash
            </button>
            <button
              onClick={triggerBackendError}
              className="px-3.5 py-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Play size={12} />
              Simulate Backend 500
            </button>
          </div>
        </div>

        {/* ── Exception Feed Container ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          
          {/* Status Tabs Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 md:items-center justify-between">
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: 'unresolved', label: 'Unresolved' },
                { key: 'resolved', label: 'Resolved' },
                { key: 'ignored', label: 'Ignored' },
                { key: 'all', label: 'All Issues' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                    statusFilter === t.key
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filter Dropdowns & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search error title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono bg-white"
                />
              </div>

              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="all">ALL PROJECTS</option>
                <option value="backend">BACKEND</option>
                <option value="web-admin">WEB ADMIN</option>
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="all">ALL SEVERITIES</option>
                <option value="fatal">FATAL</option>
                <option value="error">ERROR</option>
                <option value="warning">WARNING</option>
              </select>
            </div>

          </div>

          {/* Bulk Action Toolbar if items selected or present */}
          <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900"
              >
                {selectedIds.length > 0 && selectedIds.length === filteredIssues.length ? (
                  <CheckSquare size={14} className="text-indigo-600" />
                ) : (
                  <Square size={14} className="text-slate-400" />
                )}
                <span>Select All ({selectedIds.length}/{filteredIssues.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <>
                  <button
                    onClick={() => handleBulkStatus("resolved")}
                    disabled={isActionInProgress}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    Resolve Selected ({selectedIds.length})
                  </button>
                  <button
                    onClick={() => handleBulkStatus("ignored")}
                    disabled={isActionInProgress}
                    className="px-2.5 py-1 bg-white text-slate-600 border border-slate-200 rounded-md font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Ignore Selected
                  </button>
                </>
              ) : (
                <>
                  {statusFilter === 'unresolved' && filteredIssues.length > 0 && (
                    <button
                      onClick={() => handleBulkStatus("resolved")}
                      disabled={isActionInProgress}
                      className="px-2.5 py-1 bg-white text-slate-600 border border-slate-200 rounded-md font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      Resolve All Filtered ({filteredIssues.length})
                    </button>
                  )}
                  {(statusFilter === 'resolved' || statusFilter === 'all') && (
                    <button
                      onClick={handleClearResolved}
                      disabled={isActionInProgress}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-semibold hover:bg-rose-100 transition-colors shadow-2xs flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      Purge Resolved / Ignored
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Issues List */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <Activity size={24} className="animate-spin text-indigo-600" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold">Connecting To Sentry Feed...</span>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <CheckCircle2 size={28} className="text-emerald-500" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700">All Clear • No Exceptions In Feed</span>
                <p className="text-xs text-slate-400">No issues matching status: {statusFilter}</p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isSelected = selectedIds.includes(issue.id);

                return (
                  <div 
                    key={issue.id} 
                    className={`p-4.5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                    onClick={() => setSelectedIssue(issue)}
                  >
                    
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(issue.id);
                        }}
                        className="mt-1 text-slate-400 hover:text-indigo-600"
                      >
                        {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                            issue.project === "backend" ? "bg-purple-50 text-purple-700 border-purple-200" :
                            issue.project === "web-admin" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {issue.project}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                            issue.level === "fatal" ? "bg-rose-600 text-white border-rose-700 animate-pulse" :
                            issue.level === "error" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {issue.level}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {issue.id.slice(0, 10)}...</span>
                          {issue.status !== 'unresolved' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-100 text-slate-600 border border-slate-200">
                              {issue.status}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors" title={issue.title}>
                          {issue.title}
                        </h3>
                        <p className="text-xs font-mono text-slate-500 truncate" title={issue.culprit}>
                          {issue.culprit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-4 text-center font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{issue.count}</div>
                          <div className="text-[9px] text-slate-400 uppercase">Events</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{issue.users}</div>
                          <div className="text-[9px] text-slate-400 uppercase">Users</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{formatLastSeen(issue.lastSeen)}</div>
                          <div className="text-[9px] text-slate-400 uppercase">Last Seen</div>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        {issue.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, "resolved")}
                            disabled={isActionInProgress}
                            className="h-7.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                          >
                            Resolve
                          </button>
                        )}
                        {issue.status !== 'ignored' && (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, "ignored")}
                            disabled={isActionInProgress}
                            className="h-7.5 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                          >
                            Ignore
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="h-7.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          title="Inspect Stack Trace"
                        >
                          <Terminal size={13} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </main>

      {/* ── Error Detail & Stack Trace Modal ── */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Bug size={16} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    Exception Diagnostics: {selectedIssue.title}
                  </h2>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    Culprit: {selectedIssue.culprit}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans text-xs">
              
              {/* Stat Pills */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Severity</span>
                  <p className="text-xs font-bold font-mono text-rose-600 uppercase mt-1">{selectedIssue.level}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Project</span>
                  <p className="text-xs font-bold font-mono text-slate-800 uppercase mt-1">{selectedIssue.project}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Events</span>
                  <p className="text-xs font-bold font-mono text-slate-800 mt-1">{selectedIssue.count} times</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Status</span>
                  <p className="text-xs font-bold font-mono text-slate-800 uppercase mt-1">{selectedIssue.status}</p>
                </div>
              </div>

              {/* Stack Trace Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                    <Terminal size={12} className="text-slate-400" /> Stack Trace Frame
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedIssue.stack || selectedIssue.title)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1"
                  >
                    {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy Trace'}
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-rose-400 max-h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                  {selectedIssue.stack || (
                    <span className="text-slate-500 italic">
                      {selectedIssue.title}\n    at {selectedIssue.culprit}\n    (No extended stacktrace captured for this event)
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                <div>First Observed: {new Date(selectedIssue.createdAt).toLocaleString()}</div>
                <div className="text-right">Last Triggered: {new Date(selectedIssue.lastSeen).toLocaleString()}</div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="text-[11px] font-mono text-slate-400">
                ID: {selectedIssue.id}
              </div>

              <div className="flex items-center gap-2">
                {selectedIssue.status !== 'resolved' ? (
                  <button
                    onClick={() => handleUpdateStatus(selectedIssue.id, 'resolved')}
                    disabled={isActionInProgress}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    Mark Resolved
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(selectedIssue.id, 'unresolved')}
                    disabled={isActionInProgress}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    Reopen Issue
                  </button>
                )}

                {selectedIssue.status !== 'ignored' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedIssue.id, 'ignored')}
                    disabled={isActionInProgress}
                    className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
                  >
                    Ignore
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
