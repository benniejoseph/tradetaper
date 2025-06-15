'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { 
  Terminal, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertTriangle, 
  Info, 
  XCircle, 
  CheckCircle,
  Clock,
  Eye,
  Settings,
  Trash2,
  Database,
  Activity
} from 'lucide-react';
import { adminApi, LogEntry } from '@/lib/api';

interface LogFilter {
  level: string;
  startDate: string;
  endDate: string;
  search: string;
  context: string;
}

interface SystemMetrics {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  logRate: number; // logs per minute
  topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  errorsByType: Array<{ type: string; count: number }>;
  recentActivity: LogEntry[];
}

const LogViewer = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [filters, setFilters] = useState<LogFilter>({
    level: '',
    startDate: '',
    endDate: '',
    search: '',
    context: ''
  });
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'stream' | 'analytics'>('list');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadLogs();
    loadMetrics();
  }, [filters]);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadLogs(true);
      }, 5000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (viewMode === 'stream' && logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, viewMode]);

  const loadLogs = async (append = false) => {
    try {
      setLoading(!append);
      const response = await adminApi.getLogs(
        100, 
        append ? logs.length : 0,
        filters.level || undefined,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      
      if (append) {
        setLogs(prev => [...prev, ...response.data]);
      } else {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      // Mock data for development
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          level: 'error',
          message: 'Database connection failed',
          context: 'Database',
          timestamp: new Date().toISOString(),
          endpoint: '/api/v1/admin/users',
          method: 'GET',
          details: { error: 'Connection timeout', duration: 5000 }
        },
        {
          id: '2',
          level: 'warn',
          message: 'High memory usage detected',
          context: 'System',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          details: { memoryUsage: 85, threshold: 80 }
        },
        {
          id: '3',
          level: 'info',
          message: 'User authentication successful',
          context: 'Auth',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          endpoint: '/api/v1/auth/login',
          method: 'POST',
          userId: 'user-123'
        }
      ];
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Mock metrics data
      const mockMetrics: SystemMetrics = {
        totalLogs: 15432,
        errorCount: 89,
        warningCount: 234,
        infoCount: 15109,
        logRate: 12.5,
        topEndpoints: [
          { endpoint: '/api/v1/admin/dashboard-stats', count: 1250, avgResponseTime: 245 },
          { endpoint: '/api/v1/auth/login', count: 890, avgResponseTime: 156 },
          { endpoint: '/api/v1/admin/users', count: 567, avgResponseTime: 320 }
        ],
        errorsByType: [
          { type: 'Database Error', count: 45 },
          { type: 'Authentication Error', count: 23 },
          { type: 'Validation Error', count: 21 }
        ],
        recentActivity: logs.slice(0, 5)
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleFilterChange = (key: keyof LogFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      level: '',
      startDate: '',
      endDate: '',
      search: '',
      context: ''
    });
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'debug':
        return <Terminal className="w-4 h-4 text-gray-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-900/20 border-red-500/30 text-red-300';
      case 'warn':
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300';
      case 'info':
        return 'bg-blue-900/20 border-blue-500/30 text-blue-300';
      case 'debug':
        return 'bg-gray-900/20 border-gray-500/30 text-gray-300';
      default:
        return 'bg-green-900/20 border-green-500/30 text-green-300';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.level && log.level !== filters.level) return false;
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.context && log.context !== filters.context) return false;
    if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        <main className="flex-1 scrollable-content p-6">
          <div className="max-w-full mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl mr-4">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  System Logs & Debugging
                </h1>
                <p className="text-gray-400">Monitor system activity, errors, and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('stream')}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    viewMode === 'stream' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Stream
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    viewMode === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Analytics
                </button>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-green-600/20 border border-green-500/30 text-green-400' 
                    : 'bg-gray-800/50 border border-gray-600 text-gray-400 hover:text-white'
                }`}
              >
                {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => loadLogs()}
                disabled={loading}
                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all"
              >
                <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportLogs}
                className="p-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all"
              >
                <Download className="w-4 h-4 text-green-400" />
              </button>
            </div>
          </div>

          {/* Metrics Overview */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Logs</p>
                    <p className="text-2xl font-bold text-white">{metrics.totalLogs.toLocaleString()}</p>
                  </div>
                  <Terminal className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Errors (24h)</p>
                    <p className="text-2xl font-bold text-red-400">{metrics.errorCount}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Warnings (24h)</p>
                    <p className="text-2xl font-bold text-yellow-400">{metrics.warningCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Log Rate</p>
                    <p className="text-2xl font-bold text-green-400">{metrics.logRate}/min</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Context</label>
                <select
                  value={filters.context}
                  onChange={(e) => handleFilterChange('context', e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Contexts</option>
                  <option value="Auth">Authentication</option>
                  <option value="Database">Database</option>
                  <option value="API">API</option>
                  <option value="System">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {viewMode === 'analytics' && metrics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Endpoints */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Endpoints</h3>
              <div className="space-y-3">
                {metrics.topEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{endpoint.endpoint}</p>
                      <p className="text-xs text-gray-400">{endpoint.count} requests</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-400">{endpoint.avgResponseTime}ms</p>
                      <p className="text-xs text-gray-400">avg response</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors by Type */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Error Types</h3>
              <div className="space-y-3">
                {metrics.errorsByType.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-white">{error.type}</span>
                    </div>
                    <span className="text-sm text-red-400">{error.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
            {/* Logs Header */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  System Logs ({filteredLogs.length})
                </h3>
                <div className="flex items-center space-x-2">
                  {autoRefresh && (
                    <span className="text-xs text-green-400 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Live</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logs List */}
            <div className={`${viewMode === 'stream' ? 'h-96' : 'h-auto'} overflow-y-auto`}>
              {loading && filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No logs found with current filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/50">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start space-x-3">
                        {getLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            {log.context && (
                              <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                                {log.context}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-white text-sm mb-1">{log.message}</p>
                          {log.endpoint && (
                            <p className="text-xs text-gray-400">
                              {log.method} {log.endpoint}
                            </p>
                          )}
                        </div>
                        <button className="p-1 text-gray-400 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Level</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedLog.level)}`}>
                      {selectedLog.level.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Timestamp</label>
                    <p className="text-white text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Message</label>
                  <p className="text-white bg-gray-800/50 p-3 rounded-lg">{selectedLog.message}</p>
                </div>
                
                {selectedLog.endpoint && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Endpoint</label>
                      <p className="text-white text-sm">{selectedLog.endpoint}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Method</label>
                      <p className="text-white text-sm">{selectedLog.method}</p>
                    </div>
                  </div>
                )}
                
                {selectedLog.details && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Details</label>
                    <pre className="text-gray-300 bg-gray-800/50 p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LogViewer;