"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Search, Settings, ShieldCheck, Clock, CheckCircle2, History, Info, Plus, Trash2, ArrowUpRight, AlertTriangle, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/toast-provider";

interface ReferralEntry {
  id: string;
  referrer: { name: string; phone: string };
  referee: { name: string; phone: string };
  codeUsed: string;
  status: 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REJECTED';
  qualifiedAt: string | null;
  rewardedAt: string | null;
  isSuspicious: boolean;
  suspicionReason: string | null;
  createdAt: string;
}

interface ReferralSettings {
  id: string;
  triggerEvent: string;
  referrerReward: number;
  refereeReward: number;
  maxPerUser?: number;
  isActive: boolean;
}

interface ReferralLog {
  id: string;
  referrerReward: number;
  refereeReward: number;
  createdAt: string;
}

interface ReferralGuideStep {
  id?: string;
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
}

export default function ReferralsDashboard() {
  const { showToast } = useToast();
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [logs, setLogs] = useState<ReferralLog[]>([]);
  const [guideSteps, setGuideSteps] = useState<ReferralGuideStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monitor' | 'settings' | 'audit' | 'guide'>('monitor');
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, rewarded: 0, pending: 0, suspicious: 0 });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, setRes, logRes, guideRes] = await Promise.all([
        fetch(`${apiUrl}/admin/referrals/matrix`).then(res => res.json()),
        fetch(`${apiUrl}/admin/referrals/settings`).then(res => res.json()),
        fetch(`${apiUrl}/admin/referrals/logs`).then(res => res.json()),
        fetch(`${apiUrl}/admin/referrals/guide`).then(res => res.json())
      ]);

      if (matRes.success) {
        setReferrals(matRes.data);
        const sCount = matRes.data.filter((r: any) => r.isSuspicious).length;
        setStats(prev => ({ ...prev, total: matRes.data.length, rewarded: matRes.data.filter((r: any) => r.status === 'REWARDED').length, pending: matRes.data.filter((r: any) => r.status === 'PENDING').length, suspicious: sCount }));
      }
      if (setRes.success) {
        if (setRes.data) {
          setSettings(setRes.data);
        } else {
          setSettings({
            id: '',
            triggerEvent: 'FIRST_WATCH',
            referrerReward: 0,
            refereeReward: 0,
            isActive: true
          });
        }
      }
      if (logRes.success) setLogs(logRes.data);
      if (guideRes.success) setGuideSteps(guideRes.data);
    } catch (err) {
      showToast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSettings = async () => {
    if (!settings) return;
    try {
      const res = await fetch(`${apiUrl}/admin/referrals/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) showToast("Global rules updated", "success");
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  const handleSaveGuide = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/referrals/guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: guideSteps }),
      });
      if (res.ok) showToast("Mobile guide updated", "success");
    } catch (err) {
      showToast("Guide sync failed", "error");
    }
  };

  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => 
      r.referee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referrer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.codeUsed.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [referrals, searchQuery]);



  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>Referral Command Center</h1>
          <p style={{ color: 'var(--secondary)' }}>Lifecycle-based monitoring for high-integrity growth.</p>
        </div>
        <div className="glass" style={{ padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
          <button onClick={() => setActiveTab('monitor')} style={{ background: activeTab === 'monitor' ? 'var(--accent)' : 'transparent', color: activeTab === 'monitor' ? '#fff' : 'var(--secondary)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Lifecycle Monitor</button>
          <button onClick={() => setActiveTab('settings')} style={{ background: activeTab === 'settings' ? 'var(--accent)' : 'transparent', color: activeTab === 'settings' ? '#fff' : 'var(--secondary)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Global Rules</button>
          <button onClick={() => setActiveTab('audit')} style={{ background: activeTab === 'audit' ? 'var(--accent)' : 'transparent', color: activeTab === 'audit' ? '#fff' : 'var(--secondary)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Audit Vault</button>
          <button onClick={() => setActiveTab('guide')} style={{ background: activeTab === 'guide' ? 'var(--accent)' : 'transparent', color: activeTab === 'guide' ? '#fff' : 'var(--secondary)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Mobile Guide</button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><Users size={24} /></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total}</div><div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Total Attributions</div></div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}><CheckCircle2 size={24} /></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.rewarded}</div><div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Successfully Rewarded</div></div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}><AlertTriangle size={24} /></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{(stats as any).suspicious || 0}</div><div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Suspicious Flags</div></div>
        </div>
      </div>

      {activeTab === 'monitor' ? (
        <div className="table-container animate-fade-in">
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '400px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search referrals..." style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff' }} />
              </div>
            </div>
          </div>
          <table>
            <thead><tr><th>Code</th><th>Referrer</th><th>Referee</th><th>Status</th><th>Timeline</th></tr></thead>
            <tbody>
              {filteredReferrals.map(ref => (
                <tr key={ref.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent)' }}>{ref.codeUsed}</span></td>
                  <td>{ref.referrer.name}</td>
                  <td style={{ fontWeight: 600 }}>{ref.referee.name}</td>
                  <td>
                    <span className="badge" style={{ 
                      background: ref.status === 'REWARDED' ? 'rgba(34, 197, 94, 0.1)' : ref.status === 'PENDING' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: ref.status === 'REWARDED' ? 'var(--success)' : ref.status === 'PENDING' ? 'var(--warning)' : 'var(--accent)'
                    }}>
                      {ref.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--secondary)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span title="Signup">📝 {new Date(ref.createdAt).toLocaleDateString()}</span>
                      {ref.qualifiedAt && <span title="Qualified">🎯 {new Date(ref.qualifiedAt).toLocaleDateString()}</span>}
                      {ref.rewardedAt && <span title="Rewarded">💰 {new Date(ref.rewardedAt).toLocaleDateString()}</span>}
                    </div>
                  </td>
                  <td>
                    {ref.isSuspicious ? (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', cursor: 'help' }} title={ref.suspicionReason || "Fraud Detected"}>
                        🚩 SUSPICIOUS
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                        🛡️ SECURE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="card animate-fade-in" style={{ maxWidth: '600px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Global Referral Rules</h2>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Set the baseline incentives for organic growth.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--secondary)', marginBottom: '8px', display: 'block' }}>Trigger Event</label>
              <select value={settings?.triggerEvent} onChange={e => setSettings(prev => prev ? {...prev, triggerEvent: e.target.value} : null)} style={{ width: '100%', padding: '12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff' }}>
                <option value="SIGNUP">SIGNUP (Instant Reward)</option>
                <option value="FIRST_WATCH">FIRST_WATCH (Verifiable Watch)</option>
                <option value="FIRST_EARNING">FIRST_EARNING (Engagement Based)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--secondary)', marginBottom: '8px', display: 'block' }}>Referrer Reward (Coins)</label>
                <input type="number" value={settings?.referrerReward} onChange={e => setSettings(prev => prev ? {...prev, referrerReward: parseInt(e.target.value)} : null)} style={{ width: '100%', padding: '12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--secondary)', marginBottom: '8px', display: 'block' }}>Referee Reward (Coins)</label>
                <input type="number" value={settings?.refereeReward} onChange={e => setSettings(prev => prev ? {...prev, refereeReward: parseInt(e.target.value)} : null)} style={{ width: '100%', padding: '12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff' }} />
              </div>
            </div>

            <button onClick={handleUpdateSettings} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '12px' }}>Save Global Configuration</button>
          </div>
        </div>
      ) : activeTab === 'audit' ? (
        <div className="table-container animate-fade-in">
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Reward Audit Vault</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Immutable record of every coin distributed by the system.</p>
          </div>
          <table>
            <thead><tr><th>Reward ID</th><th>Ref Reward</th><th>Refe Reward</th><th>Distributed At</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td><span style={{ fontSize: '0.8125rem', color: 'var(--secondary)' }}>{log.id}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>+{log.referrerReward}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>+{log.refereeReward}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div><h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mobile Onboarding Guide</h2><p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Define the steps users see in the mobile app.</p></div>
            <button onClick={handleSaveGuide} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={16} /> Save Guide</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {guideSteps.map((step, index) => (
              <div key={index} className="card" style={{ display: 'grid', gridTemplateColumns: '48px 1fr 2fr 150px 80px', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{index + 1}</div>
                <input value={step.title} onChange={(e) => {
                  const newSteps = [...guideSteps];
                  newSteps[index].title = e.target.value;
                  setGuideSteps(newSteps);
                }} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#fff' }} />
                <input value={step.description} onChange={(e) => {
                  const newSteps = [...guideSteps];
                  newSteps[index].description = e.target.value;
                  setGuideSteps(newSteps);
                }} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#fff' }} />
                <select value={step.icon} onChange={(e) => {
                  const newSteps = [...guideSteps];
                  newSteps[index].icon = e.target.value;
                  setGuideSteps(newSteps);
                }} style={{ width: '100%', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#fff' }}><option value="Share2">Share</option><option value="Download">Download</option><option value="Award">Award</option><option value="Info">Info</option></select>
                <button onClick={() => setGuideSteps(guideSteps.filter((_, i) => i !== index))} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
              </div>
            ))}
            <button onClick={() => setGuideSteps([...guideSteps, { stepNumber: guideSteps.length + 1, title: '', description: '', icon: 'Info' }])} style={{ border: '1px dashed var(--border)', padding: '16px', borderRadius: '12px', background: 'transparent', color: 'var(--secondary)', cursor: 'pointer' }}>+ Add Instruction Step</button>
          </div>
        </div>
      )}
    </div>
  );
}
