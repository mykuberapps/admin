'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Save, CheckCircle2, AlertCircle, AlertTriangle,
  Smartphone, Search, X, Film, Tv, Activity, Database,
  Settings, Layers, Plus, Trash2, ArrowUp, ArrowDown,
  RefreshCw, RotateCcw, Copy, Check, Code, Eye, Play,
  Tag, Compass, Filter, ChevronRight, ShieldCheck, Image as ImageIcon
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Horror',
  'Romance', 'Sci-Fi', 'Thriller', 'Anime', 'Fantasy',
  'Documentary', 'Mystery', 'Crime', 'Family', 'Animation'
];

const GENRE_GRADIENTS: Record<string, string> = {
  Action: 'from-red-600 to-rose-700',
  Adventure: 'from-emerald-600 to-green-700',
  Romance: 'from-pink-600 to-rose-600',
  Horror: 'from-slate-900 to-neutral-950',
  Comedy: 'from-amber-500 to-orange-600',
  Thriller: 'from-purple-600 to-indigo-800',
  'Sci-Fi': 'from-blue-600 to-cyan-700',
  Drama: 'from-fuchsia-600 to-purple-800',
  Anime: 'from-sky-500 to-blue-600',
  Fantasy: 'from-amber-400 to-yellow-600',
  Documentary: 'from-slate-600 to-zinc-700',
  Mystery: 'from-indigo-600 to-slate-800',
  Crime: 'from-red-800 to-slate-900',
  Family: 'from-teal-500 to-emerald-600',
  Animation: 'from-violet-500 to-purple-600',
};

interface ThemedRow {
  title: string;
  genre: string;
}

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
  genre?: string[] | string;
  category?: string;
  maturityRating?: string;
}

interface ExploreConfig {
  id?: string;
  featuredMediaId: string | null;
  rows: ThemedRow[];
  updatedAt?: string;
}

export default function ExploreDesignPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [config, setConfig] = useState<ExploreConfig>({
    featuredMediaId: null,
    rows: []
  });
  const [initialConfig, setInitialConfig] = useState<ExploreConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'VISUAL' | 'JSON'>('VISUAL');
  const [showSimulator, setShowSimulator] = useState(true);
  const [simulatorDevice, setSimulatorDevice] = useState<'iOS' | 'Android'>('iOS');
  const [copiedJson, setCopiedJson] = useState(false);

  // New Row creation form
  const [newRowTitle, setNewRowTitle] = useState('');
  const [newRowGenre, setNewRowGenre] = useState('Action');
  const [showAddRowForm, setShowAddRowForm] = useState(false);

  // Hero selection modal
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        fetch(`${API_URL}/admin/explore-config`)
      ]);
      const vData = await vRes.json();
      const cData = await cRes.json();

      setVideos(vData.data || []);
      if (cData.data) {
        const loaded: ExploreConfig = {
          featuredMediaId: cData.data.featuredMediaId || null,
          rows: Array.isArray(cData.data.rows) ? cData.data.rows : [],
          updatedAt: cData.data.updatedAt
        };
        setConfig(loaded);
        setInitialConfig(loaded);
      }
    } catch (err) {
      console.error('Failed to load explore config', err);
      setMessage({ type: 'error', text: 'Failed to establish synchronization with the backend.' });
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
        rows: config.rows || []
      };

      const res = await fetch(`${API_URL}/admin/explore-config`, {
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
        setMessage({ type: 'success', text: 'Explore Discovery configuration deployed successfully across all mobile clients.' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        throw new Error(data.message || 'Synchronization rejected');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to deploy explore configuration.' });
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

  // Row manipulation
  const handleAddRow = () => {
    const title = newRowTitle.trim();
    if (!title) return;
    const updated = [...config.rows, { title, genre: newRowGenre }];
    setConfig({ ...config, rows: updated });
    setNewRowTitle('');
    setShowAddRowForm(false);
  };

  const handleAddPreset = (presetTitle: string, presetGenre: string) => {
    if (config.rows.some(r => r.title.toLowerCase() === presetTitle.toLowerCase())) return;
    setConfig({ ...config, rows: [...config.rows, { title: presetTitle, genre: presetGenre }] });
  };

  const handleMoveRow = (index: number, direction: -1 | 1) => {
    const updated = [...config.rows];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setConfig({ ...config, rows: updated });
  };

  const handleDeleteRow = (index: number) => {
    const updated = config.rows.filter((_, i) => i !== index);
    setConfig({ ...config, rows: updated });
  };

  const handleRowTitleChange = (index: number, newTitle: string) => {
    const updated = [...config.rows];
    updated[index] = { ...updated[index], title: newTitle };
    setConfig({ ...config, rows: updated });
  };

  const handleRowGenreChange = (index: number, newGenre: string) => {
    const updated = [...config.rows];
    updated[index] = { ...updated[index], genre: newGenre };
    setConfig({ ...config, rows: updated });
  };

  // Helper to count catalog items matching a genre
  const getMatchingCount = (genre: string) => {
    return videos.filter(v => {
      const gArr = Array.isArray(v.genre) ? v.genre : (v.genre ? [v.genre] : []);
      return gArr.some(g => typeof g === 'string' && g.toLowerCase() === genre.toLowerCase());
    }).length;
  };

  const featuredVideo = useMemo(() => {
    return videos.find(v => v.id === config.featuredMediaId) || null;
  }, [videos, config.featuredMediaId]);

  const filteredModalVideos = useMemo(() => {
    return videos.filter(v => {
      const q = modalSearch.toLowerCase().trim();
      const matchesSearch = !q || v.title.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
      const matchesType = modalFilterType === 'ALL' || v.type === modalFilterType;
      return matchesSearch && matchesType;
    });
  }, [videos, modalSearch, modalFilterType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-800">
        <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest text-slate-500 uppercase font-semibold">Synchronizing Discovery Nodes...</p>
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <Compass size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Explore Discovery Orchestrator & Themed Rows</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                DISCOVERY_LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Target: <span className="text-emerald-600 font-semibold">/admin/explore-config</span> • Mobile Endpoint: <span className="text-slate-700 font-semibold">Explore Screen</span>
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
              <Compass size={13} /> Visual Canvas
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
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 font-semibold shadow-xs' 
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Toggle Live Mobile Simulator Panel"
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
            className="h-9 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin text-white" />
            ) : (
              <Save size={14} />
            )}
            <span>{saving ? 'Publishing Discovery Fleet...' : 'Deploy to Production'}</span>
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

      {/* Discovery Fleet Capacity Scorecards */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 shadow-2xs">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Discovery Spotlight */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Discovery Hero</span>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5" title={featuredVideo?.title || 'Auto-Fallback'}>
                {featuredVideo ? featuredVideo.title : 'First Catalog Item'}
              </p>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5 ${featuredVideo ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200' : 'text-amber-700 bg-amber-100/80 border border-amber-200'}`}>
                {featuredVideo ? 'ACTIVE_CURATED' : 'CATALOG_DEFAULT'}
              </span>
            </div>
          </div>

          {/* Card 2: Themed Rails */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Themed Rails</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{config.rows.length} Custom Rows</p>
              <span className="text-[10px] text-emerald-600 font-mono font-medium">Dynamic Genre Sections</span>
            </div>
          </div>

          {/* Card 3: Genre Hub Mosaic */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Tag size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Genre Hub Mosaic</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{AVAILABLE_GENRES.length} Hub Tiles</p>
              <span className="text-[10px] text-slate-500 font-mono">Apple Music / Max Mosaic</span>
            </div>
          </div>

          {/* Card 4: Discoverable Depth */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
              <Film size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">Total Catalog Depth</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{videos.length} Videos</p>
              <span className="text-[10px] text-teal-600 font-mono font-medium">3-Col Infinite Grid</span>
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
                      <Code size={16} className="text-emerald-600" />
                      Production ExploreConfig Schema Payload
                    </h3>
                    <p className="text-xs text-slate-500">Live JSON synchronized with the mobile app explore screen</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
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
                {/* 1. Explore Spotlight Hero Curator Node */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Explore Spotlight Hero</h2>
                        <p className="text-[11px] text-slate-500">Prominent top discovery card displayed on mobile explore screen</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {featuredVideo && (
                        <button
                          onClick={() => setConfig({ ...config, featuredMediaId: null })}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-medium transition-colors border border-slate-200 hover:border-rose-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} /> Reset to Default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setModalSearch('');
                          setModalFilterType('ALL');
                          setIsModalOpen(true);
                        }}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Settings size={13} /> {featuredVideo ? 'Change Spotlight' : 'Assign Title'}
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {featuredVideo ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 group shadow-md">
                        {/* Widescreen Banner */}
                        <div className="h-60 relative overflow-hidden bg-slate-950">
                          {featuredVideo.backdropUrl || featuredVideo.posterUrl ? (
                            <img 
                              src={featuredVideo.backdropUrl || featuredVideo.posterUrl} 
                              alt={featuredVideo.title}
                              className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">NO_IMAGE_AVAILABLE</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
                          
                          {/* Banner Floating Details */}
                          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                            <div className="space-y-1.5 max-w-xl">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500 text-white font-bold uppercase tracking-wider shadow-xs">
                                  ★ FEATURED DISCOVERY
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
                          </div>
                        </div>

                        {/* Specs bar */}
                        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                          <div className="flex items-center gap-4 font-mono text-[11px]">
                            <span>ID: <span className="text-slate-900 font-semibold select-all">{featuredVideo.id}</span></span>
                            <span>Maturity: <span className="text-slate-900 font-semibold">{featuredVideo.maturityRating || '13+'}</span></span>
                            <span>Rating: <span className="text-amber-500 font-bold">★ {featuredVideo.rating || 0}</span></span>
                          </div>
                          <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-bold">
                            <ShieldCheck size={14} /> Discovery Ready
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/60">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                          <Eye size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">No Spotlight Hero Assigned</p>
                          <p className="text-xs text-slate-500 max-w-md mt-1">
                            The mobile explore screen will automatically display the first available media item from your catalog.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setModalSearch('');
                            setModalFilterType('ALL');
                            setIsModalOpen(true);
                          }}
                          className="mt-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                        >
                          <Plus size={14} /> Assign Spotlight Media Item
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Themed Genre Rows Manager */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                        <Layers size={16} />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Dynamic Themed Rails</h2>
                        <p className="text-[11px] text-slate-500">Horizontal carousels rendered dynamically based on genre filters</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAddRowForm(!showAddRowForm)}
                      className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                    >
                      <Plus size={14} /> Add Themed Rail
                    </button>
                  </div>

                  {/* Quick Preset Row Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                      Quick Preset Suggestions (Click to Add):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { title: 'Action & Adrenaline', genre: 'Action' },
                        { title: 'Midnight Horrors', genre: 'Horror' },
                        { title: 'Laugh Out Loud', genre: 'Comedy' },
                        { title: 'Emotional Dramas', genre: 'Drama' },
                        { title: 'Sci-Fi Frontiers', genre: 'Sci-Fi' },
                        { title: 'Romantic Escapes', genre: 'Romance' },
                        { title: 'Binge-Worthy Series', genre: 'Series' }
                      ].map(preset => {
                        const exists = config.rows.some(r => r.title.toLowerCase() === preset.title.toLowerCase());
                        return (
                          <button
                            key={preset.title}
                            disabled={exists}
                            onClick={() => handleAddPreset(preset.title, preset.genre)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                              exists 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <Plus size={11} />
                            <span>{preset.title}</span>
                            <span className="text-[9px] font-mono text-slate-400">({preset.genre})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add New Row Form Drawer */}
                  {showAddRowForm && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Plus size={14} className="text-emerald-600" /> Create Custom Themed Rail
                        </span>
                        <button onClick={() => setShowAddRowForm(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                            Rail Display Title
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Adrenaline Rush, Romantic Escapes..."
                            value={newRowTitle}
                            onChange={(e) => setNewRowTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                            Filter Genre
                          </label>
                          <select
                            value={newRowGenre}
                            onChange={(e) => setNewRowGenre(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {AVAILABLE_GENRES.map(g => (
                              <option key={g} value={g}>{g} ({getMatchingCount(g)} matching in library)</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setShowAddRowForm(false)}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddRow}
                          disabled={!newRowTitle.trim()}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          Save & Add Rail
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Configured Rails */}
                  <div className="space-y-3">
                    {config.rows.length > 0 ? (
                      config.rows.map((row, idx) => {
                        const count = getMatchingCount(row.genre);
                        return (
                          <div 
                            key={idx}
                            className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            {/* Left: Row details */}
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-500 shrink-0 shadow-2xs">
                                #{idx + 1}
                              </div>
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text"
                                    value={row.title}
                                    onChange={(e) => handleRowTitleChange(idx, e.target.value)}
                                    className="text-xs font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white px-2 py-0.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none transition-all w-full max-w-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono px-2">
                                  <span>Genre Filter:</span>
                                  <select
                                    value={row.genre}
                                    onChange={(e) => handleRowGenreChange(idx, e.target.value)}
                                    className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                  >
                                    {AVAILABLE_GENRES.map(g => (
                                      <option key={g} value={g}>{g}</option>
                                    ))}
                                  </select>
                                  <span className="text-emerald-600 font-bold">• {count} titles match</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                              <button
                                onClick={() => handleMoveRow(idx, -1)}
                                disabled={idx === 0}
                                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
                                title="Move Earlier"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                onClick={() => handleMoveRow(idx, 1)}
                                disabled={idx === config.rows.length - 1}
                                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
                                title="Move Later"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(idx)}
                                className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer ml-1"
                                title="Delete Row"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 border border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                        <Layers size={22} className="text-slate-400" />
                        <p className="text-xs font-semibold text-slate-700">Zero Custom Themed Rails Configured</p>
                        <p className="text-[11px] text-slate-500 max-w-sm">
                          Use the quick presets above or click "Add Themed Rail" to create dynamic genre sections for your users.
                        </p>
                      </div>
                    )}
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
                    <Smartphone size={16} className="text-emerald-600" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Explore Screen Simulator</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Pixel-accurate client render</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-mono border border-slate-200">
                    <button
                      onClick={() => setSimulatorDevice('iOS')}
                      className={`px-2 py-0.5 rounded ${simulatorDevice === 'iOS' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-500'}`}
                    >
                      iPhone 16 Pro
                    </button>
                    <button
                      onClick={() => setSimulatorDevice('Android')}
                      className={`px-2 py-0.5 rounded ${simulatorDevice === 'Android' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-500'}`}
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
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
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
                    
                    {/* Floating Search Bar */}
                    <div className="p-3 sticky top-0 z-20 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/40">
                      <div className="h-8 bg-slate-900 rounded-xl px-2.5 flex items-center gap-2 border border-slate-800 text-[10px] text-slate-400">
                        <Search size={12} className="text-slate-500" />
                        <span>Search titles, actors, genres...</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-4 flex-1 pb-14">
                      
                      {/* Featured Discovery Hero */}
                      {featuredVideo ? (
                        <div className="h-44 relative rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800 shadow-md">
                          <img 
                            src={featuredVideo.backdropUrl || featuredVideo.posterUrl || featuredVideo.thumbnail} 
                            alt="" 
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-[#0a0f1d]/40 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-[8px] font-mono uppercase bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded shadow-xs">
                              FEATURED
                            </span>
                            <h4 className="text-xs font-black text-white truncate mt-1 drop-shadow">{featuredVideo.title}</h4>
                            {featuredVideo.description && (
                              <p className="text-[9px] text-slate-300 line-clamp-1 mt-0.5">{featuredVideo.description}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono text-center p-2">
                          <span>HERO_DEFAULT_FIRST_VIDEO</span>
                        </div>
                      )}

                      {/* Browse by Genre Mosaic Hub */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Browse by Genre
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {AVAILABLE_GENRES.slice(0, 6).map(g => {
                            const grad = GENRE_GRADIENTS[g] || 'from-slate-700 to-slate-900';
                            return (
                              <div 
                                key={g}
                                className={`h-10 rounded-xl bg-gradient-to-r ${grad} p-2 flex items-center justify-between shadow-xs border border-white/10`}
                              >
                                <span className="text-[10px] font-black text-white">{g}</span>
                                <ChevronRight size={10} className="text-white/60" />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dynamic Themed Rows */}
                      {config.rows.map((row, idx) => {
                        const matching = videos.filter(v => {
                          const gArr = Array.isArray(v.genre) ? v.genre : (v.genre ? [v.genre] : []);
                          return gArr.some(g => typeof g === 'string' && g.toLowerCase() === row.genre.toLowerCase());
                        });

                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                              <span>{row.title}</span>
                              <ChevronRight size={9} className="text-slate-600" />
                            </div>

                            <div 
                              className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
                              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                              {matching.length > 0 ? (
                                matching.slice(0, 4).map(v => (
                                  <div key={v.id} className="w-16 shrink-0 flex flex-col">
                                    <div className="w-16 h-24 rounded-lg bg-slate-800 overflow-hidden border border-slate-800 relative">
                                      {v.posterUrl || v.thumbnailUrl || v.thumbnail ? (
                                        <img src={v.posterUrl || v.thumbnailUrl || v.thumbnail} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-600 font-mono">NULL</div>
                                      )}
                                    </div>
                                    <span className="text-[8px] text-slate-300 truncate mt-0.5 font-medium">{v.title}</span>
                                  </div>
                                ))
                              ) : (
                                [1, 2, 3].map(i => (
                                  <div key={i} className="w-16 h-24 rounded-lg bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-[8px] text-slate-600 font-mono">
                                    NULL
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Explore Everything 3-Column Grid Preview */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Explore Everything
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {videos.slice(0, 6).map(v => (
                            <div key={v.id} className="aspect-[2/3] rounded-lg bg-slate-800 overflow-hidden border border-slate-800">
                              {v.posterUrl || v.thumbnailUrl || v.thumbnail ? (
                                <img src={v.posterUrl || v.thumbnailUrl || v.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-600 font-mono">NULL</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Mobile Bottom Tab Bar */}
                    <div className="h-11 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md flex items-center justify-around text-[8px] font-mono text-slate-400 absolute bottom-0 left-0 right-0 z-30">
                      <div className="flex flex-col items-center gap-0.5 text-slate-500">
                        <Film size={11} /> Home
                      </div>
                      <div className="flex flex-col items-center gap-0.5 text-emerald-400 font-bold">
                        <Search size={11} /> Explore
                      </div>
                      <div className="flex flex-col items-center gap-0.5 text-slate-500">
                        <Tv size={11} /> Live
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
                    Explore screen dynamically syncs in real-time
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Entity Picker Modal for Spotlight Hero */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                    Select Explore Spotlight Hero
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Select the featured title to showcase at the top of the mobile explore screen
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
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                    const isSelected = config.featuredMediaId === video.id;

                    return (
                      <div
                        key={video.id}
                        onClick={() => {
                          setConfig({ ...config, featuredMediaId: video.id });
                          setIsModalOpen(false);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 relative group ${
                          isSelected 
                            ? 'bg-purple-50/80 border-purple-500 shadow-sm ring-1 ring-purple-500/50' 
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
                              <span className="text-purple-600 font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} /> Assigned
                              </span>
                            ) : (
                              <span className="text-slate-400 group-hover:text-slate-600">
                                Click to select
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Selected badge */}
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
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

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
              >
                Close Picker
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
