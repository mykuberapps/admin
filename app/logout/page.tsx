"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { Power } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // Purge local authentication state
    localStorage.removeItem("admin_api_key");
    localStorage.removeItem("admin_api_username");
    
    showToast("Session credentials purged. Gateway connection closed.", "info");
    
    // Redirect to login after a brief simulated teardown
    const timer = setTimeout(() => {
      router.push("/login");
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [router, showToast]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center font-mono p-6">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <Power className="text-blue-600" size={32} />
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">System State</p>
          <p className="text-sm font-semibold">TERMINATING_SECURE_SESSION</p>
        </div>
      </div>
    </div>
  );
}