"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Zap, Clock, AlertCircle, CheckCircle2, 
  RotateCw, Terminal, Layers, Search,
  ChevronRight, ArrowRight, Activity, Trash2, X,
  CloudUpload, XCircle, Database, Server, RefreshCw,
  ExternalLink, Play, Film, Sliders, ShieldAlert,
  HardDrive, AlertTriangle, ArrowUpDown, Copy, Check
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useUpload } from "@/components/UploadProvider";

interface TranscodingJob {
  id: string;
  mediaId: string;
  title: string;
  status: 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED' | 'UPLOAD_PENDING';
  qualities: string[];
  attempts: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  parentStatus?: string;
  progress?: number;
  processingLog?: string;
}

export default function ProcessingPanel() {
  const { showToast } = useToast();
  const router = useRouter();
  const { tasks } = useUpload();
  const [jobs, setJobs] = useState<TranscodingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'QUEUED' | 'PROCESSING' | 'FAILED' | 'READY'>('ALL');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<TranscodingJob | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const getAdminHeaders = () => {
    const adminKey = typeof window !== 'undefined'
      ? (localStorage.getItem('admin_api_key') || process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026')
      : (process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'kuber_admin_secret_key_2026');
    return {
      'Content-Type': 'application/json',
      'X-Admin-API-Key': adminKey
    };
  };

  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos/jobs`, {
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
      }
    } catch (err) {
      console.error('[ProcessingPanel] fetch error:', err);
      if (!silent) showToast("Failed to fetch transcode jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'retry' | 'delete') => {
    const targetJob = jobs.find(j => j.id === id) || (selectedJob?.id === id ? selectedJob : null);
    if (action === 'retry' && (targetJob?.error?.includes('Master URL not found') || targetJob?.status === 'UPLOAD_PENDING')) {
      showToast("Cannot retry transcode: Master video file has not been uploaded to S3 yet. Please upload it via Ingestion Studio.", "error");
      return;
    }

    setIsActionInProgress(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos/jobs/${id}${action === 'retry' ? '/retry' : ''}`, {
        method: action === 'retry' ? 'POST' : 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        showToast(`Job ${action === 'retry' ? 'requeued' : 'removed'} successfully`, "success");
        if (selectedJob?.id === id) {
          if (action === 'delete') setSelectedJob(null);
          else setSelectedJob(prev => prev ? { ...prev, status: 'QUEUED' } : null);
        }
        await fetchJobs(true);
      } else {
        const errJson = await res.json().catch(() => null);
        showToast(errJson?.message || `Action failed with status ${res.status}`, "error");
      }
    } catch (err) {
      showToast("Network fault during job action", "error");
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
        showToast(`Requeued ${data.count} faulted transcode job(s)`, "success");
        await fetchJobs(true);
      }
    } catch (e) {
      showToast("Failed to retry faulted jobs", "error");
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
        showToast("Purged completed & stale jobs from Redis queue", "success");
        await fetchJobs(true);
      }
    } catch (e) {
      showToast("Failed to clean queue", "error");
    } finally {
      setIsActionInProgress(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const isJobFailed = (j: any) => {
    if (j.status === 'FAILED' || j.parentStatus === 'FAILED') return true;
    const clientTask = tasks.find(t => (t.mediaId === j.mediaId || t.mediaId === j.id) && t.status === 'FAILED');
    return Boolean(clientTask);
  };

  const isJobProcessing = (j: any) => {
    if (isJobFailed(j)) return false;
    return j.status === 'PROCESSING' || (j.status === 'UPLOAD_PENDING' && j.parentStatus === 'UPLOADING');
  };

  const mappedJobs = useMemo(() => {
    return jobs.map(j => {
      const clientTask = tasks.find(t => (t.mediaId === j.mediaId || t.mediaId === j.id) && t.status === 'FAILED');
      if (clientTask && j.status !== 'FAILED') {
        return {
          ...j,
          status: 'FAILED' as const,
          parentStatus: 'FAILED',
          error: clientTask.error || 'Upload interrupted by client.'
        };
      }
      return j;
    });
  }, [jobs, tasks]);

  const filteredJobs = useMemo(() => {
    return mappedJobs.filter(j => {
      // Status filter
      let matchesStatus = true;
      if (filter === 'PROCESSING') matchesStatus = isJobProcessing(j);
      else if (filter === 'FAILED') matchesStatus = isJobFailed(j);
      else if (filter === 'QUEUED') {
        matchesStatus = !isJobFailed(j) && (j.status === 'QUEUED' || (j.status === 'UPLOAD_PENDING' && ['UPLOAD_PENDING', 'UPLOADED'].includes(j.parentStatus || '')));
      } else if (filter === 'READY') {
        matchesStatus = j.status === 'READY' && !isJobFailed(j);
      }

      // Search filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch = Boolean(
          (j.title && j.title.toLowerCase().includes(q)) ||
          (j.id && j.id.toLowerCase().includes(q)) ||
          (j.mediaId && j.mediaId.toLowerCase().includes(q))
        );
      }

      return matchesStatus && matchesSearch;
    });
  }, [mappedJobs, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: mappedJobs.length,
    processing: mappedJobs.filter(isJobProcessing).length,
    failed: mappedJobs.filter(isJobFailed).length,
    ready: mappedJobs.filter(j => j.status === 'READY' && !isJobFailed(j)).length,
    queued: mappedJobs.filter(j => !isJobFailed(j) && (j.status === 'QUEUED' || j.status === 'UPLOAD_PENDING')).length,
  }), [mappedJobs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (job: TranscodingJob) => {
    if (isJobFailed(job)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={12} className="text-rose-500" />
          FAULTED
        </span>
      );
    }
    if (isJobProcessing(job)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Activity size={12} className="text-indigo-500 animate-spin" />
          ENCODING {job.progress ? `${Math.round(job.progress)}%` : ''}
        </span>
      );
    }
    if (job.status === 'READY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-500" />
          READY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} className="text-amber-500" />
        QUEUED
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      
      {/* ── Sub-Navigation / Header ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <Server size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">Processing & Queue Engine</h1>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Distributed FFmpeg Pipeline & BullMQ Orchestration</p>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              <Link 
                href="/processing"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 transition-colors flex items-center gap-1.5"
              >
                <Activity size={13} className="text-indigo-600" />
                Transcode Jobs
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-200/50 text-indigo-800">
                  {stats.total}
                </span>
              </Link>
              <Link 
                href="/processing/queues"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1.5"
              >
                <Database size={13} className="text-slate-400" />
                BullMQ Redis Queue
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

          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-emerald-700">Polling Active (5s)</span>
            </div>

            {stats.failed > 0 && (
              <button 
                onClick={handleRetryAllFailed}
                disabled={isActionInProgress}
                className="h-8.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-100 transition-colors disabled:opacity-50 shadow-xs"
                title="Batch re-queue all faulted transcode jobs"
              >
                <RotateCw size={13} className={isActionInProgress ? "animate-spin" : ""} /> 
                Retry Failed ({stats.failed})
              </button>
            )}

            <button 
              onClick={handleCleanQueue}
              disabled={isActionInProgress}
              className="h-8.5 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
              title="Clean completed and stale jobs from Redis"
            >
              <Trash2 size={13} className="text-slate-400" />
              Clean Redis
            </button>

            <button
              onClick={() => fetchJobs()}
              disabled={loading}
              className="h-8.5 w-8.5 bg-white border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs"
              title="Refresh telemetry"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : "text-slate-600"} />
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full space-y-6">

        {/* ── Metrics Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Transcodes</span>
              <Layers size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900">{stats.total}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Recorded Jobs</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Encoding Active</span>
              <Activity size={16} className={stats.processing > 0 ? "animate-spin text-indigo-600" : "text-slate-400"} />
            </div>
            <p className="text-2xl font-bold font-mono text-indigo-600">{stats.processing}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Active Workers</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Queued / Staged</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-600">{stats.queued}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Waiting Pipeline</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Faulted Jobs</span>
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-600">{stats.failed}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Requires Review</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Ready & Active</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600">{stats.ready}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">HLS Stream Ready</p>
          </div>
        </div>

        {/* ── Table & Toolbar Container ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          
          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3 md:items-center justify-between">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['ALL', 'PROCESSING', 'QUEUED', 'FAILED', 'READY'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                    filter === tab
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'ALL' && `All (${stats.total})`}
                  {tab === 'PROCESSING' && `Active (${stats.processing})`}
                  {tab === 'QUEUED' && `Queued (${stats.queued})`}
                  {tab === 'FAILED' && `Faulted (${stats.failed})`}
                  {tab === 'READY' && `Ready (${stats.ready})`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, ID or media ID..."
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

          {/* Job List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px]">
                  <th className="px-5 py-3 font-semibold">Media Production Entity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Qualities</th>
                  <th className="px-4 py-3 font-semibold">Attempts</th>
                  <th className="px-4 py-3 font-semibold">Created / Updated</th>
                  <th className="px-5 py-3 font-semibold text-right">Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => {
                    const failed = isJobFailed(job);
                    const processing = isJobProcessing(job);

                    return (
                      <tr 
                        key={job.id} 
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setSelectedJob(job)}
                      >
                        {/* Title & Entity Link */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              failed ? 'bg-rose-50 border-rose-200 text-rose-600' :
                              processing ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                              'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                              <Film size={15} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-xs md:max-w-md">
                                {job.title || 'Untitled Asset'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">
                                  JOB: {job.id.slice(0, 10)}...
                                </span>
                                {job.mediaId && (
                                  <Link
                                    href={`/content/${job.mediaId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-0.5 font-mono text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline"
                                    title="Open in Content Inspector"
                                  >
                                    <span>MEDIA: {job.mediaId.slice(0, 8)}</span>
                                    <ExternalLink size={9} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(job)}
                          {failed && job.error && (
                            <p className="text-[10px] font-mono text-rose-600 truncate max-w-[200px] mt-1" title={job.error}>
                              {job.error}
                            </p>
                          )}
                        </td>

                        {/* Qualities */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {job.qualities && job.qualities.length > 0 ? (
                              job.qualities.map((q) => (
                                <span key={q} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded font-mono text-[10px]">
                                  {q}
                                </span>
                              ))
                            ) : (
                              <span className="font-mono text-[10px] text-slate-400">1080p, 720p, 480p</span>
                            )}
                          </div>
                        </td>

                        {/* Attempts */}
                        <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                          <span className={`font-semibold ${job.attempts > 1 ? 'text-amber-600' : ''}`}>
                            {job.attempts || 0}
                          </span> / 3
                        </td>

                        {/* Timestamps */}
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          <div>{new Date(job.createdAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">{new Date(job.createdAt).toLocaleTimeString()}</div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {job.error?.includes('Master URL not found') ? (
                              <Link
                                href={`/studio/upload?id=${job.mediaId}&tab=studio`}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                                title="Master video missing. Re-upload video file in Ingestion Studio."
                              >
                                <CloudUpload size={11} /> Re-upload Source
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleAction(job.id, 'retry')}
                                disabled={isActionInProgress}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-md transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                                title="Requeue Job"
                              >
                                <RotateCw size={11} /> Retry
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(job.id, 'delete')}
                              disabled={isActionInProgress}
                              className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-md transition-colors"
                              title="Cancel and Remove Job"
                            >
                              <Trash2 size={12} />
                            </button>
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                              title="View Telemetry"
                            >
                              <Terminal size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                      {searchQuery ? "No transcode jobs match your search query." : "No transcode jobs in pipeline."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* ── Job Inspector Modal / Drawer ── */}
      {selectedJob && (
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
                    Job Telemetry: {selectedJob.title}
                  </h2>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    ID: {selectedJob.id}
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
              
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedJob)}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Attempts</span>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-1">{selectedJob.attempts || 0} / 3</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Progress</span>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {selectedJob.progress ? `${Math.round(selectedJob.progress)}%` : '0%'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Parent Media</span>
                  {selectedJob.mediaId ? (
                    <Link
                      href={`/content/${selectedJob.mediaId}`}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 mt-1 truncate"
                    >
                      <span className="truncate">View Media</span>
                      <ExternalLink size={10} />
                    </Link>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px] mt-1 block">N/A</span>
                  )}
                </div>
              </div>

              {/* Qualities Target */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Target HLS Ladders</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedJob.qualities && selectedJob.qualities.length > 0 ? selectedJob.qualities : ['1080p', '720p', '480p']).map(q => (
                    <span key={q} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-xs font-mono font-semibold">
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              {/* Error Box if Failed */}
              {selectedJob.error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-xs">
                    <AlertTriangle size={14} /> Fault Exception Detail:
                  </div>
                  <p className="font-mono text-xs text-rose-800 break-words">
                    {selectedJob.error}
                  </p>
                </div>
              )}

              {/* Execution / Transcoding Logs Terminal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                    <Terminal size={12} className="text-slate-400" /> Transcode Execution Log
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedJob.processingLog || selectedJob.error || 'No logs recorded.')}
                    className="text-[11px] text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1"
                  >
                    {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy Log'}
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-emerald-400 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                  {selectedJob.processingLog || selectedJob.error || (
                    <span className="text-slate-500 italic">
                      No live FFmpeg console log captured yet. Job is in state: {selectedJob.status}.
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-400">
                <div>Created: {new Date(selectedJob.createdAt).toLocaleString()}</div>
                <div className="text-right">Updated: {new Date(selectedJob.updatedAt || selectedJob.createdAt).toLocaleString()}</div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              {selectedJob.mediaId ? (
                <Link
                  href={`/content/${selectedJob.mediaId}`}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink size={13} />
                  Open Media In Cinematic Player
                </Link>
              ) : <div />}

              <div className="flex items-center gap-2">
                {selectedJob.error?.includes('Master URL not found') ? (
                  <Link
                    href={`/studio/upload?id=${selectedJob.mediaId}&tab=studio`}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CloudUpload size={13} />
                    Re-upload Source in Studio
                  </Link>
                ) : (
                  <button
                    onClick={() => handleAction(selectedJob.id, 'retry')}
                    disabled={isActionInProgress}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <RotateCw size={13} className={isActionInProgress ? "animate-spin" : ""} />
                    Re-queue Transcoding
                  </button>
                )}
                <button
                  onClick={() => handleAction(selectedJob.id, 'delete')}
                  disabled={isActionInProgress}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shadow-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
