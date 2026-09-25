"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  Radio, Film, Globe, Save, CheckCircle2, AlertCircle, 
  ExternalLink, Loader2, RefreshCw, Zap, Shield, Eye,
  Clock, Play, Pause, Layers, Trash2, Plus, Edit,
  RotateCcw, Coins, Tag, Search, Filter, X, ArrowUpRight,
  Sparkles, Sliders, Check, Copy, ChevronRight, HardDrive,
  Tv, LayoutGrid, CheckSquare, Square
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface AdCampaign {
  id: string;
  title: string;
  type: string;
  mediaUrl: string;
  targetUrl: string | null;
  duration: number;
  skipAfter: number;
  isActive: boolean;
  viewsCount: number;
  clicksCount: number;
  ctr: number;
  midrollOffset: number | null;
  targetCountries: string[];
  targetGenres: string[];
  startDate: string | null;
  endDate: string | null;
  maxViews: number | null;
  ctaText: string | null;
  rewardCoins: number;
  createdAt: string;
}

interface AdSettings {
  adsEnabled: boolean;
  midrollInterval: number;
  maxAdsPerVideo: number;
  maxPrerollAds: number;
  maxMidrollAds: number;
  maxPostrollAds: number;
  adCooldownSeconds: number;
  maxDailyAdRewards: number;
  defaultRewardCoins: number;
  campaignPriority: string;
  adProvider: string;
  videoAdProvider: string;
  exoclickVastUrl: string;
  adsterraVastUrl: string;
  adsterraDirectLink: string;
  adsterraBannerEnabled: boolean;
  adsterraVideoEnabled: boolean;
  monetagSmartlinkUrl: string;
  monetagBannerEnabled: boolean;
  monetagVideoEnabled: boolean;
  monetagPopupEnabled: boolean;
  monetagRewardEnabled: boolean;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalViews: number;
  totalClicks: number;
  avgCtr: number;
  totalCoinsAwarded: number;
  totalRewardsClaimed: number;
}

const AD_TYPES = [
  { key: 'REWARDED_VIDEO', label: 'Rewarded Video', desc: 'Watch & earn wallet coins (fullscreen)' },
  { key: 'VIDEO_PREROLL', label: 'Video Pre-roll', desc: 'Plays before movie playback starts' },
  { key: 'VIDEO_MIDROLL', label: 'Video Mid-roll', desc: 'Plays at timed intervals during playback' },
  { key: 'VIDEO_POSTROLL', label: 'Video Post-roll', desc: 'Plays when video ends' },
  { key: 'VIDEO_BUMPER', label: 'Video Bumper', desc: 'Short 6s spotlight commercial (unskippable)' },
  { key: 'BANNER', label: 'Banner Card', desc: 'In-feed and Home screen display banner' },
  { key: 'POPUP', label: 'Pause Popup', desc: 'Modal card displayed when user pauses video' },
  { key: 'OVERLAY', label: 'Lower-Third', desc: 'Non-intrusive stream overlay banner' },
];

export default function AdCampaignCenterPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'monetization' | 'payouts'>('campaigns');
  
  // Settings State
  const [settings, setSettings] = useState<AdSettings>({
    adsEnabled: true,
    midrollInterval: 300,
    maxAdsPerVideo: 3,
    maxPrerollAds: 1,
    maxMidrollAds: 1,
    maxPostrollAds: 1,
    adCooldownSeconds: 0,
    maxDailyAdRewards: 5,
    defaultRewardCoins: 25,
    campaignPriority: 'CUSTOM_FIRST',
    adProvider: 'EXOCLICK',
    videoAdProvider: 'EXOCLICK',
    exoclickVastUrl: '',
    adsterraVastUrl: '',
    adsterraDirectLink: '',
    adsterraBannerEnabled: true,
    adsterraVideoEnabled: true,
    monetagSmartlinkUrl: '',
    monetagBannerEnabled: true,
    monetagVideoEnabled: true,
    monetagPopupEnabled: true,
    monetagRewardEnabled: true,
  });

  // Campaigns State
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [payoutLogs, setPayoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "VIDEO_PREROLL",
    mediaUrl: "",
    targetUrl: "",
    duration: 15,
    skipAfter: 5,
    midrollOffset: 300,
    targetCountries: "",
    targetGenres: "",
    maxViews: "",
    ctaText: "Visit Sponsor",
    rewardCoins: 25,
    isActive: true,
  });
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Media Preview Modal
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string; title: string } | null>(null);

  // VAST Tester State
  const [testingVast, setTestingVast] = useState(false);
  const [vastTestResult, setVastTestResult] = useState<any>(null);

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

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers = getAdminHeaders();
      const [settingsRes, campaignsRes, statsRes, payoutsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/ads/settings`, { headers }),
        fetch(`${apiUrl}/admin/ads/campaigns?limit=100`, { headers }),
        fetch(`${apiUrl}/admin/ads/stats`, { headers }),
        fetch(`${apiUrl}/admin/ads/payouts?limit=30`, { headers }),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.success && sData.data) setSettings(sData.data);
      }

      if (campaignsRes.ok) {
        const cData = await campaignsRes.json();
        if (cData.success) setCampaigns(cData.data || []);
      }

      if (statsRes.ok) {
        const stData = await statsRes.json();
        if (stData.success) setStats(stData.data);
      }

      if (payoutsRes.ok) {
        const pData = await payoutsRes.json();
        if (pData.success) setPayoutLogs(pData.data || []);
      }
    } catch (err) {
      console.error('[AdCampaignCenter] fetch error:', err);
      if (!silent) showToast("Failed to fetch campaign data.", "error");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getAdminHeaders, showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Save Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/ads/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Monetization directives committed successfully.", "success");
      } else {
        showToast("Failed to commit ad directives.", "error");
      }
    } catch {
      showToast("Network fault saving settings.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Test VAST Tag (Adsterra, ExoClick, or Sample Tag)
  const handleTestVast = async (targetUrl?: string) => {
    const urlToTest = targetUrl || settings.adsterraVastUrl || settings.exoclickVastUrl;
    if (!urlToTest) {
      showToast("Please enter a VAST XML Tag URL to test.", "error");
      return;
    }
    setTestingVast(true);
    setVastTestResult(null);
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/ads/vast-test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ vastUrl: urlToTest }),
      });
      const data = await res.json();
      setVastTestResult(data);
      if (data.success) {
        showToast("VAST tag verified! MP4 Video creative resolved.", "success");
      } else {
        showToast(data.message || "VAST test: No ads filled or tag returned 0 videos.", "error");
      }
    } catch {
      showToast("Error connecting to VAST server.", "error");
    } finally {
      setTestingVast(false);
    }
  };

  // Toggle Campaign
  const handleToggleCampaign = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/ads/campaigns/${id}/toggle`, {
        method: 'PATCH',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Campaign ${data.data.isActive ? 'activated' : 'paused'}.`, "success");
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: data.data.isActive } : c));
      }
    } catch {
      showToast("Failed to toggle campaign.", "error");
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this ad campaign?")) return;
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/ads/campaigns/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        showToast("Campaign deleted successfully.", "success");
        setCampaigns(prev => prev.filter(c => c.id !== id));
      }
    } catch {
      showToast("Failed to delete campaign.", "error");
    }
  };

  // Reset Campaign Stats
  const handleResetStats = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const headers = getAdminHeaders();
      const res = await fetch(`${apiUrl}/admin/ads/campaigns/${id}/reset-stats`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        showToast("Campaign counters reset to 0.", "success");
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, viewsCount: 0, clicksCount: 0, ctr: 0 } : c));
      }
    } catch {
      showToast("Failed to reset stats.", "error");
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCampaignId(null);
    setFormData({
      title: "",
      type: "REWARDED_VIDEO",
      mediaUrl: "",
      targetUrl: settings.monetagSmartlinkUrl || "",
      duration: 15,
      skipAfter: 5,
      midrollOffset: 300,
      targetCountries: "ALL",
      targetGenres: "ALL",
      maxViews: "",
      ctaText: "Claim Coins",
      rewardCoins: 25,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: AdCampaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCampaignId(c.id);
    setFormData({
      title: c.title,
      type: c.type,
      mediaUrl: c.mediaUrl,
      targetUrl: c.targetUrl || "",
      duration: c.duration,
      skipAfter: c.skipAfter,
      midrollOffset: c.midrollOffset || 300,
      targetCountries: c.targetCountries?.join(", ") || "ALL",
      targetGenres: c.targetGenres?.join(", ") || "ALL",
      maxViews: c.maxViews ? String(c.maxViews) : "",
      ctaText: c.ctaText || "Visit Sponsor",
      rewardCoins: c.rewardCoins || 0,
      isActive: c.isActive,
    });
    setIsModalOpen(true);
  };

  // Save Campaign (Create or Update)
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.mediaUrl.trim()) {
      showToast("Title and Media Asset URL are required.", "error");
      return;
    }

    setSavingCampaign(true);
    try {
      const headers = getAdminHeaders();
      const payload = {
        title: formData.title,
        type: formData.type,
        mediaUrl: formData.mediaUrl,
        targetUrl: formData.targetUrl.trim() || null,
        duration: Number(formData.duration) || 15,
        skipAfter: Number(formData.skipAfter) || 0,
        midrollOffset: formData.type === 'VIDEO_MIDROLL' ? (Number(formData.midrollOffset) || 300) : null,
        targetCountries: formData.targetCountries.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
        targetGenres: formData.targetGenres.split(',').map(s => s.trim()).filter(Boolean),
        maxViews: formData.maxViews ? Number(formData.maxViews) : null,
        ctaText: formData.ctaText.trim() || 'Visit Sponsor',
        rewardCoins: Number(formData.rewardCoins) || 0,
        isActive: formData.isActive,
      };

      let res;
      if (editingCampaignId) {
        res = await fetch(`${apiUrl}/admin/ads/campaigns/${editingCampaignId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${apiUrl}/admin/ads/campaigns`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(`Campaign ${editingCampaignId ? 'updated' : 'created'} successfully!`, "success");
        setIsModalOpen(false);
        await fetchAllData(true);
      } else {
        showToast("Failed to save campaign.", "error");
      }
    } catch {
      showToast("Network fault during campaign save.", "error");
    } finally {
      setSavingCampaign(false);
    }
  };

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesType = typeFilter === "ALL" || c.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || 
        (statusFilter === "ACTIVE" && c.isActive) ||
        (statusFilter === "PAUSED" && !c.isActive);
      const matchesSearch = !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.ctaText && c.ctaText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.targetUrl && c.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [campaigns, typeFilter, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Accessing Ad Monetization Telemetry...</p>
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
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                <Radio size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-none">Ad Campaigns & Monetization</h1>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Multi-Format Delivery, Coin Incentives & ExoClick VAST</p>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-6">
              <button 
                onClick={() => setActiveTab('campaigns')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'campaigns'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers size={13} className={activeTab === 'campaigns' ? 'text-indigo-600' : 'text-slate-400'} />
                Campaign Manager
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-200/60 text-indigo-800">
                  {campaigns.length}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('monetization')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'monetization'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sliders size={13} className={activeTab === 'monetization' ? 'text-indigo-600' : 'text-slate-400'} />
                Network Monetization
              </button>

              <button 
                onClick={() => setActiveTab('payouts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'payouts'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Coins size={13} className={activeTab === 'payouts' ? 'text-indigo-600' : 'text-slate-400'} />
                Reward Payouts ({stats?.totalRewardsClaimed || 0})
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === 'campaigns' && (
              <button
                onClick={handleOpenCreateModal}
                className="h-8.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus size={14} />
                New Ad Campaign
              </button>
            )}

            <button
              onClick={() => fetchAllData()}
              className="h-8.5 w-8.5 bg-white border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs"
              title="Refresh telemetry"
            >
              <RefreshCw size={14} className="text-slate-600" />
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
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Campaigns</span>
              <Layers size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900">{stats?.totalCampaigns || campaigns.length}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">{stats?.activeCampaigns || 0} active in rotation</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Impressions</span>
              <Eye size={16} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-indigo-600">{stats?.totalViews || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Total ad views rendered</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Clicks & Engagements</span>
              <ArrowUpRight size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600">{stats?.totalClicks || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Click-through traffic</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-purple-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Average CTR</span>
              <Sparkles size={16} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-purple-600">{stats?.avgCtr || 0}%</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Conversion efficiency</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Coins Awarded</span>
              <Coins size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-600">{stats?.totalCoinsAwarded || 0}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Incentives to user wallets</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* --- TAB 1: CAMPAIGN MANAGER --- */}
        {/* ========================================================================= */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">

            {/* Toolbar: Search, Filters & Action */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 md:items-center justify-between">
              
              {/* Type Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['ALL', 'REWARDED_VIDEO', 'VIDEO_PREROLL', 'VIDEO_MIDROLL', 'BANNER', 'POPUP'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none whitespace-nowrap ${
                      typeFilter === t
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'ALL' ? 'All Types' : t.replace('VIDEO_', '').replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Status & Search */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="PAUSED">Paused Only</option>
                </select>

                <div className="relative w-56">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search campaign..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono bg-white"
                  />
                </div>
              </div>

            </div>

            {/* Campaign Cards / Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px]">
                      <th className="px-5 py-3 font-semibold">Campaign Asset / Title</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Reward Coins</th>
                      <th className="px-4 py-3 font-semibold">Performance</th>
                      <th className="px-4 py-3 font-semibold">Duration / Skip</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map((c) => (
                        <tr 
                          key={c.id} 
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                          onClick={() => handleOpenEditModal(c)}
                        >
                          {/* Title & Preview */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewMedia({ url: c.mediaUrl, type: c.type, title: c.title });
                                }}
                                className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shrink-0"
                                title="Preview Media Asset"
                              >
                                {c.type.includes('VIDEO') ? <Play size={14} /> : <Film size={14} />}
                              </button>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-xs md:max-w-sm">
                                  {c.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                                  <span>CTA: {c.ctaText || 'Visit Sponsor'}</span>
                                  {c.targetUrl && (
                                    <span className="truncate max-w-[150px]">• {c.targetUrl}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                              c.type === 'REWARDED_VIDEO' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              c.type === 'BANNER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              'bg-purple-50 text-purple-800 border-purple-200'
                            }`}>
                              {c.type.replace('VIDEO_', '').replace('_', ' ')}
                            </span>
                          </td>

                          {/* Reward Coins */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {c.rewardCoins > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                                <Coins size={12} className="text-amber-500" />
                                +{c.rewardCoins} Coins
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400">0 (Impression)</span>
                            )}
                          </td>

                          {/* Performance: Views & Clicks */}
                          <td className="px-4 py-3.5">
                            <div className="font-mono text-xs text-slate-800 font-semibold">
                              {c.viewsCount} views • {c.clicksCount} clicks
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                <div 
                                  className="bg-indigo-600 h-full"
                                  style={{ width: `${Math.min(c.ctr, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-indigo-600 font-bold">{c.ctr}% CTR</span>
                            </div>
                          </td>

                          {/* Duration & Skip */}
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {c.duration}s total
                            <div className="text-[10px] text-slate-400">
                              {c.skipAfter > 0 ? `Skip after ${c.skipAfter}s` : 'Unskippable'}
                            </div>
                          </td>

                          {/* Status Toggle */}
                          <td className="px-4 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleCampaign(c.id, e)}
                              className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                                c.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                            >
                              <span className={`block w-3 h-3 bg-white rounded-full transition-transform ${
                                c.isActive ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </button>
                            <span className="text-[10px] font-mono text-slate-400 block mt-1">
                              {c.isActive ? 'ACTIVE' : 'PAUSED'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => handleOpenEditModal(c, e)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Edit Campaign"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={(e) => handleResetStats(c.id, e)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Reset Stats"
                              >
                                <RotateCcw size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCampaign(c.id, e)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Delete Campaign"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-mono text-xs">
                          {searchQuery ? "No campaigns match your search query." : "No ad campaigns created yet. Click 'New Ad Campaign' to start!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* --- TAB 2: NETWORK MONETIZATION & INTEGRATIONS --- */}
        {/* ========================================================================= */}
        {activeTab === 'monetization' && (
          <div className="space-y-6">

            {/* Master Switch & Priority */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Master Advertising Engine</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Controls global ad injection across video players, mobile home feeds, and reward claiming.
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Priority Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Priority:</span>
                  <select
                    value={settings.campaignPriority || 'CUSTOM_FIRST'}
                    onChange={(e) => setSettings(s => ({ ...s, campaignPriority: e.target.value }))}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CUSTOM_FIRST">Custom Campaigns First</option>
                    <option value="NETWORK_FIRST">Network VAST First</option>
                    <option value="HYBRID">Hybrid Rotation</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, adsEnabled: !s.adsEnabled }))}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                    settings.adsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.adsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* ExoClick Live VAST Suite */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Film size={16} className="text-indigo-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">ExoClick VAST 2.0/3.0 XML Feed</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Automated video commercial ad tags with real-time impression & quartile tracking.</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTestVast()}
                  disabled={testingVast}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {testingVast ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  <span>Test VAST Tag</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">VAST XML Tag Endpoint URL</label>
                <input
                  type="text"
                  value={settings.exoclickVastUrl}
                  onChange={(e) => setSettings(s => ({ ...s, exoclickVastUrl: e.target.value }))}
                  placeholder="https://s.magsrv.com/v1/vast.php?idz=..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* VAST Test Results Display */}
              {vastTestResult && (
                <div className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 ${
                  vastTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {vastTestResult.success ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-rose-600" />}
                    <span>{vastTestResult.success ? 'VAST Tag Verified & Operational' : 'VAST Tag Returned An Error'}</span>
                  </div>
                  {vastTestResult.data ? (
                    <div className="space-y-1 text-[11px] text-emerald-800">
                      <p>Title: {vastTestResult.data.title}</p>
                      <p>Media MP4: {vastTestResult.data.mediaUrl}</p>
                      <p>Duration: {vastTestResult.data.duration}s | Skip: {vastTestResult.data.skipAfter}s</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-rose-800">{vastTestResult.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Monetag Smartlink Suite */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-cyan-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Monetag Direct Smartlink</h4>
                    <p className="text-xs text-slate-500 mt-0.5">High eCPM fallback direct link for web banners, mobile overlays, and post-roll rewards.</p>
                  </div>
                </div>

                <a
                  href={settings.monetagSmartlinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  <span>Test Link</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">Monetag Direct Smartlink URL</label>
                <input
                  type="text"
                  value={settings.monetagSmartlinkUrl}
                  onChange={(e) => setSettings(s => ({ ...s, monetagSmartlinkUrl: e.target.value }))}
                  placeholder="https://omg10.com/4/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Pacing, Delivery & Coin Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Delivery Frequency & Default Incentives
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Configure mid-roll commercial spacing and coin reward rules.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-900 block font-mono">Mid-roll Spacing (Seconds)</label>
                  <input
                    type="number"
                    value={settings.midrollInterval}
                    onChange={(e) => setSettings(s => ({ ...s, midrollInterval: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block font-mono">300s = 5 mins between video commercials</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-900 block font-mono">Default Coins Per Rewarded Ad</label>
                  <input
                    type="number"
                    value={settings.defaultRewardCoins || 25}
                    onChange={(e) => setSettings(s => ({ ...s, defaultRewardCoins: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block font-mono">Used if campaign does not specify custom coins</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-900 block font-mono">Max Daily Claims Per User</label>
                  <input
                    type="number"
                    value={settings.maxDailyAdRewards}
                    onChange={(e) => setSettings(s => ({ ...s, maxDailyAdRewards: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block font-mono">Prevents coin farming (default 5 claims/day)</span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {savingSettings ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Commit Ad Directives</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* --- TAB 3: REWARD PAYOUTS LEDGER --- */}
        {/* ========================================================================= */}
        {activeTab === 'payouts' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Ad Reward Disbursal Ledger
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Total Rewarded Claims: {stats?.totalRewardsClaimed || 0}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-mono uppercase text-[10px]">
                    <th className="px-5 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold">Recipient User</th>
                    <th className="px-4 py-3 font-semibold">Rewarded Campaign</th>
                    <th className="px-4 py-3 font-semibold">Coins Credited</th>
                    <th className="px-5 py-3 font-semibold text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {payoutLogs.length > 0 ? (
                    payoutLogs.map((log) => {
                      const meta = log.metadata || {};
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-900">
                              {log.user?.email || log.userId?.slice(0, 10)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {meta.adTitle || meta.campaignTitle || 'Rewarded Video Commercial'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <Coins size={11} className="text-amber-500" />
                              +{log.amount} Coins
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {log.balanceAfter} Coins
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-mono text-xs">
                        No ad reward payouts recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* --- CAMPAIGN BUILDER & EDITOR MODAL --- */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Radio size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingCampaignId ? 'Edit Ad Campaign' : 'Create Custom Ad Campaign'}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">Configure delivery format, targeting & per-ad coin reward</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
              
              {/* Campaign Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Apex Legends Mobile VIP Pass"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Ad Format Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ad Placement Format *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {AD_TYPES.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* PER-AD COIN REWARD CONFIGURATION (THE USER'S EXPLICIT FEATURE REQUEST!) */}
              <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <Coins size={15} className="text-amber-600" />
                    <span>Coins Given By Each Ad View (Wallet Reward)</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-700">
                    +{formData.rewardCoins} Coins / View
                  </span>
                </div>

                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Specify exactly how many coins are credited to the user's wallet when they watch or complete this ad.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={formData.rewardCoins}
                    onChange={(e) => setFormData(f => ({ ...f, rewardCoins: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="w-28 px-3 py-1.5 border border-amber-300 rounded-lg font-mono font-bold text-xs text-slate-900 bg-white focus:outline-none focus:border-amber-500"
                  />

                  {/* Quick Preset Pills */}
                  <div className="flex items-center gap-1">
                    {[10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, rewardCoins: amt }))}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors ${
                          formData.rewardCoins === amt 
                            ? 'bg-amber-600 text-white shadow-2xs' 
                            : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media Asset URL with Preview Button */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Media Asset URL (MP4 / Image) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData(f => ({ ...f, mediaUrl: e.target.value }))}
                    placeholder="https://...mp4 or https://...png"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  {formData.mediaUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewMedia({ url: formData.mediaUrl, type: formData.type, title: formData.title || 'Preview' })}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Play size={12} />
                      Preview
                    </button>
                  )}
                </div>
              </div>

              {/* Target Click URL & CTA Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Click URL</label>
                  <input
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData(f => ({ ...f, targetUrl: e.target.value }))}
                    placeholder="https://sponsor.com or Monetag link"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Call-To-Action (CTA) Button Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(f => ({ ...f, ctaText: e.target.value }))}
                    placeholder="e.g. Claim 50 Coins, Play Now"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Timing & Pacing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">Duration (s)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">Skip After (s)</label>
                  <input
                    type="number"
                    value={formData.skipAfter}
                    onChange={(e) => setFormData(f => ({ ...f, skipAfter: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">0 for unskippable</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">Max View Cap</label>
                  <input
                    type="number"
                    value={formData.maxViews}
                    onChange={(e) => setFormData(f => ({ ...f, maxViews: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Targeting: Countries & Genres */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">Country Targeting (ISO)</label>
                  <input
                    type="text"
                    value={formData.targetCountries}
                    onChange={(e) => setFormData(f => ({ ...f, targetCountries: e.target.value }))}
                    placeholder="ALL or IN, US, UK"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">Genre Targeting</label>
                  <input
                    type="text"
                    value={formData.targetGenres}
                    onChange={(e) => setFormData(f => ({ ...f, targetGenres: e.target.value }))}
                    placeholder="ALL or Action, Sci-Fi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Activate Campaign Immediately</span>
                <button
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                    formData.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCampaign}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {savingCampaign && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingCampaignId ? 'Update Campaign' : 'Publish Campaign'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MEDIA PREVIEW MODAL --- */}
      {/* ========================================================================= */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-800 truncate">{previewMedia.title}</span>
              <button 
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px]">
              {previewMedia.url.endsWith('.mp4') || previewMedia.type.includes('VIDEO') ? (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-[350px] w-full rounded-lg" 
                />
              ) : (
                <img 
                  src={previewMedia.url} 
                  alt="Ad Preview" 
                  className="max-h-[350px] object-contain rounded-lg" 
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
