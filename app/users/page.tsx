"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, RotateCcw, Search, Monitor, Clock, 
  Ban, CheckCircle2, ExternalLink, Activity, 
  ShieldAlert, Database, Download, Filter, 
  ChevronLeft, ChevronRight, ArrowUpDown
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  isBanned: boolean;
  banReason?: string;
  totalWatchTime: number;
  _count: {
    devices: number;
    sessions: number;
    watchSessions: number;
  };
  authLogs: { createdAt: string }[];
  createdAt: string;
}

interface UserStats {
  totalUsers: number;
  active24h: number;
  quarantined: number;
  avgWatchTime: number;
}

export default function UserManagement() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Selection State
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder
      });
      
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const [res, statsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/users?${params.toString()}`),
        fetch(`${apiUrl}/admin/users/stats`)
      ]);
      
      const data = await res.json();
      const statsData = await statsRes.json();
      
      if (data.success) {
        setUsers(data.data);
        setTotalRecords(data.meta.total);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      showToast("Registry sync failed", "error");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, page, limit, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset selection when page changes or data refreshes
  useEffect(() => {
    setSelectedUsers(new Set());
  }, [users]);

  // --- Handlers ---

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const handleBan = async (userId: string, isBanned: boolean) => {
    const reason = isBanned ? window.prompt("Enter quarantine rationale:") : null;
    if (isBanned && reason === null) return;

    setProcessingId(userId);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned, reason })
      });
      if (res.ok) {
        showToast(isBanned ? "User quarantined" : "Quarantine lifted", "success");
        fetchUsers();
      }
    } catch (err) {
      showToast("Operation failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReset = async (userId: string) => {
    if (!confirm("Execute forced termination of all active sessions for this UID?")) return;
    setProcessingId(userId);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/reset`, { method: 'POST' });
      if (res.ok) {
        showToast("Session state reset", "success");
      }
    } catch (err) {
      showToast("Reset operation failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // --- Bulk Actions ---

  const handleBulkBan = async (isBanned: boolean) => {
    if (selectedUsers.size === 0) return;
    const reason = isBanned ? window.prompt(`Enter quarantine rationale for ${selectedUsers.size} users:`) : null;
    if (isBanned && reason === null) return;

    setBulkProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/bulk-ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedUsers), isBanned, reason })
      });
      if (res.ok) {
        showToast(`Mass ${isBanned ? 'quarantine' : 'un-quarantine'} executed`, "success");
        setSelectedUsers(new Set());
        fetchUsers();
      }
    } catch (err) {
      showToast("Bulk operation failed", "error");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReset = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Execute forced termination of active sessions for ${selectedUsers.size} users?`)) return;
    
    setBulkProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/bulk-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedUsers) })
      });
      if (res.ok) {
        showToast("Mass session reset executed", "success");
        setSelectedUsers(new Set());
      }
    } catch (err) {
      showToast("Bulk reset failed", "error");
    } finally {
      setBulkProcessing(false);
    }
  };

  // --- Export CSV ---

  const handleExportCSV = async () => {
    showToast("Generating CSV export...", "info");
    try {
      // Fetch all matching records without pagination limit (up to 10k)
      const params = new URLSearchParams({ limit: '10000', offset: '0', sortBy, sortOrder });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`${apiUrl}/admin/users?${params.toString()}`);
      const data = await res.json();
      
      if (!data.success) throw new Error("Fetch failed");
      
      const exportUsers: User[] = data.data;
      
      // Build CSV
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Ban Reason', 'Watch Time (s)', 'Total Devices', 'Registered At'];
      const csvRows = [headers.join(',')];
      
      exportUsers.forEach(u => {
        const row = [
          u.id,
          `"${u.name || ''}"`,
          `"${u.email || ''}"`,
          `"${u.phone || ''}"`,
          u.isBanned ? 'BANNED' : 'ACTIVE',
          `"${u.banReason || ''}"`,
          u.totalWatchTime,
          u._count.devices,
          new Date(u.createdAt).toISOString()
        ];
        csvRows.push(row.join(','));
      });
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kuber_users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      showToast("CSV Export failed", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-sm">
      
      {/* Top Console Header */}
      <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Users className="text-gray-500" size={18} />
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">Identity Registry</h1>
            <p className="text-[11px] text-gray-500 font-mono">/admin/users</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400" size={14} />
            <input 
              type="text"
              placeholder="Query by UID, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
            />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
        
        {/* Top-Level Telemetry Cards */}
        <div className="grid grid-cols-4 gap-4 max-w-[1600px] w-full mx-auto shrink-0">
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Total Registered Users</span>
            <span className="text-2xl font-mono text-gray-900 mt-2">{stats?.totalUsers?.toLocaleString() ?? '...'}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Active Users (24h)</span>
            <span className="text-2xl font-mono text-blue-600 mt-2">{stats?.active24h?.toLocaleString() ?? '...'}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Quarantined Accounts</span>
            <span className="text-2xl font-mono text-red-600 mt-2">{stats?.quarantined?.toLocaleString() ?? '0'}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Avg Watch Time</span>
            <span className="text-2xl font-mono text-gray-900 mt-2">
              {stats?.avgWatchTime !== undefined ? `${Math.floor(stats.avgWatchTime / 3600)}h ${Math.floor((stats.avgWatchTime % 3600) / 60)}m` : '...'}
            </span>
          </div>
        </div>

        <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-500" />
                <select 
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                  className="text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 py-1 pl-2 pr-6"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Nodes</option>
                  <option value="BANNED">Quarantined</option>
                </select>
              </div>
              
              {selectedUsers.size > 0 && (
                <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
                  <span className="text-[11px] font-mono text-gray-500 mr-2">{selectedUsers.size} Selected</span>
                  <button 
                    onClick={() => handleBulkBan(true)}
                    disabled={bulkProcessing}
                    className="h-7 px-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban size={12} /> Mass Quarantine
                  </button>
                  <button 
                    onClick={() => handleBulkBan(false)}
                    disabled={bulkProcessing}
                    className="h-7 px-2.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium hover:bg-green-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 size={12} /> Un-Quarantine
                  </button>
                  <button 
                    onClick={handleBulkReset}
                    disabled={bulkProcessing}
                    className="h-7 px-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-medium hover:bg-orange-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw size={12} /> Reset Sessions
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleExportCSV}
              className="h-8 px-3 bg-white border border-gray-200 text-gray-700 rounded text-xs font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="flex-1 overflow-auto relative">
            {loading && users.length === 0 ? (
              <div className="absolute inset-0 z-10 bg-white/50 flex flex-col items-center justify-center gap-3">
                <Activity className="w-5 h-5 text-gray-400 animate-pulse" />
              </div>
            ) : null}
            
            <table className="w-full text-left whitespace-nowrap text-xs">
              <thead className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                <tr className="text-gray-500 font-mono uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2.5 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={users.length > 0 && selectedUsers.size === users.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Identifier / Subject {sortBy === 'name' && <ArrowUpDown size={10} />}</div>
                  </th>
                  <th className="px-4 py-2.5 font-medium">State</th>
                  <th className="px-4 py-2.5 font-medium text-right cursor-pointer hover:bg-gray-50" onClick={() => handleSort('totalWatchTime')}>
                    <div className="flex items-center justify-end gap-1">Telemetry {sortBy === 'totalWatchTime' && <ArrowUpDown size={10} />}</div>
                  </th>
                  <th className="px-4 py-2.5 font-medium cursor-pointer hover:bg-gray-50" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">Registered {sortBy === 'createdAt' && <ArrowUpDown size={10} />}</div>
                  </th>
                  <th className="px-4 py-2.5 font-medium text-right">Engagement</th>
                  <th className="px-4 py-2.5 font-medium text-right">Active Nodes</th>
                  <th className="px-4 py-2.5 font-medium text-right">Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 transition-colors group ${processingId === user.id ? 'opacity-50 pointer-events-none' : ''} ${selectedUsers.has(user.id) ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                          {user.name || 'UNASSIGNED_SUBJECT'}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-gray-400">{user.id}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-mono text-[10px] text-gray-500 truncate max-w-[150px]">{user.email || user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 text-[10px] font-mono uppercase" title={user.banReason || 'No reason provided'}>
                          <ShieldAlert size={10} /> Quarantined
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-green-200 bg-green-50 text-green-700 text-[10px] font-mono uppercase">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-mono text-gray-600">
                        <Clock size={12} className="text-gray-400" />
                        <span>{Math.floor(user.totalWatchTime / 3600)}h {Math.floor((user.totalWatchTime % 3600) / 60)}m</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">
                      {new Date(user.createdAt).toISOString().replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600 text-[10px]">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-900">{user._count.watchSessions} plays</span>
                        <span className="text-gray-400">{user._count.sessions} logins</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">
                      <div className="flex items-center justify-end gap-1.5">
                        <Monitor size={12} className="text-gray-400" />
                        <span>{user._count.devices}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/users/${user.id}`)}
                          className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 border border-transparent transition-colors"
                          title="Inspect Telemetry"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button 
                          onClick={() => handleReset(user.id)}
                          className="p-1.5 rounded text-orange-600 hover:text-white hover:bg-orange-600 border border-transparent transition-colors"
                          title="SIGTERM Sessions"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button 
                          onClick={() => handleBan(user.id, !user.isBanned)}
                          className={`p-1.5 rounded border border-transparent transition-colors ${
                            user.isBanned 
                              ? 'text-green-600 hover:bg-green-600 hover:text-white' 
                              : 'text-red-600 hover:bg-red-600 hover:text-white'
                          }`}
                          title={user.isBanned ? "Lift Quarantine" : "Enforce Quarantine"}
                        >
                          {user.isBanned ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Database size={20} className="text-gray-300" />
                        <span className="text-xs font-medium">No records match the active query.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords} entries
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="px-3 py-1 text-xs font-mono font-medium border border-gray-200 rounded bg-gray-50">
                {page} / {Math.max(1, Math.ceil(totalRecords / limit))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(Math.ceil(totalRecords / limit), p + 1))}
                disabled={page >= Math.ceil(totalRecords / limit) || loading}
                className="p-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}