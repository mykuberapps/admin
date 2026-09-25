"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  Search, AlertCircle, Database, TrendingUp, Hash, 
  ArrowRight, BarChart3, Activity, RefreshCw, Download, 
  Layers, Users, CheckCircle2, AlertTriangle, Clock, 
  Filter, Copy, Check, ExternalLink, Flame
} from "lucide-react";

interface SearchTelemetryData {
  timeRange: string;
  kpis: {
    totalSearches: number;
    successfulSearches: number;
    zeroResultCount: number;
    successRate: number;
    gapRate: number;
    uniqueQueriesCount: number;
    uniqueSearchersCount: number;
    avgResultsPerQuery: number;
  };
  timeline: {
    label: string;
    date: string;
    total: number;
    hits: number;
    misses: number;
  }[];
  topHits: {
    query: string;
    count: number;
    avgResults: number;
  }[];
  topMisses: {
    query: string;
    count: number;
    priority: "CRITICAL" | "HIGH" | "MODERATE";
  }[];
  stream: {
    items: {
      id: string;
      query: string;
      resultsCount: number;
      createdAt: string;
      user: { id: string; name: string | null; phone: string | null; email: string | null } | null;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function SearchAnalyticsPage() {
  const [data, setData] = useState<SearchTelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [streamFilter, setStreamFilter] = useState<"ALL" | "HITS" | "ZERO_RESULTS">("ALL");
  const [searchQueryFilter, setSearchQueryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [chartMetric, setChartMetric] = useState<"total" | "hits" | "misses">("total");
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchSearchTelemetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParam = searchQueryFilter.trim() ? `&search=${encodeURIComponent(searchQueryFilter.trim())}` : "";
      const url = `${apiUrl}/admin/analytics/search?range=${timeRange}&type=${streamFilter}&page=${page}&limit=25${searchParam}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch search telemetry (Status ${res.status})`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || "Failed to load search telemetry");
      }
    } catch (err: any) {
      console.error("Search Telemetry Error:", err);
      setError(err.message || "Network error loading search telemetry");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, timeRange, streamFilter, page, searchQueryFilter]);

  useEffect(() => {
    fetchSearchTelemetry();
  }, [fetchSearchTelemetry]);

  // Handle Query Copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(text);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!data?.stream?.items || data.stream.items.length === 0) return;
    const headers = "ID,Query,ResultsCount,Status,User,Phone,Timestamp\n";
    const rows = data.stream.items.map((i) => {
      const status = i.resultsCount > 0 ? "HIT" : "ZERO_RESULT";
      const userName = i.user?.name || "Anonymous";
      const userPhone = i.user?.phone || "";
      return `"${i.id}","${i.query}",${i.resultsCount},"${status}","${userName}","${userPhone}","${i.createdAt}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `search_telemetry_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxChartValue = data?.timeline
    ? Math.max(...data.timeline.map((t) => t[chartMetric]), 5)
    : 5;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <Search size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Search Telemetry & Content Intelligence</h1>
              <p className="text-xs text-gray-500">In-depth search query forensics, user discovery intent, catalog fulfillment rate, and content gap radar</p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium text-gray-600">
            {(["today", "7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setTimeRange(range);
                  setPage(1);
                }}
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

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            title="Download CSV report"
          >
            <Download size={13} className="text-gray-500" />
            Export
          </button>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => fetchSearchTelemetry()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
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

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Searches */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Searches</span>
            <Search size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.kpis.totalSearches.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-gray-500">
            Across {data?.kpis.uniqueSearchersCount || 0} unique searchers
          </span>
        </div>

        {/* Fulfillment Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fulfillment Rate</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {data?.kpis.successRate || 0}%
          </div>
          <span className="text-[11px] text-gray-500">
            {data?.kpis.successfulSearches || 0} searches delivered content
          </span>
        </div>

        {/* Content Gap Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Content Gap Rate</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {data?.kpis.gapRate || 0}%
          </div>
          <span className="text-[11px] text-rose-600 font-medium">
            {data?.kpis.zeroResultCount || 0} zero-result missed queries
          </span>
        </div>

        {/* Avg Results Per Query */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Matches Per Query</span>
            <Hash size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.kpis.avgResultsPerQuery || 0}
          </div>
          <span className="text-[11px] text-gray-500">
            {data?.kpis.uniqueQueriesCount || 0} distinct query keywords
          </span>
        </div>
      </div>

      {/* Graphical Section: Search Volume Velocity Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-600" />
              Search Velocity & Discovery Trend
            </h2>
            <p className="text-xs text-gray-500">Query volume progression over time comparing fulfilled hits vs missed searches</p>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setChartMetric("total")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMetric === "total" ? "bg-white text-gray-900 shadow-2xs font-bold" : "hover:text-gray-900"
              }`}
            >
              Total Queries
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("hits")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMetric === "hits" ? "bg-white text-emerald-600 shadow-2xs font-bold" : "hover:text-gray-900"
              }`}
            >
              Fulfilled (Hits)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("misses")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMetric === "misses" ? "bg-white text-rose-600 shadow-2xs font-bold" : "hover:text-gray-900"
              }`}
            >
              Zero-Results (Gaps)
            </button>
          </div>
        </div>

        {/* Column Visualizer */}
        <div className="pt-2">
          {loading ? (
            <div className="h-56 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
              <RefreshCw size={20} className="animate-spin" />
              <span>Rendering discovery telemetry...</span>
            </div>
          ) : !data?.timeline || data.timeline.length === 0 || !data.timeline.some(t => t.total > 0) ? (
            <div className="h-56 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
              <Activity size={24} className="text-gray-300" />
              <span className="font-medium text-gray-500">No search activity recorded in this timeframe.</span>
              <span className="text-[11px] text-gray-400">Real searches performed by users in the mobile app will populate this velocity chart in real-time.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-52 flex items-end gap-1.5 pt-4 pb-2 px-1 border-b border-gray-100">
                {data.timeline.map((pt, idx) => {
                  const val = pt[chartMetric];
                  const barHeightPct = val === 0 ? 0 : Math.max(8, Math.min(100, Math.round((val / maxChartValue) * 100)));
                  const barColor = chartMetric === "hits" 
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : chartMetric === "misses"
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-cyan-600 hover:bg-cyan-700";

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-mono px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-lg">
                        <span className="font-semibold">{pt.label}</span>: {val} {chartMetric}
                      </div>

                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${barColor}`}
                        style={{ height: `${barHeightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 px-1 pt-1">
                <span>{data.timeline[0]?.label}</span>
                <span>{data.timeline[Math.floor(data.timeline.length / 2)]?.label}</span>
                <span>{data.timeline[data.timeline.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Intelligence: Top Hits vs Content Gap Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Top Catalog Hits */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Top Performing Catalog Searches
              </h3>
              <p className="text-xs text-gray-500">Most requested keywords that successfully delivered titles</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              FULFILLED
            </span>
          </div>

          <div className="space-y-2.5">
            {(!data?.topHits || data.topHits.length === 0) ? (
              <p className="text-xs text-gray-400 py-8 text-center italic">No fulfilled search hits recorded yet.</p>
            ) : (
              data.topHits.map((h, idx) => {
                const maxCount = data.topHits[0]?.count || 1;
                const widthPct = Math.max(10, Math.min(100, Math.round((h.count / maxCount) * 100)));

                return (
                  <div key={h.query} className="space-y-1 p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-[11px] font-mono font-bold text-gray-400">#{idx + 1}</span>
                        <span className="font-bold text-gray-900 font-mono">"{h.query}"</span>
                        <span className="text-[10px] text-gray-500 font-mono">({h.avgResults} matches)</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">{h.count} searches</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Content Gap Radar (Zero Results) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Flame size={16} className="text-rose-500" />
                Content Gap Radar (Missing Titles)
              </h3>
              <p className="text-xs text-gray-500">Unfulfilled search demand highlighting missing movies & shows</p>
            </div>
            <span className="text-[11px] font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              ACQUISITION PRIORITY
            </span>
          </div>

          <div className="space-y-2.5">
            {(!data?.topMisses || data.topMisses.length === 0) ? (
              <p className="text-xs text-gray-400 py-8 text-center italic">No content gaps recorded. All searches found matching titles!</p>
            ) : (
              data.topMisses.map((m, idx) => {
                const priorityBadge = m.priority === "CRITICAL"
                  ? "bg-red-500 text-white"
                  : m.priority === "HIGH"
                  ? "bg-amber-500 text-white"
                  : "bg-gray-200 text-gray-700";

                return (
                  <div key={m.query} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-[11px] font-mono font-bold text-gray-400">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-gray-900 font-mono text-xs">"{m.query}"</div>
                        <span className="text-[10px] text-rose-600 font-medium">Missing from catalog</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-xs">{m.count} misses</span>
                      <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${priorityBadge}`}>
                        {m.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Live Search Query Telemetry Stream (Audit Log) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              Live Search Query Audit Stream
            </h3>
            <p className="text-xs text-gray-500">Granular chronological stream of every individual search executed by users</p>
          </div>

          <span className="text-xs text-gray-500 font-mono">
            {data?.stream?.pagination?.total.toLocaleString() || 0} total queries logged
          </span>
        </div>

        {/* Stream Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Query Filter Input */}
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQueryFilter}
              onChange={(e) => {
                setSearchQueryFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Search keyword in telemetry..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => { setStreamFilter("ALL"); setPage(1); }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                streamFilter === "ALL" ? "bg-white text-gray-900 shadow-2xs font-bold" : "hover:text-gray-900"
              }`}
            >
              All Queries
            </button>
            <button
              type="button"
              onClick={() => { setStreamFilter("HITS"); setPage(1); }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                streamFilter === "HITS" ? "bg-white text-emerald-600 shadow-2xs font-bold" : "hover:text-gray-900"
              }`}
            >
              Hits (Results &gt; 0)
            </button>
            <button
              type="button"
              onClick={() => { setStreamFilter("ZERO_RESULTS"); setPage(1); }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                streamFilter === "ZERO_RESULTS" ? "bg-white text-rose-600 shadow-2xs font-bold" : "hover:text-gray-900"
              }`}
            >
              Zero-Results (Gaps)
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin" />
            <span>Loading live query stream...</span>
          </div>
        ) : (!data?.stream?.items || data.stream.items.length === 0) ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No search telemetry found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Search Query</th>
                  <th className="py-3 px-4">Status & Matches</th>
                  <th className="py-3 px-4">Searcher / User</th>
                  <th className="py-3 px-4 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {data.stream.items.map((item) => {
                  const isHit = item.resultsCount > 0;
                  const userLabel = item.user ? (item.user.name || item.user.phone || item.user.email || "Registered User") : "Guest User";

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 text-xs">
                            "{item.query}"
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.query)}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                            title="Copy query"
                          >
                            {copiedQuery === item.query ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isHit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> {item.resultsCount} matches found
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle size={11} /> 0 results (Content Gap)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{userLabel}</div>
                        {item.user?.phone && <div className="text-[10px] text-gray-400 font-mono">{item.user.phone}</div>}
                      </td>

                      <td className="py-3 px-4 text-right text-gray-500 text-[11px] font-mono">
                        {new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {data.stream.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-mono">
                  Page {data.stream.pagination.page} of {data.stream.pagination.totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= data.stream.pagination.totalPages}
                    onClick={() => setPage(p => Math.min(data.stream.pagination.totalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
