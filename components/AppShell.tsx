"use client";

import React from "react";
import { 
  Users, LayoutDashboard, Wallet, Settings, LogOut, 
  Search, Bell, ShieldCheck, Video, CloudUpload, 
  Monitor, ChevronRight, Sparkles, Activity, 
  Database, BarChart3, HardDrive, Terminal, GitBranch, Layers, Megaphone
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUpload } from "@/components/UploadProvider";
import { UploadStatusBar } from "@/components/UploadStatusBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { tasks, isWidgetHidden, setWidgetHidden } = useUpload();
  const [serverJobCount, setServerJobCount] = React.useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const pathname = usePathname();
  const router = useRouter();
  
  const [authorized, setAuthorized] = React.useState(false);
  const [adminUsername, setAdminUsername] = React.useState("Administrator");
  const [adminInitials, setAdminInitials] = React.useState("AD");

  React.useEffect(() => {
    if (pathname === "/login") {
      setAuthorized(true);
      return;
    }

    let key = localStorage.getItem("admin_api_key");
    let username = localStorage.getItem("admin_api_username");
    if (!key) {
      const defaultKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "kuber_admin_secret_key_2026";
      localStorage.setItem("admin_api_key", defaultKey);
      localStorage.setItem("admin_api_username", "Administrator");
      key = defaultKey;
      username = "Administrator";
    }
    
    setAuthorized(true);
    if (username) {
      setAdminUsername(username);
      setAdminInitials(username.slice(0, 2).toUpperCase());
    }
  }, [pathname, router]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !(window.fetch as any).__patched) {
      const originalFetch = window.fetch;
      const patchedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        let urlStr = "";
        let newInit = init ? { ...init } : {};
        
        if (typeof input === "string") {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.toString();
        } else if (input && typeof input === 'object' && 'url' in input) {
          urlStr = (input as any).url;
        }

        const effectiveAdminKey = localStorage.getItem("admin_api_key") || process.env.NEXT_PUBLIC_ADMIN_API_KEY || "kuber_admin_secret_key_2026";
        
        if (urlStr.includes("/admin/")) {
          const headersObj: Record<string, string> = {};
          let hasKey = false;
          
          if (newInit.headers) {
            const h = new Headers(newInit.headers);
            h.forEach((value, key) => { 
              headersObj[key] = value; 
              if (key.toLowerCase() === 'x-admin-api-key') hasKey = true;
            });
          } else if (typeof input === 'object' && 'headers' in input) {
            const h = new Headers((input as Request).headers);
            h.forEach((value, key) => { 
              headersObj[key] = value; 
              if (key.toLowerCase() === 'x-admin-api-key') hasKey = true;
            });
          }
          
          if (!hasKey && effectiveAdminKey) {
            headersObj["X-Admin-API-Key"] = effectiveAdminKey;
          }
          const adminUsername = localStorage.getItem("admin_api_username") || "Administrator";
          if (adminUsername) {
            headersObj["X-Admin-Username"] = adminUsername;
          }

          // If body is FormData, do not set Content-Type header so the browser sets the boundary automatically
          if (newInit.body instanceof FormData) {
            delete headersObj["Content-Type"];
            delete headersObj["content-type"];
          }

          newInit.headers = headersObj;
        }
        
        let finalInput = input;
        // If input was a Request object, and we are modifying headers, it's safer to reconstruct it
        if (typeof input === 'object' && 'url' in input) {
          finalInput = (input as any).url;
          newInit.method = newInit.method || (input as any).method;
          newInit.body = newInit.body || (input as any).body;
          newInit.credentials = newInit.credentials || (input as any).credentials;
          newInit.mode = newInit.mode || (input as any).mode;
        }

        const response = await originalFetch(finalInput, newInit);
        // Only redirect to /login on explicit security endpoint failures, never on content/media 401s
        if (response.status === 401 && urlStr.includes("/admin/security/")) {
          localStorage.removeItem("admin_api_key");
          localStorage.removeItem("admin_api_username");
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return response;
      };
      (patchedFetch as any).__patched = true;
      window.fetch = patchedFetch;
    }
  }, []);

  const activeTasks = tasks.filter(t => !['COMPLETED', 'FAILED'].includes(t.status));

  // Sync with server-side jobs for persistent tab visibility
  React.useEffect(() => {
    if (pathname === "/login") return;

    const fetchGlobalJobs = async () => {
      const adminKey = localStorage.getItem("admin_api_key");
      if (!adminKey) return;

      try {
        const res = await fetch(`${apiUrl}/admin/videos/jobs`);
        const data = await res.json();
        if (data.success) {
          const activeCount = data.data.filter((j: any) => j.status === 'PROCESSING' || j.status === 'PENDING').length;
          setServerJobCount(activeCount);
        }
      } catch (e: any) { 
        // Suppress console.error to avoid Next.js dev overlay
        console.warn('Jobs sync failed:', e.message); 
      }
    };

    fetchGlobalJobs();
    const interval = setInterval(fetchGlobalJobs, 8000); // Sync every 8s
    return () => clearInterval(interval);
  }, [apiUrl, pathname]);

  // Use the larger number to ensure visibility across refreshes
  const totalActive = Math.max(activeTasks.length, serverJobCount);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center font-mono text-xs text-gray-500 space-y-4">
        <span className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span>Verifying secure admin session...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-sm text-gray-900">
      
      {/* Sidebar - Technical Console Style */}
      <aside className="w-64 flex flex-col bg-white border-r border-gray-200 shrink-0 z-20">
        
        {/* System Identifier */}
        <div className="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center shadow-sm">
              <Terminal size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-gray-900">KUBER</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-200 bg-white text-gray-500 uppercase tracking-wider">
            ADMIN
          </span>
        </div>
        
        {/* Navigation Directory */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          
          {/* Primary Nav */}
          <nav className="space-y-0.5">
            <NavItem href="/" icon={<LayoutDashboard size={14} />} label="System Dashboard" />
            <NavItem href="/users" icon={<Users size={14} />} label="User Registry" />
            <NavItem href="/notifications" icon={<Bell size={14} />} label="Broadcast Center" />
            <NavItem href="/analytics" icon={<BarChart3 size={14} />} label="Global Telemetry" />
            <NavItem href="/search-analytics" icon={<Search size={14} />} label="Search Telemetry" />
            <NavItem href="/referrals" icon={<GitBranch size={14} />} label="Referral Network" />
            <NavItem href="/transactions" icon={<Wallet size={14} />} label="Financial Ledger" />
          </nav>
          
          {/* Media Operations */}
          <div>
            <NavSectionHeader label="Media Operations" />
            <nav className="space-y-0.5">
              <NavItem href="/content" icon={<Video size={14} />} label="Content Library" />
              <NavItem href="/studio/upload" icon={<CloudUpload size={14} />} label="Ingestion Center" />
              <NavItem href="/studio/homepage" icon={<Monitor size={14} />} label="Layout Orchestrator" />
              <NavItem href="/studio/explore" icon={<Sparkles size={14} />} label="Explore Design" />
            </nav>
          </div>

          {/* Core Infrastructure */}
          <div>
            <NavSectionHeader label="Core Infrastructure" />
            <nav className="space-y-0.5">
              <Link href="/processing" className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <Activity size={14} className={`${totalActive > 0 ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-700'}`} />
                  {totalActive > 0 && (
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  )}
                </div>
                <span>Processing Engine</span>
                {totalActive > 0 && (
                  <span className="ml-auto text-[10px] font-mono font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
                    {totalActive}
                  </span>
                )}
              </Link>
              <NavItem href="/processing/queues" icon={<Layers size={14} />} label="BullMQ Dashboard" />
              <NavItem href="/storage" icon={<Database size={14} />} label="Media Operations Center" />
              <NavItem href="/settings/sentry" icon={<Activity size={14} />} label="Sentry Dashboard" />
              <NavItem href="/settings/logs" icon={<Terminal size={14} />} label="System Logs" />
            </nav>
          </div>

          {/* System Config */}
          <div>
            <NavSectionHeader label="System Configuration" />
            <nav className="space-y-0.5">
              <NavItem href="/settings/ads" icon={<Megaphone size={14} />} label="Campaigns & Ads" />
              <NavItem href="/settings" icon={<Settings size={14} />} label="Global Settings" />
            </nav>
          </div>
        </div>

        {/* Session Actions */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0">
          <Link 
            href="/logout" 
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-colors"
          >
            <LogOut size={14} />
            <span>Terminate Session</span>
          </Link>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Command Bar */}
        <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          
          {/* Search / Command Palette Trigger */}
          <div className="relative w-80 flex items-center">
            <Search size={14} className="absolute left-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Query system resources..." 
              className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none font-mono"
            />
          </div>

          {/* Environment Status & Identity */}
          <div className="flex items-center gap-5">
            
            {/* System Alerts */}
            {isWidgetHidden && activeTasks.length > 0 && (
              <button 
                onClick={() => setWidgetHidden(false)}
                className="relative p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                title="Active Uploads"
              >
                <CloudUpload size={14} className="text-blue-600" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              </button>
            )}
            <button className="relative p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
              <Bell size={14} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
            </button>
            
            <div className="h-4 w-px bg-gray-200" />
            
            {/* User Identity Matrix */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-xs font-semibold text-gray-900">{adminUsername}</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-0.5">Administrator</span>
              </div>
              <div className="w-8 h-8 rounded bg-gray-800 border border-gray-700 flex items-center justify-center shadow-sm">
                <span className="text-[11px] font-mono font-semibold text-white">{adminInitials}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content Stage */}
        <div className="flex-1 overflow-auto p-6 bg-[#f8f9fa]">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>

        {/* Telemetry / Upload Overlay */}
        <UploadStatusBar />
      </main>
    </div>
  );
}

// ----- UI Helper Components -----

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      href={href} 
      className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      <div className="text-gray-400 group-hover:text-gray-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavSectionHeader({ label }: { label: string }) {
  return (
    <div className="px-2.5 mb-2 mt-1">
      <span className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}