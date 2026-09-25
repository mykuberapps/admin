'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, Save, CheckCircle2, AlertCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Plus, Trash2, Search,
  X, Film, Tv, Play, Eye, TrendingUp, Sparkles,
  Activity, Settings, Database, GripVertical, Image as ImageIcon,
  Smartphone, Code, RefreshCw, RotateCcw, Copy, Check,
  Layers, Sliders, ArrowLeft, ArrowRight, Star, Flame,
  CheckSquare, Square, ExternalLink, ShieldCheck, Tag
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const DEFAULT_CATEGORIES = [
  "Education", "Action", "Comedy", "Thriller", 
  "Drama", "Horror", "Romance", "Tech", 
  "Islamic", "Gaming", "Kids", "Sports"
];

interface VideoItem {
  id: string;
  type: 'MOVIE' | 'SERIES';
  title: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  releaseYear?: number;
  rating?: number;
  contentRating?: string;
  maturityRating?: string;
  category?: string;
  episodes?: any[];
}

interface HomeConfig {
  id?: string;
  featuredMediaId: string | null;
  trendingMediaIds: string[];
  newReleaseMediaIds: string[];
  topMovieMediaIds: string[];
  topSeriesMediaIds: string[];
  enabledCategories: string[];
  updatedAt?: string;
}

export default function LayoutOrchestratorPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [config, setConfig] = useState<HomeConfig>({
    featuredMediaId: null,
    trendingMediaIds: [],
    newReleaseMediaIds: [],
    topMovieMediaIds: [],
    topSeriesMediaIds: [],
    enabledCategories: DEFAULT_CATEGORIES
  });
  const [initialConfig, setInitialConfig] = useState<HomeConfig | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // View toggles
  const [viewMode, setViewMode] = useState<'VISUAL' | 'JSON'>('VISUAL');
  const [showSimulator, setShowSimulator] = useState(true);
  const [simulatorDevice, setSimulatorDevice] = useState<'iOS' | 'Android'>('iOS');
  const [copiedJson, setCopiedJson] = useState(false);

  // Modal Picker state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'FEATURED' | 'TRENDING' | 'NEW_RELEASE' | 'TOP_MOVIES' | 'TOP_SERIES'>('FEATURED');
  const [modalSelectedIds, setModalSelectedIds] = useState<string[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilterType, setModalFilterType] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([
        fetch(`${API_URL}/admin/videos`),
        fetch(`${API_URL}/admin/home-config`)
      ]);
      const vData = await vRes.json();
      const cData = await cRes.json();

      const fetchedVideos: VideoItem[] = vData.data || [];
      setVideos(fetchedVideos);

      if (cData.data) {
        const loadedConfig: HomeConfig = {
          featuredMediaId: cData.data.featuredMediaId || null,
          trendingMediaIds: Array.isArray(cData.data.trendingMediaIds) ? cData.data.trendingMediaIds : [],
          newReleaseMediaIds: Array.isArray(cData.data.newReleaseMediaIds) ? cData.data.newReleaseMediaIds : [],
          topMovieMediaIds: Array.isArray(cData.data.topMovieMediaIds) ? cData.data.topMovieMediaIds : [],
          topSeriesMediaIds: Array.isArray(cData.data.topSeriesMediaIds) ? cData.data.topSeriesMediaIds : [],
          enabledCategories: Array.isArray(cData.data.enabledCategories) && cData.data.enabledCategories.length > 0 
            ? cData.data.enabledCategories 
            : DEFAULT_CATEGORIES,
          updatedAt: cData.data.updatedAt
        };
        setConfig(loadedConfig);
        setInitialConfig(loadedConfig);
      }
    } catch (err) {
      console.error('Failed to load orchestrator data', err);
      setMessage({ type: 'error', text: 'Failed to establish synchronization with the backend API.' });
    } finally {
      setLoading(false);
    }
  };

  const isDirty = useMemo(() => {
    if (!initialConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        featuredMediaId: config.featuredMediaId || null,
        trendingMediaIds: config.trendingMediaIds || [],
        newReleaseMediaIds: config.newReleaseMediaIds || [],
        topMovieMediaIds: config.topMovieMediaIds || [],
        topSeriesMediaIds: config.topSeriesMediaIds || [],
        enabledCategories: config.enabledCategories || []
      };

      const res = await fetch(`${API_URL}/admin/home-config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-API-Key': 'kuber_admin_secret_key_2026'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setInitialConfig({ ...config, updatedAt: new Date().toISOString() });
        setMessage({ 
          type: 'success', 
          text: 'Mobile Fleet Layout updated and published successfully across all devices.' 
        });
        setTimeout(() => setMessage(null), 5000);
      } else {
        throw new Error(data.message || 'Synchronization rejected');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to deploy layout to production.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    if (!initialConfig) return;
    if (confirm('Revert all unsaved changes to the last deployed configuration?')) {
      setConfig(initialConfig);
      setMessage({ type: 'success', text: 'Reverted to last deployed configuration.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Reordering helpers
  const moveItem = (railKey: keyof HomeConfig, fromIndex: number, direction: -1 | 1) => {
    const list = [...((config[railKey] as string[]) || [])];
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= list.length) return;
    const temp = list[fromIndex];
    list[fromIndex] = list[toIndex];
    list[toIndex] = temp;
    setConfig({ ...config, [railKey]: list });
  };

  const removeItem = (railKey: keyof HomeConfig, id: string) => {
    const list = ((config[railKey] as string[]) || []).filter((item) => item !== id);
    setConfig({ ...config, [railKey]: list });
  };

  const clearRail = (railKey: keyof HomeConfig, title: string) => {
    if (confirm(`Clear all curated titles from "${title}"? The mobile app will fallback to automatic catalog ranking.`)) {
      setConfig({ ...config, [railKey]: [] });
    }
  };

  const toggleCategory = (cat: string) => {
    const current = config.enabledCategories || [];
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    setConfig({ ...config, enabledCategories: updated });
  };

  const toggleAllCategories = (enable: boolean) => {
    setConfig({
      ...config,
      enabledCategories: enable ? [...DEFAULT_CATEGORIES] : []
    });
  };

  // Open Modal with pre-selected items
  const openModalForRail = (mode: 'FEATURED' | 'TRENDING' | 'NEW_RELEASE' | 'TOP_MOVIES' | 'TOP_SERIES') => {
    setModalMode(mode);
    setModalSearch('');
    setModalFilterType('ALL');

    if (mode === 'FEATURED') {
      setModalSelectedIds(config.featuredMediaId ? [config.featuredMediaId] : []);
    } else {
      const railKey = 
        mode === 'TRENDING' ? 'trendingMediaIds' :
        mode === 'NEW_RELEASE' ? 'newReleaseMediaIds' :
        mode === 'TOP_MOVIES' ? 'topMovieMediaIds' : 'topSeriesMediaIds';
      setModalSelectedIds([...(config[railKey] as string[])]);
    }
    setIsModalOpen(true);
  };

  // Confirm Modal Selection
  const applyModalSelection = () => {
    if (modalMode === 'FEATURED') {
      setConfig({
        ...config,
        featuredMediaId: modalSelectedIds[0] || null
      });
    } else {
      const railKey = 
        modalMode === 'TRENDING' ? 'trendingMediaIds' :
        modalMode === 'NEW_RELEASE' ? 'newReleaseMediaIds' :
        modalMode === 'TOP_MOVIES' ? 'topMovieMediaIds' : 'topSeriesMediaIds';
      setConfig({
        ...config,
        [railKey]: modalSelectedIds
      });
    }
    setIsModalOpen(false);
  };

  // Filter videos for entity picker
  const filteredModalVideos = useMemo(() => {
    return videos.filter((v) => {
      const q = modalSearch.toLowerCase().trim();
      const matchesSearch = !q || v.title.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
      const matchesType = modalFilterType === 'ALL' || v.type === modalFilterType;
      return matchesSearch && matchesType;
    });
  }, [videos, modalSearch, modalFilterType]);

  // Featured video object
  const featuredVideo = useMemo(() => {
    return videos.find((v) => v.id === config.featuredMediaId) || null;
  }, [videos, config.featuredMediaId]);

  // Curated statistics
  const stats = useMemo(() => {
    const allAssigned = new Set([
      ...(config.featuredMediaId ? [config.featuredMediaId] : []),
      ...config.trendingMediaIds,
      ...config.newReleaseMediaIds,
      ...config.topMovieMediaIds,
      ...config.topSeriesMediaIds,
    ]);

    return {
      totalCuratedTitles: allAssigned.size,
      totalCatalogVideos: videos.length,
      activeRailsCount: 4,
      enabledCategoriesCount: config.enabledCategories.length,
      heroStatus: config.featuredMediaId ? 'ENGAGED' : 'UNASSIGNED (Auto-Fallback)'
    };
  }, [config, videos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest text-slate-500 uppercase font-semibold">Synchronizing Fleet Layout Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans text-sm flex flex-col antialiased">
      
      {/* Embedded CSS for 100% hidden scrollbars in phone simulator & carousels */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />

      {/* Top Application Navigation Bar */}
      <header className="h-16 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Layout size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Layout Orchestrator & Live Mobile Engine</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                FLEET_LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Singleton ID: <span className="text-slate-700 font-semibold">singleton</span> • Target: <span className="text-blue-600 font-semibold">/videos/home</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Visual / JSON toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setViewMode('VISUAL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'VISUAL' 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layout size={13} /> Visual Canvas
            </button>
            <button
              onClick={() => setViewMode('JSON')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'JSON' 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code size={13} /> JSON Blueprint
            </button>
          </div>

          {/* Device Simulator Toggle */}
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`h-9 px-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
              showSimulator 
                ? 'bg-blue-50/80 border-blue-200 text-blue-700 font-semibold shadow-xs' 
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Toggle Live Client Preview Panel"
          >
            <Smartphone size={14} />
            <span>Simulator {showSimulator ? 'On' : 'Off'}</span>
          </button>

          {/* Revert button if dirty */}
          {isDirty && (
            <button
              onClick={handleRevert}
              className="h-9 px-3 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Discard unsaved changes"
            >
              <RotateCcw size={13} /> Discard
            </button>
          )}

          {/* Primary Deploy CTA */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin text-white" />
            ) : (
              <Save size={14} />
            )}
            <span>{saving ? 'Publishing Fleet Layout...' : 'Deploy to Production'}</span>
          </button>
        </div>
      </header>

      {/* Message / Toast Notification */}
      {message && (
        <div className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium border-b transition-all animate-in fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 max-w-[1600px] mx-auto w-full">
            {message.type === 'success' ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> : <AlertCircle size={15} className="text-rose-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Executive Status & Fleet Capacity Scorecards */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 shadow-2xs">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Hero Spotlight */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Hero Spotlight</span>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5" title={featuredVideo?.title || 'Auto-Fallback'}>
                {featuredVideo ? featuredVideo.title : 'Algorithmic Fallback'}
              </p>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5 ${featuredVideo ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200' : 'text-amber-700 bg-amber-100/80 border border-amber-200'}`}>
                {featuredVideo ? 'ACTIVE_CURATED' : 'AUTO_RATING'}
              </span>
            </div>
          </div>

          {/* Card 2: Curated Titles Coverage */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Curated Titles</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-bold text-slate-900">{stats.totalCuratedTitles}</span>
                <span className="text-xs text-slate-500 font-mono">/ {stats.totalCatalogVideos} catalog</span>
              </div>
              <span className="text-[10px] text-blue-600 font-mono font-medium">
                {stats.totalCatalogVideos ? Math.round((stats.totalCuratedTitles / stats.totalCatalogVideos) * 100) : 0}% library coverage
              </span>
            </div>
          </div>

          {/* Card 3: Dynamic Rails */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Sliders size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Active Dynamic Rails</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">4 Sections</p>
              <span className="text-[10px] text-slate-500 font-mono">Trending, New, Movies, Series</span>
            </div>
          </div>

          {/* Card 4: Categories Taxonomy */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Tag size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Taxonomy Tags</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{stats.enabledCategoriesCount} / {DEFAULT_CATEGORIES.length}</p>
              <span className="text-[10px] text-emerald-600 font-mono font-medium">Active in Mobile Feed</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6">
          
          {/* Main Orchestrator Canvas */}
          <div className="flex-1 space-y-6 min-w-0">
            
            {viewMode === 'JSON' ? (
              /* JSON Blueprint & API Payload Inspector */
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Code size={16} className="text-blue-600" />
                      Production HomeConfig Payload Schema
                    </h3>
                    <p className="text-xs text-slate-500">Raw JSON synced to mobile applications via GET /videos/home</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    {copiedJson ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedJson ? 'Copied to Clipboard!' : 'Copy Schema'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto max-h-[650px] text-cyan-300 no-scrollbar">
                  <pre>{JSON.stringify(config, null, 2)}</pre>
                </div>
              </div>
            ) : (
              /* Visual Canvas Sections */
              <>
                {/* 1. Hero Spotlight Curator Node */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Hero Spotlight Slot</h2>
                        <p className="text-[11px] text-slate-500">Full-bleed cinematic banner displayed at top of app home screen</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {featuredVideo && (
                        <button
                          onClick={() => setConfig({ ...config, featuredMediaId: null })}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-medium transition-colors border border-slate-200 hover:border-rose-200 flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Reset to Algorithmic
                        </button>
                      )}
                      <button
                        onClick={() => openModalForRail('FEATURED')}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Settings size={13} /> {featuredVideo ? 'Change Spotlight' : 'Assign Title'}
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {featuredVideo ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 group shadow-md">
                        {/* Widescreen Backdrop Banner Preview */}
                        <div className="h-60 relative overflow-hidden bg-slate-950">
                          {featuredVideo.backdropUrl || featuredVideo.posterUrl ? (
                            <img 
                              src={featuredVideo.backdropUrl || featuredVideo.posterUrl} 
                              alt={featuredVideo.title}
                              className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">NO_IMAGE_AVAILABLE</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
                          
                          {/* Banner Floating Metadata */}
                          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                            <div className="space-y-1.5 max-w-xl">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500 text-white font-bold uppercase tracking-wider shadow-xs">
                                  ★ ACTIVE SPOTLIGHT
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20 font-semibold">
                                  {featuredVideo.type}
                                </span>
                                {featuredVideo.releaseYear && (
                                  <span className="text-xs font-mono text-slate-300 font-semibold">({featuredVideo.releaseYear})</span>
                                )}
                              </div>
                              <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">{featuredVideo.title}</h3>
                              {featuredVideo.description && (
                                <p className="text-xs text-slate-200 line-clamp-2 max-w-lg leading-relaxed">{featuredVideo.description}</p>
                              )}
                            </div>

                            <div className="hidden sm:flex items-center gap-2 text-xs">
                              <span className="px-3.5 py-1.5 bg-white text-slate-950 font-bold rounded-xl shadow-md flex items-center gap-1.5">
                                <Play size={12} className="fill-slate-950" /> Watch Trailer
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Spec Details Bar */}
                        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                          <div className="flex items-center gap-4 font-mono text-[11px]">
                            <span>ID: <span className="text-slate-900 font-semibold select-all">{featuredVideo.id}</span></span>
                            <span>Maturity: <span className="text-slate-900 font-semibold">{featuredVideo.maturityRating || '13+'}</span></span>
                            <span>Rating: <span className="text-amber-500 font-bold">★ {featuredVideo.rating || 0}</span></span>
                            {featuredVideo.episodes && (
                              <span>Episodes: <span className="text-slate-900 font-semibold">{featuredVideo.episodes.length}</span></span>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-bold">
                            <ShieldCheck size={14} /> Production Ready
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/60">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                          <Eye size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">No Spotlight Title Assigned</p>
                          <p className="text-xs text-slate-500 max-w-md mt-1">
                            The mobile client will automatically display the highest rated trending content or featured catalog releases.
                          </p>
                        </div>
                        <button
                          onClick={() => openModalForRail('FEATURED')}
                          className="mt-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                        >
                          <Plus size={14} /> Assign Spotlight Movie or Series
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Dynamic Curated Rails */}
                <div className="space-y-6">
                  
                  {/* Rail: Trending Lineup */}
                  <DynamicRailCard
                    title="Trending Now Lineup"
                    subtitle="Ranked carousel shown on home screen with numerical badges (#1, #2, #3...)"
                    icon={<Flame size={16} className="text-amber-500" />}
                    badgeColor="text-amber-600 bg-amber-50 border-amber-200"
                    items={config.trendingMediaIds}
                    videos={videos}
                    showRank={true}
                    onAdd={() => openModalForRail('TRENDING')}
                    onRemove={(id) => removeItem('trendingMediaIds', id)}
                    onMove={(idx, dir) => moveItem('trendingMediaIds', idx, dir)}
                    onClear={() => clearRail('trendingMediaIds', 'Trending Now')}
                  />

                  {/* Rail: Latest Releases */}
                  <DynamicRailCard
                    title="New Releases Showcase"
                    subtitle="Curated new catalog arrivals or falls back to most recently ingested titles"
                    icon={<Sparkles size={16} className="text-blue-600" />}
                    badgeColor="text-blue-600 bg-blue-50 border-blue-200"
                    items={config.newReleaseMediaIds}
                    videos={videos}
                    showRank={false}
                    onAdd={() => openModalForRail('NEW_RELEASE')}
                    onRemove={(id) => removeItem('newReleaseMediaIds', id)}
                    onMove={(idx, dir) => moveItem('newReleaseMediaIds', idx, dir)}
                    onClear={() => clearRail('newReleaseMediaIds', 'New Releases')}
                  />

                  {/* Rail: Top Movies */}
                  <DynamicRailCard
                    title="Top Movies Index"
                    subtitle="Curated cinematic feature films or falls back to highest rated movie catalog"
                    icon={<Film size={16} className="text-indigo-600" />}
                    badgeColor="text-indigo-600 bg-indigo-50 border-indigo-200"
                    items={config.topMovieMediaIds}
                    videos={videos}
                    showRank={false}
                    onAdd={() => openModalForRail('TOP_MOVIES')}
                    onRemove={(id) => removeItem('topMovieMediaIds', id)}
                    onMove={(idx, dir) => moveItem('topMovieMediaIds', idx, dir)}
                    onClear={() => clearRail('topMovieMediaIds', 'Top Movies')}
                  />

                  {/* Rail: Top Series */}
                  <DynamicRailCard
                    title="Top Series Index"
                    subtitle="Curated episodic releases or falls back to highest rated television series"
                    icon={<Tv size={16} className="text-emerald-600" />}
                    badgeColor="text-emerald-600 bg-emerald-50 border-emerald-200"
                    items={config.topSeriesMediaIds}
                    videos={videos}
                    showRank={false}
                    onAdd={() => openModalForRail('TOP_SERIES')}
                    onRemove={(id) => removeItem('topSeriesMediaIds', id)}
                    onMove={(idx, dir) => moveItem('topSeriesMediaIds', idx, dir)}
                    onClear={() => clearRail('topSeriesMediaIds', 'Top Series')}
                  />

                </div>

                {/* 3. Category Filter Taxonomy Matrix */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                        <Tag size={16} />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Audience Discovery Categories</h2>
                        <p className="text-[11px] text-slate-500">Toggle genre navigation pills displayed in the mobile client filter bar</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAllCategories(true)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
                      >
                        Enable All
                      </button>
                      <button
                        onClick={() => toggleAllCategories(false)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
                    {DEFAULT_CATEGORIES.map((cat) => {
                      const isEnabled = config.enabledCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border cursor-pointer ${
                            isEnabled 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{cat}</span>
                          {isEnabled ? <CheckCircle2 size={14} className="text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Right Column - Live Mobile Device Simulator (Zero Scrollbars) */}
          {showSimulator && (
            <div className="w-full lg:w-[410px] shrink-0">
              <div className="sticky top-20 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-blue-600" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Live Mobile Simulator</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Pixel-accurate client render</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-mono border border-slate-200">
                    <button
                      onClick={() => setSimulatorDevice('iOS')}
                      className={`px-2 py-0.5 rounded ${simulatorDevice === 'iOS' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500'}`}
                    >
                      iPhone 16 Pro
                    </button>
                    <button
                      onClick={() => setSimulatorDevice('Android')}
                      className={`px-2 py-0.5 rounded ${simulatorDevice === 'Android' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-500'}`}
                    >
                      Android
                    </button>
                  </div>
                </div>

                {/* iPhone Chassis Frame */}
                <div className="relative mx-auto w-[330px] h-[640px] bg-slate-950 rounded-[46px] p-3 shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
                  
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5 border border-slate-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                    <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse" />
                  </div>

                  {/* Status Bar */}
                  <div className="h-6 flex items-center justify-between px-5 text-[10px] font-mono text-slate-300 font-bold z-30 select-none pt-1">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-4 h-2 border border-slate-400 rounded-xs flex items-center p-0.5">
                        <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* Simulated Mobile App Viewport (STRICT NO-SCROLLBAR) */}
                  <div 
                    className="flex-1 overflow-y-auto bg-[#0a0f1d] text-white rounded-[34px] flex flex-col select-none relative no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    
                    {/* Floating Mobile Header */}
                    <div className="h-12 px-3.5 flex items-center justify-between sticky top-0 z-20 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/40">
                      <span className="text-xs font-black tracking-widest bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                        KUBER
                      </span>
                      <div className="flex items-center gap-2.5 text-slate-300">
                        <div className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full text-[9px] font-mono font-bold flex items-center gap-1">
                          <span>🪙</span> 250
                        </div>
                        <Search size={13} className="text-slate-400" />
                      </div>
                    </div>

                    {/* App Hero Section */}
                    <div className="h-48 relative shrink-0 bg-slate-900 overflow-hidden">
                      {featuredVideo ? (
                        <>
                          <img 
                            src={featuredVideo.backdropUrl || featuredVideo.posterUrl} 
                            alt="" 
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-[8px] font-mono uppercase bg-blue-500 text-white font-black px-1.5 py-0.5 rounded shadow-xs">
                              SPOTLIGHT
                            </span>
                            <h4 className="text-xs font-black text-white truncate mt-1 drop-shadow">{featuredVideo.title}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <button className="px-3 py-1 bg-white text-slate-950 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-sm">
                                <Play size={8} className="fill-slate-950" /> Play
                              </button>
                              <button className="px-2.5 py-1 bg-slate-800/80 text-white rounded-lg text-[9px] font-bold border border-slate-700">
                                + Watchlist
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-[10px] font-mono p-4 text-center">
                          <span>AUTO_HERO_FALLBACK</span>
                          <span className="text-[8px] text-slate-600 mt-0.5">Algorithmic catalog ranking</span>
                        </div>
                      )}
                    </div>

                    {/* Category Tags Bar (STRICT NO-SCROLLBAR) */}
                    <div 
                      className="flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-slate-900 no-scrollbar"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {config.enabledCategories.slice(0, 6).map((c, i) => (
                        <span key={c} className={`px-2 py-0.5 rounded-full text-[8px] font-medium whitespace-nowrap ${
                          i === 0 ? 'bg-blue-500 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Simulated Dynamic Rails */}
                    <div className="p-3 space-y-4 flex-1 pb-14">
                      
                      {/* Rail 1: Trending Now */}
                      <SimulatorRailRow
                        title="Trending Now"
                        items={config.trendingMediaIds}
                        videos={videos}
                        showRank={true}
                      />

                      {/* Rail 2: New Releases */}
                      <SimulatorRailRow
                        title="New Releases"
                        items={config.newReleaseMediaIds}
                        videos={videos}
                        showRank={false}
                        fallbackItems={videos.slice(0, 3)}
                      />

                      {/* Rail 3: Top Movies */}
                      <SimulatorRailRow
                        title="Top Movies"
                        items={config.topMovieMediaIds}
                        videos={videos}
                        showRank={false}
                        fallbackItems={videos.filter(v => v.type === 'MOVIE').slice(0, 3)}
                      />

                      {/* Rail 4: Top Series */}
                      <SimulatorRailRow
                        title="Top Series"
                        items={config.topSeriesMediaIds}
                        videos={videos}
                        showRank={false}
                        fallbackItems={videos.filter(v => v.type === 'SERIES').slice(0, 3)}
                      />

                    </div>

                    {/* Mobile Bottom Tab Bar */}
                    <div className="h-11 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md flex items-center justify-around text-[8px] font-mono text-slate-400 absolute bottom-0 left-0 right-0 z-30">
                      <div className="flex flex-col items-center gap-0.5 text-blue-400 font-bold">
                        <Layout size={11} /> Home
                      </div>
                      <div className="flex flex-col items-center gap-0.5 text-slate-500">
                        <Search size={11} /> Explore
                      </div>
                      <div className="flex flex-col items-center gap-0.5 text-slate-500">
                        <Film size={11} /> Live
                      </div>
                      <div className="flex flex-col items-center gap-0.5 text-slate-500">
                        <Tag size={11} /> Rewards
                      </div>
                    </div>

                  </div>

                  {/* iPhone Home Indicator */}
                  <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2 shrink-0" />
                </div>

                <div className="text-center">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Device viewport dynamically syncs in real-time
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Multi-Select Entity Picker Modal (Light Theme) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                    {modalMode === 'FEATURED' ? 'Assign Spotlight Hero' : `Curate Rail: ${modalMode}`}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {modalMode === 'FEATURED' ? 'Select 1 title to spotlight' : `${modalSelectedIds.length} titles selected for this lineup`}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Filters & Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter by title, ID, or keyword..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                {(['ALL', 'MOVIE', 'SERIES'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setModalFilterType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      modalFilterType === type 
                        ? 'bg-white text-slate-900 font-bold shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {filteredModalVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredModalVideos.map((video) => {
                    const isSelected = modalSelectedIds.includes(video.id);

                    return (
                      <div
                        key={video.id}
                        onClick={() => {
                          if (modalMode === 'FEATURED') {
                            setModalSelectedIds([video.id]);
                          } else {
                            setModalSelectedIds(
                              isSelected 
                                ? modalSelectedIds.filter((id) => id !== video.id)
                                : [...modalSelectedIds, video.id]
                            );
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 relative group ${
                          isSelected 
                            ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/50' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Poster thumbnail */}
                        <div className="w-14 aspect-[2/3] shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                          {video.posterUrl || video.thumbnailUrl || video.thumbnail ? (
                            <img 
                              src={video.posterUrl || video.thumbnailUrl || video.thumbnail} 
                              alt={video.title} 
                              className="w-full h-full object-cover" 
                              loading="lazy" 
                            />
                          ) : (
                            <ImageIcon size={18} className="absolute inset-0 m-auto text-slate-400" />
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                {video.type}
                              </span>
                              {video.releaseYear && (
                                <span className="text-[10px] font-mono text-slate-500">{video.releaseYear}</span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 truncate mt-1" title={video.title}>
                              {video.title}
                            </h4>
                            <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={video.id}>
                              {video.id}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 mt-1">
                            <span className="text-amber-500 font-bold flex items-center gap-0.5">
                              ★ {video.rating || 0}
                            </span>
                            {isSelected ? (
                              <span className="text-blue-600 font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} /> Selected
                              </span>
                            ) : (
                              <span className="text-slate-400 group-hover:text-slate-600">
                                Click to select
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top corner selected badge */}
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 space-y-2">
                  <Database size={28} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No media titles found</p>
                  <p className="text-xs text-slate-500">Try refining your search filter query.</p>
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="text-xs text-slate-600 font-mono">
                {modalMode === 'FEATURED' ? (
                  <span>Selected: <span className="text-slate-900 font-bold">{modalSelectedIds.length ? '1 title' : 'None'}</span></span>
                ) : (
                  <span>Selected: <span className="text-blue-600 font-bold">{modalSelectedIds.length} titles</span></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={applyModalSelection}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Apply Lineup Selection
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ----- Visual Component: Dynamic Rail Card (Light Theme) -----

interface DynamicRailCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeColor: string;
  items: string[];
  videos: VideoItem[];
  showRank?: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onClear: () => void;
}

function DynamicRailCard({
  title,
  subtitle,
  icon,
  badgeColor,
  items,
  videos,
  showRank,
  onAdd,
  onRemove,
  onMove,
  onClear
}: DynamicRailCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      
      {/* Rail Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${badgeColor}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">{title}</h2>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                {items.length} titles
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-medium transition-colors border border-slate-200 hover:border-rose-200 flex items-center gap-1 cursor-pointer"
              title="Clear all titles from rail"
            >
              <Trash2 size={13} /> Clear Rail
            </button>
          )}
          <button
            onClick={onAdd}
            className="px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus size={14} /> Append Title
          </button>
        </div>
      </div>

      {/* Rail Horizontal Cards Carousel (NO SCROLLBAR) */}
      <div 
        className="p-6 overflow-x-auto no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.length > 0 ? (
          <div className="flex gap-4">
            {items.map((id, index) => {
              const video = videos.find((v) => v.id === id);
              if (!video) return null;

              return (
                <div 
                  key={id} 
                  className="w-32 shrink-0 flex flex-col group bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-2 transition-all hover:shadow-md"
                >
                  {/* Poster Box */}
                  <div className="aspect-[2/3] bg-slate-100 rounded-xl overflow-hidden relative mb-2 border border-slate-200 shadow-xs">
                    {video.posterUrl || video.thumbnailUrl || video.thumbnail ? (
                      <img 
                        src={video.posterUrl || video.thumbnailUrl || video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        loading="lazy" 
                      />
                    ) : (
                      <ImageIcon size={20} className="absolute inset-0 m-auto text-slate-400" />
                    )}

                    {/* Rank Badge */}
                    {showRank && (
                      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg bg-black/80 backdrop-blur-md text-amber-400 font-black text-xs font-mono flex items-center justify-center border border-amber-500/30 shadow-md">
                        #{index + 1}
                      </div>
                    )}

                    {/* Quick Reorder & Delete Overlays */}
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      <div className="flex justify-end">
                        <button
                          onClick={() => onRemove(id)}
                          className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                          title="Remove from rail"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-white/95 rounded-lg p-1 border border-slate-200 shadow-sm">
                        <button
                          onClick={() => onMove(index, -1)}
                          disabled={index === 0}
                          className="w-5 h-5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                          title="Move Earlier"
                        >
                          <ArrowLeft size={12} />
                        </button>
                        <span className="text-[9px] font-mono text-slate-700 font-bold">{index + 1}</span>
                        <button
                          onClick={() => onMove(index, 1)}
                          disabled={index === items.length - 1}
                          className="w-5 h-5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                          title="Move Later"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <span className="text-xs font-bold text-slate-900 truncate" title={video.title}>
                    {video.title}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>{video.type}</span>
                    <span className="text-amber-500 font-semibold">★ {video.rating || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 border border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center gap-2 bg-slate-50/50">
            <Layers size={20} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">Lineup Array Empty</p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              The mobile app will automatically populate this section with highest-rated items from your catalog.
            </p>
            <button
              onClick={onAdd}
              className="mt-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus size={12} /> Curate Specific Titles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ----- Helper Component for Phone Simulator Rail Row (NO SCROLLBAR) -----

function SimulatorRailRow({
  title,
  items,
  videos,
  showRank,
  fallbackItems = []
}: {
  title: string;
  items: string[];
  videos: VideoItem[];
  showRank?: boolean;
  fallbackItems?: VideoItem[];
}) {
  const displayItems = items.length > 0 ? items : fallbackItems.map((v) => v.id);
  const displayVideos = displayItems.map((id) => videos.find((v) => v.id === id)).filter(Boolean) as VideoItem[];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
        <span>{title}</span>
        <ChevronRight size={9} className="text-slate-600" />
      </div>

      <div 
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayVideos.length > 0 ? (
          displayVideos.slice(0, 4).map((video, idx) => (
            <div key={video.id} className="w-16 shrink-0 relative flex flex-col">
              <div className="w-16 h-24 rounded-lg bg-slate-800 overflow-hidden border border-slate-800 relative">
                {video.posterUrl || video.thumbnailUrl || video.thumbnail ? (
                  <img src={video.posterUrl || video.thumbnailUrl || video.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-600 font-mono">NULL</div>
                )}
                {showRank && (
                  <div className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-black/80 text-amber-400 text-[8px] font-black font-mono border border-amber-500/40">
                    #{idx + 1}
                  </div>
                )}
              </div>
              <span className="text-[8px] text-slate-300 truncate mt-0.5 font-medium">{video.title}</span>
            </div>
          ))
        ) : (
          [1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-24 rounded-lg bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-[8px] text-slate-600 font-mono">
              NULL
            </div>
          ))
        )}
      </div>
    </div>
  );
}
