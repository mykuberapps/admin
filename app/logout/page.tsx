"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { Power, ShieldOff } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // Purge all stored administrative session data
    localStorage.removeItem("admin_api_key");
    localStorage.removeItem("admin_api_username");
    localStorage.removeItem("admin_auth_time");
    
    showToast("Session terminated. Security credentials revoked.", "info");
    
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [router, showToast]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-mono p-6 select-none">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shadow-xl animate-pulse">
          <ShieldOff size={28} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Access Control
          </p>
          <h2 className="text-sm font-bold text-white tracking-wider">
            TERMINATING_SECURE_SESSION
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Revoking operator access tokens and clearing storage...
          </p>
        </div>
      </div>
    </div>
  );
}