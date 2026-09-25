"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Plus, Search, HardDrive, Layers, Clock, AlertCircle,
  FileVideo, Activity, Box, Filter, ArrowUpDown, Film, Tv,
  Eye, Check, Copy, RefreshCw, LayoutGrid, List, Star,
  ShieldCheck, Tag, ExternalLink, Trash2, Edit2, Play,
  CheckCircle2, X, Sparkles, SlidersHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import UploadManager from "@/components/UploadManager";

interface Episode {
  id?: string;
  title: string;
  description: string;
  seasonNumber: number;
  episodeNumber: number;
  url: string;
  duration: number;
  thumbnail: string;
}

interface MediaData {
  id: string;
  type: 'MOVIE' | 'SERIES';
  title: string;
  description?: string;
  url?: string;
  posterUrl?: string;
  backdropUrl?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  duration?: number;
  genre?: string[];
  cast?: string[];
  director?: string;
  releaseYear?: number;
  language?: string;
  languages?: string[];
  rating?: number;
  contentRating?: string;
  maturityRating?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isActive?: boolean;
  episodes?: Episode[];
  createdAt?: string;
}

export default function UnifiedContentPage() {
  const { showToast } = useToast();
  const router = useRouter();
  
  const [content, setContent] = useState<MediaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [genreFilter, setGenreFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'RATING' | 'YEAR' | 'TITLE'>('NEWEST');
  
  // View mode: Grid vs Table
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [showUpload, setShowUpload] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchContent = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/admin/videos`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setContent(data.data);
        if (isManualRefresh) showToast("Content repository refreshed successfully", "success");
      }
    } catch (err) {
      showToast("Failed to retrieve library data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast("Media UUID copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract all unique genres for filter dropdown
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    content.forEach(item => {
      const gArr = Array.isArray(item.genre) ? item.genre : (item.genre ? [item.genre] : []);
      gArr.forEach(g => {
        if (typeof g === 'string' && g.trim()) set.add(g.trim());
      });
    });
    return Array.from(set).sort();
  }, [content]);

  // Telemetry KPIs
  const metrics = useMemo(() => {
    const total = content.length;
    const movies = content.filter(c => c.type === 'MOVIE').length;
    const series = content.filter(c => c.type === 'SERIES').length;
    const active = content.filter(c => c.isActive !== false).length;
    const totalEpisodes = content.reduce((acc, c) => acc + (c.episodes?.length || 0), 0);
    const featured = content.filter(c => c.isFeatured).length;
    const trending = content.filter(c => c.isTrending).length;

    return {
      total,
      movies,
      series,
      active,
      inactive: total - active,
      totalEpisodes,
      featured,
      trending
    };
  }, [content]);

  // Filtered and Sorted Content
  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.title?.toLowerCase().includes(q) || 
        item.id?.toLowerCase().includes(q) ||
        item.director?.toLowerCase().includes(q) ||
        (item.releaseYear && item.releaseYear.toString().includes(q));

      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' ? item.isActive !== false : item.isActive === false);

      const gArr = Array.isArray(item.genre) ? item.genre : (item.genre ? [item.genre] : []);
      const matchesGenre = genreFilter === 'ALL' || 
        gArr.some(g => typeof g === 'string' && g.toLowerCase() === genreFilter.toLowerCase());

      return matchesSearch && matchesType && matchesStatus && matchesGenre;
    }).sort((a, b) => {
      if (sortBy === 'RATING') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'YEAR') return (b.releaseYear || 0) - (a.releaseYear || 0);
      if (sortBy === 'TITLE') return (a.title || '').localeCompare(b.title || '');
      // Default: NEWEST
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [content, searchQuery, typeFilter, statusFilter, genreFilter, sortBy]);

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "ALL" || statusFilter !== "ALL" || genreFilter !== "ALL" || sortBy !== "NEWEST";

  const clearAllFilters = () => {
    setSearchQuery("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setGenreFilter("ALL");
    setSortBy("NEWEST");
  };

  if (showUpload) {
    return (
      <UploadManager 
        onComplete={() => { setShowUpload(false); fetchContent(); }} 
        onClose={() => setShowUpload(false)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4 text-slate-800">
        <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest text-slate-500 uppercase font-semibold">
          Synchronizing Media Infrastructure...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans text-sm flex flex-col antialiased">
      
      {/* Top Application Header */}
      <header className="h-16 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Film size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Content Library & Asset Infrastructure</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {metrics.total} ASSETS INDEXED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Endpoint: <span className="text-slate-700 font-semibold">/admin/videos</span> • Target: <span className="text-blue-600 font-semibold">Catalog Master Storage</span>
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => fetchContent(true)}
            disabled={refreshing}
            className="h-9 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Refresh repository assets"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          {/* Primary Ingest Media CTA */}
          <button 
            onClick={() => setShowUpload(true)}
            className="h-9 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> 
            <span>Ingest Media Asset</span>
          </button>
        </div>
      </header>

      {/* Executive Telemetry & Capacity Scorecards */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 shadow-2xs">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Total Assets */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <HardDrive size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Total Master Inventory</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-bold text-slate-900">{metrics.total}</span>
                <span className="text-xs text-slate-500 font-mono">records</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-mono font-medium">
                {metrics.active} active • {metrics.inactive} inactive
              </span>
            </div>
          </div>

          {/* Card 2: Feature Movies */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Film size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Feature Films</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{metrics.movies} Movies</p>
              <span className="text-[10px] text-indigo-600 font-mono font-medium">
                {metrics.total ? Math.round((metrics.movies / metrics.total) * 100) : 0}% of catalog
              </span>
            </div>
          </div>

          {/* Card 3: Television Series */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Tv size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Episodic Series</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{metrics.series} Shows</p>
              <span className="text-[10px] text-purple-600 font-mono font-medium">
                {metrics.totalEpisodes} total episodes indexed
              </span>
            </div>
          </div>

          {/* Card 4: Curated Spotlights */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Curated Visibility</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{metrics.featured + metrics.trending} Promoted</p>
              <span className="text-[10px] text-amber-600 font-mono font-medium">
                {metrics.featured} featured • {metrics.trending} trending
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Multi-Dimension Command & Filter Bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-3 shrink-0 shadow-2xs">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Search input & Type pills */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search title, UUID, director, year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
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

            {/* Type Segmented Controller */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              {(['ALL', 'MOVIE', 'SERIES'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    typeFilter === t 
                      ? 'bg-white text-slate-900 shadow-xs font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t === 'MOVIE' ? 'Movies' : 'Series'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Genre Filter */}
            {allGenres.length > 0 && (
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer max-w-[160px]"
              >
                <option value="ALL">All Genres</option>
                {allGenres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="h-9 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 flex items-center gap-1 cursor-pointer"
              >
                <X size={13} /> Reset
              </button>
            )}
          </div>

          {/* Right: Sort & View Mode Switcher */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
              >
                <option value="NEWEST">Newest Ingested</option>
                <option value="RATING">Highest Rated (★)</option>
                <option value="YEAR">Release Year</option>
                <option value="TITLE">Title (A-Z)</option>
              </select>
            </div>

            {/* View Mode Switcher: Grid vs Table */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'GRID' 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Visual Card Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TABLE' 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Detailed Inventory Table View"
              >
                <List size={15} />
              </button>
            </div>

            <div className="text-xs font-mono text-slate-500 pl-1">
              <span className="font-bold text-slate-800">{filteredContent.length}</span> items
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
          
          {filteredContent.length === 0 ? (
            /* Zero-Results State */
            <div className="mt-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white py-20 p-6 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                <Box size={26} />
              </div>
              <h3 className="text-base font-bold text-slate-900">No media assets found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                {hasActiveFilters 
                  ? "No titles matched your selected search criteria or genre filters." 
                  : "Your media repository is currently empty. Click 'Ingest Media Asset' to add movies and series."}
              </p>
              {hasActiveFilters ? (
                <button 
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs border border-blue-200 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <button 
                  onClick={() => setShowUpload(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus size={14} className="inline mr-1" /> Ingest First Media Asset
                </button>
              )}
            </div>
          ) : viewMode === 'GRID' ? (
            /* Visual Poster Card Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredContent.map((item) => {
                const isItemCopied = copiedId === item.id;
                const gArr = Array.isArray(item.genre) ? item.genre : (item.genre ? [item.genre] : []);

                return (
                  <div 
                    key={item.id} 
                    onClick={() => router.push(`/content/${item.id}`)}
                    className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    {/* Poster Cover Aspect Box */}
                    <div className="aspect-[2/3] w-full bg-slate-100 relative overflow-hidden">
                      {item.posterUrl || item.thumbnailUrl || item.thumbnail ? (
                        <img 
                          src={item.posterUrl || item.thumbnailUrl || item.thumbnail} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          loading="lazy" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50">
                          <FileVideo size={28} className="text-slate-300" />
                          <span className="text-[10px] font-mono text-slate-400">NO_POSTER</span>
                        </div>
                      )}

                      {/* Top Badges Overlay */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-lg backdrop-blur-md shadow-xs ${
                          item.type === 'MOVIE' 
                            ? 'bg-blue-600/90 text-white border border-blue-400/30' 
                            : 'bg-purple-600/90 text-white border border-purple-400/30'
                        }`}>
                          {item.type}
                        </span>

                        {/* Operational Status Dot */}
                        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                          <div className={`w-1.5 h-1.5 rounded-full ${item.isActive !== false ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="text-[9px] font-mono text-white font-bold">
                            {item.isActive !== false ? 'ACTIVE' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Floating Rating & Year */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                        {item.rating !== undefined && item.rating > 0 ? (
                          <div className="bg-black/80 backdrop-blur-md text-amber-400 font-bold px-2 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
                            <Star size={10} className="fill-amber-400" />
                            <span>{item.rating.toFixed(1)}</span>
                          </div>
                        ) : <div />}

                        {item.releaseYear && (
                          <div className="bg-black/80 backdrop-blur-md text-slate-200 font-bold px-2 py-0.5 rounded-lg border border-white/15">
                            {item.releaseYear}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Body Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={item.title}>
                          {item.title}
                        </h4>
                        
                        {/* UUID with Copy Icon */}
                        <div 
                          onClick={(e) => handleCopyId(e, item.id)}
                          className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-700 mt-1 cursor-pointer select-none group/uuid"
                          title="Click to copy UUID"
                        >
                          <span className="truncate max-w-[130px]">{item.id}</span>
                          {isItemCopied ? (
                            <Check size={11} className="text-emerald-500 shrink-0" />
                          ) : (
                            <Copy size={11} className="opacity-0 group-hover/uuid:opacity-100 transition-opacity shrink-0" />
                          )}
                        </div>

                        {/* Episodes or Duration spec */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                          {item.type === 'SERIES' ? (
                            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                              {item.episodes?.length || 0} Episodes
                            </span>
                          ) : item.duration ? (
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                              <Clock size={11} /> {Math.round(item.duration / 60)} mins
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">Master Video</span>
                          )}
                        </div>

                        {/* Genre Chips */}
                        {gArr.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {gArr.slice(0, 2).map((g, i) => (
                              <span key={i} className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {g}
                              </span>
                            ))}
                            {gArr.length > 2 && (
                              <span className="text-[9px] font-mono text-slate-400">+{gArr.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {item.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              Featured
                            </span>
                          )}
                          {item.isTrending && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                              Trending
                            </span>
                          )}
                        </div>

                        <span className="text-blue-600 font-bold text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Manage <ExternalLink size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Detailed Inventory Table View */
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3.5 px-6">Asset & ID</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Rating & Year</th>
                      <th className="py-3.5 px-4">Specs</th>
                      <th className="py-3.5 px-4">Genres</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredContent.map((item) => {
                      const isItemCopied = copiedId === item.id;
                      const gArr = Array.isArray(item.genre) ? item.genre : (item.genre ? [item.genre] : []);

                      return (
                        <tr 
                          key={item.id}
                          onClick={() => router.push(`/content/${item.id}`)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Asset & ID */}
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                {item.posterUrl || item.thumbnailUrl || item.thumbnail ? (
                                  <img 
                                    src={item.posterUrl || item.thumbnailUrl || item.thumbnail} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                    loading="lazy" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <FileVideo size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors" title={item.title}>
                                  {item.title}
                                </h4>
                                <div 
                                  onClick={(e) => handleCopyId(e, item.id)}
                                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-700 mt-0.5 cursor-pointer select-none group/uuid"
                                  title="Click to copy UUID"
                                >
                                  <span className="truncate max-w-[140px]">{item.id}</span>
                                  {isItemCopied ? (
                                    <Check size={10} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <Copy size={10} className="opacity-0 group-hover/uuid:opacity-100 transition-opacity shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                              item.type === 'MOVIE' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {item.type}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${item.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="text-xs font-medium text-slate-700">
                                {item.isActive !== false ? 'Active' : 'Offline'}
                              </span>
                            </div>
                          </td>

                          {/* Rating & Year */}
                          <td className="py-3 px-4 font-mono text-xs">
                            <div className="flex items-center gap-2">
                              {item.rating !== undefined && item.rating > 0 ? (
                                <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                  ★ {item.rating.toFixed(1)}
                                </span>
                              ) : <span className="text-slate-400">—</span>}
                              {item.releaseYear && (
                                <span className="text-slate-400">({item.releaseYear})</span>
                              )}
                            </div>
                          </td>

                          {/* Specs */}
                          <td className="py-3 px-4 text-xs font-mono">
                            {item.type === 'SERIES' ? (
                              <span className="text-purple-700 font-semibold">
                                {item.episodes?.length || 0} Episodes
                              </span>
                            ) : item.duration ? (
                              <span className="text-slate-600">
                                {Math.round(item.duration / 60)} mins
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Genres */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {gArr.slice(0, 2).map((g, i) => (
                                <span key={i} className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {g}
                                </span>
                              ))}
                              {gArr.length > 2 && (
                                <span className="text-[9px] font-mono text-slate-400">+{gArr.length - 2}</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/content/${item.id}`);
                              }}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 hover:border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Manage</span>
                              <ExternalLink size={11} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
