'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  TrendingUp, 
  CreditCard, 
  Upload, 
  LogIn, 
  Activity,
  MapPin,
  Clock,
  Filter
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
    case 'login': return LogIn;
    case 'trade_created': return TrendingUp;
    case 'trade_closed': return TrendingUp;
    case 'subscription_changed': return CreditCard;
    case 'image_uploaded': return Upload;
    default: return Activity;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'login': return 'text-green-400 bg-green-400/10';
    case 'trade_created': return 'text-blue-400 bg-blue-400/10';
    case 'trade_closed': return 'text-purple-400 bg-purple-400/10';
    case 'subscription_changed': return 'text-yellow-400 bg-yellow-400/10';
    case 'image_uploaded': return 'text-gray-400 bg-gray-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
};

export default function LiveActivityFeed({ activities, loading, onRefresh }: LiveActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');
  const [visibleActivities, setVisibleActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const filtered = filter === 'all' 
      ? activities 
      : activities.filter(activity => activity.type === filter);
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
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-700 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-700 rounded w-1/2"></div>
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
      className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Live Activity Feed</h3>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
          >
            {activityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={onRefresh}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
        <AnimatePresence mode="popLayout">
          {visibleActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClasses = getActivityColor(activity.type);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.userName}
                    </p>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(new Date(activity.timestamp))}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-2">
                    {activity.description}
                  </p>
                  
                  {activity.location && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{activity.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(activity.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {visibleActivities.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activities found for this filter</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>{visibleActivities.length} activities</span>
        </div>
      </div>
    </motion.div>
  );
} 