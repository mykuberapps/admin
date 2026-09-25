"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Trash2, Edit2, Star, Film, Tv, Clock, Zap, TrendingUp,
  Eye, Lock, ChevronLeft, Info, Type, Layers, Loader2,
  X, Play, Globe, Calendar, HardDrive, FileVideo, Tag, Hash,
  AlertCircle, ShieldCheck, Copy, CheckCircle2, ChevronRight,
  Share2, Monitor, Cpu, Maximize2, Image as ImageIcon,
  PlayCircle, Activity, Layout, Terminal, Database, Link as LinkIcon,
  Sparkles, ExternalLink, RefreshCw, Flame, Check, ShieldAlert,
  Volume2, Subtitles, Download, Smartphone
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { getLanguageName } from "@/app/utils/language";
import { getApiUrl, getAdminHeaders } from "@/utils/api";

interface Episode {
  id?: string;
  title: string;
  description: string;
  seasonNumber: number;
  episodeNumber: number;
  url: string;
  masterUrl?: string;
  duration: number;
  thumbnail?: string;
  thumbnailUrl?: string;
  size?: number | string;
  codec?: string;
  width?: number;
  height?: number;
  bitrate?: number;
  processingStatus: string;
  audioTracks?: any[];
  subtitleTracks?: any[];
}

interface MediaData {
  id: string;
  type: 'MOVIE' | 'SERIES';
  title: string;
  description: string;
  url?: string;
  masterUrl?: string;
  posterUrl: string;
  backdropUrl: string;
  logoUrl?: string;
  trailerUrl?: string;
  duration: number;
  genre: string[];
  cast: string[];
  director: string;
  writer: string;
  releaseYear: number;
  languages: string[];
  rating: number;
  contentRating: string;
  maturityRating: string;
  contentAdvisories: string[];
  category: string;
  tags?: string;
  keywords?: string;
  hashtags?: string;
  isFeatured: boolean;
  isTrending: boolean;
  isActive: boolean;
  scheduledAt?: string;
  size?: number | string;
  codec?: string;
  width?: number;
  height?: number;
  bitrate?: number;
  processingStatus: string;
  processingProgress?: number;
  processingLog?: string;
  createdAt: string;
  updatedAt: string;
  audioTracks?: any[];
  subtitleTracks?: any[];
  episodes?: Episode[];
}

export default function ContentDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const { showToast } = useToast();
  const router = useRouter();
  const [item, setItem] = useState<MediaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'assets' | 'metadata'>('overview');
  const [selectedSeason, setSelectedSeason] = useState<number | 'ALL'>('ALL');

  // Video Stream Preview Modal
  const [previewStream, setPreviewStream] = useState<{ title: string; url: string } | null>(null);

  // S3 Purge Portal State
  const [showPurgePortal, setShowPurgePortal] = useState(false);
  const [s3Stats, setS3Stats] = useState<{ size: number; count: number } | null>(null);
  const [purgeInput, setPurgeInput] = useState("");
  const [isPurging, setIsPurging] = useState(false);

  const apiUrl = getApiUrl();

  const fetchDetail = async () => {
    try {
      // 1. Try public endpoint first (guaranteed 0 auth issues)
      let res = await fetch(`${apiUrl}/videos/${id}`);
      if (!res.ok) {
        // 2. Fallback to admin endpoint with headers
        res = await fetch(`${apiUrl}/admin/videos/${id}`, {
          headers: getAdminHeaders()
        });
      }
      const data = await res.json();
      if (data.success && data.data) {
        setItem(data.data);
      } else if (data.id || data.title) {
        setItem(data);
      } else {
        showToast("Record not found", "error");
        router.push("/content");
      }
    } catch (err) {
      showToast("Failed to fetch entity details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, "success");
  };

  const formatSize = (bytes: number | string | undefined) => {
    const b = Number(bytes);
    if (!b || b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getAudioLanguages = () => {
    if (!item || !item.audioTracks) return [];
    const langs = new Set<string>();
    item.audioTracks.forEach(t => {
      if (t.language) langs.add(t.language.toLowerCase().trim());
    });
    return Array.from(langs).map(l => getLanguageName(l));
  };

  const getSubtitleLanguages = () => {
    if (!item || !item.subtitleTracks) return [];
    const subs = new Set<string>();
    item.subtitleTracks.forEach(t => {
      if (t.language) subs.add(t.language.toLowerCase().trim());
    });
    return Array.from(subs).map(s => getLanguageName(s));
  };

  const updateStatus = async (field: string, value: any) => {
    if (!item) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        showToast("Entity state updated", "success");
        setItem(prev => prev ? { ...prev, [field]: value } : prev);
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("State update failed", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const deleteContent = async () => {
    setShowPurgePortal(true);
    setS3Stats(null);
    setPurgeInput("");
    try {
      const res = await fetch(`${apiUrl}/admin/videos/${id}/s3-stats`, {
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setS3Stats(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executePurge = async () => {
    if (purgeInput !== "DELETE PERMANENTLY") return;
    setIsPurging(true);
    try {
      const res = await fetch(`${apiUrl}/admin/videos/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        showToast("Entity and S3 assets purged successfully", "success");
        router.push("/content");
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("Purge operation failed", "error");
      setIsPurging(false);
    }
  };

  // Filter episodes by season
  const seasonsList = useMemo(() => {
    if (!item?.episodes) return [];
    const seasons = new Set<number>();
    item.episodes.forEach(ep => seasons.add(ep.seasonNumber || 1));
    return Array.from(seasons).sort((a, b) => a - b);
  }, [item?.episodes]);

  const filteredEpisodes = useMemo(() => {
    if (!item?.episodes) return [];
    if (selectedSeason === 'ALL') return item.episodes;
    return item.episodes.filter(ep => (ep.seasonNumber || 1) === selectedSeason);
  }, [item?.episodes, selectedSeason]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Querying entity specifications...
        </p>
      </div>
    );
  }

  if (!item) return null;

  const isReady = item.processingStatus === 'READY';
  const isFailed = item.processingStatus === 'FAILED';
  const isTranscoding = !isReady && !isFailed;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-sm">
      
      {/* 1. EXECUTIVE COMMAND APP BAR */}
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1700px] mx-auto h-full px-6 flex items-center justify-between gap-4">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/content")}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Return to Catalog Library"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 border border-slate-200 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">
                {item.type === 'SERIES' ? 'Series' : 'Feature'}
              </span>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-sm">
                {item.title}
              </h1>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline truncate max-w-xs">
                {item.id}
              </span>
            </div>
          </div>

          {/* Action Directives */}
          <div className="flex items-center gap-2.5">
            {/* Stream Player Preview */}
            {(item.url || item.masterUrl || (item.episodes && item.episodes[0]?.url)) && (
              <button
                onClick={() => {
                  const url = item.url || item.masterUrl || item.episodes?.[0]?.url || '';
                  setPreviewStream({ title: item.title, url });
                }}
                className="h-8 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors shadow-2xs"
                title="Play Stream Preview in Player"
              >
                <PlayCircle size={14} className="text-indigo-600" />
                Player Preview
              </button>
            )}

            {/* Edit in Ingestion Studio */}
            <button
              onClick={() => router.push(`/studio/upload?id=${item.id}`)}
              className="h-8 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Open entity in Ingestion Studio"
            >
              <Edit2 size={13} className="text-slate-500" />
              Edit in Studio
            </button>

            {/* Queue Diagnostics */}
            <button
              onClick={() => router.push("/processing")}
              className="h-8 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Inspect live transcoding telemetry"
            >
              <Activity size={13} className="text-slate-500" />
              Diagnostics
            </button>

            {/* S3 Purge */}
            <button
              onClick={deleteContent}
              className="h-8 px-3 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-red-50 transition-colors shadow-2xs"
              title="Initiate S3 & Database Purge Protocol"
            >
              <Trash2 size={13} />
              Purge
            </button>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC HERO BANNER */}
      <div className="relative bg-slate-900 border-b border-slate-800 text-white overflow-hidden shrink-0 shadow-sm">
        {/* Backdrop Ambient Image */}
        {item.backdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-xs scale-105"
            style={{ backgroundImage: `url(${item.backdropUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60" />

        <div className="relative max-w-[1700px] mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Poster & Core Metadata */}
          <div className="flex items-center gap-5 min-w-0">
            {/* 2:3 Vertical Key Art Card */}
            <div className="w-20 h-28 sm:w-24 sm:h-36 bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-xl relative group">
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <Film size={24} />
                </div>
              )}
              <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[9px] font-mono font-bold text-indigo-300">
                4K UHD
              </span>
            </div>

            {/* Typography & Spec Badges */}
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isReady
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : isFailed
                    ? 'bg-red-500/20 border border-red-400/40 text-red-300'
                    : 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 animate-pulse'
                }`}>
                  {isReady && <CheckCircle2 size={11} />}
                  {isFailed && <AlertCircle size={11} />}
                  {isTranscoding && <Activity size={11} className="animate-spin" />}
                  {item.processingStatus}
                  {item.processingProgress !== undefined && !isReady && !isFailed && ` (${item.processingProgress}%)`}
                </span>

                <span className="px-2 py-0.5 bg-white/10 border border-white/15 rounded text-[10px] font-bold uppercase">
                  {item.maturityRating || 'All Ages'}
                </span>
                
                {item.contentRating && (
                  <span className="px-1.5 py-0.2 bg-white/10 border border-white/15 rounded text-[10px] font-mono">
                    {item.contentRating}
                  </span>
                )}

                <span className="text-slate-400 text-xs font-mono">
                  {item.releaseYear || new Date(item.createdAt).getFullYear()}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                {item.title}
              </h2>

              {item.description && (
                <p className="text-xs text-slate-300 max-w-2xl line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Specs Pills */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-400" />
                  {formatDuration(item.duration)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <HardDrive size={13} className="text-slate-400" />
                  {formatSize(item.size)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Globe size={13} className="text-blue-400" />
                  {item.audioTracks?.length || (item.type === 'SERIES' ? item.episodes?.[0]?.audioTracks?.length : 0) || 0} Audio
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Type size={13} className="text-purple-400" />
                  {item.subtitleTracks?.length || (item.type === 'SERIES' ? item.episodes?.[0]?.subtitleTracks?.length : 0) || 0} Subs
                </span>
                {item.rating > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {item.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Platform Status Toggles */}
          <div className="flex md:flex-col items-center md:items-end gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
            <div className="flex items-center justify-between gap-4 w-full">
              <span className="text-xs font-semibold text-slate-300">Active Stream</span>
              <button
                onClick={() => updateStatus('isActive', !item.isActive)}
                disabled={isUpdatingStatus}
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                  item.isActive ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    item.isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 w-full">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Star size={12} className={item.isFeatured ? "text-amber-400 fill-amber-400" : "text-slate-500"} />
                Featured Hero
              </span>
              <button
                onClick={() => updateStatus('isFeatured', !item.isFeatured)}
                disabled={isUpdatingStatus}
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                  item.isFeatured ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    item.isFeatured ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 w-full">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Flame size={12} className={item.isTrending ? "text-orange-400 fill-orange-400" : "text-slate-500"} />
                Trending Now
              </span>
              <button
                onClick={() => updateStatus('isTrending', !item.isTrending)}
                disabled={isUpdatingStatus}
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                  item.isTrending ? 'bg-orange-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    item.isTrending ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="border-b border-slate-200 bg-white sticky top-14 z-30 shadow-2xs">
        <div className="max-w-[1700px] mx-auto px-6 flex items-center gap-8">
          {[
            { id: 'overview', label: 'Overview & Tech Specs', icon: <Database size={14} /> },
            { id: 'episodes', label: `Episodic Manifest (${item.episodes?.length || 0})`, icon: <Layers size={14} />, hidden: item.type === 'MOVIE' },
            { id: 'assets', label: 'Key Artwork Gallery', icon: <ImageIcon size={14} /> },
            { id: 'metadata', label: 'Editorial, Tags & SEO', icon: <Terminal size={14} /> },
          ].filter(t => !t.hidden).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-12 flex items-center gap-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-6">
        <div className="max-w-[1700px] mx-auto">
          
          {/* TAB 1: OVERVIEW & TECH SPECS */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Master Endpoints & Core Data */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Streaming Master Endpoints */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                    <FileVideo className="text-indigo-600" size={16} />
                    HLS Streaming Pipelines & Master Endpoints
                  </h3>

                  <div className="space-y-3">
                    <EndpointCard
                      label="HLS Master Playlist Manifest (.m3u8)"
                      url={item.masterUrl || item.url || item.episodes?.[0]?.url}
                      onCopy={() => copyToClipboard(item.masterUrl || item.url || item.episodes?.[0]?.url || '', 'HLS Master URL')}
                      onPlay={(url) => setPreviewStream({ title: `${item.title} (Master)`, url })}
                    />

                    {item.url && item.url !== item.masterUrl && (
                      <EndpointCard
                        label="Direct S3 Stream URL"
                        url={item.url}
                        onCopy={() => copyToClipboard(item.url || '', 'Stream URL')}
                        onPlay={(url) => setPreviewStream({ title: `${item.title} (Direct)`, url })}
                      />
                    )}

                    {item.trailerUrl && (
                      <EndpointCard
                        label="Trailer HLS Stream"
                        url={item.trailerUrl}
                        onCopy={() => copyToClipboard(item.trailerUrl || '', 'Trailer URL')}
                        onPlay={(url) => setPreviewStream({ title: `${item.title} (Trailer)`, url })}
                      />
                    )}
                  </div>
                </div>

                {/* Core Entity Information */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                    <Film className="text-indigo-600" size={16} />
                    Core Entity Specification
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <DetailItem label="Primary Title" value={item.title} />
                    <DetailItem label="Content Category" value={item.category || 'Feature'} />
                    <DetailItem label="Director" value={item.director || '—'} />
                    <DetailItem label="Lead Writer" value={item.writer || '—'} />
                    <DetailItem label="Release Year" value={item.releaseYear?.toString() || '—'} />
                    <DetailItem label="Maturity Rating" value={item.maturityRating || 'All Ages'} />
                    <DetailItem label="Content Rating" value={item.contentRating || 'General'} />
                    <DetailItem label="Platform Rating" value={`${item.rating || 0} / 10.0`} />

                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1.5">
                        Genres / Categories
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.genre && item.genre.length > 0 ? (
                          item.genre.map((g, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-semibold text-[11px]">
                              {g}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No genres assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1.5">
                        Cast Ensemble
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.cast && item.cast.length > 0 ? (
                          item.cast.map((c, i) => (
                            <span key={i} className="px-2.5 py-1 bg-indigo-50/60 border border-indigo-100 text-indigo-900 rounded-lg font-medium text-xs">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No cast members recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right 1 Col: Encoding Metrics & Language Matrix */}
              <div className="space-y-6">
                
                {/* Video Encoding Diagnostics */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                    <Cpu className="text-indigo-600" size={16} />
                    Encoding & Transcode Metrics
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-mono text-[11px]">VIDEO CODEC</span>
                      <span className="font-bold text-slate-900 font-mono uppercase">
                        {item.codec || item.episodes?.[0]?.codec || 'H.264 / AVC'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-mono text-[11px]">RESOLUTION</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {item.width && item.height ? `${item.width} x ${item.height}` : item.episodes?.[0]?.width ? `${item.episodes[0].width} x ${item.episodes[0].height}` : '1080p (Adaptive)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-mono text-[11px]">STREAM BITRATE</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {item.bitrate ? `${Math.round(item.bitrate / 1000)} kbps` : item.episodes?.[0]?.bitrate ? `${Math.round(item.episodes[0].bitrate / 1000)} kbps` : 'Multi-tier ABR'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-mono text-[11px]">S3 RECLAIMED FOOTPRINT</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatSize(item.size)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audio Tracks Matrix */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                    <Volume2 className="text-indigo-600" size={16} />
                    Audio Tracks Matrix ({item.audioTracks?.length || item.episodes?.[0]?.audioTracks?.length || 0})
                  </h3>

                  <div className="space-y-2">
                    {(item.audioTracks && item.audioTracks.length > 0) || (item.episodes?.[0]?.audioTracks && item.episodes[0].audioTracks.length > 0) ? (
                      (item.audioTracks && item.audioTracks.length > 0 ? item.audioTracks : item.episodes?.[0]?.audioTracks || []).map((t: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {t.name || getLanguageName(t.language) || 'Primary Stream'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ISO: {t.language || 'und'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-mono rounded font-semibold">
                            2.0 Stereo
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        Embedded in main video stream (Stereo AAC)
                      </p>
                    )}
                  </div>
                </div>

                {/* Subtitle / VTT Tracks */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                    <Subtitles className="text-indigo-600" size={16} />
                    Subtitles & Closed Captions ({item.subtitleTracks?.length || item.episodes?.[0]?.subtitleTracks?.length || 0})
                  </h3>

                  <div className="space-y-2">
                    {(item.subtitleTracks && item.subtitleTracks.length > 0) || (item.episodes?.[0]?.subtitleTracks && item.episodes[0].subtitleTracks.length > 0) ? (
                      (item.subtitleTracks && item.subtitleTracks.length > 0 ? item.subtitleTracks : item.episodes?.[0]?.subtitleTracks || []).map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {s.name || getLanguageName(s.language) || 'Subtitle Track'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ISO: {s.language || 'und'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-mono rounded font-semibold">
                            WebVTT
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        No external sidecar subtitle tracks registered
                      </p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: EPISODIC MANIFEST */}
          {activeTab === 'episodes' && item.type === 'SERIES' && (
            <div className="space-y-4">
              {/* Season Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 font-mono uppercase mr-2">
                    Seasons:
                  </span>
                  <button
                    onClick={() => setSelectedSeason('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedSeason === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({item.episodes?.length || 0})
                  </button>
                  {seasonsList.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSeason(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedSeason === s
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Season {s}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono text-slate-500">
                  Showing {filteredEpisodes.length} of {item.episodes?.length || 0} episodes
                </span>
              </div>

              {/* Episodes Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">S:E</th>
                        <th className="py-3 px-4">Episode Title</th>
                        <th className="py-3 px-4">Duration & Size</th>
                        <th className="py-3 px-4">Resolution</th>
                        <th className="py-3 px-4">Stream Status</th>
                        <th className="py-3 px-4 text-right">Playback & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredEpisodes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No episodes found for this season filter.
                          </td>
                        </tr>
                      ) : (
                        filteredEpisodes.map((ep, idx) => {
                          const epReady = ep.processingStatus === 'READY';
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              {/* S:E */}
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] rounded">
                                  S{String(ep.seasonNumber || 1).padStart(2, '0')}:E{String(ep.episodeNumber || idx + 1).padStart(2, '0')}
                                </span>
                              </td>

                              {/* Title & ID */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-8 bg-slate-100 rounded overflow-hidden shrink-0 border border-slate-200 relative flex items-center justify-center">
                                    {ep.thumbnailUrl || ep.thumbnail ? (
                                      <img src={ep.thumbnailUrl || ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <Tv size={14} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 block text-xs">
                                      {ep.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {ep.id || `ep-${idx}`}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Duration & Size */}
                              <td className="py-3 px-4 font-mono text-slate-600">
                                <div>{formatDuration(ep.duration)}</div>
                                <div className="text-[10px] text-slate-400">{formatSize(ep.size)}</div>
                              </td>

                              {/* Resolution */}
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {ep.width && ep.height ? `${ep.width}x${ep.height}` : '1080p ABR'}
                              </td>

                              {/* Stream Status */}
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  epReady
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {epReady ? <CheckCircle2 size={11} /> : <Activity size={11} className="animate-spin" />}
                                  {ep.processingStatus}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {ep.url && (
                                    <>
                                      <button
                                        onClick={() => setPreviewStream({ title: `S${ep.seasonNumber}:E${ep.episodeNumber} - ${ep.title}`, url: ep.url })}
                                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                        title="Play Episode Preview"
                                      >
                                        <Play size={11} className="fill-indigo-600" />
                                        Play
                                      </button>
                                      <button
                                        onClick={() => copyToClipboard(ep.url, 'Episode HLS URL')}
                                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md transition-colors"
                                        title="Copy HLS Stream URL"
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </>
                                  )}
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

          {/* TAB 3: KEY ARTWORK GALLERY */}
          {activeTab === 'assets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Vertical Poster (2:3) */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Vertical Key Artwork</h4>
                    <p className="text-[10px] text-slate-500 font-mono">2:3 Aspect Ratio (Mobile & Detail Cards)</p>
                  </div>
                  {item.posterUrl && (
                    <button
                      onClick={() => copyToClipboard(item.posterUrl, 'Poster URL')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
                
                <div className="p-4 flex items-center justify-center bg-slate-100/60 flex-1">
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt="Vertical Poster"
                      className="max-h-72 aspect-[2/3] object-cover rounded-lg shadow-md border border-slate-200"
                    />
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-mono">No Vertical Poster Uploaded</p>
                    </div>
                  )}
                </div>

                {item.posterUrl && (
                  <div className="p-3 border-t border-slate-100 bg-white">
                    <p className="text-[10px] text-slate-400 font-mono truncate" title={item.posterUrl}>
                      {item.posterUrl}
                    </p>
                  </div>
                )}
              </div>

              {/* Landscape Backdrop (16:9) */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col md:col-span-2">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Cinematic Landscape Backdrop</h4>
                    <p className="text-[10px] text-slate-500 font-mono">16:9 Aspect Ratio (Hero Banners & TV Carousels)</p>
                  </div>
                  {item.backdropUrl && (
                    <button
                      onClick={() => copyToClipboard(item.backdropUrl, 'Backdrop URL')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>

                <div className="p-4 flex items-center justify-center bg-slate-100/60 flex-1">
                  {item.backdropUrl ? (
                    <img
                      src={item.backdropUrl}
                      alt="Landscape Backdrop"
                      className="w-full max-h-72 aspect-[16/9] object-cover rounded-lg shadow-md border border-slate-200"
                    />
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-mono">No Landscape Backdrop Uploaded</p>
                    </div>
                  )}
                </div>

                {item.backdropUrl && (
                  <div className="p-3 border-t border-slate-100 bg-white">
                    <p className="text-[10px] text-slate-400 font-mono truncate" title={item.backdropUrl}>
                      {item.backdropUrl}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EDITORIAL, TAGS & SEO */}
          {activeTab === 'metadata' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search Index Keywords */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <Tag className="text-indigo-600" size={16} />
                  Search Index Keywords
                </h3>

                {item.keywords ? (
                  <div className="flex flex-wrap gap-2">
                    {item.keywords.split(',').map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs rounded-lg">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No search indexing keywords registered.</p>
                )}
              </div>

              {/* Social Hashtags */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <Hash className="text-indigo-600" size={16} />
                  Social Discovery & Viral Hashtags
                </h3>

                {item.hashtags ? (
                  <div className="flex flex-wrap gap-2">
                    {item.hashtags.split(',').map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs rounded-lg font-semibold">
                        #{tag.trim().replace('#', '')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No social hashtags mapped for discovery.</p>
                )}
              </div>

              {/* Content Advisories */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <ShieldAlert className="text-indigo-600" size={16} />
                  Viewer Content Advisories
                </h3>

                {item.contentAdvisories && item.contentAdvisories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.contentAdvisories.map((adv, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg font-medium">
                        {adv}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No viewer content advisories registered.</p>
                )}
              </div>

              {/* Publication Telemetry */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                  <Calendar className="text-indigo-600" size={16} />
                  Publication Schedule & Entity Timestamps
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-mono">CREATED AT</span>
                    <span className="font-mono text-slate-800">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-mono">LAST MODIFIED</span>
                    <span className="font-mono text-slate-800">
                      {new Date(item.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {item.scheduledAt && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-500 font-mono">SCHEDULED PUBLISH</span>
                      <span className="font-mono text-indigo-600 font-bold">
                        {new Date(item.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 5. INTERACTIVE VIDEO STREAM PREVIEW MODAL */}
      {previewStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-700 overflow-hidden font-sans text-white">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlayCircle className="text-indigo-400" size={18} />
                <h3 className="font-bold text-sm text-white truncate max-w-lg">
                  {previewStream.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewStream(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Container */}
            <div className="aspect-video w-full bg-black relative flex items-center justify-center">
              <video
                src={previewStream.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Player Stream Footer Info */}
            <div className="p-4 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] truncate max-w-xl">
                <span className="text-indigo-400 font-bold uppercase">Stream URI:</span>
                <span className="truncate">{previewStream.url}</span>
              </div>
              <button
                onClick={() => copyToClipboard(previewStream.url, 'Stream URI')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors text-xs"
              >
                <Copy size={12} />
                Copy URI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. S3 PURGE PROTOCOL MODAL */}
      {showPurgePortal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-red-200 overflow-hidden font-sans">
            {/* Warning Header */}
            <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-red-950 font-bold text-sm">Purge Protocol Initiated</h3>
                <p className="text-red-700 text-xs mt-1 leading-relaxed">
                  This will permanently delete this title from the database and wipe all master video files and HLS segments from AWS S3.
                </p>
              </div>
            </div>

            <div className="p-6">
              {/* S3 Storage Footprint Telemetry */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                <h4 className="text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-2 flex items-center gap-2">
                  <HardDrive size={13} className="text-slate-400" /> Target AWS S3 Footprint
                </h4>
                {s3Stats ? (
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-xl font-bold text-slate-900 font-mono block">
                        {formatSize(s3Stats.size)}
                      </span>
                      <span className="text-[11px] text-slate-500">Storage Reclaimed</span>
                    </div>
                    <div>
                      <span className="text-xl font-bold text-slate-900 font-mono block">
                        {s3Stats.count}
                      </span>
                      <span className="text-[11px] text-slate-500">Objects & Segments</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 py-1 text-xs font-mono">
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                    Calculating S3 footprint...
                  </div>
                )}
              </div>

              {/* Two-step Confirmation */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Type <strong className="text-red-600 select-none">DELETE PERMANENTLY</strong> to confirm:
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-red-600 text-xs font-mono font-bold focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
                  placeholder="DELETE PERMANENTLY"
                  value={purgeInput}
                  onChange={(e) => setPurgeInput(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurgePortal(false)}
                  disabled={isPurging}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Abort Protocol
                </button>
                <button
                  onClick={executePurge}
                  disabled={purgeInput !== "DELETE PERMANENTLY" || isPurging}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs"
                >
                  {isPurging ? (
                    <><Loader2 size={14} className="animate-spin" /> Purging...</>
                  ) : (
                    <><Trash2 size={14} /> Execute Purge</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ----- Helper Components -----

function DetailItem({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
        {label}
      </span>
      <span className="font-semibold text-slate-900 block truncate">
        {value}
      </span>
    </div>
  );
}

function EndpointCard({
  label,
  url,
  onCopy,
  onPlay
}: {
  label: string;
  url?: string;
  onCopy: () => void;
  onPlay: (url: string) => void;
}) {
  if (!url) return null;
  return (
    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block font-semibold">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 overflow-hidden">
          <p className="text-xs font-mono text-slate-700 truncate">{url}</p>
        </div>
        <button
          onClick={() => onPlay(url)}
          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors shrink-0 shadow-2xs"
          title="Play Stream in Modal"
        >
          <Play size={13} className="fill-indigo-600" />
        </button>
        <button
          onClick={onCopy}
          className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors shrink-0 shadow-2xs"
          title="Copy to clipboard"
        >
          <Copy size={13} />
        </button>
      </div>
    </div>
  );
}
