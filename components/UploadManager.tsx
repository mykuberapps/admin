"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  CloudUpload, Loader2, CheckCircle2, X, ChevronRight, ChevronLeft,
  Film, Image as ImageIcon, AlertCircle, Crop, Star, Plus,
  Database, UploadCloud, Save, Tv, Sparkles, Play,
  Smartphone, Monitor, Info, Tag, Hash, Users, RotateCw,
  RefreshCw, Check, Clock, Layers, Shield, FileVideo, Music, Subtitles, Trash2
} from 'lucide-react';
import { useToast } from '@/components/toast-provider';
import { useUpload } from './UploadProvider';
import ImageAdjuster from './ImageAdjuster';

interface UploadManagerProps {
  initialData?: any;
  onComplete: (data: any) => void;
  onClose: () => void;
}

interface FileState {
  file: File | null;
  url: string | null;
  uploading: boolean;
  progress: number;
  completed: boolean;
}

const MATURITY_RATINGS = [
  { label: 'All Ages', value: 'G', badge: 'G' },
  { label: '7+', value: '7+', badge: '7+' },
  { label: '13+', value: '13+', badge: '13+' },
  { label: '16+', value: '16+', badge: '16+' },
  { label: '18+', value: '18+', badge: '18+' }
];

const CONTENT_RATINGS = ['General', 'U', 'UA', 'A', 'PG-13', 'R', 'TV-MA', 'NC-17'];
const ADVISORIES = ['Violence', 'Language', 'Nudity', 'Substances', 'Fear', 'Sexual Content'];
const GENRES = [
  'Action', 'Adventure', 'Sci-Fi', 'Thriller', 'Drama', 'Horror',
  'Comedy', 'Crime', 'Romance', 'Fantasy', 'Mystery', 'Animation',
  'Documentary', 'Biography', 'War', 'History', 'Kids', 'Sports'
];
const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Telugu', value: 'te' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' }
];

interface EpisodeData {
  id?: string;
  title: string;
  description: string;
  seasonNumber: number;
  episodeNumber: number;
  file: File | null;
  url: string | null;
  thumbnailFile: File | null;
  thumbnailUrl: string | null;
  progress: number;
  thumbnailProgress: number;
  completed: boolean;
  thumbnailCompleted: boolean;
  uploading: boolean;
  thumbnailUploading: boolean;
  duration: number;
  subtitles: SubtitleState[];
  audioTracks: SubtitleState[];
}

interface SubtitleState {
  id: string;
  lang: string;
  name: string;
  file: File | null;
  url: string | null;
  uploading: boolean;
  progress: number;
  completed: boolean;
  format?: string;
}

export default function UploadManager({ initialData, onComplete, onClose }: UploadManagerProps) {
  const { showToast } = useToast();
  const { addTask } = useUpload();

  const [step, setStep] = useState(1);
  const [simulatorMode, setSimulatorMode] = useState<'mobile' | 'billboard'>('mobile');
  const [selectedQualities, setSelectedQualities] = useState<string[]>(['480p', '720p', '1080p']);
  const [activeSeason, setActiveSeason] = useState(1);
  const [castInput, setCastInput] = useState('');
  const [isProbing, setIsProbing] = useState(false);
  const [probedData, setProbedData] = useState<any>(null);

  const [formData, setFormData] = useState({
    type: initialData?.type || 'MOVIE',
    title: initialData?.title || '',
    description: initialData?.description || '',
    languages: initialData?.languages || ['en'],
    contentRating: initialData?.contentRating || 'General',
    maturityRating: initialData?.maturityRating || '13+',
    contentAdvisories: initialData?.contentAdvisories || [] as string[],
    releaseYear: initialData?.releaseYear || new Date().getFullYear(),
    rating: initialData?.rating || 8.4,
    tags: initialData?.tags || '',
    keywords: initialData?.keywords || '',
    genre: initialData?.genre || ['Action', 'Thriller'] as string[],
    hashtags: initialData?.hashtags || '',
    cast: initialData?.cast || ['Lead Actor', 'Co-Star'] as string[],
    director: initialData?.director || '',
    writer: initialData?.writer || '',
    isFeatured: initialData?.isFeatured || false,
    isTrending: initialData?.isTrending || false
  });

  const [poster, setPoster] = useState<FileState>({
    file: null,
    url: initialData?.posterUrl || null,
    uploading: false,
    progress: initialData?.posterUrl ? 100 : 0,
    completed: !!initialData?.posterUrl
  });

  const [backdrop, setBackdrop] = useState<FileState>({
    file: null,
    url: initialData?.backdropUrl || null,
    uploading: false,
    progress: initialData?.backdropUrl ? 100 : 0,
    completed: !!initialData?.backdropUrl
  });

  const [master, setMaster] = useState<FileState>({
    file: null,
    url: initialData?.url || initialData?.masterUrl || null,
    uploading: false,
    progress: (initialData?.url || initialData?.masterUrl) ? 100 : 0,
    completed: !!(initialData?.url || initialData?.masterUrl)
  });

  const [movieSubtitles, setMovieSubtitles] = useState<SubtitleState[]>(
    initialData?.subtitleTracks?.map((t: any) => ({
      id: t.id,
      lang: t.language || t.lang || t.name,
      name: t.name,
      file: null,
      url: t.url,
      uploading: false,
      progress: 100,
      completed: true,
      format: t.format || 'vtt'
    })) || []
  );

  const [movieAudioTracks, setMovieAudioTracks] = useState<SubtitleState[]>(
    initialData?.audioTracks?.map((t: any) => ({
      id: t.id,
      lang: t.language || t.lang || t.name,
      name: t.name,
      file: null,
      url: t.url,
      uploading: false,
      progress: 100,
      completed: true
    })) || []
  );

  const [episodes, setEpisodes] = useState<EpisodeData[]>(
    initialData?.episodes?.map((e: any) => ({
      ...e,
      file: null,
      thumbnailFile: null,
      thumbnailUrl: e.thumbnail || null,
      progress: e.url ? 100 : 0,
      thumbnailProgress: e.thumbnail ? 100 : 0,
      completed: !!e.url,
      thumbnailCompleted: !!e.thumbnail,
      uploading: false,
      thumbnailUploading: false,
      duration: e.duration || 0,
      subtitles: e.subtitleTracks?.map((t: any) => ({
        id: t.id,
        lang: t.language || t.lang || t.name,
        name: t.name,
        file: null,
        url: t.url,
        uploading: false,
        progress: 100,
        completed: true
      })) || [],
      audioTracks: e.audioTracks?.map((t: any) => ({
        id: t.id,
        lang: t.language || t.lang || t.name,
        name: t.name,
        file: null,
        url: t.url,
        uploading: false,
        progress: 100,
        completed: true
      })) || []
    })) || []
  );

  const [cropping, setCropping] = useState<{
    type: 'poster' | 'backdrop';
    imageUrl: string;
  } | null>(null);

  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);
  const masterInputRef = useRef<HTMLInputElement>(null);

  // Sync initialData when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'MOVIE',
        title: initialData.title || '',
        description: initialData.description || '',
        languages: initialData.languages || ['en'],
        contentRating: initialData.contentRating || 'General',
        maturityRating: initialData.maturityRating || '13+',
        contentAdvisories: initialData.contentAdvisories || [],
        releaseYear: initialData.releaseYear || new Date().getFullYear(),
        rating: initialData.rating || 8.4,
        tags: initialData.tags || '',
        keywords: initialData.keywords || '',
        hashtags: initialData.hashtags || '',
        genre: initialData.genre || ['Action'],
        cast: initialData.cast || [],
        director: initialData.director || '',
        writer: initialData.writer || '',
        isFeatured: initialData.isFeatured || false,
        isTrending: initialData.isTrending || false
      });
      setPoster({ file: null, url: initialData.posterUrl || null, uploading: false, progress: initialData.posterUrl ? 100 : 0, completed: !!initialData.posterUrl });
      setBackdrop({ file: null, url: initialData.backdropUrl || null, uploading: false, progress: initialData.backdropUrl ? 100 : 0, completed: !!initialData.backdropUrl });
      const mUrl = initialData.url || initialData.masterUrl || null;
      setMaster({ file: null, url: mUrl, uploading: false, progress: mUrl ? 100 : 0, completed: !!mUrl });
    }
  }, [initialData]);

  // Handle local video probe
  const probeLocalVideo = (file: File) => {
    setIsProbing(true);
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objUrl = URL.createObjectURL(file);
      video.src = objUrl;

      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration || 0);
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const bitRate = Math.round((file.size * 8) / (duration || 1));
        const resolution = `${width}x${height}`;
        const codec = file.type || 'video/mp4';

        setProbedData({
          duration,
          width,
          height,
          resolution,
          bitRate,
          size: file.size,
          codec,
          format: file.name.split('.').pop()?.toUpperCase() || 'VIDEO',
          languages: ['English']
        });
        setIsProbing(false);
        URL.revokeObjectURL(objUrl);
        showToast(`Master media inspected: ${resolution} (${Math.floor(duration / 60)}m ${duration % 60}s)`, "success");
      };

      video.onerror = () => {
        const bitRate = Math.round(file.size / 1000);
        setProbedData({
          duration: 0,
          width: 1920,
          height: 1080,
          resolution: 'Master Container',
          bitRate,
          size: file.size,
          codec: file.name.split('.').pop()?.toUpperCase() || 'RAW',
          format: file.name.split('.').pop()?.toUpperCase() || 'VIDEO',
          languages: ['English']
        });
        setIsProbing(false);
        URL.revokeObjectURL(objUrl);
      };
    } catch (e) {
      console.error("Local video probe error:", e);
      setIsProbing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'backdrop' | 'master') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const setter = type === 'poster' ? setPoster : type === 'backdrop' ? setBackdrop : setMaster;
    setter({ file, url, uploading: false, progress: 0, completed: false });

    if (type !== 'master') {
      setCropping({ type: type as any, imageUrl: url });
    }

    if (type === 'master') {
      probeLocalVideo(file);
    }
  };

  const handleApplyCrop = (type: 'poster' | 'backdrop', croppedDataUrl: string) => {
    fetch(croppedDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${type}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const setter = type === 'poster' ? setPoster : setBackdrop;
        setter((prev: any) => ({ ...prev, file, url: croppedDataUrl, completed: false }));
        setCropping(null);
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} adjusted successfully`, "success");
      });
  };

  // Genre toggling
  const toggleGenre = (genre: string) => {
    setFormData(prev => {
      const exists = prev.genre.includes(genre);
      const nextGenres = exists ? prev.genre.filter((g: string) => g !== genre) : [...prev.genre, genre];
      return { ...prev, genre: nextGenres };
    });
  };

  // Advisory toggling
  const toggleAdvisory = (advisory: string) => {
    setFormData(prev => {
      const exists = prev.contentAdvisories.includes(advisory);
      const next = exists ? prev.contentAdvisories.filter((a: string) => a !== advisory) : [...prev.contentAdvisories, advisory];
      return { ...prev, contentAdvisories: next };
    });
  };

  // Cast management
  const addCastMember = () => {
    if (!castInput.trim()) return;
    if (!formData.cast.includes(castInput.trim())) {
      setFormData(prev => ({ ...prev, cast: [...prev.cast, castInput.trim()] }));
    }
    setCastInput('');
  };

  const removeCastMember = (name: string) => {
    setFormData(prev => ({ ...prev, cast: prev.cast.filter((c: string) => c !== name) }));
  };

  // Series Episode management
  const addEpisode = () => {
    const seasonEps = episodes.filter(e => e.seasonNumber === activeSeason);
    const nextEp = seasonEps.length > 0 ? Math.max(...seasonEps.map(e => e.episodeNumber)) + 1 : 1;

    setEpisodes([...episodes, {
      title: `Episode ${nextEp}`,
      description: '',
      seasonNumber: activeSeason,
      episodeNumber: nextEp,
      file: null,
      url: null,
      thumbnailFile: null,
      thumbnailUrl: null,
      progress: 0,
      thumbnailProgress: 0,
      completed: false,
      thumbnailCompleted: false,
      uploading: false,
      thumbnailUploading: false,
      duration: 0,
      subtitles: [],
      audioTracks: []
    }]);
  };

  const removeEpisode = (season: number, epNum: number) => {
    setEpisodes(episodes.filter(e => !(e.seasonNumber === season && e.episodeNumber === epNum)));
  };

  const updateEpisode = (season: number, epNum: number, data: Partial<EpisodeData>) => {
    setEpisodes(episodes.map(e => (e.seasonNumber === season && e.episodeNumber === epNum) ? { ...e, ...data } : e));
  };

  // Presets & Templates
  const loadPreset = (presetType: 'movie' | 'series') => {
    if (presetType === 'movie') {
      setFormData({
        type: 'MOVIE',
        title: 'Project Apex: Genesis',
        description: 'In a neon-drenched metropolis on the brink of collapse, a rogue cyberneticist uncovers an artificial intelligence with the power to rewrite reality itself.',
        languages: ['en', 'hi'],
        contentRating: 'UA',
        maturityRating: '16+',
        contentAdvisories: ['Violence', 'Language'],
        releaseYear: 2026,
        rating: 9.1,
        tags: 'cyberpunk, sci-fi, artificial intelligence, thriller, blockbuster',
        keywords: 'ai, matrix, futuristic, neon, rebellion',
        genre: ['Sci-Fi', 'Action', 'Thriller'],
        hashtags: '#ProjectApex #SciFiBlockbuster #Cyberpunk2026',
        cast: ['Kaelen Vane', 'Lyra Sterling', 'Darius Stone', 'Elena Cruz'],
        director: 'Siddharth Roy',
        writer: 'Elena Rostova',
        isFeatured: true,
        isTrending: true
      });
      setSelectedQualities(['480p', '720p', '1080p']);
      showToast("Loaded 'Project Apex' Feature Film Preset", "success");
    } else {
      setFormData({
        type: 'SERIES',
        title: 'Chronicles of Solaria',
        description: 'Across the seven fractured star systems of Solaria, dynastic families wage covert warfare for dominance over the last stable wormhole generator.',
        languages: ['en'],
        contentRating: 'UA',
        maturityRating: '16+',
        contentAdvisories: ['Violence', 'Language', 'Fear'],
        releaseYear: 2026,
        rating: 8.9,
        tags: 'space opera, galactic politics, starship, dynasty, epic',
        keywords: 'solaria, space, empire, sci-fi series, wormhole',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        hashtags: '#ChroniclesOfSolaria #SpaceOpera #NewSeries',
        cast: ['Marcus Vance', 'Seraphina Vale', 'Orion Holt'],
        director: 'Amara Campbell',
        writer: 'Julian Graves',
        isFeatured: true,
        isTrending: true
      });
      setSelectedQualities(['480p', '720p', '1080p']);
      setEpisodes([
        {
          title: 'The Fractured Horizon',
          description: 'A routine diplomatic transit through the Solarian Jump Gate erupts into catastrophic ambush.',
          seasonNumber: 1,
          episodeNumber: 1,
          file: null,
          url: null,
          thumbnailFile: null,
          thumbnailUrl: null,
          progress: 0,
          thumbnailProgress: 0,
          completed: false,
          thumbnailCompleted: false,
          uploading: false,
          thumbnailUploading: false,
          duration: 3120,
          subtitles: [],
          audioTracks: []
        },
        {
          title: 'Echoes of the Void',
          description: 'Stranded in deep uncharted space, the survivors encounter a dormant celestial construct.',
          seasonNumber: 1,
          episodeNumber: 2,
          file: null,
          url: null,
          thumbnailFile: null,
          thumbnailUrl: null,
          progress: 0,
          thumbnailProgress: 0,
          completed: false,
          thumbnailCompleted: false,
          uploading: false,
          thumbnailUploading: false,
          duration: 2940,
          subtitles: [],
          audioTracks: []
        }
      ]);
      showToast("Loaded 'Chronicles of Solaria' Series Preset", "success");
    }
  };

  const handlePublish = async () => {
    const isSeries = formData.type === 'SERIES';

    const hasPoster = Boolean(poster.file || poster.url || initialData?.posterUrl);
    const hasBackdrop = Boolean(backdrop.file || backdrop.url || initialData?.backdropUrl);
    const hasMaster = Boolean(master.file || master.url || initialData?.url || initialData?.masterUrl);

    if (!hasPoster || !hasBackdrop) {
      showToast("Missing required visual assets (Poster & Backdrop)", "error");
      setStep(2);
      return;
    }

    if (!isSeries && !hasMaster) {
      showToast("Missing master file for movie ingestion", "error");
      setStep(3);
      return;
    }

    if (isSeries && episodes.length === 0) {
      showToast("Series must contain at least one episode definition", "error");
      setStep(3);
      return;
    }

    if (!formData.title || formData.title.trim() === '') {
      showToast("Production title is required", "error");
      setStep(1);
      return;
    }

    const validMovieSubs = movieSubtitles.filter(s => Boolean(s.file || s.url));
    const validMovieAudio = movieAudioTracks.filter(a => Boolean(a.file || a.url));

    const cleanEpisodes = episodes.map(ep => ({
      ...ep,
      subtitles: (ep.subtitles || []).filter((s: any) => Boolean(s.file || s.url)),
      audioTracks: (ep.audioTracks || []).filter((a: any) => Boolean(a.file || a.url)),
    }));

    try {
      await addTask({
        formData,
        poster,
        backdrop,
        master,
        episodes: cleanEpisodes,
        movieSubtitles: validMovieSubs,
        movieAudioTracks: validMovieAudio,
        selectedQualities,
        mediaId: initialData?.id
      });

      showToast(`Payload staged into pipeline: ${formData.title}`, "success");
      onComplete(null);
    } catch (err: any) {
      showToast(err.message || "Queue insertion failed", "error");
    }
  };

  const stepLabels = [
    { title: 'General', subtitle: 'Metadata & Format' },
    { title: 'Artwork', subtitle: 'Posters & Backdrops' },
    { title: 'Media', subtitle: 'Payload & Specs' },
    { title: 'Discovery', subtitle: 'Credits & Tags' },
    { title: 'Pre-Flight', subtitle: 'Quality Gate' },
  ];

  // Pre-flight compliance checks
  const preFlightChecks = [
    { label: 'Production Title & Synopsis', ok: Boolean(formData.title && formData.description) },
    { label: 'Classification & Genres', ok: Boolean(formData.genre.length > 0 && formData.maturityRating) },
    { label: 'Key Artwork (2:3 Poster & 16:9 Backdrop)', ok: Boolean((poster.file || poster.url) && (backdrop.file || backdrop.url)) },
    { label: formData.type === 'SERIES' ? `Episodes Staged (${episodes.length})` : 'Master Video Payload', ok: formData.type === 'SERIES' ? episodes.length > 0 : Boolean(master.file || master.url) },
    { label: 'Transcode Target Profiles Selected', ok: selectedQualities.length > 0 },
  ];
  const allChecksPass = preFlightChecks.every(c => c.ok);

  return (
    <div className="w-full flex flex-col font-sans text-sm bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      
      {/* ── Studio Top Toolbar ── */}
      <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 leading-tight">
              {initialData ? `Editing: ${formData.title || 'Untitled'}` : 'Interactive Ingestion Studio'}
            </h2>
            <p className="text-[11px] text-gray-500 font-mono">
              Stage media, inspect video specs, and launch distributed HLS transcoder
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          {!initialData && (
            <>
              <button
                type="button"
                onClick={() => loadPreset('movie')}
                className="h-8 px-2.5 bg-white border border-gray-300 hover:border-blue-400 hover:text-blue-600 rounded text-xs font-medium text-gray-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Film size={13} className="text-blue-600" /> Movie Preset
              </button>
              <button
                type="button"
                onClick={() => loadPreset('series')}
                className="h-8 px-2.5 bg-white border border-gray-300 hover:border-purple-400 hover:text-purple-600 rounded text-xs font-medium text-gray-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Tv size={13} className="text-purple-600" /> Series Preset
              </button>
            </>
          )}
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            title="Close Staging Studio"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Stepper Navigation Bar ── */}
      <div className="px-6 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2">
          {stepLabels.map((s, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <React.Fragment key={idx}>
                <button
                  type="button"
                  onClick={() => setStep(stepNum)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs ${
                    isActive 
                      ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold shadow-xs' 
                      : isDone 
                        ? 'text-gray-800 hover:bg-gray-50 font-medium' 
                        : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isDone ? <Check size={11} /> : stepNum}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{s.title}</span>
                    <span className="text-[9px] text-gray-400 font-mono hidden sm:inline">{s.subtitle}</span>
                  </div>
                </button>
                {idx < stepLabels.length - 1 && (
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Progress Counter */}
        <div className="text-right hidden md:block">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Step {step} of 5</span>
        </div>
      </div>

      {/* ── Main Dual-Pane Workspace ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Column: Interactive Form Steps (7 cols) */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
          
          {/* ═════ STEP 1: GENERAL & CLASSIFICATION ═════ */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Format Segmented Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Production Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setFormData({ ...formData, type: 'MOVIE' })}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                      formData.type === 'MOVIE' 
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      formData.type === 'MOVIE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Film size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Feature Film</p>
                      <p className="text-[11px] text-gray-500">Standalone cinematic title with direct master video</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setFormData({ ...formData, type: 'SERIES' })}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                      formData.type === 'SERIES' 
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      formData.type === 'SERIES' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Tv size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Episodic Series</p>
                      <p className="text-[11px] text-gray-500">Multi-season series with episodic media manifests</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Production Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Project Apex: Genesis"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700">Synopsis & Narrative Summary</label>
                    <span className="text-[10px] text-gray-400 font-mono">{formData.description.length} / 500 chars</span>
                  </div>
                  <textarea 
                    rows={3}
                    maxLength={500}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Compelling synopsis displayed across client billboard and cards..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder:text-gray-400 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Classification Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Release Year</label>
                  <input 
                    type="number"
                    min={1900}
                    max={2030}
                    value={formData.releaseYear}
                    onChange={e => setFormData({ ...formData, releaseYear: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Maturity Rating</label>
                  <select 
                    value={formData.maturityRating}
                    onChange={e => setFormData({ ...formData, maturityRating: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900 font-semibold"
                  >
                    {MATURITY_RATINGS.map(r => (
                      <option key={r.value} value={r.value}>{r.label} ({r.badge})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Censor Rating</label>
                  <select 
                    value={formData.contentRating}
                    onChange={e => setFormData({ ...formData, contentRating: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900"
                  >
                    {CONTENT_RATINGS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content Advisories */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Content Advisories</label>
                <div className="flex flex-wrap gap-1.5">
                  {ADVISORIES.map(adv => {
                    const active = formData.contentAdvisories.includes(adv);
                    return (
                      <button
                        key={adv}
                        type="button"
                        onClick={() => toggleAdvisory(adv)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                          active 
                            ? 'bg-amber-50 border-amber-300 text-amber-800' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {adv}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Genres ({formData.genre.length} selected)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.map(g => {
                    const active = formData.genre.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all border ${
                          active 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Primary Audio Language</label>
                <select
                  value={formData.languages[0] || 'en'}
                  onChange={e => setFormData({ ...formData, languages: [e.target.value] })}
                  className="w-full max-w-xs px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

            </div>
          )}

          {/* ═════ STEP 2: ARTWORK & VISUAL STUDIO ═════ */}
          {step === 2 && (
            <div className="space-y-6">
              
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-800 flex items-start gap-2.5">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                <p>
                  Visual assets are automatically transformed and optimized for mobile app feeds, tablet carousels, and 4K TV billboards. You can click any uploaded visual to crop or fine-tune.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 2:3 Vertical Poster */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900">Vertical Poster</span>
                      <span className="text-[10px] font-mono text-gray-500 ml-1.5">(2:3 Aspect Ratio)</span>
                    </div>
                    {poster.url && (
                      <button
                        type="button"
                        onClick={() => setCropping({ type: 'poster', imageUrl: poster.url! })}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Crop size={12} /> Adjust Crop
                      </button>
                    )}
                  </div>

                  <div 
                    onClick={() => posterInputRef.current?.click()}
                    className={`aspect-[2/3] w-full max-w-[240px] rounded-lg border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden group ${
                      poster.url 
                        ? 'border-green-400 bg-gray-900' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={posterInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={e => handleFileSelect(e, 'poster')} 
                    />
                    {poster.url ? (
                      <>
                        <img src={poster.url} alt="Poster" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                          <ImageIcon size={16} /> Replace Poster
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-gray-400">
                        <UploadCloud size={28} className="mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <p className="text-xs font-semibold text-gray-700">Upload 2:3 Poster</p>
                        <p className="text-[10px] text-gray-400 mt-1">Recommended: 1000x1500px</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 16:9 Cinematic Backdrop */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900">Cinematic Backdrop</span>
                      <span className="text-[10px] font-mono text-gray-500 ml-1.5">(16:9 Aspect Ratio)</span>
                    </div>
                    {backdrop.url && (
                      <button
                        type="button"
                        onClick={() => setCropping({ type: 'backdrop', imageUrl: backdrop.url! })}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Crop size={12} /> Adjust Crop
                      </button>
                    )}
                  </div>

                  <div 
                    onClick={() => backdropInputRef.current?.click()}
                    className={`aspect-video w-full rounded-lg border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden group ${
                      backdrop.url 
                        ? 'border-green-400 bg-gray-900' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={backdropInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={e => handleFileSelect(e, 'backdrop')} 
                    />
                    {backdrop.url ? (
                      <>
                        <img src={backdrop.url} alt="Backdrop" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                          <ImageIcon size={16} /> Replace Backdrop
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-gray-400">
                        <UploadCloud size={28} className="mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <p className="text-xs font-semibold text-gray-700">Upload 16:9 Backdrop</p>
                        <p className="text-[10px] text-gray-400 mt-1">Recommended: 1920x1080px or 4K</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ═════ STEP 3: MEDIA PAYLOAD & SPECS ═════ */}
          {step === 3 && (
            <div className="space-y-6">

              {formData.type === 'MOVIE' ? (
                <>
                  {/* Master Video Dropzone */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-900">
                      Raw Cinematic Master File (Video Source)
                    </label>

                    <div 
                      onClick={() => masterInputRef.current?.click()}
                      className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all text-center group ${
                        master.file || master.url
                          ? 'border-green-400 bg-green-50/30'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={masterInputRef} 
                        className="hidden" 
                        accept="video/*,.mkv,.ts,.mov" 
                        onChange={e => handleFileSelect(e, 'master')} 
                      />

                      {master.file || master.url ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                            <CheckCircle2 size={22} />
                          </div>
                          <p className="text-xs font-bold text-gray-900 truncate max-w-md">
                            {master.file ? master.file.name : 'Existing Cloud Master Assigned'}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {master.file ? `Size: ${(master.file.size / 1024 / 1024).toFixed(1)} MB` : 'Master preserved from database'}
                          </p>
                          <span className="text-[10px] text-blue-600 underline font-medium">Click to select different master file</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileVideo size={32} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <p className="text-xs font-semibold text-gray-800">Drag & Drop master video file or Click to Browse</p>
                          <p className="text-[11px] text-gray-500 font-mono">Supports ProRes, MP4, MKV, QuickTime (Up to 50GB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Local Technical Profiler Badge */}
                  {probedData && (
                    <div className="p-3.5 bg-gray-900 text-white rounded-lg font-mono text-xs space-y-2 border border-gray-800">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-gray-800 pb-1.5">
                        <span className="flex items-center gap-1.5 text-green-400 font-semibold">
                          <Check size={13} /> Technical Inspector Report
                        </span>
                        <span>0ms Local HTML5 Probe</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                        <div><span className="text-gray-500">Resolution:</span> <p className="text-gray-200 font-bold">{probedData.resolution}</p></div>
                        <div><span className="text-gray-500">Duration:</span> <p className="text-gray-200 font-bold">{Math.floor(probedData.duration / 60)}m {probedData.duration % 60}s</p></div>
                        <div><span className="text-gray-500">Codec:</span> <p className="text-gray-200 font-bold">{probedData.codec}</p></div>
                        <div><span className="text-gray-500">Format:</span> <p className="text-gray-200 font-bold">{probedData.format}</p></div>
                      </div>
                    </div>
                  )}

                  {/* Transcoding Profile Targets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-900">
                      Adaptive HLS Transcode Profiles (Multi-Bitrate Ladder)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { q: '480p', label: '480p SD', sub: 'Mobile Saver • 1.4 Mbps' },
                        { q: '720p', label: '720p HD', sub: 'Balanced Stream • 2.8 Mbps' },
                        { q: '1080p', label: '1080p FHD', sub: 'Cinematic High • 5.0 Mbps' },
                      ].map(({ q, label, sub }) => {
                        const active = selectedQualities.includes(q);
                        return (
                          <div
                            key={q}
                            onClick={() => setSelectedQualities(prev => prev.includes(q) ? prev.filter(v => v !== q) : [...prev, q])}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              active 
                                ? 'border-blue-600 bg-blue-50/40 text-blue-900' 
                                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold font-mono">{label}</span>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                active ? 'bg-blue-600 text-white' : 'border border-gray-300'
                              }`}>
                                {active && <Check size={10} />}
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">{sub}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtitle & Audio Sidecar Manager */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Subtitles size={14} className="text-gray-500" /> Subtitles ({movieSubtitles.length})
                        </span>
                        <button 
                          type="button"
                          onClick={() => setMovieSubtitles([...movieSubtitles, { id: crypto.randomUUID(), lang: 'en', name: 'English', file: null, url: null, uploading: false, progress: 0, completed: false, format: 'vtt' }])}
                          className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
                        >
                          + Add Subtitle
                        </button>
                      </div>
                      <div className="space-y-2">
                        {movieSubtitles.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                            <select 
                              value={sub.lang} 
                              onChange={e => setMovieSubtitles(movieSubtitles.map(s => s.id === sub.id ? { ...s, lang: e.target.value, name: LANGUAGES.find(l => l.value === e.target.value)?.label || 'Other' } : s))}
                              className="px-1.5 py-1 text-xs border border-gray-300 rounded bg-white"
                            >
                              {LANGUAGES.map(l => (<option key={l.value} value={l.value}>{l.label}</option>))}
                            </select>
                            <label className="flex-1 cursor-pointer truncate px-2 py-1 bg-white border border-dashed border-gray-300 rounded text-[11px] text-gray-600 hover:border-blue-400">
                              {sub.file ? sub.file.name : (sub.url ? 'Attached' : 'Select .vtt / .srt')}
                              <input 
                                type="file" 
                                accept=".vtt,.srt" 
                                className="hidden" 
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) setMovieSubtitles(movieSubtitles.map(s => s.id === sub.id ? { ...s, file: f, name: f.name.replace(/.[^/.]+$/, '') } : s));
                                }}
                              />
                            </label>
                            <button 
                              type="button"
                              onClick={() => setMovieSubtitles(movieSubtitles.filter(s => s.id !== sub.id))}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Music size={14} className="text-gray-500" /> Audio Tracks ({movieAudioTracks.length})
                        </span>
                        <button 
                          type="button"
                          onClick={() => setMovieAudioTracks([...movieAudioTracks, { id: crypto.randomUUID(), lang: 'hi', name: 'Hindi', file: null, url: null, uploading: false, progress: 0, completed: false }])}
                          className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
                        >
                          + Add Track
                        </button>
                      </div>
                      <div className="space-y-2">
                        {movieAudioTracks.map(aud => (
                          <div key={aud.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                            <select 
                              value={aud.lang} 
                              onChange={e => setMovieAudioTracks(movieAudioTracks.map(a => a.id === aud.id ? { ...a, lang: e.target.value, name: LANGUAGES.find(l => l.value === e.target.value)?.label || 'Other' } : a))}
                              className="px-1.5 py-1 text-xs border border-gray-300 rounded bg-white"
                            >
                              {LANGUAGES.map(l => (<option key={l.value} value={l.value}>{l.label}</option>))}
                            </select>
                            <label className="flex-1 cursor-pointer truncate px-2 py-1 bg-white border border-dashed border-gray-300 rounded text-[11px] text-gray-600 hover:border-blue-400">
                              {aud.file ? aud.file.name : (aud.url ? 'Attached' : 'Select .mp3 / .m4a')}
                              <input 
                                type="file" 
                                accept="audio/*" 
                                className="hidden" 
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) setMovieAudioTracks(movieAudioTracks.map(a => a.id === aud.id ? { ...a, file: f, name: f.name.replace(/.[^/.]+$/, '') } : a));
                                }}
                              />
                            </label>
                            <button 
                              type="button"
                              onClick={() => setMovieAudioTracks(movieAudioTracks.filter(a => a.id !== aud.id))}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Series Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">Season Manifest</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const maxSeason = Math.max(...episodes.map(e => e.seasonNumber), 0);
                          setActiveSeason(maxSeason + 1);
                        }}
                        className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-mono text-gray-700"
                      >
                        + Add Season
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={addEpisode}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Episode
                    </button>
                  </div>

                  {/* Episode List */}
                  <div className="space-y-3">
                    {episodes.map((ep, idx) => (
                      <div key={idx} className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                              S{ep.seasonNumber}E{ep.episodeNumber}
                            </span>
                            <input 
                              type="text"
                              value={ep.title}
                              onChange={e => updateEpisode(ep.seasonNumber, ep.episodeNumber, { title: e.target.value })}
                              placeholder="Episode Title"
                              className="px-2 py-1 text-xs border border-gray-300 rounded bg-white font-semibold text-gray-900"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeEpisode(ep.seasonNumber, ep.episodeNumber)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="cursor-pointer p-2.5 bg-white border border-dashed border-gray-300 rounded flex items-center gap-2 hover:border-blue-400">
                            <FileVideo size={16} className="text-gray-400" />
                            <span className="text-xs truncate text-gray-700">
                              {ep.file ? ep.file.name : (ep.url ? 'Video Attached' : 'Attach Episode Video')}
                            </span>
                            <input 
                              type="file" 
                              accept="video/*" 
                              className="hidden" 
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) updateEpisode(ep.seasonNumber, ep.episodeNumber, { file: f });
                              }}
                            />
                          </label>

                          <label className="cursor-pointer p-2.5 bg-white border border-dashed border-gray-300 rounded flex items-center gap-2 hover:border-blue-400">
                            <ImageIcon size={16} className="text-gray-400" />
                            <span className="text-xs truncate text-gray-700">
                              {ep.thumbnailFile ? ep.thumbnailFile.name : (ep.thumbnailUrl ? 'Thumb Attached' : 'Episode Thumbnail')}
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) updateEpisode(ep.seasonNumber, ep.episodeNumber, { thumbnailFile: f });
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ))}

                    {episodes.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                        <Tv size={28} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs font-semibold text-gray-600">No episodes defined yet</p>
                        <p className="text-[11px] text-gray-400">Click &quot;Add Episode&quot; above to create season entries</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ═════ STEP 4: CREDITS & DISCOVERY ═════ */}
          {step === 4 && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Director</label>
                  <input 
                    type="text"
                    value={formData.director}
                    onChange={e => setFormData({ ...formData, director: e.target.value })}
                    placeholder="e.g. Christopher Nolan"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Writer / Screenplay</label>
                  <input 
                    type="text"
                    value={formData.writer}
                    onChange={e => setFormData({ ...formData, writer: e.target.value })}
                    placeholder="e.g. Jonathan Nolan"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* Cast Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Principal Cast Members</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text"
                    value={castInput}
                    onChange={e => setCastInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCastMember(); } }}
                    placeholder="Type actor name and press Enter..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900"
                  />
                  <button 
                    type="button"
                    onClick={addCastMember}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-xs font-semibold text-gray-700"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {formData.cast.map((c: string) => (
                    <span key={c} className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-800 rounded-md text-xs flex items-center gap-1.5 font-medium">
                      <Users size={12} className="text-gray-400" />
                      {c}
                      <button type="button" onClick={() => removeCastMember(c)} className="text-gray-400 hover:text-red-500">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Discovery Tags & Hashtags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Search Keywords (Comma Separated)</label>
                  <input 
                    type="text"
                    value={formData.keywords}
                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="space, ai, matrix, action, blockbuster"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Marketing Hashtags</label>
                  <input 
                    type="text"
                    value={formData.hashtags}
                    onChange={e => setFormData({ ...formData, hashtags: e.target.value })}
                    placeholder="#SciFiMovie #MustWatch"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:border-blue-500 outline-none text-gray-900 font-mono"
                  />
                </div>
              </div>

              {/* Promotional Switches */}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Featured Billboard</p>
                    <p className="text-[10px] text-gray-500">Pin to top hero banner on web & mobile</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={e => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Trending Now</p>
                    <p className="text-[10px] text-gray-500">Include in Trending Rails with fire badge</p>
                  </div>
                </label>
              </div>

            </div>
          )}

          {/* ═════ STEP 5: PRE-FLIGHT QUALITY GATE ═════ */}
          {step === 5 && (
            <div className="space-y-6">
              
              {/* Quality Gate Checklist Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-mono">
                      Pre-Flight Automated Quality Gate
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      System validation verifying all streaming standards prior to transcode scheduling
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border ${
                    allChecksPass 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {allChecksPass ? 'Gate Passed' : 'Incomplete'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {preFlightChecks.map((chk, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                          chk.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {chk.ok ? <Check size={11} /> : <X size={11} />}
                        </div>
                        <span className={chk.ok ? 'text-gray-800 font-medium' : 'text-red-700 font-medium'}>
                          {chk.label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">
                        {chk.ok ? 'READY' : 'ACTION REQUIRED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Summary */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 font-mono">
                  <span className="text-[10px] uppercase text-gray-400 font-semibold">Production Identity</span>
                  <div className="flex justify-between"><span className="text-gray-500">Format:</span> <span className="text-gray-900 font-bold">{formData.type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Title:</span> <span className="text-gray-900 truncate max-w-[120px]">{formData.title}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Maturity:</span> <span className="text-gray-900">{formData.maturityRating}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Year:</span> <span className="text-gray-900">{formData.releaseYear}</span></div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 font-mono">
                  <span className="text-[10px] uppercase text-gray-400 font-semibold">Encoding Specs</span>
                  <div className="flex justify-between"><span className="text-gray-500">HLS Profiles:</span> <span className="text-gray-900">{selectedQualities.join(', ')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Subtitles:</span> <span className="text-gray-900">{movieSubtitles.length} track(s)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Audio:</span> <span className="text-gray-900">{movieAudioTracks.length} track(s)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Container:</span> <span className="text-gray-900">m3u8 VOD</span></div>
                </div>
              </div>

              {/* Submission Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePublish}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CloudUpload size={18} />
                  <span>Launch Ingestion & Transcoding Pipeline</span>
                </button>
                <p className="text-center text-[10px] text-gray-400 font-mono mt-2">
                  Assets will be synchronized to S3 storage bucket and distributed to BullMQ worker queue
                </p>
              </div>

            </div>
          )}

          {/* ── Bottom Stepper Controls ── */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.min(5, s + 1))}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save size={14} /> Queue Ingestion
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Sticky Live Device Simulator (5 cols) */}
        <div className="lg:col-span-5 p-6 bg-gray-50/50 flex flex-col items-center justify-start sticky top-0 max-h-[85vh] overflow-y-auto">
          
          {/* Simulator Toolbar */}
          <div className="w-full max-w-[320px] flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Sparkles size={14} className="text-amber-500" />
              <span>Live Visualizer</span>
            </div>

            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setSimulatorMode('mobile')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  simulatorMode === 'mobile' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone size={12} /> Mobile Card
              </button>
              <button
                type="button"
                onClick={() => setSimulatorMode('billboard')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  simulatorMode === 'billboard' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Monitor size={12} /> Billboard
              </button>
            </div>
          </div>

          {/* ── Mode 1: Mobile App Card Mockup ── */}
          {simulatorMode === 'mobile' && (
            <div className="w-[280px] bg-black rounded-[36px] p-3 shadow-2xl border-[6px] border-gray-800 relative select-none">
              
              {/* Dynamic Island / Camera Notch */}
              <div className="w-20 h-4 bg-black rounded-full mx-auto mb-2 z-20 relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-800 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50" />
              </div>

              {/* Screen Contents */}
              <div className="rounded-[24px] overflow-hidden bg-gray-950 text-white flex flex-col relative aspect-[9/16]">
                
                {/* Poster Artwork Header */}
                <div className="relative w-full h-[65%] bg-gray-900 overflow-hidden">
                  {poster.url ? (
                    <img src={poster.url} alt="Mobile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-4 text-center">
                      <Film size={36} className="mb-2 opacity-40" />
                      <p className="text-[10px] font-mono">Stage poster in Step 2</p>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/30" />

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold border border-white/20">
                      {formData.maturityRating}
                    </span>
                    {formData.isTrending && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-bold font-mono">
                        🔥 Trending
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Title & Meta Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between -mt-6 relative z-10">
                  <div>
                    <h4 className="text-sm font-bold leading-tight line-clamp-1">
                      {formData.title || 'Untitled Production'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 line-clamp-1">
                      {formData.releaseYear} • {formData.genre.slice(0, 2).join(' • ')}
                    </p>
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {formData.description || 'Synopsis preview will dynamically populate here as you compose metadata...'}
                    </p>
                  </div>

                  {/* Mock Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button type="button" className="flex-1 py-1.5 bg-white text-black text-[11px] font-bold rounded-md flex items-center justify-center gap-1">
                      <Play size={10} fill="currentColor" /> Watch
                    </button>
                    <button type="button" className="px-3 py-1.5 bg-white/10 text-white text-[11px] font-semibold rounded-md border border-white/20">
                      Trailer
                    </button>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="w-20 h-1 bg-white/30 rounded-full mx-auto mb-2 shrink-0" />
              </div>

            </div>
          )}

          {/* ── Mode 2: Desktop Billboard Hero Preview ── */}
          {simulatorMode === 'billboard' && (
            <div className="w-full max-w-[340px] bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl text-white select-none">
              
              <div className="aspect-video w-full relative bg-gray-950 overflow-hidden">
                {backdrop.url ? (
                  <img src={backdrop.url} alt="Backdrop Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-4 text-center">
                    <Monitor size={36} className="mb-2 opacity-40" />
                    <p className="text-[10px] font-mono">Stage backdrop in Step 2</p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                
                <div className="absolute bottom-3 left-3 right-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black uppercase font-mono">
                      {formData.type}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-white border border-white/20">
                      {formData.maturityRating}
                    </span>
                    <span className="text-[10px] font-mono text-gray-300">★ {formData.rating.toFixed(1)}</span>
                  </div>
                  <h4 className="text-xs font-bold leading-tight truncate">
                    {formData.title || 'Untitled Title'}
                  </h4>
                  <p className="text-[9px] text-gray-300 line-clamp-2 leading-relaxed">
                    {formData.description || 'Wide backdrop hero billboard display preview.'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Genres: {formData.genre.slice(0, 2).join(', ')}</span>
                <span className="text-blue-400 font-semibold">16:9 4K Profile</span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Image Adjuster Modal */}
      {cropping && (
        <ImageAdjuster
          type={cropping.type as any}
          imageUrl={cropping.imageUrl}
          onCancel={() => setCropping(null)}
          onApply={(dataUrl: string) => handleApplyCrop(cropping.type as any, dataUrl)}
        />
      )}

    </div>
  );
}
