'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { 
  Server, 
  Database, 
  Cloud, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Globe,
  Zap,
  Shield,
  Activity,
  Wifi,
  HardDrive
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  responseTime?: number;
  lastChecked: string;
  url?: string;
  details?: any;
  error?: string;
}

interface SystemInfo {
  deployment: {
    backend: {
      url: string;
      version: string;
      uptime: number;
      status: string;
    };
    admin: {
      url: string;
      status: string;
      lastDeploy: string;
    };
    frontend: {
      url: string;
      status: string;
      lastDeploy: string;
    };
  };
  database: {
    status: string;
    connectionCount: number;
    responseTime: number;
  };
  external: {
    railway: boolean;
    vercel: boolean;
    github: boolean;
  };
}

export default function StatusPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toISOString());

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkAllServices = async () => {
    setIsRefreshing(true);
    const newServices: ServiceStatus[] = [];

    // Check Backend API
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.tradetaper.com/api/v1/health');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        newServices.push({
          name: 'Backend API',
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          url: 'https://api.tradetaper.com',
          details: data
        });
      } else {
        newServices.push({
          name: 'Backend API',
          status: 'degraded',
          lastChecked: new Date().toISOString(),
          url: 'https://api.tradetaper.com',
          error: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      newServices.push({
        name: 'Backend API',
        status: 'offline',
        lastChecked: new Date().toISOString(),
        url: 'https://api.tradetaper.com',
        error: error.message
      });
    }

    // Check Backend Ping Endpoint
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.tradetaper.com/api/v1/ping');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        newServices.push({
          name: 'Backend Ping',
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          url: 'https://api.tradetaper.com/api/v1/ping',
          details: data
        });
      } else {
        newServices.push({
          name: 'Backend Ping',
          status: 'offline',
          lastChecked: new Date().toISOString(),
          url: 'https://api.tradetaper.com/api/v1/ping',
          error: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      newServices.push({
        name: 'Backend Ping',
        status: 'offline',
        lastChecked: new Date().toISOString(),
        url: 'https://api.tradetaper.com/api/v1/ping',
        error: error.message
      });
    }

    // Check Admin Login Endpoint
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.tradetaper.com/api/v1/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 401) {
        // 401 is expected for wrong credentials, means endpoint is working
        newServices.push({
          name: 'Admin Login',
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          url: 'https://api.tradetaper.com/api/v1/auth/admin/login',
          details: { note: 'Endpoint accessible (401 expected)' }
        });
      } else if (response.status === 404) {
        newServices.push({
          name: 'Admin Login',
          status: 'offline',
          lastChecked: new Date().toISOString(),
          url: 'https://api.tradetaper.com/api/v1/auth/admin/login',
          error: 'Endpoint not found (404)'
        });
      } else {
        newServices.push({
          name: 'Admin Login',
          status: 'degraded',
          lastChecked: new Date().toISOString(),
          url: 'https://api.tradetaper.com/api/v1/auth/admin/login',
          error: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      newServices.push({
        name: 'Admin Login',
        status: 'offline',
        lastChecked: new Date().toISOString(),
        url: 'https://api.tradetaper.com/api/v1/auth/admin/login',
        error: error.message
      });
    }

    // Check Database Access
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.tradetaper.com/api/v1/admin/database/tables', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 401) {
        // 401 means endpoint exists but requires auth
        newServices.push({
          name: 'Database Access',
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: { note: 'Endpoint accessible (auth required)' }
        });
      } else if (response.status === 404) {
        newServices.push({
          name: 'Database Access',
          status: 'offline',
          lastChecked: new Date().toISOString(),
          error: 'Endpoint not found (404)'
        });
      } else if (response.ok) {
        newServices.push({
          name: 'Database Access',
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: { note: 'Endpoint accessible' }
        });
      } else {
        newServices.push({
          name: 'Database Access',
          status: 'degraded',
          lastChecked: new Date().toISOString(),
          error: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      newServices.push({
        name: 'Database Access',
        status: 'offline',
        lastChecked: new Date().toISOString(),
        error: error.message
      });
    }

    // Check Frontend
    try {
      const startTime = Date.now();
      const response = await fetch('https://tradetaper-frontend-benniejosephs-projects.vercel.app');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        newServices.push({
          name: 'Frontend',
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          url: 'https://tradetaper-frontend-benniejosephs-projects.vercel.app'
        });
      } else {
        newServices.push({
          name: 'Frontend',
          status: 'degraded',
          lastChecked: new Date().toISOString(),
          url: 'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
          error: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      newServices.push({
        name: 'Frontend',
        status: 'offline',
        lastChecked: new Date().toISOString(),
        url: 'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
        error: error.message
      });
    }

    // Check Current Admin (this page)
    newServices.push({
      name: 'Admin Panel',
      status: 'online',
      lastChecked: new Date().toISOString(),
      url: window.location.origin,
      details: { note: 'Currently viewing' }
    });

    setServices(newServices);
    setLastRefresh(new Date().toISOString());
    setIsRefreshing(false);

    // Update system info
    const backendService = newServices.find(s => s.name === 'Backend API');
    setSystemInfo({
      deployment: {
        backend: {
          url: 'https://api.tradetaper.com',
          version: backendService?.details?.version || 'Unknown',
          uptime: backendService?.details?.uptime || 0,
          status: backendService?.status || 'unknown'
        },
        admin: {
          url: window.location.origin,
          status: 'online',
          lastDeploy: 'Latest'
        },
        frontend: {
          url: 'https://tradetaper-frontend-benniejosephs-projects.vercel.app',
          status: newServices.find(s => s.name === 'Frontend')?.status || 'unknown',
          lastDeploy: 'Latest'
        }
      },
      database: {
        status: backendService?.details?.database || 'unknown',
        connectionCount: 0,
        responseTime: backendService?.responseTime || 0
      },
      external: {
        railway: backendService?.status === 'online',
        vercel: true,
        github: true
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'border-green-500/30 bg-green-900/20';
      case 'degraded':
        return 'border-yellow-500/30 bg-yellow-900/20';
      case 'offline':
        return 'border-red-500/30 bg-red-900/20';
      default:
        return 'border-gray-500/30 bg-gray-900/20';
    }
  };

  const overallStatus = () => {
    const onlineCount = services.filter(s => s.status === 'online').length;
    const totalCount = services.length;
    
    if (onlineCount === totalCount) return 'All Systems Operational';
    if (onlineCount > totalCount * 0.7) return 'Partial Service Degradation';
    return 'Major Service Outage';
  };

  const overallStatusColor = () => {
    const onlineCount = services.filter(s => s.status === 'online').length;
    const totalCount = services.length;
    
    if (onlineCount === totalCount) return 'text-green-400';
    if (onlineCount > totalCount * 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        <main className="flex-1 scrollable-content p-6">
      <div className="max-w-7xl mx-auto">
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
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  System Status
                </h1>
                <p className="text-gray-400">Real-time monitoring of all TradeTaper services</p>
              </div>
            </div>
            <button
              onClick={checkAllServices}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-blue-400">Refresh</span>
            </button>
          </div>

          {/* Overall Status */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${overallStatusColor()}`}>{overallStatus()}</h2>
                <p className="text-gray-400">Last updated: {new Date(lastRefresh).toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{services.filter(s => s.status === 'online').length}</p>
                  <p className="text-xs text-gray-400">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{services.filter(s => s.status === 'degraded').length}</p>
                  <p className="text-xs text-gray-400">Degraded</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{services.filter(s => s.status === 'offline').length}</p>
                  <p className="text-xs text-gray-400">Offline</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`p-6 rounded-2xl border backdrop-blur-xl ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                </div>
                {service.url && (
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className={`text-sm capitalize ${
                    service.status === 'online' ? 'text-green-400' :
                    service.status === 'degraded' ? 'text-yellow-400' :
                    service.status === 'offline' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {service.status}
                  </span>
                </div>

                {service.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Response Time</span>
                    <span className="text-sm text-white">{service.responseTime}ms</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Last Checked</span>
                  <span className="text-sm text-white">
                    {new Date(service.lastChecked).toLocaleTimeString()}
                  </span>
                </div>

                {service.error && (
                  <div className="mt-3 p-2 bg-red-900/30 border border-red-700/50 rounded">
                    <p className="text-xs text-red-300">{service.error}</p>
                  </div>
                )}

                {service.details && (
                  <div className="mt-3 p-2 bg-gray-800/50 rounded">
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(service.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* System Information */}
        {systemInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <Server className="w-6 h-6 mr-2" />
              System Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Deployment Info */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Deployments</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Backend</span>
                    <span className={`text-sm ${
                      systemInfo.deployment.backend.status === 'online' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      v{systemInfo.deployment.backend.version}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Admin</span>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frontend</span>
                    <span className={`text-sm ${
                      systemInfo.deployment.frontend.status === 'online' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {systemInfo.deployment.frontend.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* External Services */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">External Services</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Railway</span>
                    {systemInfo.external.railway ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Vercel</span>
                    {systemInfo.external.vercel ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">GitHub</span>
                    {systemInfo.external.github ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-white text-sm">
                      {Math.floor(systemInfo.deployment.backend.uptime / 3600)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">DB Status</span>
                    <span className={`text-sm ${
                      systemInfo.database.status === 'connected' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {systemInfo.database.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Time</span>
                    <span className="text-white text-sm">{systemInfo.database.responseTime}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}