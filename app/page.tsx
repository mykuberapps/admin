"use client";

import { useEffect, useState } from "react";
import { Users, Wallet, PlayCircle, GitBranch, TrendingUp, AlertTriangle, Clock, RefreshCw } from "lucide-react";

interface PlatformStats {
  users: { total: number; newThisWeek: number };
  platform: { totalCoinBalance: number };
  streaming: { activeWatchSessions: number };
  referrals: { total: number; rewarded: number; pending: number; suspicious: number };
}

interface StatCardProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
}

function StatCard({ icon, iconColor, label, value, sub, subColor }: StatCardProps) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ padding: "10px", borderRadius: "10px", background: iconColor + "1a", color: iconColor }}>
          {icon}
        </div>
        {sub && (
          <span style={{ color: subColor || "var(--success)", fontSize: "0.8125rem", fontWeight: 600 }}>
            {sub}
          </span>
        )}
      </div>
      <div style={{ fontSize: "0.8125rem", color: "var(--secondary)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        setLastUpdated(new Date());
      }
    } catch {
      // Silently fail — dashboard degrades gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  const weekChange = stats
    ? `+${stats.users.newThisWeek} this week`
    : null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>
            System Overview
          </h1>
          <p style={{ color: "var(--secondary)" }}>
            Welcome back, Administrator. Here&apos;s the live state of Kuber.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--secondary)", fontSize: "0.75rem" }}>
          <Clock size={12} />
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString()}`
            : "Syncing..."}
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--secondary)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", padding: "4px" }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "24px",
        marginBottom: "40px"
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ height: "120px", background: "var(--surface)", opacity: 0.5 }} />
          ))
        ) : (
          <>
            <StatCard
              icon={<Users size={24} />}
              iconColor="#3b82f6"
              label="Total Users"
              value={stats?.users.total.toLocaleString() ?? "—"}
              sub={weekChange ?? undefined}
              subColor="var(--success)"
            />
            <StatCard
              icon={<Wallet size={24} />}
              iconColor="#8b5cf6"
              label="Platform Coin Balance"
              value={stats ? `${stats.platform.totalCoinBalance.toLocaleString()} coins` : "—"}
            />
            <StatCard
              icon={<PlayCircle size={24} />}
              iconColor="#eab308"
              label="Active Watch Sessions"
              value={stats?.streaming.activeWatchSessions.toLocaleString() ?? "—"}
              sub="Right now"
              subColor="var(--warning)"
            />
            <StatCard
              icon={<GitBranch size={24} />}
              iconColor="#22c55e"
              label="Total Referrals"
              value={stats?.referrals.total.toLocaleString() ?? "—"}
              sub={stats ? `${stats.referrals.rewarded} rewarded` : undefined}
              subColor="var(--success)"
            />
          </>
        )}
      </div>

      {/* Secondary Row */}
      {stats && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          {/* Referral Health */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>Referral Health</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              {[
                { label: "Rewarded", value: stats.referrals.rewarded, color: "var(--success)" },
                { label: "Pending", value: stats.referrals.pending, color: "var(--warning)" },
                { label: "Suspicious", value: stats.referrals.suspicious, color: "var(--error)" },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center", padding: "16px", background: "var(--surface)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: "4px" }}>{item.label}</div>
                </div>
              ))}
            </div>
            {stats.referrals.suspicious > 0 && (
              <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--error)" }}>
                <AlertTriangle size={14} />
                {stats.referrals.suspicious} suspicious referral{stats.referrals.suspicious > 1 ? "s" : ""} require manual review.
              </div>
            )}
          </div>

          {/* Growth Signal */}
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>Growth Signal</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>New Users (7d)</span>
                <span style={{ fontWeight: 700, color: "var(--success)" }}>+{stats.users.newThisWeek}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Referral Conversion</span>
                <span style={{ fontWeight: 700 }}>
                  {stats.referrals.total > 0
                    ? `${Math.round((stats.referrals.rewarded / stats.referrals.total) * 100)}%`
                    : "N/A"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--secondary)", fontSize: "0.875rem" }}>Live Streams</span>
                <span style={{ fontWeight: 700, color: stats.streaming.activeWatchSessions > 0 ? "var(--success)" : "var(--secondary)" }}>
                  {stats.streaming.activeWatchSessions}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
