'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Activity, Zap, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/api';

const ACTIVITY_COLORS: Record<string, string> = {
  login: '#6366F1',
  trade_created: '#10B981',
  trade_closed: '#F59E0B',
  subscription_changed: '#8B5CF6',
  image_uploaded: '#06B6D4',
};

export default function ActivityPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: feed, isLoading, refetch } = useQuery({
    queryKey: ['activity-feed-full'],
    queryFn: () => adminApi.getActivityFeed(50),
    refetchInterval: 5000,
  });

  const activities = feed || [];

  const eventBreakdown = activities.reduce((acc: Record<string, number>, a: any) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: '#10B981' }} />
              <Activity className="w-5 h-5" style={{ color: '#10B981' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Live Activity</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-refreshes every 5s</p>
            </div>
          </div>
          <button className="admin-btn-secondary" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Breakdown */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="admin-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Event Breakdown</h3>
              </div>
              {Object.keys(eventBreakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(eventBreakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: ACTIVITY_COLORS[type] || '#94A3B8' }} />
                          <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                            {type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-muted)' }}>
                        <div className="h-full rounded-full" style={{
                          background: ACTIVITY_COLORS[type] || '#94A3B8',
                          width: `${(count / activities.length) * 100}%`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No events tracked yet</p>
                </div>
              )}
            </motion.div>

            {/* Live Feed */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="admin-card col-span-2" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: '#10B981' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Event Stream</h3>
                <span className="badge badge-muted ml-auto">{activities.length} events</span>
              </div>
              <div className="overflow-y-auto flex-1 p-3">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-3 mb-1 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }}>
                      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--bg-subtle)' }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded w-3/4" style={{ background: 'var(--bg-subtle)' }} />
                        <div className="h-2.5 rounded w-1/3" style={{ background: 'var(--bg-subtle)' }} />
                      </div>
                    </div>
                  ))
                ) : activities.length === 0 ? (
                  <div className="text-center py-20">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No Activity Yet</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Events will appear here as users interact with the platform</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activities.map((a: any, i: number) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: 'var(--bg-muted)' }}
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                             style={{ background: ACTIVITY_COLORS[a.type] || '#94A3B8' }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {a.user?.name && <span className="font-semibold">{a.user.name}</span>}
                            {' '}{a.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="badge badge-muted text-[10px]">{a.type?.replace(/_/g, ' ')}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {new Date(a.timestamp).toLocaleString()}
                            </span>
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
  );
}