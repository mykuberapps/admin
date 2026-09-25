"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Lock, Key, User, ShieldAlert, ArrowRight, 
  Activity, Eye, EyeOff, Sparkles, CheckCircle2 
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { getApiUrl } from "@/utils/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  const apiUrl = getApiUrl();

  // Check if already authenticated with a valid key
  useEffect(() => {
    const existingKey = localStorage.getItem("admin_api_key");
    if (!existingKey) {
      setCheckingExisting(false);
      return;
    }

    fetch(`${apiUrl}/admin/system-settings`, {
      headers: { "X-Admin-API-Key": existingKey }
    })
      .then((res) => {
        if (res.ok) {
          router.replace("/");
        } else {
          localStorage.removeItem("admin_api_key");
          localStorage.removeItem("admin_api_username");
          setCheckingExisting(false);
        }
      })
      .catch(() => {
        setCheckingExisting(false);
      });
  }, [router, apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanKey = apiKey.trim();

    if (!cleanUsername || !cleanKey) {
      showToast("Both Operator ID and Master Security Key are strictly required.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/system-settings`, {
        headers: { 
          "X-Admin-API-Key": cleanKey,
          "X-Admin-Username": cleanUsername
        },
      });

      if (res.ok) {
        localStorage.setItem("admin_api_username", cleanUsername);
        localStorage.setItem("admin_api_key", cleanKey);
        localStorage.setItem("admin_auth_time", new Date().toISOString());

        showToast(`Access granted. Welcome back, ${cleanUsername}.`, "success");
        router.replace("/");
      } else {
        showToast("Authentication Denied: Invalid Security Key or unauthorized identity.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Authentication gateway unreachable. Check network/server connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-xs text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <span className="tracking-wider uppercase">Verifying Security Handshake...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Cyber Grid Lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]" 
        style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
        }}
      />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 relative z-10">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock className="text-white" size={22} />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                KUBER STUDIO
              </h1>
              <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold rounded-full">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Executive Command & Ingestion Gateway
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User size={13} className="text-indigo-400" /> Operator Identity
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. nawed or admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                autoFocus
                className="w-full h-11 px-3.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key size={13} className="text-indigo-400" /> Master Security Key
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter secret authorization key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
                required
                className="w-full h-11 px-3.5 pr-10 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Activity size={14} className="animate-spin" /> Verifying Security Token...
              </span>
            ) : (
              <>
                <span>Authenticate Session</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Security Notice Footer */}
        <div className="mt-8 pt-5 border-t border-white/5 flex items-start gap-2.5">
          <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
            RESTRICTED PORTAL: Access is monitored. Every authorization event is cryptographically audited and recorded to the security ledger.
          </p>
        </div>
      </div>

      {/* Version Tag */}
      <div className="mt-6 flex items-center gap-3 text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Secure SSL Gateway
        </span>
        <span>•</span>
        <span>Kuber v2.5 Enterprise</span>
      </div>
    </div>
  );
}