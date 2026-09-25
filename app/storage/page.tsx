"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Database, HardDrive, AlertTriangle, Server, 
  Activity, Gauge, RefreshCw, X, ShieldAlert,
  FileVideo, FileText, LayoutGrid, Terminal,
  DollarSign, CheckCircle2, Search, Filter, ArrowUpDown,
  ExternalLink, Film, Tv, Clock, Trash2, ArrowRight,
  ShieldCheck, AlertCircle, Info, ChevronRight
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface MediaHealthStats {
  totalSize: number;
  movieTotalBytes?: number;
  episodeTotalBytes?: number;
  mediaCount?: number;
  episodeCount?: number;
  totalObjects: number;
  largeFiles: { id: string; title: string; size: number; type: string; createdAt?: string }[];
  failedUploads: number;
  missingMasterFiles: number;
  activeJobs: number;
}

export default function MediaStoragePage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<MediaHealthStats | null>(null);
  const [quarantineItems, setQuarantineItems] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [sortField, setSortField] = useState<'size' | 'title'>('size');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [quarantineHours, setQuarantineHours] = useState<number>(24);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  
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

  const fetchHealth = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers = getAdminHeaders();
      const [resHealth, resPreview] = await Promise.all([
        fetch(`${apiUrl}/admin/media-health`, { headers }),
        fetch(`${apiUrl}/admin/media/invalidate-preview?hours=${quarantineHours}`, { headers })
      ]);

      if (!resHealth.ok) throw new Error(`Failed to fetch health (${resHealth.status})`);
      
      const dataHealth = await resHealth.json();
      const dataPreview = await resPreview.json();

      if (dataHealth.success) setStats(dataHealth.data);
      if (dataPreview.success) setQuarantineItems(dataPreview.data);
    } catch (err: any) {
      console.error('[MediaStoragePage] fetch error:', err);
      if (!silent) showToast("Failed to fetch storage telemetry.", "error");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, quarantineHours, getAdminHeaders, showToast]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(true), 15000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const runCleanup = async () => {
    setCleaning(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/media/invalidate`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({ hours: quarantineHours })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Orphaned uploads safely quarantined.", "success");
        setShowPurgeModal(false);
        await fetchHealth(true);
      } else {
        showToast("Purge action rejected by server.", "error");
      }
    } catch {
      showToast("Network fault during quarantine purge.", "error");
    } finally {
      setCleaning(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0.00 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const processedFiles = useMemo(() => {
    if (!stats?.largeFiles) return [];
    return stats.largeFiles
      .filter(f => {
        const matchesType = filterType === "ALL" || f.type === filterType;
        const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              f.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
      })
      .sort((a, b) => {
        if (sortField === 'size') {
          return sortOrder === 'asc' ? a.size - b.size : b.size - a.size;
        } else {
          return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
        }
      });
  }, [stats?.largeFiles, filterType, searchQuery, sortField, sortOrder]);

  const movieBytes = stats?.movieTotalBytes || 0;
  const episodeBytes = stats?.episodeTotalBytes || 0;
  const totalBytes = stats?.totalSize || 0;
  const moviePct = totalBytes > 0 ? Math.round((movieBytes / totalBytes) * 100) : 0;
  const episodePct = totalBytes > 0 ? Math.round((episodeBytes / totalBytes) * 100) : 0;

  const totalQuarantineCount = useMemo(() => {
    if (!quarantineItems) return 0;
    return (quarantineItems.missingMedia?.length || 0) + 
           (quarantineItems.missingEpisodes?.length || 0) + 
           (quarantineItems.failedJobs?.length || 0);
  }, [quarantineItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Activity className="w-5 h-5 text-indigo-600 animate-spin" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Analyzing Storage Cluster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      
      {/* ── Sub-Navigation / Header ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                <HardDrive size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">Media Operations & Storage</h1>
                <p className="text-[11px] text-slate-500 font-mono mt-1">S3 Bucket Telemetry & Infrastructure Integrity</p>
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
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors flex items-center gap-1.5"
              >
                <Database size={13} className="text-slate-400" />
                BullMQ Redis Queue
              </Link>
              <Link 
                href="/storage"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 transition-colors flex items-center gap-1.5"
              >
                <HardDrive size={13} className="text-indigo-600" />
                Media Storage
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/content"
              className="h-8.5 px-3.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Film size={13} className="text-slate-500" />
              Content Library
            </Link>

            <button 
              onClick={() => fetchHealth()}
              disabled={loading}
              className="h-8.5 px-3.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Sync Storage
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full space-y-6">

        {/* ── Capacity Metrics Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Payload Capacity</span>
              <HardDrive size={16} />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900">{formatSize(totalBytes)}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Total S3 Footprint</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Library Objects</span>
              <Server size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900">{stats?.totalObjects || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {stats?.mediaCount || 0} Media • {stats?.episodeCount || 0} Episodes
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Faulted Jobs</span>
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-600">{stats?.failedUploads || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Requires Invalidation</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Worker Load</span>
              <Gauge size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600">{stats?.activeJobs || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Active Transcode Threads</p>
          </div>

        </div>

        {/* ── Visual Storage Distribution Bar ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={15} className="text-indigo-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Storage Allocation Distribution
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600">
              Total Managed: {formatSize(totalBytes)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/80">
            <div 
              className="bg-indigo-600 h-full transition-all duration-500" 
              style={{ width: `${moviePct}%` }}
              title={`Movies: ${formatSize(movieBytes)} (${moviePct}%)`}
            />
            <div 
              className="bg-purple-500 h-full transition-all duration-500" 
              style={{ width: `${episodePct}%` }}
              title={`Episodes: ${formatSize(episodeBytes)} (${episodePct}%)`}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 pt-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
              <span className="text-slate-600">Feature Movies:</span>
              <span className="font-bold text-slate-900">{formatSize(movieBytes)} ({moviePct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
              <span className="text-slate-600">Series Episodes:</span>
              <span className="font-bold text-slate-900">{formatSize(episodeBytes)} ({episodePct}%)</span>
            </div>
          </div>
        </div>

        {/* ── Two Column Layout: Top Consumers & Quarantine ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Top Capacity Consumers (8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
            
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid size={15} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Top Capacity Consumers
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Sorted by {sortField} ({sortOrder})
              </span>
            </div>

            {/* Filter & Search */}
            <div className="p-3 border-b border-slate-200 flex items-center gap-3 bg-white">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search production title or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono bg-white text-slate-700"
                >
                  <option value="ALL">All Formats</option>
                  <option value="MOVIE">Movies Only</option>
                  <option value="SERIES">Series Only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px]">
                    <th 
                      className="px-5 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => {
                        setSortField('title');
                        setSortOrder(sortField === 'title' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Production Title / ID
                        <ArrowUpDown size={11} className={sortField === 'title' ? 'text-indigo-600' : 'text-slate-400'} />
                      </div>
                    </th>
                    <th className="px-4 py-3 font-semibold">Format</th>
                    <th 
                      className="px-5 py-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => {
                        setSortField('size');
                        setSortOrder(sortField === 'size' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Payload Size
                        <ArrowUpDown size={11} className={sortField === 'size' ? 'text-indigo-600' : 'text-slate-400'} />
                      </div>
                    </th>
                    <th className="px-5 py-3 font-semibold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedFiles.length > 0 ? (
                    processedFiles.map(file => (
                      <tr 
                        key={file.id} 
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/content/${file.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                              {file.type === 'SERIES' ? <Tv size={14} /> : <Film size={14} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-xs md:max-w-sm">
                                {file.title}
                              </p>
                              <p className="font-mono text-[10px] text-slate-400 truncate">
                                {file.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-semibold border ${
                            file.type === 'SERIES' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {file.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                          {formatSize(file.size)}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/content/${file.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors shadow-2xs"
                          >
                            <span>Inspect</span>
                            <ExternalLink size={10} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                        No files match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right Column: Infrastructure Quarantine Portal (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden">
            
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-rose-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Quarantine Center
                </span>
              </div>

              {totalQuarantineCount > 0 && (
                <button 
                  onClick={() => setShowPurgeModal(true)} 
                  disabled={cleaning}
                  className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                >
                  <Trash2 size={12} />
                  Purge ({totalQuarantineCount})
                </button>
              )}
            </div>

            {/* Quarantine Threshold Selector */}
            <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Age Threshold:</span>
              <select
                value={quarantineHours}
                onChange={(e) => setQuarantineHours(Number(e.target.value))}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-mono bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>Older than 1 hour</option>
                <option value={6}>Older than 6 hours</option>
                <option value={24}>Older than 24 hours</option>
                <option value={72}>Older than 72 hours</option>
              </select>
            </div>

            {/* Quarantine Items Feed */}
            <div className="p-4 space-y-2.5 overflow-y-auto max-h-[420px] font-mono text-[11px] flex-1">
              {totalQuarantineCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="font-semibold text-slate-700 text-xs font-sans">Cluster Integrity Optimal</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No orphaned assets detected</p>
                </div>
              ) : (
                <>
                  {quarantineItems?.missingMedia?.map((m: any) => (
                    <div key={m.id} className="p-2.5 bg-rose-50/80 text-rose-900 border border-rose-200 rounded-lg flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-200/60 rounded text-rose-800 mr-1.5">ORPHAN</span>
                        <span className="font-semibold truncate">{m.title}</span>
                      </div>
                      <span className="text-[10px] text-rose-500 shrink-0">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}

                  {quarantineItems?.missingEpisodes?.map((e: any) => (
                    <div key={e.id} className="p-2.5 bg-rose-50/80 text-rose-900 border border-rose-200 rounded-lg flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-200/60 rounded text-rose-800 mr-1.5">EPISODE</span>
                        <span className="font-semibold truncate">{e.media?.title} - {e.title}</span>
                      </div>
                      <span className="text-[10px] text-rose-500 shrink-0">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}

                  {quarantineItems?.failedJobs?.map((j: any) => (
                    <div key={j.id} className="p-2.5 bg-amber-50/80 text-amber-900 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200/60 rounded text-amber-800 mr-1.5">JOB</span>
                        <span className="font-semibold truncate">#{j.id.slice(0, 10)}...</span>
                      </div>
                      <span className="text-[10px] text-amber-600 shrink-0">
                        {new Date(j.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* ── Purge Confirmation Modal ── */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Confirm Quarantine Purge</h3>
                <p className="text-xs text-slate-500 mt-0.5">Threshold: older than {quarantineHours} hours</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will mark <strong className="text-slate-900">{totalQuarantineCount}</strong> orphaned media record(s) as quarantined/failed and clean up associated transcode queue tasks.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowPurgeModal(false)}
                disabled={cleaning}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={runCleanup}
                disabled={cleaning}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Trash2 size={13} className={cleaning ? "animate-spin" : ""} />
                {cleaning ? "Quarantining..." : "Confirm Purge"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
