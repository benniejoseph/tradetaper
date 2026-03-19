'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/lib/api-base-url';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Activity,
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  responseTime?: number;
  lastChecked: string;
  url?: string;
  details?: Record<string, unknown> | null;
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
    try {
      const checkedAt = new Date().toISOString();
      const newServices: ServiceStatus[] = [];
      const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/, '');

      try {
        const startTime = Date.now();
        const response = await fetch(`${apiOrigin}/api/v1/health`, {
          cache: 'no-store',
        });
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json().catch(() => null);
          newServices.push({
            name: 'Backend API',
            status: 'online',
            responseTime,
            lastChecked: checkedAt,
            url: `${apiOrigin}/api/v1/health`,
            details: data,
          });
        } else {
          newServices.push({
            name: 'Backend API',
            status: 'degraded',
            responseTime,
            lastChecked: checkedAt,
            url: `${apiOrigin}/api/v1/health`,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error: unknown) {
        newServices.push({
          name: 'Backend API',
          status: 'offline',
          lastChecked: checkedAt,
          url: `${apiOrigin}/api/v1/health`,
          error: error instanceof Error ? error.message : 'Request failed',
        });
      }

      try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}/admin/system-health`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json().catch(() => null);
          newServices.push({
            name: 'Admin API',
            status: 'online',
            responseTime,
            lastChecked: checkedAt,
            url: `${API_BASE_URL}/admin/system-health`,
            details: data,
          });
        } else if (response.status === 401) {
          newServices.push({
            name: 'Admin API',
            status: 'degraded',
            responseTime,
            lastChecked: checkedAt,
            url: `${API_BASE_URL}/admin/system-health`,
            error: 'Admin session expired',
          });
        } else {
          newServices.push({
            name: 'Admin API',
            status: 'degraded',
            responseTime,
            lastChecked: checkedAt,
            url: `${API_BASE_URL}/admin/system-health`,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error: unknown) {
        newServices.push({
          name: 'Admin API',
          status: 'offline',
          lastChecked: checkedAt,
          url: `${API_BASE_URL}/admin/system-health`,
          error: error instanceof Error ? error.message : 'Request failed',
        });
      }

      newServices.push({
        name: 'Admin Panel',
        status: 'online',
        lastChecked: checkedAt,
        url: window.location.origin,
        details: { note: 'Currently viewing' },
      });

      setServices(newServices);
      setLastRefresh(checkedAt);

      const backendPublic = newServices.find((s) => s.name === 'Backend API');
      const adminApi = newServices.find((s) => s.name === 'Admin API');
      const backendDetails = backendPublic?.details || {};
      const adminDetails = adminApi?.details || {};

      setSystemInfo({
        deployment: {
          backend: {
            url: apiOrigin,
            version: typeof backendDetails.version === 'string' ? backendDetails.version : 'n/a',
            uptime:
              typeof adminDetails.uptime === 'number'
                ? adminDetails.uptime
                : typeof backendDetails.uptime === 'number'
                  ? backendDetails.uptime
                  : 0,
            status: backendPublic?.status || 'unknown',
          },
          admin: {
            url: window.location.origin,
            status: 'online',
            lastDeploy: 'Latest',
          },
          frontend: {
            url: 'Not monitored from browser',
            status: 'unknown',
            lastDeploy: 'N/A',
          },
        },
        database: {
          status:
            typeof backendDetails.db === 'string'
              ? backendDetails.db
              : typeof adminDetails.database === 'string'
                ? adminDetails.database
                : 'unknown',
          connectionCount:
            typeof adminDetails.databaseConnections === 'number'
              ? adminDetails.databaseConnections
              : 0,
          responseTime: adminApi?.responseTime || backendPublic?.responseTime || 0,
        },
        external: {
          railway: backendPublic?.status === 'online',
          vercel: true,
          github: false,
        },
      });
    } finally {
      setIsRefreshing(false);
    }
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
    <div className="flex h-dvh" style={{ background: 'var(--bg-base)' }}>
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
          <div className="max-w-[var(--content-max-width)] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                  System Status
                </h1>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Real-time monitoring of all TradeTaper services
                </p>
              </div>
            </div>
            <button
              onClick={checkAllServices}
              disabled={isRefreshing}
              className="admin-btn-secondary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5">
          <div className="max-w-[var(--content-max-width)] mx-auto space-y-4">

            {/* Overall Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="admin-card p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className={`text-base font-bold ${overallStatusColor()}`}>{overallStatus()}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Last updated: {new Date(lastRefresh).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { label: 'Online', count: services.filter(s => s.status === 'online').length, color: '#10B981' },
                  { label: 'Degraded', count: services.filter(s => s.status === 'degraded').length, color: '#FBBF24' },
                  { label: 'Offline', count: services.filter(s => s.status === 'offline').length, color: '#F43F5E' },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {services.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="admin-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{service.name}</span>
                    </div>
                    {service.url && (
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${service.name} endpoint`}
                        title={`Open ${service.name} endpoint`}
                        style={{ color: 'var(--text-muted)' }}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</span>
                      <span className={`text-xs font-semibold capitalize ${
                        service.status === 'online' ? 'text-green-400' :
                        service.status === 'degraded' ? 'text-yellow-400' :
                        service.status === 'offline' ? 'text-red-400' : ''
                      }`} style={service.status === 'unknown' ? { color: 'var(--text-muted)' } : {}}>
                        {service.status}
                      </span>
                    </div>

                    {service.responseTime != null && (
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Response</span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{service.responseTime}ms</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Checked</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(service.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {service.error && (
                      <div className="mt-2 px-2 py-1.5 rounded-md text-[10px]"
                        style={{ background: 'var(--accent-danger-subtle)', color: 'var(--accent-danger)' }}>
                        {service.error}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* System Information */}
            {systemInfo && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.4 }}
                className="admin-card p-5"
              >
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Server className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  System Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Deployments</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Backend', value: `v${systemInfo.deployment.backend.version}`, ok: systemInfo.deployment.backend.status === 'online' },
                        { label: 'Admin', value: 'Active', ok: true },
                        { label: 'Frontend', value: systemInfo.deployment.frontend.status, ok: systemInfo.deployment.frontend.status === 'online' },
                      ].map(d => (
                        <div key={d.label} className="flex justify-between">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                          <span className="text-xs font-semibold" style={{ color: d.ok ? '#10B981' : '#F43F5E' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>External Services</p>
                    <div className="space-y-2">
                      {[
                        { label: 'GCP Cloud Run', ok: systemInfo.external.railway },
                        { label: 'Vercel', ok: systemInfo.external.vercel },
                        { label: 'GitHub', ok: systemInfo.external.github },
                      ].map(ext => (
                        <div key={ext.label} className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ext.label}</span>
                          {ext.ok
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Performance</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Uptime</span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {Math.floor(systemInfo.deployment.backend.uptime / 3600)}h
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>DB Status</span>
                        <span className="text-xs font-semibold" style={{ color: systemInfo.database.status === 'connected' ? '#10B981' : '#F43F5E' }}>
                          {systemInfo.database.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Response</span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{systemInfo.database.responseTime}ms</span>
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
