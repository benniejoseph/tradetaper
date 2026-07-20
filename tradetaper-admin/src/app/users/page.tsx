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
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="admin-page-title">Users</h1>
                <p className="admin-page-subtitle">
                  {total > 0 ? `${formatNumber(total)} total users` : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <form onSubmit={handleSearch} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1 sm:flex-none">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search users…"
                    className="admin-input w-full pl-8 sm:w-[250px]"
                  />
                </div>
                <button type="submit" className="admin-btn-primary min-w-[94px] justify-center">Search</button>
              </form>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="admin-btn-secondary min-w-[44px] justify-center"
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
          </div>
        </header>

        {/* Stats Strip */}
        <div className="admin-page-subbar">
          <div className="admin-shell grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { label: 'Total Users', value: formatNumber(total), color: 'var(--chart-2)', icon: Users },
              { label: 'Verified (Page)', value: `${verifiedCount}/${users.length || 0}`, color: 'var(--accent-success)', icon: CheckCircle2 },
              { label: 'Paid (Page)', value: `${paidCount}/${users.length || 0}`, color: 'var(--chart-4)', icon: CreditCard },
            ].map((s) => (
              <div key={s.label} className="admin-card admin-card-panel flex items-center gap-3 min-h-[124px]">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="admin-metric-label">{s.label}</p>
                  <p className="admin-metric-value mt-1" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden admin-page-main">
          <div className="admin-shell h-full flex min-h-0 overflow-hidden gap-6 sm:gap-7 flex-col xl:flex-row">
            {/* Table */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              <div className="admin-card overflow-hidden">
                <div className="xl:hidden">
                  {isLoading ? (
                    <div className="admin-mobile-list">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="admin-mobile-card animate-pulse">
                          <div className="h-4 rounded w-1/2 mb-3" style={{ background: 'var(--bg-muted)' }} />
                          <div className="h-3 rounded mb-2" style={{ background: 'var(--bg-muted)' }} />
                          <div className="h-3 rounded w-3/4" style={{ background: 'var(--bg-muted)' }} />
                        </div>
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="py-16 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                      <p style={{ color: 'var(--text-muted)' }}>No users found</p>
                    </div>
                  ) : (
                    <div className="admin-mobile-list">
                      {users.map((u) => {
                        const userPlanLabel = formatPlanLabel(
                          u.subscription?.plan,
                          u.subscription?.tier,
                        );
                        const isFreeTier = isFreePlan(
                          u.subscription?.plan,
                          u.subscription?.tier,
                        );
                        return (
                          <div key={u.id} className="admin-mobile-card space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                     style={{ background: 'var(--gradient-brand)' }}>
                                  {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email.split('@')[0]}
                                  </p>
                                  <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                                </div>
                              </div>
                              {u.isEmailVerified
                                ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-success)' }} />
                                : <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
                            </div>
                            <div className="admin-mobile-row">
                              <span className="admin-mobile-label">Plan</span>
                              <span className={`badge ${isFreeTier ? 'badge-muted' : 'badge-primary'}`}>
                                {userPlanLabel}
                              </span>
                            </div>
                            <div className="admin-mobile-row">
                              <span className="admin-mobile-label">Joined</span>
                              <span style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                              type="button"
                              className="admin-btn-secondary w-full justify-center"
                              aria-label={`Open user details for ${u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email}`}
                              onClick={() => setSelectedUser(u.id)}
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="hidden xl:block admin-page-table-wrap">
                  <table className="admin-table" style={{ minWidth: 860 }}>
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
                              <span className="text-sm font-semibold leading-6" style={{ color: 'var(--text-primary)' }}>
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
                              ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />
                              : <XCircle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                          </td>
                          <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-btn-secondary min-w-[44px] justify-center px-3"
                              aria-label={`Open user details for ${u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email}`}
                              title="Open user details"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedUser(u.id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                        );
                      })}
                    </motion.tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="admin-pagination">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Page {page} of {totalPages} • {total} total
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="admin-btn-secondary min-w-[44px] justify-center disabled:opacity-40"
                        aria-label="Previous page"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="admin-btn-secondary min-w-[44px] justify-center disabled:opacity-40"
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
                className="fixed inset-0 z-50 w-full border overflow-y-auto flex-shrink-0 rounded-none md:relative md:inset-auto md:z-auto md:w-[380px] xl:w-[430px] md:rounded-2xl"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
                     style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>User Detail</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="admin-btn-secondary min-h-[44px] min-w-[44px] justify-center"
                    aria-label="Close user detail panel"
                    title="Close details"
                  >
                    <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
                {detailLoading ? (
                  <div className="admin-card-panel-compact admin-list-stack animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
                    ))}
                  </div>
                ) : hasDetailUser ? (
                  <div className="admin-card-panel admin-list-stack">
                    {/* User info */}
                    <div className="admin-card admin-card-panel">
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
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Trades', value: userDetail?.tradeCount ?? 0, icon: BarChart3, color: 'var(--chart-2)' },
                          { label: 'Accounts', value: userDetail?.accountCount ?? 0, icon: CreditCard, color: 'var(--accent-success)' },
                          { label: 'Total P&L', value: `$${detailTotalPnl.toFixed(2)}`, icon: ArrowUpRight, color: detailTotalPnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' },
                          { label: 'Plan', value: formatPlanLabel(detailUser?.subscription?.plan, detailUser?.subscription?.tier), icon: CreditCard, color: 'var(--chart-4)' },
                        ].map((m) => (
                          <div key={m.label} className="admin-muted-block">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                            <p className="text-base font-bold" style={{ color: m.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Trades */}
                    {detailTrades.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Recent Trades</p>
                        <div className="admin-list-stack-tight">
                          {detailTrades.slice(0, 5).map((t) => (
                            <div key={t.id} className="admin-muted-block flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.symbol}</p>
                                <span className={`badge ${t.side === 'LONG' || t.side === 'long' ? 'badge-success' : 'badge-danger'}`}>{t.side || '—'}</span>
                              </div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: Number(t.profitOrLoss) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}
                              >
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
                        <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Accounts</p>
                        <div className="admin-list-stack-tight">
                          {detailAccounts.map((a) => (
                            <div key={a.id} className="admin-muted-block flex items-center justify-between">
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.name || 'Account'}</p>
                              <p className="text-sm font-semibold" style={{ color: 'var(--accent-success)' }}>
                                {a.balance != null ? `$${Number(a.balance).toLocaleString()}` : '—'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
