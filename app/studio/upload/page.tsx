"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import UploadManager from "@/components/UploadManager";
import { useToast } from "@/components/toast-provider";
import {
  UploadCloud, FileEdit, ArrowLeft, Activity, Database, Sparkles,
  Radio, Layers, RefreshCw, Play, CheckCircle2, AlertTriangle,
  Clock, Film, Tv, Search, SlidersHorizontal, ExternalLink,
  ShieldCheck, ChevronRight, Plus, Eye, Check, XCircle
} from "lucide-react";

type TabKey = "studio" | "pipelines" | "manifest";

function IngestionCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const id = searchParams.get("id");
  const tabParam = searchParams.get("tab") as TabKey | null;

  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || "studio");
  const [initialData, setInitialData] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Active Pipelines State
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [autoRefreshPipelines, setAutoRefreshPipelines] = useState(true);

  // Production Manifest State
  const [manifest, setManifest] = useState<any[]>([]);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [manifestSearch, setManifestSearch] = useState("");
  const [manifestStatusFilter, setManifestStatusFilter] = useState("ALL");
  const [manifestTypeFilter, setManifestTypeFilter] = useState("ALL");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined"
      ? (localStorage.getItem("admin_token") || localStorage.getItem("token") || "")
      : "";
    const adminKey = typeof window !== "undefined"
      ? (localStorage.getItem("admin_api_key") || process.env.NEXT_PUBLIC_ADMIN_API_KEY || "kuber_admin_secret_key_2026")
      : "kuber_admin_secret_key_2026";
    return {
      "Content-Type": "application/json",
      "x-admin-api-key": adminKey,
      "x-admin-key": adminKey,
      "X-Admin-API-Key": adminKey,
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  // Sync tab from URL if changed
  useEffect(() => {
    if (tabParam && ["studio", "pipelines", "manifest"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch initial entity data if editing
  useEffect(() => {
    if (id) {
      fetchInitialData(id);
      setActiveTab("studio");
    } else {
      setInitialData(null);
    }
  }, [id]);

  const fetchInitialData = async (entityId: string) => {
    setLoadingInitial(true);
    try {
      // Try admin endpoint first
      let res = await fetch(`${apiUrl}/admin/videos/${entityId}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        // Fallback to public endpoint
        res = await fetch(`${apiUrl}/videos/${entityId}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setInitialData(json.data);
      } else if (json.id || json.title) {
        setInitialData(json);
      } else {
        showToast("Entity record not found in database.", "error");
      }
    } catch (err) {
      showToast("Failed to retrieve entity payload.", "error");
    } finally {
      setLoadingInitial(false);
    }
  };

  // Fetch Active Pipelines
  const fetchPipelines = useCallback(async () => {
    setLoadingPipelines(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos/ingestion-sessions`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setPipelines(items);
      }
    } catch (err) {
      console.warn("Failed to fetch ingestion pipelines:", err);
    } finally {
      setLoadingPipelines(false);
    }
  }, [apiUrl]);

  // Fetch Production Manifest
  const fetchManifest = useCallback(async () => {
    setLoadingManifest(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setManifest(items);
      }
    } catch (err) {
      console.warn("Failed to fetch manifest catalog:", err);
    } finally {
      setLoadingManifest(false);
    }
  }, [apiUrl]);

  // Handle Tab Switch
  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "pipelines") fetchPipelines();
    if (tab === "manifest") fetchManifest();
  };

  // Auto-refresh pipelines every 5s when active
  useEffect(() => {
    if (activeTab === "pipelines" && autoRefreshPipelines) {
      fetchPipelines();
      const interval = setInterval(fetchPipelines, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, autoRefreshPipelines, fetchPipelines]);

  // Fetch initial tab data on mount
  useEffect(() => {
    if (activeTab === "pipelines") fetchPipelines();
    if (activeTab === "manifest") fetchManifest();
  }, [activeTab, fetchPipelines, fetchManifest]);

  // Filtered Manifest items
  const filteredManifest = manifest.filter(item => {
    const matchesSearch = !manifestSearch ||
      item.title?.toLowerCase().includes(manifestSearch.toLowerCase()) ||
      (Array.isArray(item.genre) && item.genre.some((g: string) => g.toLowerCase().includes(manifestSearch.toLowerCase())));
    const matchesStatus = manifestStatusFilter === "ALL" || item.processingStatus === manifestStatusFilter;
    const matchesType = manifestTypeFilter === "ALL" || (item.type || (item.isSeries ? "SERIES" : "MOVIE")) === manifestTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-[#f8fafc]">
      {/* Executive Command Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1700px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left Title & Status */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/content")}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Return to Catalog Library"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-5 w-px bg-slate-200"></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  Ingestion Command Center
                </h1>
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  v2.5 Pro Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Multi-pass S3 Transcoding Pipeline & Ingestion Orchestration
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => switchTab("studio")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "studio"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles size={14} />
              Ingestion Studio
              {id && (
                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold">
                  Editing
                </span>
              )}
            </button>

            <button
              onClick={() => switchTab("pipelines")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "pipelines"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Radio size={14} className={pipelines.length > 0 ? "text-amber-500 animate-pulse" : ""} />
              Active Pipelines
              {pipelines.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                  {pipelines.length}
                </span>
              )}
            </button>

            <button
              onClick={() => switchTab("manifest")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "manifest"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers size={14} />
              Production Manifest
              {manifest.length > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                  {manifest.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Action Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/processing")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Activity size={13} className="text-indigo-600" />
              Processing Queue
              <ExternalLink size={11} className="text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/content")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Database size={13} className="text-slate-500" />
              Catalog Library
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6">
        <div className="max-w-[1700px] mx-auto">
          {/* TAB 1: INGESTION STUDIO */}
          {activeTab === "studio" && (
            <div>
              {/* Edit Mode Notice Banner */}
              {id && (
                <div className="mb-4 bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg">
                      <FileEdit size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-950">
                        Configuring Existing Entity: {initialData?.title || `ID #${id}`}
                      </p>
                      <p className="text-[11px] text-indigo-700 font-mono">
                        Modifications will update existing master record without re-transcoding unchanged video streams.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      router.push("/studio/upload");
                      setInitialData(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={13} />
                    Switch to New Ingestion
                  </button>
                </div>
              )}

              {loadingInitial ? (
                <div className="min-h-[500px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
                  <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-600">Retrieving entity specifications...</p>
                </div>
              ) : (
                <UploadManager
                  initialData={initialData}
                  onClose={() => router.push("/content")}
                  onComplete={() => {
                    showToast("Ingestion specifications successfully registered!", "success");
                    switchTab("pipelines");
                  }}
                />
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE PIPELINES */}
          {activeTab === "pipelines" && (
            <div className="space-y-4">
              {/* Pipeline Controls Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-indigo-600" />
                    Live Transcoding & Ingestion Pipelines
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time monitoring of media being uploaded, packaged, or transcoded to HLS/DASH.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRefreshPipelines}
                      onChange={(e) => setAutoRefreshPipelines(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    Auto-refresh (5s)
                  </label>

                  <button
                    onClick={fetchPipelines}
                    disabled={loadingPipelines}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <RefreshCw size={13} className={loadingPipelines ? "animate-spin text-indigo-600" : ""} />
                    Refresh Now
                  </button>

                  <button
                    onClick={() => switchTab("studio")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <Plus size={14} />
                    Start Ingestion
                  </button>
                </div>
              </div>

              {/* Pipeline List */}
              {loadingPipelines && pipelines.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Activity className="w-6 h-6 text-indigo-600 animate-pulse mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-mono">Querying active ingestion pipelines...</p>
                </div>
              ) : pipelines.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">All Pipelines Idle</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    There are currently no media titles undergoing ingestion or transcoding. The queue is clear.
                  </p>
                  <button
                    onClick={() => switchTab("studio")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <UploadCloud size={14} />
                    Ingest New Media Title
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pipelines.map((pipe) => {
                    const isProcessing = pipe.processingStatus === "PROCESSING";
                    const isQueued = pipe.processingStatus === "QUEUED";
                    const isUploading = pipe.processingStatus === "UPLOADING";

                    return (
                      <div
                        key={pipe.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                                {pipe.isSeries || pipe.type === "SERIES" ? <Tv size={16} /> : <Film size={16} />}
                              </div>
                              <div className="truncate">
                                <h3 className="text-xs font-bold text-slate-900 truncate">
                                  {pipe.title || "Untitled Payload"}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono truncate">
                                  ID: {pipe.id}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                isProcessing
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : isQueued
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {pipe.processingStatus}
                            </span>
                          </div>

                          {/* Progress Meter */}
                          <div className="mt-3 mb-4 space-y-1.5">
                            <div className="flex justify-between text-[11px] font-mono text-slate-600">
                              <span>Ingestion Progress</span>
                              <span className="font-bold text-slate-900">
                                {pipe.progress !== undefined ? `${pipe.progress}%` : isProcessing ? "In Progress" : "Queued"}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isProcessing
                                    ? "bg-indigo-600 animate-pulse"
                                    : isQueued
                                    ? "bg-amber-500"
                                    : "bg-blue-600"
                                }`}
                                style={{ width: `${pipe.progress || (isProcessing ? 65 : isQueued ? 20 : 40)}%` }}
                              />
                            </div>
                          </div>

                          {/* Metadata specs */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Created</span>
                              <span className="font-mono text-slate-700">
                                {pipe.createdAt ? new Date(pipe.createdAt).toLocaleTimeString() : "Recent"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Audio/Subs</span>
                              <span className="font-medium text-slate-700">
                                {pipe.audioTracks?.length || 0} tracks / {pipe.subtitleTracks?.length || 0} subs
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pipeline Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => router.push("/processing")}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Activity size={12} className="text-indigo-600" />
                            Diagnostics
                          </button>
                          <button
                            onClick={() => {
                              router.push(`/studio/upload?id=${pipe.id}`);
                              setActiveTab("studio");
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors border border-indigo-200"
                          >
                            <FileEdit size={12} />
                            Inspect Studio
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCTION MANIFEST */}
          {activeTab === "manifest" && (
            <div className="space-y-4">
              {/* Manifest Header Controls */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative min-w-[260px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search title, genre..."
                      value={manifestSearch}
                      onChange={(e) => setManifestSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={manifestStatusFilter}
                    onChange={(e) => setManifestStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="READY">Ready for Streaming</option>
                    <option value="PROCESSING">Transcoding</option>
                    <option value="QUEUED">Queued</option>
                    <option value="FAILED">Failed</option>
                  </select>

                  {/* Type Filter */}
                  <select
                    value={manifestTypeFilter}
                    onChange={(e) => setManifestTypeFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Formats</option>
                    <option value="MOVIE">Feature Film</option>
                    <option value="SERIES">Episodic Series</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">
                    Showing {filteredManifest.length} of {manifest.length} records
                  </span>
                  <button
                    onClick={fetchManifest}
                    disabled={loadingManifest}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <RefreshCw size={13} className={loadingManifest ? "animate-spin text-indigo-600" : ""} />
                    Refresh
                  </button>
                  <button
                    onClick={() => switchTab("studio")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <Plus size={14} />
                    New Title
                  </button>
                </div>
              </div>

              {/* Catalog Manifest Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Entity</th>
                        <th className="py-3 px-4">Format</th>
                        <th className="py-3 px-4">Rating & Year</th>
                        <th className="py-3 px-4">Tracks</th>
                        <th className="py-3 px-4">Pipeline Status</th>
                        <th className="py-3 px-4 text-right">Studio Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                      {filteredManifest.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No titles found matching current search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredManifest.map((item) => {
                          const isReady = item.processingStatus === "READY";
                          const isFailed = item.processingStatus === "FAILED";

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* Entity Info */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-14 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                                    {item.thumbnailUrl || item.posterUrl ? (
                                      <img
                                        src={item.thumbnailUrl || item.posterUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Film size={18} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 block text-xs">
                                      {item.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {item.id}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Format */}
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                                  {item.isSeries || item.type === "SERIES" ? (
                                    <>
                                      <Tv size={12} className="text-purple-600" />
                                      Series
                                    </>
                                  ) : (
                                    <>
                                      <Film size={12} className="text-blue-600" />
                                      Movie
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* Rating & Year */}
                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  <span className="inline-block px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold rounded">
                                    {item.maturityRating || "All"}
                                  </span>
                                  <span className="text-slate-500 text-[11px] block">
                                    {item.releaseYear || "N/A"}
                                  </span>
                                </div>
                              </td>

                              {/* Tracks */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-600">
                                    {item.audioTracks?.length || 0} Audio
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] text-slate-600">
                                    {item.subtitleTracks?.length || 0} Subs
                                  </span>
                                </div>
                              </td>

                              {/* Pipeline Status */}
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isReady
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : isFailed
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {isReady && <CheckCircle2 size={11} />}
                                  {isFailed && <XCircle size={11} />}
                                  {!isReady && !isFailed && <Activity size={11} className="animate-spin" />}
                                  {item.processingStatus}
                                </span>
                              </td>

                              {/* Studio Action */}
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      router.push(`/studio/upload?id=${item.id}`);
                                      setActiveTab("studio");
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors border border-indigo-200"
                                    title="Open and edit in Ingestion Studio"
                                  >
                                    <FileEdit size={12} />
                                    Edit Studio
                                  </button>
                                  <button
                                    onClick={() => router.push("/processing")}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View diagnostics in Processing Queue"
                                  >
                                    <Activity size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const PageLoader = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 bg-[#f8fafc]">
    <Database className="w-5 h-5 text-indigo-600 animate-pulse" />
    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
      Initializing Ingestion Command Center...
    </p>
  </div>
);

export default function StudioUploadPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <IngestionCenterContent />
    </Suspense>
  );
}
