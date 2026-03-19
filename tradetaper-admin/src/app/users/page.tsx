'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  Users, Search, Download, CheckCircle2, XCircle, ArrowUpRight,
  RefreshCw, ChevronLeft, ChevronRight, CreditCard, BarChart3, Eye, X,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import adminApi, {
  AdminAccountRecord,
  AdminTradeRecord,
  AdminUserDetailResponse,
} from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { formatPlanLabel, isFreePlan } from '@/lib/subscription-plan';
import { containerVariants, itemVariants } from '@/lib/animation-variants';
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

  const { data: userDetail, isLoading: detailLoading } = useQuery<AdminUserDetailResponse | null>({
    queryKey: ['user-detail', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null;
      return adminApi.getUserDetail(selectedUser);
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
    const rows = data.data.map((u) => [
      u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim(), u.email,
      formatPlanLabel(u.subscription?.plan, u.subscription?.tier),
      u.isEmailVerified ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    downloadCsv('users.csv', headers, rows);
    toast.success('Exported CSV');
  };


  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const verifiedCount = users.filter((u) => !!u.isEmailVerified).length;
  const paidCount = users.filter((u) => !isFreePlan(u.subscription?.plan, u.subscription?.tier)).length;
  const detailUser = userDetail?.user;
  const hasDetailUser = !!(userDetail && !userDetail.error && detailUser);
  const detailTotalPnl = Number(userDetail?.totalPnl ?? 0);
  const detailTrades: AdminTradeRecord[] = userDetail?.trades ?? [];
  const detailAccounts: AdminAccountRecord[] = userDetail?.accounts ?? [];

  return (
    <div className="flex h-dvh min-w-0" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="sticky top-0 z-40 border-b px-6 py-3 backdrop-blur-xl flex-shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="mx-auto w-full max-w-[var(--content-max-width)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>Users</h1>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {total > 0 ? `${formatNumber(total)} total users` : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search users…"
                    className="admin-input pl-8"
                    style={{ width: 220 }}
                  />
                </div>
                <button type="submit" className="admin-btn-primary">Search</button>
              </form>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => refetch()}
                title="Refresh users"
                aria-label="Refresh users"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button className="admin-btn-secondary" onClick={exportCsv}>
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Strip */}
        <div className="px-6 py-3 border-b flex-shrink-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="mx-auto w-full max-w-[var(--content-max-width)] grid grid-cols-3 gap-3">
            {[
              { label: 'Total Users', value: formatNumber(total), color: '#6366F1', icon: Users },
              { label: 'Verified (Page)', value: `${verifiedCount}/${users.length || 0}`, color: '#10B981', icon: CheckCircle2 },
              { label: 'Paid (Page)', value: `${paidCount}/${users.length || 0}`, color: '#8B5CF6', icon: CreditCard },
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
        <div className="flex-1 min-h-0 overflow-hidden p-5">
          <div className="mx-auto w-full max-w-[var(--content-max-width)] h-full flex min-h-0 overflow-hidden gap-4">
            {/* Table */}
            <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto">
              <div className="admin-card overflow-hidden" style={{ minWidth: 800 }}>
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
                    ) : users.map((u) => {
                      const userPlanLabel = formatPlanLabel(
                        u.subscription?.plan,
                        u.subscription?.tier,
                      );
                      const isFreeTier = isFreePlan(
                        u.subscription?.plan,
                        u.subscription?.tier,
                      );
                      return (
                      <motion.tr
                        variants={itemVariants}
                        key={u.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedUser(u.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedUser(u.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email}`}
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
                          <span className={`badge ${isFreeTier ? 'badge-muted' : 'badge-primary'}`}>
                            {userPlanLabel}
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
                          <button
                            type="button"
                            className="p-2 rounded-lg transition-colors"
                            style={{ background: 'var(--bg-muted)' }}
                            aria-label={`Open user details for ${u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email}`}
                            title="Open user details"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedUser(u.id);
                            }}
                          >
                            <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          </button>
                        </td>
                      </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Page {page} of {totalPages} • {total} total
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="admin-btn-secondary py-2 px-3.5 disabled:opacity-40"
                        aria-label="Previous page"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="admin-btn-secondary py-2 px-3.5 disabled:opacity-40"
                        aria-label="Next page"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Detail Panel */}
          <AnimatePresence>
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
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 rounded-lg"
                    style={{ background: 'var(--bg-muted)' }}
                    aria-label="Close user detail panel"
                    title="Close details"
                  >
                    <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
                {detailLoading ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
                    ))}
                  </div>
                ) : hasDetailUser ? (
                  <div className="p-5 space-y-6">
                    {/* User info */}
                    <div className="admin-card p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                             style={{ background: 'var(--gradient-brand)' }}>
                          {(detailUser?.firstName?.[0] || detailUser?.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {detailUser?.firstName ? `${detailUser.firstName} ${detailUser.lastName || ''}`.trim() : 'No name'}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{detailUser?.email || '—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Trades', value: userDetail?.tradeCount ?? 0, icon: BarChart3, color: '#6366F1' },
                          { label: 'Accounts', value: userDetail?.accountCount ?? 0, icon: CreditCard, color: '#10B981' },
                          { label: 'Total P&L', value: `$${detailTotalPnl.toFixed(2)}`, icon: ArrowUpRight, color: detailTotalPnl >= 0 ? '#10B981' : '#F43F5E' },
                          { label: 'Plan', value: formatPlanLabel(detailUser?.subscription?.plan, detailUser?.subscription?.tier), icon: CreditCard, color: '#8B5CF6' },
                        ].map((m) => (
                          <div key={m.label} className="rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                            <p className="text-base font-bold" style={{ color: m.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Trades */}
                    {detailTrades.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Recent Trades</p>
                        <div className="space-y-1.5">
                          {detailTrades.slice(0, 5).map((t) => (
                            <div key={t.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.symbol}</p>
                                <span className={`badge ${t.side === 'LONG' || t.side === 'long' ? 'badge-success' : 'badge-danger'}`}>{t.side || '—'}</span>
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
                    {detailAccounts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Accounts</p>
                        <div className="space-y-1.5">
                          {detailAccounts.map((a) => (
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
                      ID: {detailUser?.id || '—'}<br/>
                      Joined: {detailUser?.createdAt ? new Date(detailUser.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p style={{ color: 'var(--text-muted)' }}>Failed to load user detail</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
