'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Activity, Zap, RefreshCw } from 'lucide-react';
import { Activity as ActivityItem, adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

const ACTIVITY_COLORS: Record<string, string> = {
  login: 'var(--chart-2)',
  logout: 'var(--chart-2)',
  trade_created: 'var(--chart-1)',
  trade_closed: 'var(--chart-5)',
  subscription_changed: 'var(--chart-4)',
  billing_updated: 'var(--chart-4)',
  user_created: 'var(--chart-3)',
  image_uploaded: 'var(--accent-neutral)',
};

type ActivityFilter = 'all' | 'trade' | 'auth' | 'billing';
type ActivityCategory = Exclude<ActivityFilter, 'all'> | 'other';
const EMPTY_ACTIVITIES: ActivityItem[] = [];

function normalizeType(type: string | undefined): string {
  return (type || '').trim().toLowerCase();
}

function toReadableType(type: string | undefined): string {
  const normalized = normalizeType(type);
  if (!normalized) {
    return 'unknown';
  }

  return normalized.replace(/[_-]+/g, ' ');
}

function classifyActivityType(type: string | undefined): ActivityCategory {
  const normalized = normalizeType(type);

  if (
    normalized.includes('trade') ||
    normalized.includes('position') ||
    normalized.includes('order')
  ) {
    return 'trade';
  }

  if (
    normalized.includes('subscription') ||
    normalized.includes('billing') ||
    normalized.includes('invoice') ||
    normalized.includes('payment') ||
    normalized.includes('refund') ||
    normalized.includes('coupon') ||
    normalized.includes('plan')
  ) {
    return 'billing';
  }

  if (
    normalized.includes('login') ||
    normalized.includes('logout') ||
    normalized.includes('auth') ||
    normalized.includes('mfa') ||
    normalized.includes('session') ||
    normalized.includes('password') ||
    normalized.includes('user')
  ) {
    return 'auth';
  }

  return 'other';
}

function formatFeedTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatLastUpdated(dataUpdatedAt: number): string {
  if (!dataUpdatedAt) {
    return '—';
  }
  return new Date(dataUpdatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function filterLabel(filter: ActivityFilter): string {
  if (filter === 'all') {
    return 'All';
  }
  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

export default function ActivityPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: feed,
    isLoading,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['activity-feed-full'],
    queryFn: () => adminApi.getActivityFeed(50),
    refetchInterval: 5000,
    retry: 1,
    retryDelay: 750,
  });

  const activities = feed ?? EMPTY_ACTIVITIES;

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        if (filter === 'all') {
          return true;
        }
        return classifyActivityType(activity.type) === filter;
      }),
    [activities, filter],
  );

  const eventBreakdown = useMemo(
    () =>
      filteredActivities.reduce<Record<string, number>>((acc, activity) => {
        const key = normalizeType(activity.type) || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [filteredActivities],
  );

  const categoryCounts = useMemo(() => {
    return filteredActivities.reduce<Record<ActivityCategory, number>>(
      (acc, activity) => {
        const category = classifyActivityType(activity.type);
        acc[category] += 1;
        return acc;
      },
      { trade: 0, auth: 0, billing: 0, other: 0 },
    );
  }, [filteredActivities]);

  const maxBreakdownCount = useMemo(() => {
    const counts = Object.values(eventBreakdown);
    return counts.length > 0 ? Math.max(...counts) : 1;
  }, [eventBreakdown]);

  const breakdownRows = useMemo(
    () => Object.entries(eventBreakdown).sort((a, b) => b[1] - a[1]),
    [eventBreakdown],
  );

  const summaryCards = useMemo(() => {
    const cards = [
      { key: 'trade', label: 'Trade', value: categoryCounts.trade },
      { key: 'auth', label: 'Auth', value: categoryCounts.auth },
      { key: 'billing', label: 'Billing', value: categoryCounts.billing },
      { key: 'other', label: 'Other', value: categoryCounts.other },
    ];

    if (filter === 'all') {
      return cards;
    }

    return cards.filter((card) => card.key === filter);
  }, [categoryCounts.auth, categoryCounts.billing, categoryCounts.other, categoryCounts.trade, filter]);

  const constrainBreakdown = breakdownRows.length > 5;
  const constrainStream = filteredActivities.length > 10;

  const onRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      const result = await refetch();
      if (result.error) {
        toast.error('Failed to refresh activity feed');
      } else {
        toast.success('Activity feed refreshed');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-start justify-between gap-4 sm:gap-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--accent-primary)' }} />
                <Activity className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h1 className="admin-page-title">Live Activity</h1>
                <p className="admin-page-subtitle mt-1">Auto-refreshes every 5s • Operations event stream</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Showing {filteredActivities.length} of {activities.length} events • Updated {formatLastUpdated(dataUpdatedAt)}
                </p>
              </div>
            </div>
            <div className="flex w-full lg:w-auto flex-wrap items-center gap-2.5 sm:justify-end">
              <div className="admin-inline-filters w-full sm:w-auto">
                {(['all', 'trade', 'auth', 'billing'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors min-h-[44px] min-w-[84px]"
                    style={{
                      background: filter === t ? 'var(--accent-primary)' : 'transparent',
                      color: filter === t ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={onRefresh}
                aria-label="Refresh activity feed"
                title="Refresh activity feed"
                disabled={isRefreshing || isFetching}
                aria-busy={isRefreshing || isFetching}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto admin-page-main">
          <div className="admin-shell flex flex-col gap-6 sm:gap-7 pb-7 sm:pb-9">
            {isError && (
              <div
                className="rounded-lg border px-4 py-3 text-sm sm:text-[15px]"
                style={{
                  background: 'var(--accent-warning-subtle)',
                  borderColor: 'var(--accent-warning-muted)',
                  color: 'var(--accent-warning)',
                }}
              >
                Some activity data could not be loaded. Auto-refresh will continue retrying.
              </div>
            )}

            <div className="activity-grid">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="activity-panel activity-breakdown-panel xl:sticky xl:top-4"
              >
                <div className="activity-panel-head">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <h3 className="admin-section-title">Event Breakdown</h3>
                  </div>
                  <span className="badge badge-muted">{filteredActivities.length}</span>
                </div>
                <p className="activity-panel-kicker">{filterLabel(filter)} tab distribution</p>

                <div className={`activity-summary-grid ${summaryCards.length === 1 ? 'activity-summary-grid-single' : ''}`}>
                  {summaryCards.map((item) => (
                    <div key={item.label} className="activity-summary-card">
                      <p className="activity-summary-label">{item.label}</p>
                      <p className="activity-summary-value">{item.value}</p>
                    </div>
                  ))}
                </div>

                {breakdownRows.length > 0 ? (
                  <div className={`activity-breakdown-list ${constrainBreakdown ? 'activity-breakdown-list-scroll' : ''}`}>
                    {breakdownRows.map(([type, count]) => (
                      <div key={type} className="activity-breakdown-item">
                        <div className="activity-breakdown-row">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ACTIVITY_COLORS[type] || 'var(--accent-neutral)' }} />
                            <span className="activity-breakdown-type">{toReadableType(type)}</span>
                          </div>
                          <span className="activity-breakdown-count">{count}</span>
                        </div>
                        <div className="activity-progress-track">
                          <div
                            className="activity-progress-fill"
                            style={{
                              background: ACTIVITY_COLORS[type] || 'var(--accent-neutral)',
                              width: `${Math.max(8, (count / maxBreakdownCount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No events tracked yet</p>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`activity-panel activity-stream-panel ${constrainStream ? 'activity-stream-panel-scroll' : ''}`}
              >
                <div className="activity-stream-head">
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--accent-success)' }} />
                  <h3 className="admin-section-title">Event Stream</h3>
                  <span className="badge badge-muted activity-stream-head-count">{filteredActivities.length} shown</span>
                  <span className="activity-stream-filter">{filterLabel(filter)}</span>
                </div>
                <div className={`activity-stream-body ${constrainStream ? 'activity-stream-body-scroll' : ''}`}>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex gap-3 p-4 sm:p-5 mb-3 rounded-xl animate-pulse border" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-subtle)' }}>
                        <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--bg-subtle)' }} />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 rounded w-3/4" style={{ background: 'var(--bg-subtle)' }} />
                          <div className="h-2.5 rounded w-1/3" style={{ background: 'var(--bg-subtle)' }} />
                        </div>
                      </div>
                    ))
                  ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-24">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                      <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No Activity Yet</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Events will appear here as users interact with the platform</p>
                    </div>
                  ) : (
                    <div className="activity-stream-list">
                      {filteredActivities.map((a: ActivityItem, i: number) => (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="activity-event-item"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                            style={{ background: ACTIVITY_COLORS[normalizeType(a.type)] || 'var(--accent-neutral)' }}
                          />
                          <div className="activity-event-content">
                            <p className="activity-event-title">
                              {a.user?.name && !a.description.toLowerCase().startsWith(a.user.name.toLowerCase()) && (
                                <span className="font-semibold">{a.user.name} </span>
                              )}
                              {a.description}
                            </p>
                            <div className="activity-event-meta">
                              <span className="badge badge-muted text-xs">{toReadableType(a.type)}</span>
                              <span className="activity-event-time" title={a.timestamp}>{formatFeedTimestamp(a.timestamp)}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
