"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Users, Wallet, PlayCircle, GitBranch, TrendingUp, AlertTriangle, 
  Clock, RefreshCw, Film, Layers, HardDrive, ShieldCheck, 
  ArrowUpRight, Radio, Sparkles, CheckCircle2, XCircle, 
  Cpu, Activity, Plus, ChevronRight, BarChart2, Eye
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface PlatformStats {
  users: { total: number; newThisWeek: number };
  platform: { totalCoinBalance: number };
  streaming: { activeWatchSessions: number };
  referrals: { total: number; rewarded: number; pending: number; suspicious: number };
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface MediaHealth {
  totalSize: number;
  mediaCount: number;
  episodeCount: number;
  totalObjects: number;
  failedUploads: number;
  activeJobs: number;
}

interface RecentJob {
  id: string;
  mediaId: string;
  episodeId: string | null;
  qualities: string[];
  status: string;
  error: string | null;
  createdAt: string;
  media?: { title: string };
  episode?: { title: string };
}

interface RecentMedia {
  id: string;
  title: string;
  type: "MOVIE" | "SERIES";
  posterUrl: string | null;
  backdropUrl: string | null;
  processingStatus: string;
  duration: number;
  createdAt: string;
  episodes?: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [mediaHealth, setMediaHealth] = useState<MediaHealth | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentMedia, setRecentMedia] = useState<RecentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { showToast } = useToast();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, queueRes, healthRes, jobsRes, mediaRes] = await Promise.all([
        fetch(`${apiUrl}/admin/stats`).then(r => r.json()).catch(() => null),
        fetch(`${apiUrl}/admin/videos/queues/stats`).then(r => r.json()).catch(() => null),
        fetch(`${apiUrl}/admin/media-health`).then(r => r.json()).catch(() => null),
        fetch(`${apiUrl}/admin/videos/jobs`).then(r => r.json()).catch(() => null),
        fetch(`${apiUrl}/admin/videos`).then(r => r.json()).catch(() => null),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (queueRes?.success) setQueueStats(queueRes.data);
      if (healthRes?.success) setMediaHealth(healthRes.data);
      if (jobsRes?.success && Array.isArray(jobsRes.data)) {
        setRecentJobs(jobsRes.data.slice(0, 5));
      }
      if (mediaRes?.success && Array.isArray(mediaRes.data)) {
        setRecentMedia(mediaRes.data.slice(0, 4));
      }

      setLastUpdated(new Date());
      if (isManual) showToast("System telemetry refreshed.", "success");
    } catch {
      // Degrades gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, showToast]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 MB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. EXECUTIVE COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Executive Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Platform Telemetry, Multi-Tier Ingestion Pipelines & Storage Matrix
          </p>
        </div>

        {/* Sync Status & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono">
            <Clock size={13} className="text-slate-400" />
            <span>{lastUpdated ? lastUpdated.toLocaleTimeString() : "Syncing..."}</span>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-indigo-600" : ""} />
            </button>
          </div>

          <Link
            href="/studio/upload"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={14} />
            <span>New Ingestion</span>
          </Link>
        </div>
      </div>

      {/* 2. CORE KPI MATRIX (6 TILES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Registered Users */}
        <Link href="/users" className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            {stats?.users.newThisWeek !== undefined && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                +{stats.users.newThisWeek} 7d
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Registered Users</p>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">
              {loading ? "..." : (stats?.users.total.toLocaleString() ?? "—")}
            </h2>
          </div>
        </Link>

        {/* Metric 2: Catalog Size */}
        <Link href="/content" className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Film size={18} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              Ready
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Catalog Titles</p>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">
              {loading ? "..." : ((mediaHealth?.mediaCount ?? 0) + (mediaHealth?.episodeCount ?? 0)).toLocaleString()}
            </h2>
          </div>
        </Link>

        {/* Metric 3: Active Watch Sessions */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <PlayCircle size={18} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Radio size={10} className="animate-pulse" /> Live Now
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Streams</p>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : (stats?.streaming.activeWatchSessions.toLocaleString() ?? "0")}
            </h2>
          </div>
        </div>

        {/* Metric 4: Platform Coin Economy */}
        <Link href="/referrals" className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Wallet size={18} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono">
              Tokens
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Coin Economy</p>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">
              {loading ? "..." : (stats?.platform.totalCoinBalance.toLocaleString() ?? "0")}
            </h2>
          </div>
        </Link>

        {/* Metric 5: Active Transcoding Pipelines */}
        <Link href="/processing/queues" className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Cpu size={18} />
            </div>
            {queueStats && queueStats.failed > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                {queueStats.failed} Faulted
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                Optimal
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Pipelines</p>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">
              {loading ? "..." : (queueStats ? (queueStats.active + queueStats.waiting) : "0")}
            </h2>
          </div>
        </Link>

        {/* Metric 6: Cloud Storage Assets */}
        <Link href="/storage" className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <HardDrive size={18} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono">
              AWS S3
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Storage Volume</p>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">
              {loading ? "..." : formatBytes(mediaHealth?.totalSize ?? 0)}
            </h2>
          </div>
        </Link>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO COLUMNS: LIVE TRANSCODING PIPELINES & RECENT MEDIA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. Live Transcoding Pipeline Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-600" />
                  Live Transcoding & Ingestion Pipelines
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Multi-resolution HLS packaging, audio multiplexing & subtitle conversion
                </p>
              </div>
              <Link 
                href="/processing/queues" 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Queue Details</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Queue Counter Bar */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50 text-center py-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Waiting</span>
                <p className="text-sm font-bold text-slate-800">{queueStats?.waiting ?? 0}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-blue-500">Active</span>
                <p className="text-sm font-bold text-blue-600">{queueStats?.active ?? 0}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-500">Completed</span>
                <p className="text-sm font-bold text-emerald-600">{queueStats?.completed ?? 0}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-rose-500">Faulted</span>
                <p className="text-sm font-bold text-rose-600">{queueStats?.failed ?? 0}</p>
              </div>
            </div>

            {/* Recent Jobs Table */}
            <div className="divide-y divide-slate-100">
              {recentJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No active or past transcoding jobs recorded in queue.
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        job.status === "READY" ? "bg-emerald-50 text-emerald-600" :
                        job.status === "PROCESSING" ? "bg-blue-50 text-blue-600" :
                        job.status === "FAILED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {job.status === "READY" ? <CheckCircle2 size={16} /> :
                         job.status === "PROCESSING" ? <Activity size={16} className="animate-spin" /> :
                         job.status === "FAILED" ? <XCircle size={16} /> : <Clock size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {job.media?.title || job.episode?.title || `Media Job #${job.mediaId.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {job.qualities?.join(", ") || "Auto-Tiers"}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider ${
                        job.status === "READY" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        job.status === "PROCESSING" ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse" :
                        job.status === "FAILED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* B. Recently Ingested Productions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Film size={16} className="text-indigo-600" />
                  Recently Ingested Productions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Latest releases synchronized to the cloud streaming CDN
                </p>
              </div>
              <Link 
                href="/content" 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentMedia.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-400 font-mono text-xs">
                  No productions cataloged yet. Use &ldquo;New Ingestion&rdquo; to stage content.
                </div>
              ) : (
                recentMedia.map((m) => (
                  <Link 
                    key={m.id} 
                    href={`/content/${m.id}`}
                    className="group flex gap-3.5 p-3 rounded-xl border border-slate-200/70 hover:border-indigo-400 hover:shadow-sm transition-all bg-white"
                  >
                    <div className="w-16 h-22 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60 relative">
                      {m.posterUrl ? (
                        <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Film size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between min-w-0 py-0.5 flex-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                            {m.type}
                          </span>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${
                            m.processingStatus === "READY" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {m.processingStatus}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate mt-1.5 group-hover:text-indigo-600 transition-colors">
                          {m.title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{formatDuration(m.duration)}</span>
                        <span>•</span>
                        <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INFRASTRUCTURE, GROWTH & SECURITY */}
        <div className="space-y-6">
          
          {/* Quick Shortcuts Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-3">
              Command Shortcuts
            </h3>
            <div className="space-y-2">
              <Link 
                href="/studio/upload" 
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Ingestion Studio
                    </p>
                    <p className="text-[10px] text-slate-500">Upload & multi-pass transcode</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link 
                href="/studio/homepage" 
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Curated Home Layout
                    </p>
                    <p className="text-[10px] text-slate-500">Manage rows & featured billboard</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link 
                href="/settings/ads" 
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <BarChart2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Ad Campaigns & Banners
                    </p>
                    <p className="text-[10px] text-slate-500">Promotions, placements & CTR</p>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
              </Link>
            </div>
          </div>

          {/* Referral Network Integrity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <GitBranch size={14} className="text-indigo-600" />
                Referral Network Health
              </h3>
              <Link href="/referrals" className="text-[11px] text-indigo-600 font-semibold hover:underline">
                View Ledger
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase">Rewarded</span>
                <p className="text-base font-extrabold text-emerald-700">{stats?.referrals.rewarded ?? 0}</p>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-[10px] font-mono text-amber-600 font-bold uppercase">Pending</span>
                <p className="text-base font-extrabold text-amber-700">{stats?.referrals.pending ?? 0}</p>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                <span className="text-[10px] font-mono text-rose-600 font-bold uppercase">Flagged</span>
                <p className="text-base font-extrabold text-rose-700">{stats?.referrals.suspicious ?? 0}</p>
              </div>
            </div>

            {stats && stats.referrals.suspicious > 0 ? (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{stats.referrals.suspicious} suspicious referral actions require audit.</span>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-600 font-mono">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Fraud prevention heuristics active.</span>
              </div>
            )}
          </div>

          {/* S3 Storage & Infrastructure Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5 mb-4">
              <HardDrive size={14} className="text-indigo-600" />
              S3 Bucket Telemetry
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Storage Footprint</span>
                <span className="font-bold text-slate-900">{formatBytes(mediaHealth?.totalSize ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Total S3 Objects</span>
                <span className="font-bold text-slate-900">{mediaHealth?.totalObjects ?? 0}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Orphaned/Failed Uploads</span>
                <span className="font-bold text-emerald-600">{mediaHealth?.failedUploads ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Gateway Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Synced
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
