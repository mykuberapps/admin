"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, ShieldAlert, Zap, Key, RefreshCw, Activity, Lock, 
  Clock, AlertOctagon, UserCheck, Save, Server, Wrench, Download
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface SecurityLog {
  id: string;
  userId: string | null;
  event: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
  user: {
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Settings State
  const [rateLimitLimit, setRateLimitLimit] = useState(30);
  const [gatewayAdminKey, setGatewayAdminKey] = useState("nawed-api-key");
  const [tokenRotationEnabled, setTokenRotationEnabled] = useState(true);
  const [referralCodeLength, setReferralCodeLength] = useState(6);
  const [referralCodePrefix, setReferralCodePrefix] = useState("KUBER");
  
  // App Update & Maintenance States
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [appDownloadUrl, setAppDownloadUrl] = useState("");
  const [appForceUpdate, setAppForceUpdate] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  // Feature Toggle States
  const [walletEnabled, setWalletEnabled] = useState(true);
  const [adsEnabled, setAdsEnabled] = useState(true);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchSettingsAndLogs = async () => {
    try {
      const [logsRes, settingsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/security/logs`),
        fetch(`${apiUrl}/admin/system-settings`)
      ]);

      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(logsData.data);
        setLastUpdated(new Date());
      }

      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data) {
        setRateLimitLimit(settingsData.data.rateLimitLimit);
        setGatewayAdminKey(settingsData.data.gatewayAdminKey);
        setTokenRotationEnabled(settingsData.data.tokenRotationEnabled);
        setReferralCodeLength(settingsData.data.referralCodeLength);
        setReferralCodePrefix(settingsData.data.referralCodePrefix);
        setAppVersion(settingsData.data.appVersion || "1.0.0");
        setAppDownloadUrl(settingsData.data.appDownloadUrl || "");
        setAppForceUpdate(!!settingsData.data.appForceUpdate);
        setMaintenanceMode(!!settingsData.data.maintenanceMode);
        setMaintenanceMessage(settingsData.data.maintenanceMessage || "");
        setWalletEnabled(settingsData.data.walletEnabled !== undefined ? !!settingsData.data.walletEnabled : true);
        setAdsEnabled(settingsData.data.adsEnabled !== undefined ? !!settingsData.data.adsEnabled : true);
      }
    } catch (e) {
      console.error("Failed to sync console parameters", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
    const interval = setInterval(fetchSettingsAndLogs, 15000); // Auto-sync every 15s
    return () => clearInterval(interval);
  }, []);

  const triggerRefresh = () => {
    setRefreshing(true);
    fetchSettingsAndLogs();
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/system-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateLimitLimit,
          gatewayAdminKey,
          tokenRotationEnabled,
          referralCodeLength,
          referralCodePrefix,
          appVersion,
          appDownloadUrl,
          appForceUpdate,
          maintenanceMode,
          maintenanceMessage,
          walletEnabled,
          adsEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Global security directives updated.", "success");
        localStorage.setItem("admin_api_key", gatewayAdminKey);
      } else {
        showToast("Directive commit failed.", "error");
      }
    } catch (e) {
      showToast("Network fault during directive commit.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getEventBadgeClass = (event: string) => {
    switch (event) {
      case "REFRESH_TOKEN_REUSE_ATTACK":
        return "bg-red-50 text-red-700 border-red-200";
      case "LOGIN_SUCCESS":
      case "REGISTER_SUCCESS":
      case "TOKEN_REFRESHED":
        return "bg-green-50 text-green-700 border-green-200";
      case "LOGOUT":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatMetadata = (meta: any) => {
    if (!meta) return "NULL";
    if (typeof meta === "object") {
      return Object.entries(meta)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join(", ");
    }
    return String(meta);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center gap-3">
        <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
        <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Establishing secure connection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-sm text-gray-900">
      
      {/* Console Header */}
      <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-gray-500" size={18} />
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">Security Operations Console</h1>
            <p className="text-[11px] text-gray-500 font-mono">/admin/security</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            <Clock size={12} />
            {lastUpdated ? `Sync: ${lastUpdated.toLocaleTimeString()}` : "Syncing..."}
            <button
              onClick={triggerRefresh}
              disabled={refreshing}
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors ml-1 disabled:opacity-50"
              title="Force sync"
            >
              <RefreshCw size={10} className={`${refreshing ? "animate-spin text-blue-600" : "text-gray-500"}`} />
            </button>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
            Commit Directives
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* Global Security Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Rate Limiting */}
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-gray-500">
                <Zap size={14} />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider font-mono">Rate Limiting</h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 uppercase">Active</span>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <input
                type="number"
                value={rateLimitLimit}
                onChange={(e) => setRateLimitLimit(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-sm font-mono text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                min="1"
              />
              <span className="text-[10px] text-gray-500 font-mono">req/min</span>
            </div>
          </div>

          {/* Gateway Key */}
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-gray-500">
                <Key size={14} />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider font-mono">Gateway API Key</h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 uppercase">Enforced</span>
            </div>
            <div className="mt-auto">
              <input
                type="text"
                value={gatewayAdminKey}
                onChange={(e) => setGatewayAdminKey(e.target.value)}
                className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs font-mono text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Token Rotation */}
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-gray-500">
                <Activity size={14} />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider font-mono">Token Rotation</h3>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${tokenRotationEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {tokenRotationEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono">Replay Attack Mit.</span>
              <button
                onClick={() => setTokenRotationEnabled(!tokenRotationEnabled)}
                className={`w-8 h-4 rounded-sm transition-colors relative flex items-center ${tokenRotationEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-3 h-3 bg-white rounded-sm transition-transform ${tokenRotationEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Crypto Config */}
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-gray-500">
                <Lock size={14} />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider font-mono">Referral Crypto Setup</h3>
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <div className="flex-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase mb-0.5 block">Prefix</label>
                <input
                  type="text"
                  value={referralCodePrefix}
                  onChange={(e) => setReferralCodePrefix(e.target.value.toUpperCase())}
                  className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs font-mono text-gray-900 focus:bg-white focus:border-blue-500 outline-none uppercase"
                />
              </div>
              <div className="w-16">
                <label className="text-[9px] font-mono text-gray-400 uppercase mb-0.5 block">Length</label>
                <input
                  type="number"
                  value={referralCodeLength}
                  onChange={(e) => setReferralCodeLength(parseInt(e.target.value) || 6)}
                  className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs font-mono text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                  min="4"
                  max="12"
                />
              </div>
            </div>
          </div>
        </div>

        {/* App Version & Maintenance Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Maintenance Mode Configuration */}
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-gray-500">
                <Wrench size={14} />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider font-mono">System Maintenance Mode</h3>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${maintenanceMode ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {maintenanceMode ? 'Active' : 'Offline'}
              </span>
            </div>
            
            <div className="my-3 flex flex-col gap-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase block">Maintenance Notice Message</label>
              <textarea
                rows={2}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="We are upgrading our servers. Please check back soon!"
                className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs font-sans text-gray-900 focus:bg-white focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="text-[10px] text-gray-500 font-mono">Lock Application</span>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-8 h-4 rounded-sm transition-colors relative flex items-center ${maintenanceMode ? 'bg-red-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-3 h-3 bg-white rounded-sm transition-transform ${maintenanceMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* App Update Configuration */}
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-gray-500">
                <Download size={14} />
                <h3 className="text-[10px] font-semibold uppercase tracking-wider font-mono">App Update & Sideload Controls</h3>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${appForceUpdate ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {appForceUpdate ? 'Force' : 'Optional'}
              </span>
            </div>

            <div className="my-3 flex gap-3">
              <div className="w-24">
                <label className="text-[9px] font-mono text-gray-400 uppercase mb-0.5 block">App Version</label>
                <input
                  type="text"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs font-mono text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase mb-0.5 block">Direct APK URL</label>
                <input
                  type="text"
                  value={appDownloadUrl}
                  onChange={(e) => setAppDownloadUrl(e.target.value)}
                  placeholder="https://kuber.app/apk/kuber-v1.1.0.apk"
                  className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm text-xs font-mono text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="text-[10px] text-gray-500 font-mono">Force Update (Blocks App Use)</span>
              <button
                onClick={() => setAppForceUpdate(!appForceUpdate)}
                className={`w-8 h-4 rounded-sm transition-colors relative flex items-center ${appForceUpdate ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-3 h-3 bg-white rounded-sm transition-transform ${appForceUpdate ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Feature Toggles Panel */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Zap size={14} className="text-yellow-500" />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider font-mono">Live Feature Toggles</h3>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border bg-blue-50 text-blue-700 border-blue-200">
              On-The-Fly Hot Toggles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wallet System Switch */}
            <div className="border border-gray-100 rounded p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-700">Wallet System</span>
                <span className="text-[9px] text-gray-400 font-mono">Coin balance & watch rewards</span>
              </div>
              <button
                onClick={() => setWalletEnabled(!walletEnabled)}
                className={`w-8 h-4 rounded-sm transition-colors relative flex items-center ${walletEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-3 h-3 bg-white rounded-sm transition-transform ${walletEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Ad Networks Switch */}
            <div className="border border-gray-100 rounded p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-700">Ad Monetization</span>
                <span className="text-[9px] text-gray-400 font-mono">Monetag video ads & campaigns</span>
              </div>
              <button
                onClick={() => setAdsEnabled(!adsEnabled)}
                className={`w-8 h-4 rounded-sm transition-colors relative flex items-center ${adsEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span className={`block w-3 h-3 bg-white rounded-sm transition-transform ${adsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Audit Trail Table */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-gray-500" />
              <h2 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider font-mono">
                System Audit Trail
              </h2>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 border border-gray-200 rounded bg-white text-gray-500">
              TAIL -N 50
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-gray-500 font-mono uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2.5 font-medium">Timestamp (UTC)</th>
                  <th className="px-4 py-2.5 font-medium">Event Type</th>
                  <th className="px-4 py-2.5 font-medium">Principal Identifiers</th>
                  <th className="px-4 py-2.5 font-medium">Source IP</th>
                  <th className="px-4 py-2.5 font-medium">Event Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Activity size={20} className="text-gray-300" />
                        <span className="text-xs font-medium font-mono uppercase">NO_EVENTS_LOGGED</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isThreat = log.event === "REFRESH_TOKEN_REUSE_ATTACK";
                    return (
                      <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${isThreat ? "bg-red-50/50" : ""}`}>
                        <td className="px-4 py-2.5 font-mono text-gray-500">
                          {new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider ${getEventBadgeClass(log.event)}`}>
                            {isThreat && <ShieldAlert size={10} />}
                            {log.event}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {log.user ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                                {log.user.name || "UNNAMED_PRINCIPAL"}
                              </span>
                              <span className="text-[10px] font-mono text-gray-500 truncate max-w-[200px]">
                                {log.user.phone || log.user.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-gray-400">SYSTEM_PROCESS</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-gray-600">
                          {log.ipAddress || "NULL"}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-gray-500 truncate max-w-xs xl:max-w-md">
                          {formatMetadata(log.metadata)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}