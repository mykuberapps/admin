"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Lock, Key, User, ShieldAlert, ArrowRight, Activity } from "lucide-react";
import { useToast } from "@/components/toast-provider";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const existingKey = localStorage.getItem("admin_api_key");
    if (existingKey) router.push("/");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !apiKey) {
      showToast("Credentials required for authentication gateway.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/security/logs`, {
        headers: { "X-Admin-API-Key": apiKey },
      });

      if (res.ok) {
        localStorage.setItem("admin_api_username", username);
        localStorage.setItem("admin_api_key", apiKey);
        showToast("Handshake successful. Session established.", "success");
        router.push("/");
      } else {
        showToast("Handshake failed: Invalid credentials provided.", "error");
      }
    } catch (err) {
      showToast("Authentication gateway unreachable.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-center items-center p-6 font-sans">
      {/* Background System Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="w-full max-w-sm bg-white border border-gray-200 shadow-sm rounded-md p-8 relative z-10">
        
        {/* Terminal Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-10 h-10 rounded-sm bg-gray-900 flex items-center justify-center shadow-sm">
            <Terminal className="text-blue-500" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 uppercase font-mono">Kuber Admin Console</h1>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em] mt-1">Version 2.4.0-stable</p>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase font-mono flex items-center gap-1.5">
              <User size={12} /> Account ID
            </label>
            <input
              type="text"
              placeholder="root_admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-mono transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase font-mono flex items-center gap-1.5">
              <Key size={12} /> Authentication Token
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none font-mono transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Activity size={12} className="animate-spin" /> Verifying...</span>
            ) : (
              <>
                <span>Initialize Session</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Telemetry/Security Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-start gap-3">
          <ShieldAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[9px] text-gray-500 leading-relaxed font-mono">
            SECURITY_NOTICE: This is a private environment. Unauthorized access attempts are monitored and recorded at the firewall level.
          </p>
        </div>
      </div>
    </div>
  );
}