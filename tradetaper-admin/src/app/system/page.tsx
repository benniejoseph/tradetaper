'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { 
  Server, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function SystemPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: systemHealth, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: adminApi.getSystemHealth,
    refetchInterval: autoRefresh ? 5000 : false, // 5 second refresh when enabled
  });

  // Mock real-time system data
  const systemMetrics = {
    servers: [
      { 
        name: 'API Server 1', 
        status: 'healthy', 
        cpu: 45, 
        memory: 62, 
        uptime: '12d 5h 23m',
        requests: 1540,
        errors: 3,
        location: 'US-East-1'
      },
      { 
        name: 'API Server 2', 
        status: 'healthy', 
        cpu: 38, 
        memory: 58, 
        uptime: '12d 5h 23m',
        requests: 1320,
        errors: 1,
        location: 'US-West-2'
      },
      { 
        name: 'Database Primary', 
        status: 'warning', 
        cpu: 78, 
        memory: 84, 
        uptime: '25d 10h 45m',
        requests: 4560,
        errors: 12,
        location: 'US-East-1'
      },
      { 
        name: 'Cache Server', 
        status: 'healthy', 
        cpu: 23, 
        memory: 41, 
        uptime: '15d 8h 12m',
        requests: 8945,
        errors: 0,
        location: 'US-East-1'
      },
    ],
    realTimeMetrics: {
      apiLatency: [
        { time: '00:00', latency: 120 },
        { time: '00:05', latency: 135 },
        { time: '00:10', latency: 110 },
        { time: '00:15', latency: 145 },
        { time: '00:20', latency: 155 },
        { time: '00:25', latency: 140 },
        { time: '00:30', latency: 130 },
      ],
      systemLoad: [
        { time: '00:00', cpu: 45, memory: 62, network: 23 },
        { time: '00:05', cpu: 48, memory: 64, network: 28 },
        { time: '00:10', cpu: 42, memory: 61, network: 19 },
        { time: '00:15', cpu: 52, memory: 68, network: 35 },
        { time: '00:20', cpu: 49, memory: 65, network: 31 },
        { time: '00:25', cpu: 46, memory: 63, network: 25 },
        { time: '00:30', cpu: 43, memory: 60, network: 22 },
      ],
    },
    alerts: [
      { 
        id: 1, 
        severity: 'warning', 
        message: 'Database CPU usage above 75%', 
        timestamp: new Date(Date.now() - 5 * 60000),
        component: 'Database'
      },
      { 
        id: 2, 
        severity: 'info', 
        message: 'Successful deployment to production', 
        timestamp: new Date(Date.now() - 15 * 60000),
        component: 'Deployment'
      },
      { 
        id: 3, 
        severity: 'error', 
        message: 'Rate limit exceeded for API endpoint /trades', 
        timestamp: new Date(Date.now() - 32 * 60000),
        component: 'API'
      },
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return XCircle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-400 bg-blue-500/10';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10';
      case 'error': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const performanceData = [
    { metric: 'Uptime', value: systemHealth?.uptime || 99.9, fullMark: 100 },
    { metric: 'Response Time', value: 100 - ((systemHealth?.responseTime || 145) / 10), fullMark: 100 },
    { metric: 'CPU Health', value: 100 - (systemHealth?.cpuUsage || 45), fullMark: 100 },
    { metric: 'Memory Health', value: 100 - (systemHealth?.memoryUsage || 62), fullMark: 100 },
    { metric: 'Cache Hit Rate', value: systemHealth?.cacheHitRate || 94.5, fullMark: 100 },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Server className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  System Health & Performance
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Real-time monitoring • Last updated {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                <span>Auto-refresh</span>
              </label>
              
              <button 
                onClick={() => refetch()}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/25">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configure</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-400">Online</div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{systemHealth?.uptime || 99.9}%</h3>
              <p className="text-gray-400 text-sm">System Uptime</p>
            </motion.div>

            {/* Response Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-400">Avg Response</div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{systemHealth?.responseTime || 145}ms</h3>
              <p className="text-gray-400 text-sm">API Response Time</p>
            </motion.div>

            {/* Error Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-yellow-400">24h Errors</div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{systemHealth?.errors24h || 16}</h3>
              <p className="text-gray-400 text-sm">Error Events</p>
            </motion.div>

            {/* API Calls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-purple-400">24h Requests</div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{formatNumber(systemHealth?.apiCalls24h || 45678)}</h3>
              <p className="text-gray-400 text-sm">API Calls</p>
            </motion.div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* System Performance Radar */}
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                    <PolarRadiusAxis stroke="#9CA3AF" />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Real-time System Load</h3>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={systemMetrics.realTimeMetrics.systemLoad}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        border: '1px solid rgba(75, 85, 99, 0.5)',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#EF4444" strokeWidth={2} dot={false} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#3B82F6" strokeWidth={2} dot={false} name="Memory %" />
                    <Line type="monotone" dataKey="network" stroke="#10B981" strokeWidth={2} dot={false} name="Network %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Server Status & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Server Status */}
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Server Status</h3>
              <div className="space-y-4">
                {systemMetrics.servers.map((server, index) => {
                  const StatusIcon = getStatusIcon(server.status);
                  return (
                    <motion.div
                      key={server.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                    >
                      <div className="flex items-center space-x-4">
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(server.status)}`} />
                        <div>
                          <h4 className="font-medium text-white">{server.name}</h4>
                          <p className="text-sm text-gray-400">{server.location} • Uptime: {server.uptime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">CPU</p>
                            <p className="text-white font-medium">{server.cpu}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Memory</p>
                            <p className="text-white font-medium">{server.memory}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Errors</p>
                            <p className="text-white font-medium">{server.errors}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Recent Alerts</h3>
              <div className="space-y-4">
                {systemMetrics.alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-xl"
                  >
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-sm">{alert.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-400">{alert.component}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-400">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}