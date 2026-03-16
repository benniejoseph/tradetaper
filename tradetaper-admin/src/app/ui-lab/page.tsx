'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Blocks,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  FileWarning,
  Layers3,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

type Kpi = {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

const kpis: Kpi[] = [
  { label: 'Admin Sessions', value: '1,284', delta: '+8.4%', icon: Users },
  { label: 'Risk Flags', value: '29', delta: '-14.2%', icon: ShieldAlert },
  { label: 'Pending Reviews', value: '43', delta: '+3.0%', icon: FileWarning },
  { label: 'Recovered Revenue', value: '$12,420', delta: '+22.1%', icon: DollarSign },
];

const userReviewQueue = [
  { id: 'USR-8842', email: 'alex@fundhouse.co', reason: 'Unusual login pattern', plan: 'Premium', status: 'Investigating' },
  { id: 'USR-8755', email: 'sara@traderdesk.com', reason: 'Multiple failed payments', plan: 'Essential', status: 'Pending' },
  { id: 'USR-8611', email: 'mike@macrohub.ai', reason: 'High risk trade velocity', plan: 'Premium', status: 'Escalated' },
  { id: 'USR-8572', email: 'nina@alphaflow.io', reason: 'KYC mismatch', plan: 'Essential', status: 'Resolved' },
];

const disputes = [
  { id: 'DSP-201', amount: '$1,299', account: 'tradetaper@gmail.com', type: 'Chargeback', priority: 'High' },
  { id: 'DSP-188', amount: '$199', account: 'fundadmin@propfx.io', type: 'Duplicate charge', priority: 'Medium' },
  { id: 'DSP-177', amount: '$499', account: 'ops@deltaedge.com', type: 'Refund request', priority: 'Low' },
];

const auditTrail = [
  { time: '09:14', actor: 'admin@tradetaper.com', action: 'Locked account USR-8611', source: 'Web Console' },
  { time: '08:57', actor: 'risk-bot@system', action: 'Triggered leverage anomaly alert', source: 'Automation' },
  { time: '08:41', actor: 'finance@tradetaper.com', action: 'Approved dispute DSP-188', source: 'Billing' },
  { time: '08:08', actor: 'ops@tradetaper.com', action: 'Reset MFA challenge', source: 'Security' },
];

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary-subtle)' }}>
          <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function UiLabPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div>
            <h1 className="text-xl font-bold text-gradient">Admin UI Lab</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Stitch-style screen set for operations, billing, and compliance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="admin-btn-secondary"><Search className="w-4 h-4" /> Search</button>
            <button className="admin-btn-secondary"><Bell className="w-4 h-4" /> Alerts</button>
            <button className="admin-btn-primary"><Sparkles className="w-4 h-4" /> Publish</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-5">
            <SectionTitle icon={TrendingUp} title="Screen 1: Command Center" subtitle="Executive view for platform health and incident pressure." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
              {kpis.map(({ label, value, delta, icon: Icon }) => (
                <div key={label} className="rounded-2xl border p-4"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-muted)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--accent-success)' }}>{delta} vs last window</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border p-5"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Incident Load Map</p>
                <span className="badge badge-primary">Live</span>
              </div>
              <div className="h-40 rounded-xl flex items-center justify-center text-sm"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                Heatmap / Chart slot for Stitch chart block
              </div>
            </div>
          </motion.section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="admin-card p-5">
              <SectionTitle icon={UserCheck} title="Screen 2: User Review Queue" subtitle="Risk and trust operations workflow." />
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Email</th>
                      <th>Reason</th>
                      <th>Plan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userReviewQueue.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.email}</td>
                        <td>{u.reason}</td>
                        <td><span className="badge badge-muted">{u.plan}</span></td>
                        <td>
                          <span className={`badge ${
                            u.status === 'Resolved' ? 'badge-success' :
                            u.status === 'Escalated' ? 'badge-danger' : 'badge-warning'
                          }`}>{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-card p-5">
              <SectionTitle icon={CreditCard} title="Screen 3: Billing Disputes" subtitle="Revenue operations with decision-ready signals." />
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div key={d.id} className="rounded-xl border p-4 flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-muted)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.id} • {d.type}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{d.account}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.amount}</p>
                      <span className={`badge ${d.priority === 'High' ? 'badge-danger' : d.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                        {d.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="admin-card p-5">
            <SectionTitle icon={Layers3} title="Screen 4: Audit + Access Control" subtitle="SOC2-facing traceability and security ops timeline." />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 rounded-xl border p-4"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-muted)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Audit Trail</p>
                <div className="space-y-2">
                  {auditTrail.map((e) => (
                    <div key={`${e.time}-${e.actor}`} className="rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                      style={{ background: 'var(--bg-surface)' }}>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{e.action}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{e.actor} • {e.source}</p>
                      </div>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{e.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-muted)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Access Matrix</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between"><span style={{ color: 'var(--text-secondary)' }}>Super Admin</span><CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-success)' }} /></div>
                  <div className="flex items-center justify-between"><span style={{ color: 'var(--text-secondary)' }}>Billing Admin</span><CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-success)' }} /></div>
                  <div className="flex items-center justify-between"><span style={{ color: 'var(--text-secondary)' }}>Risk Analyst</span><Clock3 className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} /></div>
                  <div className="flex items-center justify-between"><span style={{ color: 'var(--text-secondary)' }}>Read-only Ops</span><Blocks className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></div>
                </div>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
