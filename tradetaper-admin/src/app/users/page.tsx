'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  Users, Search, Download, CheckCircle2, XCircle, ArrowUpRight,
  RefreshCw, ChevronLeft, ChevronRight, CreditCard, BarChart3, Eye, X,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import adminApi from '@/lib/api';
import { API_BASE_URL } from '@/lib/api-base-url';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => adminApi.getUsers(page, 25, search || undefined),
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['user-detail', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null;
      const res = await fetch(
        `${API_BASE_URL}/admin/users/${selectedUser}`,
        { credentials: 'include' }
      );
      return res.json();
    },
    enabled: !!selectedUser,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const exportCsv = () => {
    if (!data?.data?.length) return toast.error('No data to export');
    const headers = ['ID', 'Name', 'Email', 'Plan', 'Verified', 'Created'];
    const rows = data.data.map((u: any) => [
      u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim(), u.email,
      u.subscription?.plan || 'Free',
      u.isEmailVerified ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
    toast.success('Exported CSV');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const users = (data as any)?.data || [];
  const total = (data as any)?.total || 0;
  const totalPages = (data as any)?.totalPages || 1;
  const verifiedCount = users.filter((u: any) => u.isEmailVerified).length;
  const paidCount = users.filter((u: any) => {
    const plan = u.subscription?.plan;
    return plan && String(plan).toLowerCase() !== 'free';
  }).length;

  return (
    <div className="flex h-dvh min-w-0" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-8 py-5 border-b"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="mx-auto w-full max-w-[var(--content-max-width)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="text-3xl leading-none font-bold" style={{ color: 'var(--text-primary)' }}>Users</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {total > 0 ? `${formatNumber(total)} total users` : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="flex w-full lg:w-auto flex-wrap items-center gap-3">
              <form onSubmit={handleSearch} className="flex w-full sm:w-auto flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search users…"
                    className="admin-input pl-10 w-full sm:w-80"
                  />
                </div>
                <button type="submit" className="admin-btn-primary">Search</button>
              </form>
              <button className="admin-btn-secondary" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="admin-btn-secondary" onClick={exportCsv}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Strip */}
        <div className="px-8 py-5 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="mx-auto w-full max-w-[var(--content-max-width)] grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Users', value: formatNumber(total), color: '#6366F1', icon: Users },
              { label: 'Verified Users', value: `${verifiedCount}/${users.length || 0}`, color: '#10B981', icon: CheckCircle2 },
              { label: 'Paid Users (Page)', value: `${paidCount}/${users.length || 0}`, color: '#8B5CF6', icon: CreditCard },
            ].map((s) => (
              <div key={s.label} className="admin-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className="text-base font-semibold" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[var(--content-max-width)] h-full flex min-h-0 overflow-hidden gap-4 lg:gap-6">
            {/* Table */}
            <div className="flex-1 min-w-0 overflow-auto">
              <div className="admin-card overflow-hidden min-w-[1100px]">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Plan</th>
                      <th>Verified</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {isLoading ? (
                      Array.from({ length: 12 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((__, j) => (
                            <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: 'var(--bg-muted)', width: `${60 + j * 10}px` }} /></td>
                          ))}
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr><td colSpan={6} className="py-20 text-center">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                        <p style={{ color: 'var(--text-muted)' }}>No users found</p>
                      </td></tr>
                    ) : users.map((u: any) => (
                      <motion.tr
                        variants={itemVariants}
                        key={u.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedUser(u.id)}
                        whileHover={{ scale: 0.995, backgroundColor: 'var(--bg-surface-hover)' }}
                        transition={{ duration: 0.15 }}
                      >
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                 style={{ background: 'var(--gradient-brand)' }}>
                              {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                            </div>
                            <span className="font-medium text-base" style={{ color: 'var(--text-primary)' }}>
                              {u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email.split('@')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.subscription?.plan === 'Free' || !u.subscription ? 'badge-muted' : 'badge-primary'}`}>
                            {u.subscription?.plan || 'Free'}
                          </span>
                        </td>
                        <td>
                          {u.isEmailVerified
                            ? <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
                            : <XCircle className="w-5 h-5" style={{ color: '#94A3B8' }} />}
                        </td>
                        <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button className="p-2 rounded-lg transition-colors" style={{ background: 'var(--bg-muted)' }}>
                            <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Page {page} of {totalPages} • {total} total
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="admin-btn-secondary py-2 px-3.5 disabled:opacity-40">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="admin-btn-secondary py-2 px-3.5 disabled:opacity-40">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Detail Panel */}
            {selectedUser && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-[380px] xl:w-[430px] border overflow-y-auto flex-shrink-0 rounded-2xl"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
                     style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>User Detail</h3>
                  <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
                    <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
                {detailLoading ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
                    ))}
                  </div>
                ) : userDetail && !userDetail.error ? (
                  <div className="p-5 space-y-6">
                    {/* User info */}
                    <div className="admin-card p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                             style={{ background: 'var(--gradient-brand)' }}>
                          {(userDetail.user.firstName?.[0] || userDetail.user.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {userDetail.user.firstName ? `${userDetail.user.firstName} ${userDetail.user.lastName || ''}`.trim() : 'No name'}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{userDetail.user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Trades', value: userDetail.tradeCount, icon: BarChart3, color: '#6366F1' },
                          { label: 'Accounts', value: userDetail.accountCount, icon: CreditCard, color: '#10B981' },
                          { label: 'Total P&L', value: `$${Number(userDetail.totalPnl || 0).toFixed(2)}`, icon: ArrowUpRight, color: userDetail.totalPnl >= 0 ? '#10B981' : '#F43F5E' },
                          { label: 'Plan', value: userDetail.user.subscription?.plan || 'Free', icon: CreditCard, color: '#8B5CF6' },
                        ].map((m) => (
                          <div key={m.label} className="rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                            <p className="text-base font-bold" style={{ color: m.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Trades */}
                    {userDetail.trades?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Recent Trades</p>
                        <div className="space-y-1.5">
                          {userDetail.trades.slice(0, 5).map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.symbol}</p>
                                <span className={`badge ${t.side === 'LONG' || t.side === 'long' ? 'badge-success' : 'badge-danger'}`}>{t.side}</span>
                              </div>
                              <p className={`text-sm font-semibold ${Number(t.profitOrLoss) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {t.profitOrLoss != null ? `$${Number(t.profitOrLoss).toFixed(2)}` : 'Open'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Accounts */}
                    {userDetail.accounts?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Accounts</p>
                        <div className="space-y-1.5">
                          {userDetail.accounts.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.name || 'Account'}</p>
                              <p className="text-sm font-semibold" style={{ color: 'var(--accent-success)' }}>
                                {a.balance != null ? `$${Number(a.balance).toLocaleString()}` : '—'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ID: {userDetail.user.id}<br/>
                      Joined: {new Date(userDetail.user.createdAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p style={{ color: 'var(--text-muted)' }}>Failed to load user detail</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
