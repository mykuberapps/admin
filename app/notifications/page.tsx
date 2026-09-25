"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Bell, Send, Users, Sparkles, Image as ImageIcon, Link as LinkIcon, 
  Trash2, RefreshCw, CheckCircle2, AlertCircle, Search, X, Check,
  Film, Gift, Zap, Shield, Smartphone, ArrowRight, Eye, UserCheck,
  TrendingUp, BarChart3, Radio
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface BroadcastStats {
  totalBroadcasts: number;
  totalSent: number;
  totalRead: number;
  overallOpenRate: string;
}

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  type: "SYSTEM" | "PROMO" | "REWARD" | "MOVIE" | "UPDATE";
  imageUrl?: string | null;
  actionUrl?: string | null;
  targetType: "ALL" | "SELECTED";
  targetUserIds: string[];
  sentBy: string;
  totalSent: number;
  totalRead: number;
  createdAt: string;
}

interface UserSummary {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  totalWatchTime: number;
}

const NOTIFICATION_TYPES = [
  { id: "SYSTEM", label: "System Alert", icon: Shield, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "PROMO", label: "Promo / Offer", icon: Zap, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "REWARD", label: "Coins & Reward", icon: Gift, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "MOVIE", label: "Movie / Premiere", icon: Film, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { id: "UPDATE", label: "App Update", icon: Sparkles, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
] as const;

const QUICK_ACTIONS = [
  { label: "Wallet Screen", url: "/(tabs)/wallet" },
  { label: "Movie Details", url: "/movie/featured" },
  { label: "Profile Screen", url: "/(tabs)/profile" },
  { label: "Earn Rewards", url: "/(tabs)/wallet" },
];

export default function BroadcastCenterPage() {
  const { showToast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"SYSTEM" | "PROMO" | "REWARD" | "MOVIE" | "UPDATE">("SYSTEM");
  const [imageUrl, setImageUrl] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [targetType, setTargetType] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsersMap, setSelectedUsersMap] = useState<Record<string, UserSummary>>({});
  
  // UI States
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [previewMode, setPreviewMode] = useState<"lockscreen" | "inapp">("lockscreen");
  
  // Data State
  const [stats, setStats] = useState<BroadcastStats>({
    totalBroadcasts: 0,
    totalSent: 0,
    totalRead: 0,
    overallOpenRate: "0.0",
  });
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);

  // User Picker Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
  const [userModalPage, setUserModalPage] = useState(1);
  const [userModalTotalPages, setUserModalTotalPages] = useState(1);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // ---------------------------------------------------------------------------
  // FETCH BROADCAST HISTORY & STATS
  // ---------------------------------------------------------------------------
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${apiUrl}/admin/notifications/broadcasts?page=${historyPage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBroadcasts(data.data || []);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to load broadcast history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [apiUrl, historyPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ---------------------------------------------------------------------------
  // FETCH USERS FOR MODAL SELECTION
  // ---------------------------------------------------------------------------
  const fetchUsersForPicker = useCallback(async (query = "", page = 1) => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`${apiUrl}/admin/notifications/users?search=${encodeURIComponent(query)}&page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAvailableUsers(data.users || []);
          if (data.pagination) {
            setUserModalTotalPages(data.pagination.totalPages || 1);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (isUserModalOpen) {
      const timer = setTimeout(() => {
        fetchUsersForPicker(userSearchQuery, userModalPage);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isUserModalOpen, userSearchQuery, userModalPage, fetchUsersForPicker]);

  // Toggle user selection
  const toggleSelectUser = (user: UserSummary) => {
    setSelectedUserIds((prev) => {
      const exists = prev.includes(user.id);
      if (exists) {
        const next = prev.filter((id) => id !== user.id);
        setSelectedUsersMap((map) => {
          const clone = { ...map };
          delete clone[user.id];
          return clone;
        });
        return next;
      } else {
        setSelectedUsersMap((map) => ({ ...map, [user.id]: user }));
        return [...prev, user.id];
      }
    });
  };

  const selectAllOnPage = () => {
    const newIds = [...selectedUserIds];
    const newMap = { ...selectedUsersMap };
    availableUsers.forEach((u) => {
      if (!newIds.includes(u.id)) {
        newIds.push(u.id);
        newMap[u.id] = u;
      }
    });
    setSelectedUserIds(newIds);
    setSelectedUsersMap(newMap);
  };

  const clearAllSelected = () => {
    setSelectedUserIds([]);
    setSelectedUsersMap({});
  };

  // ---------------------------------------------------------------------------
  // SEND BROADCAST
  // ---------------------------------------------------------------------------
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Notification Title is required.", "error");
      return;
    }
    if (!message.trim()) {
      showToast("Notification Message is required.", "error");
      return;
    }

    if (targetType === "SELECTED" && selectedUserIds.length === 0) {
      showToast("Please select at least 1 user or switch to 'All Users'.", "error");
      return;
    }

    const confirmText = targetType === "ALL" 
      ? "Broadcast to ALL registered users? This will trigger in-app inbox delivery and push notifications for all users." 
      : `Send notification to ${selectedUserIds.length} selected user(s)?`;

    if (!window.confirm(confirmText)) {
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        imageUrl: imageUrl.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
        targetType,
        targetUserIds: targetType === "SELECTED" ? selectedUserIds : undefined,
      };

      const res = await fetch(`${apiUrl}/admin/notifications/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Notification broadcast sent successfully!", "success");
        // Reset form
        setTitle("");
        setMessage("");
        setImageUrl("");
        setActionUrl("");
        if (targetType === "SELECTED") {
          setSelectedUserIds([]);
          setSelectedUsersMap({});
        }
        // Refresh history
        fetchHistory();
      } else {
        showToast(data.message || "Failed to dispatch broadcast.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error sending broadcast.", "error");
    } finally {
      setIsSending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE BROADCAST
  // ---------------------------------------------------------------------------
  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this broadcast? It will be removed from history and recipient inboxes.")) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/admin/notifications/broadcasts/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Broadcast deleted.", "success");
        fetchHistory();
      } else {
        showToast(data.message || "Failed to delete broadcast.", "error");
      }
    } catch (err: any) {
      showToast("Error deleting broadcast.", "error");
    }
  };

  const activeTypeMeta = NOTIFICATION_TYPES.find((t) => t.id === type) || NOTIFICATION_TYPES[0];
  const ActiveIcon = activeTypeMeta.icon;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notification & Broadcast Center</h1>
              <p className="text-xs text-gray-500">Dispatch in-app notifications and real-time push alerts to all or targeted users</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchHistory()}
            disabled={isLoadingHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={isLoadingHistory ? "animate-spin text-gray-400" : "text-gray-500"} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Broadcasts</span>
            <Radio size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalBroadcasts.toLocaleString()}</div>
          <span className="text-[11px] text-gray-500">Campaigns launched</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Delivered</span>
            <Send size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalSent.toLocaleString()}</div>
          <span className="text-[11px] text-gray-500">In-app inbox items created</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Opened / Read</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.totalRead.toLocaleString()}</div>
          <span className="text-[11px] text-gray-500">Read by active viewers</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Engagement</span>
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.overallOpenRate}%</div>
          <span className="text-[11px] text-emerald-600 font-medium">Verified open rate</span>
        </div>
      </div>

      {/* Main Composer & Interactive Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Broadcast Composer (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-rose-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Compose New Broadcast</h2>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">STEP 1 OF 2: AUDIENCE & COPY</span>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-5">
            
            {/* 1. Target Audience Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                1. Target Audience
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType("ALL")}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    targetType === "ALL"
                      ? "border-rose-500 bg-rose-50/40 shadow-sm ring-1 ring-rose-500"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    targetType === "ALL" ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-gray-900">All Registered Users</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Broadcast to entire user base across all devices</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType("SELECTED");
                    if (selectedUserIds.length === 0) {
                      setIsUserModalOpen(true);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    targetType === "SELECTED"
                      ? "border-purple-500 bg-purple-50/40 shadow-sm ring-1 ring-purple-500"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    targetType === "SELECTED" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-gray-900">Selected Users</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {selectedUserIds.length > 0 ? (
                        <span className="text-purple-600 font-semibold">{selectedUserIds.length} user(s) selected</span>
                      ) : (
                        "Pick specific user recipients via search"
                      )}
                    </div>
                  </div>
                </button>
              </div>

              {/* Selected Users Chips if targetType is SELECTED */}
              {targetType === "SELECTED" && (
                <div className="mt-3 p-3 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-purple-900">
                      Recipients ({selectedUserIds.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsUserModalOpen(true)}
                        className="text-[11px] text-purple-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Search size={11} />
                        {selectedUserIds.length > 0 ? "Edit Selection" : "Search & Select Users"}
                      </button>
                      {selectedUserIds.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllSelected}
                          className="text-[11px] text-gray-500 hover:text-rose-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedUserIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {selectedUserIds.map((id) => {
                        const u = selectedUsersMap[id];
                        const label = u ? (u.name || u.phone || u.email || id.slice(0, 8)) : id.slice(0, 8);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-white border border-purple-200 text-purple-800 shadow-2xs"
                          >
                            <span>{label}</span>
                            <button
                              type="button"
                              onClick={() => toggleSelectUser(u || { id, name: null, phone: null, email: null, createdAt: '', totalWatchTime: 0 })}
                              className="hover:text-rose-600 text-purple-400"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(true)}
                      className="w-full py-2 border border-dashed border-purple-300 rounded-lg text-center text-xs text-purple-700 font-medium hover:bg-purple-100/50 transition-colors"
                    >
                      + Click here to search and select target users
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Notification Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                2. Notification Category & Theme
              </label>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as any)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected 
                          ? `${t.color} ring-2 ring-offset-1 ring-gray-400 font-semibold shadow-xs`
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={13} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Title & Message */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    3. Notification Title *
                  </label>
                  <span className="text-[10px] text-gray-400">{title.length}/80</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekend Double Coins: Watch & Earn ₹50 Bonus!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    4. Announcement Message *
                  </label>
                  <span className="text-[10px] text-gray-400">{message.length}/300</span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={300}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Stream any blockbuster movie for 10 minutes today and claim instant bonus coins into your wallet. Tap to start streaming now!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow resize-none"
                />
              </div>
            </div>

            {/* 5. Optional Media & Deep Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Banner Image URL <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <ImageIcon size={14} />
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Action Deep Link <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="text"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="/(tabs)/wallet or /movie/:id"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-gray-400 mr-1">Quick Presets:</span>
              {QUICK_ACTIONS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setActionUrl(q.url)}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Send CTA Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <Shield size={12} className="text-emerald-500" />
                Audience: <strong className="text-gray-800">{targetType === "ALL" ? "All Active Users" : `${selectedUserIds.length} Selected Users`}</strong>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Dispatch Broadcast
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Interactive Smartphone Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <Smartphone size={14} className="text-rose-500" />
              Live Smartphone Preview
            </div>
            
            {/* Toggle Preview Mode */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[10px] font-medium text-gray-600">
              <button
                type="button"
                onClick={() => setPreviewMode("lockscreen")}
                className={`px-2 py-1 rounded-md transition-colors ${
                  previewMode === "lockscreen" ? "bg-white text-gray-900 shadow-2xs font-semibold" : "hover:text-gray-900"
                }`}
              >
                Push Banner
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("inapp")}
                className={`px-2 py-1 rounded-md transition-colors ${
                  previewMode === "inapp" ? "bg-white text-gray-900 shadow-2xs font-semibold" : "hover:text-gray-900"
                }`}
              >
                In-App Card
              </button>
            </div>
          </div>

          {/* Device Frame */}
          <div className="w-full max-w-[340px] mx-auto bg-[#0a0c10] p-3 rounded-[38px] shadow-2xl border-4 border-[#1f242d] ring-1 ring-white/10">
            {/* Screen Inner */}
            <div className="w-full aspect-[9/18.5] bg-gradient-to-b from-[#161a22] via-[#0d1017] to-black rounded-[28px] overflow-hidden flex flex-col relative text-white">
              
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] mr-3" />
                <div className="w-2 h-2 rounded-full bg-blue-900/60" />
              </div>

              {/* Status Bar */}
              <div className="pt-2 px-6 flex justify-between items-center text-[10px] font-semibold text-gray-400 shrink-0 z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 border border-gray-400 rounded-xs flex items-center p-0.5">
                    <div className="w-full h-full bg-gray-400" />
                  </div>
                </div>
              </div>

              {previewMode === "lockscreen" ? (
                /* LOCKSCREEN NOTIFICATION PREVIEW */
                <div className="flex-1 flex flex-col px-4 pt-10">
                  {/* Clock */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-extralight tracking-tight text-gray-100">09:41</div>
                    <div className="text-[11px] text-gray-400 font-medium">Thursday, September 10</div>
                  </div>

                  {/* Push Notification Card */}
                  <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 shadow-lg text-white space-y-2 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-[9px] font-black text-white shadow-xs">
                          K
                        </div>
                        <span className="font-semibold tracking-wide text-gray-200">KUBER</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-gray-200 uppercase font-mono">
                          {activeTypeMeta.label}
                        </span>
                      </div>
                      <span className="text-gray-400 text-[10px]">now</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {title || "Notification Title Appears Here"}
                      </h4>
                      <p className="text-[11px] text-gray-300 mt-1 line-clamp-3 leading-relaxed">
                        {message || "Your broadcast body message will show up right here in the phone notification drawer."}
                      </p>
                    </div>

                    {/* Banner Image Preview */}
                    {imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imageUrl} 
                          alt="Banner preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {actionUrl && (
                      <div className="pt-1 flex items-center justify-between text-[10px] text-amber-400 font-semibold">
                        <span>Tap to view in app</span>
                        <ArrowRight size={10} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* IN-APP INBOX PREVIEW */
                <div className="flex-1 flex flex-col pt-6 px-3">
                  <div className="px-1 py-2 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-rose-400" />
                      <span className="text-xs font-bold text-white">Notifications</span>
                    </div>
                    <span className="text-[10px] text-rose-400 font-medium">1 new</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="p-3 rounded-xl bg-white/10 border border-white/15 relative">
                      <div className="w-2 h-2 rounded-full bg-rose-500 absolute top-3 right-3" />
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                          <ActiveIcon size={14} className="text-rose-400" />
                        </div>
                        <div className="flex-1 pr-3">
                          <h5 className="text-xs font-bold text-white line-clamp-1">
                            {title || "Notification Title"}
                          </h5>
                          <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-2">
                            {message || "Notification message content..."}
                          </p>
                          <span className="text-[9px] text-gray-500 mt-1 block">Just now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Home Bar Indicator */}
              <div className="p-2 flex justify-center shrink-0">
                <div className="w-28 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Broadcast Audit Log & Telemetry</h3>
            <p className="text-xs text-gray-500">Historical delivery metrics, open rates, and recipient performance</p>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {broadcasts.length} past campaigns recorded
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-gray-400" />
            <span>Loading broadcast records...</span>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No broadcast notifications dispatched yet. Use the composer above to send your first announcement.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Notification / Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4">Read</th>
                  <th className="py-3 px-4">Open Rate</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {broadcasts.map((b) => {
                  const typeMeta = NOTIFICATION_TYPES.find((t) => t.id === b.type) || NOTIFICATION_TYPES[0];
                  const Icon = typeMeta.icon;
                  const openRate = b.totalSent > 0 ? ((b.totalRead / b.totalSent) * 100).toFixed(1) : "0.0";

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{b.title}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-1 max-w-xs">{b.message}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${typeMeta.color}`}>
                          <Icon size={10} />
                          {typeMeta.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {b.targetType === "ALL" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                            <Users size={10} /> All Users
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <UserCheck size={10} /> {b.totalSent} Selected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                        {b.totalSent.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600">
                        {b.totalRead.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, Number(openRate))}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-gray-600 font-semibold">{openRate}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        {new Date(b.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteBroadcast(b.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete broadcast"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* USER PICKER MODAL (FOR TARGETED BROADCASTS) */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Select Target Recipients</h3>
                  <p className="text-[11px] text-gray-500">Pick specific users who should receive this notification</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-150 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setUserModalPage(1);
                  }}
                  placeholder="Search by name, phone, or email..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
                <button
                  type="button"
                  onClick={selectAllOnPage}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Select Page ({availableUsers.length})
                </button>
                <button
                  type="button"
                  onClick={clearAllSelected}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-rose-600 hover:bg-gray-50"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Modal Users List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 min-h-[250px]">
              {isLoadingUsers ? (
                <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Searching users...</span>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="py-16 text-center text-xs text-gray-500">
                  No users found matching "{userSearchQuery}".
                </div>
              ) : (
                availableUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const initial = (user.name || user.email || user.phone || "U").charAt(0).toUpperCase();

                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleSelectUser(user)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected 
                          ? "border-purple-300 bg-purple-50/70"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700"
                        }`}>
                          {initial}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900">
                            {user.name || "Anonymous User"}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2">
                            {user.phone && <span>{user.phone}</span>}
                            {user.email && <span>{user.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
              <div className="font-semibold text-purple-900">
                {selectedUserIds.length} user(s) selected
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors shadow-xs"
                >
                  Done ({selectedUserIds.length})
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
