"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Server, RefreshCw, Trash2, Activity,
  Database, RotateCw, AlertCircle, CheckCircle2,
  Clock, Zap, ChevronRight, X, Layers,
  ExternalLink, Terminal, HardDrive, AlertTriangle,
  FileCode, Play, Copy, Check, Filter, Search
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface BullJob {
  id: string;
  name: string;
  data: { jobId?: string; mediaId?: string; [key: string]: any };
  progress: number;
  timestamp: number;
  attemptsMade: number;
  failedReason: string | null;
  stacktrace: string[] | null;
  returnvalue: any | null;
  opts: any | null;
  finishedOn: number | null;
  processedOn: number | null;
  state: string;
}

type FilterType = 'active' | 'waiting' | 'failed' | 'completed' | 'delayed';

export default function QueuesDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<BullJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('active');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<BullJob | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<any>(null);
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

  const fetchData = useCallback(async (showSyncing = false) => {
    if (showSyncing) setSyncing(true);
    try {
      const headers = getAdminHeaders();
      const [statsRes, jobsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/videos/queues/stats`, { headers }),
        fetch(`${apiUrl}/admin/videos/queues/jobs?type=${filter}`, { headers })
      ]);

      if (!statsRes.ok || !jobsRes.ok) {
        throw new Error(`Failed to query BullMQ telemetry (${statsRes.status} / ${jobsRes.status})`);
      }

      const statsData = await statsRes.json();
      const jobsData = await jobsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (jobsData.success) setJobs(jobsData.data || []);
    } catch (err) {
      console.error('[QueuesDashboard] fetch failed:', err);
      if (showSyncing) showToast("Failed to refresh BullMQ telemetry", "error");
    } finally {
      setLoading(false);
      if (showSyncing) setSyncing(false);
    }
  }, [filter, apiUrl, getAdminHeaders, showToast]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const handleAction = async (jobId: string, action: 'retry' | 'delete') => {
    setIsActionInProgress(true);
    try {
      const url = `${apiUrl}/admin/videos/queues/jobs/${jobId}${action === 'retry' ? '/retry' : ''}`;
      const res = await fetch(url, { 
        method: action === 'retry' ? 'POST' : 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        showToast(`Redis Job ${action === 'retry' ? 'requeued' : 'purged'} successfully`, "success");
        if (selectedJob?.id === jobId) {
          if (action === 'delete') setSelectedJob(null);
        }
        await fetchData();
      } else {
        showToast(`Action failed with status ${res.status}`, "error");
      }
    } catch {
      showToast(`Network fault during ${action}`, "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleCleanQueue = async () => {
    setIsActionInProgress(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos/queues/clean`, {
        method: 'POST',
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast("Purged stale and completed jobs from Redis", "success");
        await fetchData(true);
      }
    } catch {
      showToast("Failed to clean Redis queue", "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleRetryAllFailed = async () => {
    setIsActionInProgress(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos/jobs/retry-all-failed`, {
        method: 'POST',
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Requeued ${data.count} faulted jobs`, "success");
        await fetchData(true);
      }
    } catch {
      showToast("Failed to retry faulted jobs", "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(j => 
      j.id.toLowerCase().includes(q) ||
      (j.name && j.name.toLowerCase().includes(q)) ||
      (j.data?.jobId && j.data.jobId.toLowerCase().includes(q)) ||
      (j.failedReason && j.failedReason.toLowerCase().includes(q))
    );
  }, [jobs, searchQuery]);

  const FILTERS: { key: FilterType; label: string; count: number; colorClass: string; badgeClass: string }[] = stats ? [
    { key: 'active',    label: 'Active',    count: stats.active,    colorClass: 'text-indigo-600', badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { key: 'waiting',   label: 'Waiting',   count: stats.waiting,   colorClass: 'text-amber-600',  badgeClass: 'bg-amber-50 border-amber-200 text-amber-700' },
    { key: 'failed',    label: 'Faulted',   count: stats.failed,    colorClass: 'text-rose-600',   badgeClass: 'bg-rose-50 border-rose-200 text-rose-700' },
    { key: 'completed', label: 'Completed', count: stats.completed, colorClass: 'text-emerald-600', badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { key: 'delayed',   label: 'Delayed',   count: stats.delayed,   colorClass: 'text-purple-600', badgeClass: 'bg-purple-50 border-purple-200 text-purple-700' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">

      {/* ── Sub-Navigation / Header ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Database size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">BullMQ Dashboard</h1>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Redis Engine → transcoding-queue</p>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              <Link 
                href="/processing"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1.5"
              >
                <Activity size={13} className="text-slate-400" />
                Transcode Jobs
              </Link>
              <Link 
                href="/processing/queues"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 transition-colors flex items-center gap-1.5"
              >
                <Database size={13} className="text-indigo-600" />
                BullMQ Redis Queue
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-200/50 text-indigo-800">
                  {stats?.active || 0} active
                </span>
              </Link>
              <Link 
                href="/storage"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1.5"
              >
                <HardDrive size={13} className="text-slate-400" />
                Media Storage
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-emerald-700">Redis Connected</span>
            </div>

            {(stats?.failed || 0) > 0 && (
              <button
                onClick={handleRetryAllFailed}
                disabled={isActionInProgress}
                className="h-8.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-100 transition-colors disabled:opacity-50 shadow-xs"
                title="Retry all failed jobs in BullMQ and Prisma"
              >
                <RotateCw size={13} className={isActionInProgress ? "animate-spin" : ""} />
                Retry Failed ({stats?.failed})
              </button>
            )}

            <button
              onClick={handleCleanQueue}
              disabled={isActionInProgress}
              className="h-8.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
              title="Clean completed and failed jobs from Redis"
            >
              <Trash2 size={13} className="text-slate-400" />
              Clean Queue
            </button>

            <button
              onClick={() => fetchData(true)}
              disabled={syncing}
              className="h-8.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              Sync Redis
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full space-y-6">

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Active In Redis</span>
              <Activity size={16} className={(stats?.active || 0) > 0 ? "animate-spin text-indigo-600" : "text-slate-400"} />
            </div>
            <p className="text-2xl font-bold font-mono text-indigo-600">{stats?.active || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Currently Processing</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Waiting</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-600">{stats?.waiting || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Pending Worker</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Faulted</span>
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-600">{stats?.failed || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Failed Attempts</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Completed</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600">{stats?.completed || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Retained Logs</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-purple-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Delayed</span>
              <Zap size={16} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-purple-600">{stats?.delayed || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Scheduled / Backoff</p>
          </div>
        </div>

        {/* ── Table & Toolbar Container ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">

          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 md:items-center justify-between">
            
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none flex items-center gap-1.5 ${
                    filter === f.key
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] font-mono tabular-nums ${filter === f.key ? f.colorClass : 'text-slate-400'}`}>
                    ({f.count})
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search BullMQ job ID, payload..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

          </div>

          {/* Jobs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px]">
                  <th className="px-5 py-3 font-semibold">Job ID / Target Name</th>
                  <th className="px-4 py-3 font-semibold">Payload Data</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Attempts</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <tr 
                      key={job.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedJob(job)}
                    >
                      {/* Job ID & Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 font-mono text-[10px] font-bold">
                            MQ
                          </div>
                          <div>
                            <p className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              #{job.id}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">
                              name: {job.name || 'transcode'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Payload */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] text-slate-600 max-w-xs truncate">
                          {job.data?.jobId ? (
                            <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              jobId: {job.data.jobId.slice(0, 12)}...
                            </span>
                          ) : (
                            JSON.stringify(job.data)
                          )}
                        </div>
                        {job.failedReason && (
                          <p className="text-[10px] font-mono text-rose-600 truncate max-w-xs mt-1" title={job.failedReason}>
                            {job.failedReason}
                          </p>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3.5">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${job.progress || 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 mt-1 block">
                          {Math.round(job.progress || 0)}%
                        </span>
                      </td>

                      {/* Attempts */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                        <span className={`font-semibold ${job.attemptsMade > 1 ? 'text-amber-600' : ''}`}>
                          {job.attemptsMade}
                        </span> attempts
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div>{new Date(job.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{new Date(job.timestamp).toLocaleTimeString()}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {filter === 'failed' && (
                            <button
                              onClick={() => handleAction(job.id, 'retry')}
                              disabled={isActionInProgress}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                              title="Re-enqueue in BullMQ"
                            >
                              <RotateCw size={11} /> Retry
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(job.id, 'delete')}
                            disabled={isActionInProgress}
                            className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-md transition-colors"
                            title="Purge from Redis"
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                            title="Inspect Payload"
                          >
                            <FileCode size={12} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                      No {filter} jobs in BullMQ Redis queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* ── BullMQ Job Inspector Modal ── */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Database size={16} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    BullMQ Job Telemetry: #{selectedJob.id}
                  </h2>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    Name: {selectedJob.name} | State: {selectedJob.state || filter}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans text-xs">
              
              {/* Timing Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Queued At</span>
                  <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                    {new Date(selectedJob.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Processed At</span>
                  <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                    {selectedJob.processedOn ? new Date(selectedJob.processedOn).toLocaleTimeString() : 'Pending'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Finished At</span>
                  <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                    {selectedJob.finishedOn ? new Date(selectedJob.finishedOn).toLocaleTimeString() : 'In Progress'}
                  </p>
                </div>
              </div>

              {/* Failure Reason */}
              {selectedJob.failedReason && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-xs">
                    <AlertTriangle size={14} /> BullMQ Execution Error:
                  </div>
                  <p className="font-mono text-xs text-rose-800 break-words">
                    {selectedJob.failedReason}
                  </p>
                </div>
              )}

              {/* Payload Data JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                    <FileCode size={12} className="text-slate-400" /> Job Payload Data
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(selectedJob.data, null, 2))}
                    className="text-[11px] text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1"
                  >
                    {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-cyan-300 max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                  {JSON.stringify(selectedJob.data, null, 2)}
                </div>
              </div>

              {/* Stacktrace if available */}
              {selectedJob.stacktrace && selectedJob.stacktrace.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                    <Terminal size={12} className="text-slate-400" /> Stack Trace
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-rose-400 max-h-48 overflow-y-auto whitespace-pre-wrap select-text">
                    {selectedJob.stacktrace.join('\n')}
                  </div>
                </div>
              )}

              {/* Return value if completed */}
              {selectedJob.returnvalue && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Return Value</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800">
                    {typeof selectedJob.returnvalue === 'object' 
                      ? JSON.stringify(selectedJob.returnvalue, null, 2) 
                      : String(selectedJob.returnvalue)}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              {selectedJob.data?.jobId ? (
                <Link
                  href="/processing"
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Activity size={13} />
                  View In Transcode Jobs
                </Link>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(selectedJob.id, 'retry')}
                  disabled={isActionInProgress}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <RotateCw size={13} className={isActionInProgress ? "animate-spin" : ""} />
                  Retry BullMQ Job
                </button>
                <button
                  onClick={() => handleAction(selectedJob.id, 'delete')}
                  disabled={isActionInProgress}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shadow-xs"
                >
                  Purge From Redis
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
