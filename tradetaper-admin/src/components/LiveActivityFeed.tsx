'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  CreditCard,
  Upload,
  LogIn,
  Activity,
  MapPin,
  Clock,
  Filter,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  type: 'login' | 'trade_created' | 'trade_closed' | 'subscription_changed' | 'image_uploaded';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  location?: string;
}

interface LiveActivityFeedProps {
  activities: ActivityEvent[];
  loading?: boolean;
  onRefresh?: () => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'login':
      return LogIn;
    case 'trade_created':
      return TrendingUp;
    case 'trade_closed':
      return TrendingUp;
    case 'subscription_changed':
      return CreditCard;
    case 'image_uploaded':
      return Upload;
    default:
      return Activity;
  }
};

const getActivityTone = (type: string) => {
  switch (type) {
    case 'login':
      return { color: 'var(--accent-success)', background: 'var(--accent-success-subtle)' };
    case 'trade_created':
      return { color: 'var(--chart-4)', background: 'color-mix(in srgb, var(--chart-4) 18%, transparent)' };
    case 'trade_closed':
      return { color: 'var(--accent-warning)', background: 'var(--accent-warning-subtle)' };
    case 'subscription_changed':
      return { color: 'var(--chart-2)', background: 'color-mix(in srgb, var(--chart-2) 18%, transparent)' };
    case 'image_uploaded':
      return { color: 'var(--accent-neutral)', background: 'var(--bg-muted)' };
    default:
      return { color: 'var(--accent-neutral)', background: 'var(--bg-muted)' };
  }
};

export default function LiveActivityFeed({ activities, loading, onRefresh }: LiveActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');
  const [visibleActivities, setVisibleActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const filtered =
      filter === 'all'
        ? activities
        : activities.filter((activity) => activity.type === filter);
    setVisibleActivities(filtered);
  }, [activities, filter]);

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'login', label: 'Logins' },
    { value: 'trade_created', label: 'New Trades' },
    { value: 'trade_closed', label: 'Closed Trades' },
    { value: 'subscription_changed', label: 'Subscriptions' },
    { value: 'image_uploaded', label: 'Uploads' },
  ];

  if (loading) {
    return (
      <div className="admin-card admin-card-panel">
        <div className="animate-pulse">
          <div className="h-4 rounded w-1/3 mb-4" style={{ background: 'var(--bg-muted)' }} />
          <div className="admin-list-stack">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full" style={{ background: 'var(--bg-muted)' }} />
                <div className="flex-1">
                  <div className="h-3 rounded w-3/4 mb-1" style={{ background: 'var(--bg-muted)' }} />
                  <div className="h-2 rounded w-1/2" style={{ background: 'var(--bg-subtle)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="admin-card admin-card-panel h-full flex flex-col"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Activity className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Live Activity Feed
          </h3>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-success)' }} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select text-sm min-h-[44px] flex-1 sm:flex-none">
            {activityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <button type="button" onClick={onRefresh} className="admin-btn-secondary min-h-[44px] min-w-[44px] px-3" aria-label="Filter or refresh">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto admin-list-stack max-h-[min(60vh,32rem)] pr-1">
        <AnimatePresence mode="popLayout">
          {visibleActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const tone = getActivityTone(activity.type);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="admin-muted-block flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ color: tone.color, background: tone.background }}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {activity.userName}
                      </p>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        •
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(new Date(activity.timestamp))}
                      </span>
                    </div>

                    <p className="text-sm leading-6 mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {activity.description}
                    </p>

                    {activity.location && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <MapPin className="w-3 h-3" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs sm:pl-2" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(activity.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleActivities.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activities found for this filter</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>{visibleActivities.length} activities</span>
        </div>
      </div>
    </motion.div>
  );
}
