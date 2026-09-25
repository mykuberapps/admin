"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  Users, Activity, Calendar, RefreshCw, AlertCircle,
  TrendingUp, Film, Zap, Wallet, Shield, Navigation, 
  Search, ArrowRight, CheckCircle2, Clock, Smartphone,
  Layers, BarChart3, PieChart, Eye, PlayCircle
} from "lucide-react";

interface AnalyticsData {
  timeRange: string;
  kpis: {
    totalMoves: number;
    totalUsers: number;
    totalAds: number;
    totalVideos: number;
    totalAuth: number;
  };
  timeline: {
    label: string;
    date: string;
    moves: number;
    video: number;
    ads: number;
    nav: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
  }[];
  funnel: {
    step: string;
    count: number;
    color: string;
  }[];
  recentMoves: {
    id: string;
    action: string;
    category: string;
    screen: string | null;
    targetId: string | null;
    metadata: any;
    platform: string;
    ipAddress: string | null;
    createdAt: string;
    user: { name: string | null; phone: string | null; email: string | null } | null;
  }[];
}

const CATEGORY_ICONS: Record<string, any> = {
  VIDEO: Film,
  AD: Zap,
  NAVIGATION: Navigation,
  WALLET: Wallet,
  AUTH: Shield,
  SEARCH: Search,
  NOTIFICATION: Eye,
};

const CATEGORY_COLORS: Record<string, string> = {
  VIDEO: "text-rose-600 bg-rose-50 border-rose-200",
  AD: "text-amber-600 bg-amber-50 border-amber-200",
  NAVIGATION: "text-blue-600 bg-blue-50 border-blue-200",
  WALLET: "text-emerald-600 bg-emerald-50 border-emerald-200",
  AUTH: "text-purple-600 bg-purple-50 border-purple-200",
  SEARCH: "text-cyan-600 bg-cyan-50 border-cyan-200",
  NOTIFICATION: "text-indigo-600 bg-indigo-50 border-indigo-200",
};

export default function GlobalAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [activeMetric, setActiveMetric] = useState<"all" | "video" | "ads" | "nav">("all");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/admin/analytics/overview?range=${timeRange}`);
      if (!res.ok) throw new Error(`Failed to fetch analytics (Status ${res.status})`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || "Failed to load telemetry");
      }
    } catch (err: any) {
      console.error("Analytics Error:", err);
      setError(err.message || "Network error loading analytics");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Compute maximum value for chart scaling
  const maxMoveValue = data?.timeline 
    ? Math.max(...data.timeline.map((t) => (activeMetric === "all" ? t.moves : (t as any)[activeMetric])), 10)
    : 10;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Global User Telemetry & Graphical Analytics</h1>
              <p className="text-xs text-gray-500">Real-time recording and visual analysis of every user move, step, stream, and ad engagement</p>
            </div>
          </div>
        </div>

        {/* Timeframe Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium text-gray-600">
            {(["today", "7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-white text-gray-900 font-bold shadow-xs"
                    : "hover:text-gray-900 text-gray-500"
                }`}
              >
                {range === "today" ? "Today" : range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-gray-400" : "text-gray-500"} />
            Sync
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total User Moves</span>
            <Activity size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.kpis.totalMoves.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-gray-500">Every interaction recorded</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Users</span>
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.kpis.totalUsers.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-gray-500">Registered viewer pool</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Video Plays</span>
            <Film size={16} className="text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {data?.kpis.totalVideos.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-gray-500">Streams & episode plays</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Commercial Ads</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {data?.kpis.totalAds.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-gray-500">ExoClick & Monetag events</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Auth & Sessions</span>
            <Shield size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {data?.kpis.totalAuth.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-gray-500">Logins & secure logouts</span>
        </div>
      </div>

      {/* Graphical Section: Move Velocity Chart & Funnel Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Interactive Move Velocity Timeline Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-600" />
                User Move Velocity & Activity Timeline
              </h2>
              <p className="text-xs text-gray-500">Chronological distribution of user steps across the platform</p>
            </div>

            {/* Metric Filter */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-600">
              <button
                type="button"
                onClick={() => setActiveMetric("all")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMetric === "all" ? "bg-white text-gray-900 shadow-2xs font-bold" : "hover:text-gray-900"
                }`}
              >
                All Steps
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric("video")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMetric === "video" ? "bg-white text-rose-600 shadow-2xs font-bold" : "hover:text-gray-900"
                }`}
              >
                Videos
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric("ads")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMetric === "ads" ? "bg-white text-amber-600 shadow-2xs font-bold" : "hover:text-gray-900"
                }`}
              >
                Ads
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric("nav")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMetric === "nav" ? "bg-white text-blue-600 shadow-2xs font-bold" : "hover:text-gray-900"
                }`}
              >
                Screens
              </button>
            </div>
          </div>

          {/* Bar / Column Visualizer */}
          <div className="pt-4">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
                <RefreshCw size={20} className="animate-spin" />
                <span>Aggregating telemetry...</span>
              </div>
            ) : !data?.timeline || data.timeline.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                No user moves recorded in this timeframe yet.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-60 flex items-end gap-1.5 pt-4 pb-2 px-1 border-b border-gray-100">
                  {data.timeline.map((point, idx) => {
                    const val = activeMetric === "all" ? point.moves : (point as any)[activeMetric];
                    const barHeightPct = Math.max(6, Math.min(100, Math.round((val / maxMoveValue) * 100)));
                    
                    const barColor = activeMetric === "video" 
                      ? "bg-rose-500 hover:bg-rose-600" 
                      : activeMetric === "ads" 
                      ? "bg-amber-500 hover:bg-amber-600" 
                      : activeMetric === "nav" 
                      ? "bg-blue-500 hover:bg-blue-600" 
                      : "bg-indigo-600 hover:bg-indigo-700";

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-mono px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-lg">
                          <span className="font-semibold">{point.label}</span>: {val} {activeMetric} moves
                        </div>

                        {/* Visual Column */}
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${barColor}`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 px-1 pt-1">
                  <span>{data.timeline[0]?.label}</span>
                  <span>{data.timeline[Math.floor(data.timeline.length / 2)]?.label}</span>
                  <span>{data.timeline[data.timeline.length - 1]?.label}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Step-by-Step User Journey Funnel (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Layers size={16} className="text-purple-600" />
              Step-by-Step User Journey Funnel
            </h2>
            <p className="text-xs text-gray-500">Progression from launch to ad engagement & coin claims</p>
          </div>

          <div className="space-y-4">
            {data?.funnel.map((stage, idx) => {
              const maxStage = data.funnel[0]?.count || 1;
              const widthPct = Math.max(12, Math.min(100, Math.round((stage.count / maxStage) * 100)));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{stage.step}</span>
                    <span className="font-mono text-gray-500 font-semibold">{stage.count.toLocaleString()}</span>
                  </div>

                  {/* Funnel Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Category Breakdown */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart size={13} className="text-blue-500" />
              Category Breakdown
            </h3>

            <div className="space-y-2">
              {data?.categoryBreakdown.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.category] || Activity;
                const colorClass = CATEGORY_COLORS[cat.category] || "text-gray-700 bg-gray-50 border-gray-200";

                return (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md border flex items-center justify-center ${colorClass}`}>
                        <Icon size={12} />
                      </span>
                      <span className="font-medium text-gray-800">{cat.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900">{cat.count.toLocaleString()}</span>
                      <span className="text-[11px] text-gray-400 font-mono w-10 text-right">({cat.percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Live Real-time Step-by-Step Move Stream */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-emerald-500" />
              Live User Move Stream & Audit Log
            </h3>
            <p className="text-xs text-gray-500">Every single move and step recorded in real-time across all mobile and web clients</p>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            Displaying latest {data?.recentMoves.length || 0} moves
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin" />
            <span>Loading real-time move stream...</span>
          </div>
        ) : !data?.recentMoves || data.recentMoves.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No moves recorded yet. Open the mobile app and navigate around to see real-time steps stream here!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action / Move</th>
                  <th className="py-3 px-4">Screen</th>
                  <th className="py-3 px-4">Platform / IP</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {data.recentMoves.map((m) => {
                  const Icon = CATEGORY_ICONS[m.category] || Activity;
                  const colorClass = CATEGORY_COLORS[m.category] || "text-gray-700 bg-gray-50 border-gray-200";
                  const userLabel = m.user ? (m.user.name || m.user.phone || m.user.email || "User") : "Anonymous";

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{userLabel}</div>
                        {m.user?.phone && <div className="text-[11px] text-gray-400">{m.user.phone}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colorClass}`}>
                          <Icon size={10} />
                          {m.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-gray-900 text-[11px]">
                          {m.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                        {m.screen || "—"}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-gray-700 font-mono uppercase">{m.platform}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{m.ipAddress || "—"}</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-[11px] font-mono text-gray-500">
                        {m.metadata ? JSON.stringify(m.metadata) : "—"}
                      </td>

                      <td className="py-3 px-4 text-right text-gray-500 text-[11px] font-mono">
                        {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
