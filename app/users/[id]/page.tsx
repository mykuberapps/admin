"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShieldAlert, History, RotateCcw, Trash2, Ban, 
  CheckCircle2, Activity, User as UserIcon, Calendar, Mail,
  Phone, Clock, Monitor, Wallet, GitBranch, AlertTriangle, 
  Coins, Terminal, Database, Server
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

// ---- Types ----------------------------------------------------------------

interface Device {
  id: string;
  deviceId: string;
  platform: string;
  ipAddress: string | null;
  lastSeenAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  status: string;
  createdAt: string;
  metadata: Record<string, any> | null;
}

interface ReferralEntry {
  id: string;
  status: string;
  isSuspicious: boolean;
  suspicionReason: string | null;
  referrerReward: number;
  createdAt: string;
  referee: { id: string; name: string; phone: string };
}

interface UserDetail {
  id: string;
  email: string;
  phone: string;
  name: string;
  uid: string | null;
  isBanned: boolean;
  banReason: string | null;
  isVerified: boolean;
  totalWatchTime: number;
  createdAt: string;
  _count: { devices: number; sessions: number; watchSessions: number };
  wallet: {
    id: string;
    balance: number;
    transactions: Transaction[];
  } | null;
  devices: Device[];
  authLogs: { id: string; event: string; ipAddress: string | null; userAgent: string | null; createdAt: string }[];
  referral: {
    myCode: string | null;
    referredBy: {
      name: string | null;
      phone: string | null;
      status: string;
      isSuspicious: boolean;
      suspicionReason: string | null;
    } | null;
    referralsMade: number;
    totalEarned: number;
    referrals: ReferralEntry[];
  };
}

// ---- Helpers ---------------------------------------------------------------

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---- Page ------------------------------------------------------------------

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"moves" | "activity" | "wallet" | "referral" | "devices">("moves");
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [moveCategoryFilter, setMoveCategoryFilter] = useState<string>("ALL");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchUser = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/users/${params.id}`);
      if (!res.ok) {
        showToast("Record not found in database.", "error");
        router.push("/users");
        return;
      }
      const data = await res.json();
      if (data.success) setUser(data.data);
    } catch {
      showToast("Data synchronization failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (isBanned: boolean) => {
    const reason = isBanned ? window.prompt("Provide quarantine rationale:") : null;
    if (isBanned && reason === null) return;

    setProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${params.id}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned, reason }),
      });
      if (res.ok) {
        showToast(isBanned ? "Access revoked." : "Access restored.", "success");
        fetchUser();
      }
    } catch {
      showToast("Operation failed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Execute forced termination of all active sessions for this UID?")) return;
    setProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${params.id}/reset`, { method: "POST" });
      if (res.ok) showToast("All sessions terminated.", "success");
    } catch {
      showToast("Session termination failed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`CRITICAL: Drop all database records for ${user?.name}? This action cannot be reversed.`)) return;
    setProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Record purged successfully.", "success");
        router.push("/users");
      } else {
        showToast("Purge operation failed.", "error");
      }
    } catch {
      showToast("Purge operation failed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUserAnalytics = async (category = "ALL") => {
    setLoadingAnalytics(true);
    try {
      const catParam = category !== "ALL" ? `&category=${category}` : "";
      const res = await fetch(`${apiUrl}/admin/analytics/users/${params.id}?limit=100${catParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUserAnalytics(data);
      }
    } catch (e) {
      console.warn("Failed to load user analytics:", e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchUserAnalytics(moveCategoryFilter);
    }
  }, [params.id, moveCategoryFilter]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center gap-3">
        <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
        <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Querying identity matrix...</p>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { key: "moves", label: "User Moves & Analytics", icon: <Activity size={14} /> },
    { key: "activity", label: "Auth Audit Log", icon: <History size={14} /> },
    { key: "wallet", label: "Financial Ledger", icon: <Wallet size={14} /> },
    { key: "referral", label: "Referral Network", icon: <GitBranch size={14} /> },
    { key: "devices", label: "Registered Devices", icon: <Monitor size={14} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-sm text-gray-900">
      
      {/* Top Console Header */}
      <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/users")}
            className="text-gray-500 hover:text-gray-900 transition-colors"
            title="Return to Directory"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-gray-500" />
            <div>
              <h1 className="text-xs font-semibold text-gray-900 leading-tight uppercase font-mono tracking-wider">Identity Inspector</h1>
              <p className="text-[10px] text-gray-500 font-mono">/admin/users/{user.id}</p>
            </div>
          </div>
        </div>

        {/* Global Directives */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={processing}
            className="h-8 px-3 bg-white border border-gray-200 text-gray-700 rounded text-xs font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} /> SIGTERM Sessions
          </button>
          <button
            onClick={() => handleBan(!user.isBanned)}
            disabled={processing}
            className={`h-8 px-3 border rounded text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 ${
              user.isBanned 
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            }`}
          >
            {user.isBanned ? <><CheckCircle2 size={14} /> Lift Quarantine</> : <><Ban size={14} /> Enforce Quarantine</>}
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <button
            onClick={handleDelete}
            disabled={processing}
            className="h-8 px-3 bg-white border border-red-200 text-red-600 rounded text-xs font-medium flex items-center gap-2 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> Drop Record
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Identity Core Card */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-500 shrink-0">
                <UserIcon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-semibold text-gray-900 truncate max-w-sm">{user.name || "UNASSIGNED_SUBJECT"}</h2>
                  {user.isBanned ? (
                    <span className="px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono uppercase tracking-wider rounded">Quarantined</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-mono uppercase tracking-wider rounded">Active</span>
                  )}
                  {user.isVerified && (
                     <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono uppercase tracking-wider rounded">Verified</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-500">
                  {user.email && <span className="flex items-center gap-1.5"><Mail size={12}/>{user.email}</span>}
                  {user.phone && <span className="flex items-center gap-1.5"><Phone size={12}/>{user.phone}</span>}
                  <span className="flex items-center gap-1.5"><Calendar size={12}/>Epoch: {new Date(user.createdAt).toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">System UID</p>
              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-700">{user.id}</p>
            </div>
          </div>

          {/* Quarantine Notice */}
          {user.isBanned && user.banReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 shadow-sm">
              <ShieldAlert size={14} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs font-mono text-red-700 leading-relaxed break-words">
                <span className="font-bold">QUARANTINE_RATIONALE:</span> {user.banReason}
              </div>
            </div>
          )}

          {/* Telemetry KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={<Clock size={16} />} label="Total Watch Time" value={formatDuration(user.totalWatchTime)} />
            <MetricCard icon={<Monitor size={16} />} label="Registered Devices" value={user._count.devices.toString()} />
            <MetricCard icon={<History size={16} />} label="Media Sessions" value={user._count.watchSessions.toString()} />
            <MetricCard icon={<Coins size={16} />} label="Ledger Balance" value={user.wallet?.balance.toString() ?? "0"} />
          </div>

          {/* Sub-System Navigation */}
          <div className="flex items-center gap-1 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Sub-Views */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
            
                        {/* User Moves & Graphical Analytics */}
            {activeTab === "moves" && (
              <div className="p-6 space-y-6">
                {/* Visual Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1: 7-Day Move Velocity Bar Chart */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={13} className="text-indigo-600" />
                        7-Day Activity Habit
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        Total: {userAnalytics?.stats?.totalSteps || 0} steps
                      </span>
                    </div>

                    <div className="h-36 flex items-end gap-2 pt-4 pb-1 px-1 border-b border-gray-200">
                      {(userAnalytics?.stats?.timeline || []).map((pt: any, idx: number) => {
                        const maxVal = Math.max(...(userAnalytics?.stats?.timeline || []).map((p: any) => p.steps), 5);
                        const heightPct = Math.max(8, Math.min(100, Math.round((pt.steps / maxVal) * 100)));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                            <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 shadow">
                              {pt.steps} moves
                            </div>
                            <div
                              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-t transition-all"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[9px] font-mono text-gray-400 mt-1">{pt.label.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 2: Category Distribution */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                      Move Category Distribution
                    </span>

                    <div className="space-y-2.5 pt-1">
                      {(userAnalytics?.stats?.categories || []).length === 0 ? (
                        <p className="text-xs text-gray-400 py-6 text-center italic">No categorized moves recorded yet.</p>
                      ) : (
                        (userAnalytics?.stats?.categories || []).map((c: any) => (
                          <div key={c.category} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-700">{c.category}</span>
                              <span className="font-mono text-gray-500 font-medium">{c.count} ({c.percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${c.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Move Audit Feed */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Chronological Step-by-Step Move Feed
                      </h4>
                      <p className="text-[11px] text-gray-500">Every single move, screen view, video play, and ad event</p>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium">
                      {["ALL", "AUTH", "NAVIGATION", "VIDEO", "AD", "WALLET", "SEARCH"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setMoveCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            moveCategoryFilter === cat
                              ? "bg-indigo-600 text-white font-bold"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingAnalytics ? (
                    <div className="py-12 text-center text-xs text-gray-400">Loading user step history...</div>
                  ) : (!userAnalytics?.moves || userAnalytics.moves.length === 0) ? (
                    <div className="py-12 text-center text-xs text-gray-400">No user moves recorded under this filter.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5">Action / Step</th>
                            <th className="px-4 py-2.5">Screen</th>
                            <th className="px-4 py-2.5">Platform / IP</th>
                            <th className="px-4 py-2.5">Metadata</th>
                            <th className="px-4 py-2.5 text-right">Timestamp (UTC)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {userAnalytics.moves.map((m: any) => {
                            const isLogout = m.action === "LOGOUT_SUCCESS";
                            const isLogin = m.action === "LOGIN_SUCCESS";

                            return (
                              <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-4 py-2.5">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                    {m.category}
                                  </span>
                                </td>

                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                    isLogout 
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : isLogin
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-blue-50 text-blue-700"
                                  }`}>
                                    {m.action}
                                  </span>
                                </td>

                                <td className="px-4 py-2.5 font-mono text-gray-600 text-[11px]">
                                  {m.screen || "—"}
                                </td>

                                <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">
                                  <span>{m.platform}</span> · <span>{m.ipAddress || "NULL"}</span>
                                </td>

                                <td className="px-4 py-2.5 font-mono text-[10px] text-gray-500 max-w-xs truncate">
                                  {m.metadata ? JSON.stringify(m.metadata) : "—"}
                                </td>

                                <td className="px-4 py-2.5 font-mono text-gray-400 text-right text-[11px]">
                                  {new Date(m.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
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
            )}

            {/* Auth Audit Log */}
            {activeTab === "activity" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium">Event Vector</th>
                      <th className="px-4 py-3 font-medium">Source IP</th>
                      <th className="px-4 py-3 font-medium">Client Agent</th>
                      <th className="px-4 py-3 font-medium">Timestamp (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {user.authLogs.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">No authentication telemetry available.</td></tr>
                    ) : (
                      user.authLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${
                              log.event.includes("FAILED") ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}>
                              {log.event}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-gray-600">{log.ipAddress || "NULL"}</td>
                          <td className="px-4 py-2.5 text-gray-500 truncate max-w-xs" title={log.userAgent || ""}>{log.userAgent || "NULL"}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-500">{new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Ledger */}
            {activeTab === "wallet" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium">Transaction Type</th>
                      <th className="px-4 py-3 font-medium text-right">Delta</th>
                      <th className="px-4 py-3 font-medium text-right">Post-Tx Balance</th>
                      <th className="px-4 py-3 font-medium">Execution Status</th>
                      <th className="px-4 py-3 font-medium">Timestamp (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(!user.wallet?.transactions || user.wallet.transactions.length === 0) ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No ledger entries found.</td></tr>
                    ) : (
                      user.wallet.transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-700 uppercase tracking-wider">
                              {tx.type}
                            </span>
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {tx.amount >= 0 ? "+" : ""}{tx.amount}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-600">{tx.balanceAfter}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${
                              tx.status === "SUCCESS" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-gray-500">{new Date(tx.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Referral Network */}
            {activeTab === "referral" && (
              <div className="flex flex-col md:flex-row">
                {/* Meta Side */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 p-5 space-y-6">
                  <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Subject's Routing Code</p>
                    <div className="p-3 bg-white border border-gray-200 rounded flex items-center justify-between shadow-sm">
                      <span className="font-mono text-lg font-bold text-gray-900 tracking-widest">{user.referral.myCode ?? "NULL"}</span>
                    </div>
                  </div>

                  {user.referral.referredBy && (
                    <div>
                      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Upstream Referrer</p>
                      <div className="p-3 bg-white border border-gray-200 rounded shadow-sm space-y-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 truncate">{user.referral.referredBy.name ?? "UNASSIGNED"}</span>
                          <span className="text-[10px] font-mono text-gray-500">{user.referral.referredBy.phone}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border ${
                            user.referral.referredBy.status === 'REWARDED' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-600'
                          }`}>
                            {user.referral.referredBy.status}
                          </span>
                          {user.referral.referredBy.isSuspicious && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border bg-red-50 border-red-200 text-red-700">
                              <AlertTriangle size={10} /> Suspicious: {user.referral.referredBy.suspicionReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Network Yield</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white border border-gray-200 rounded shadow-sm">
                        <span className="text-[10px] text-gray-500 block">Conversions</span>
                        <span className="font-mono font-bold text-gray-900">{user.referral.referralsMade}</span>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded shadow-sm">
                        <span className="text-[10px] text-gray-500 block">Gross Yield</span>
                        <span className="font-mono font-bold text-green-600">+{user.referral.totalEarned}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-3 font-medium">Downstream Node</th>
                        <th className="px-4 py-3 font-medium">Network Status</th>
                        <th className="px-4 py-3 font-medium text-right">Yield</th>
                        <th className="px-4 py-3 font-medium">Timestamp (UTC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {user.referral.referrals.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">No downstream referrals propagated.</td></tr>
                      ) : (
                        user.referral.referrals.map(ref => (
                          <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">{ref.referee.name}</span>
                                <span className="font-mono text-[10px] text-gray-500">{ref.referee.phone}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider ${
                                  ref.status === 'REWARDED' ? 'bg-green-50 border-green-200 text-green-700' : 
                                  ref.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-700' :
                                  'bg-amber-50 border-amber-200 text-amber-700'
                                }`}>
                                  {ref.status}
                                </span>
                                {ref.isSuspicious && (
                                  <span className="flex items-center gap-1 text-[9px] font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-100 uppercase tracking-wider">
                                    <AlertTriangle size={8} /> Flagged
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">
                              {ref.referrerReward > 0 ? <span className="text-green-600">+{ref.referrerReward}</span> : "0"}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-gray-500">{new Date(ref.createdAt).toISOString().replace('T', ' ').slice(0, 10)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Devices */}
            {activeTab === "devices" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium">Hardware Identifier</th>
                      <th className="px-4 py-3 font-medium">Environment</th>
                      <th className="px-4 py-3 font-medium">Network IP</th>
                      <th className="px-4 py-3 font-medium">Last Handshake (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {user.devices.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">No registered hardware nodes.</td></tr>
                    ) : (
                      user.devices.map(device => (
                        <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-gray-600">{device.deviceId}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-700 uppercase tracking-wider">
                              {device.platform}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-gray-500">{device.ipAddress || "NULL"}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-500">{new Date(device.lastSeenAt).toISOString().replace('T', ' ').slice(0, 19)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}

// ----- UI Helper Components -----

function MetricCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-md shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-gray-500">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider font-mono truncate">{label}</span>
      </div>
      <p className="text-xl font-mono text-gray-900 tracking-tight truncate">{value}</p>
    </div>
  );
}