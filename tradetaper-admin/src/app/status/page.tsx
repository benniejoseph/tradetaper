'use client';

import { useState, useEffect, useCallback } from 'react';
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

type ExternalServiceState = 'online' | 'degraded' | 'offline' | 'unknown';

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
    cloudRun: ExternalServiceState;
    vercel: ExternalServiceState;
    github: ExternalServiceState;
  };
}

function getExternalState(service?: ServiceStatus): ExternalServiceState {
  if (!service) {
    return 'unknown';
  }
  if (service.status === 'online') {
    return 'online';
  }
  if (service.status === 'offline') {
    return 'offline';
  }
  if (service.status === 'degraded') {
    return 'degraded';
  }
  return 'unknown';
}

export default function StatusPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toISOString());

  const checkAllServices = useCallback(async () => {
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

      const externalStatusPages = [
        { name: 'Vercel Platform', url: 'https://www.vercel-status.com/api/v2/status.json' },
        { name: 'GitHub Platform', url: 'https://www.githubstatus.com/api/v2/status.json' },
      ] as const;

      for (const service of externalStatusPages) {
        try {
          const startTime = Date.now();
          const response = await fetch(service.url, {
            cache: 'no-store',
          });
          const responseTime = Date.now() - startTime;

          if (!response.ok) {
            newServices.push({
              name: service.name,
              status: 'degraded',
              responseTime,
              lastChecked: checkedAt,
              url: service.url,
              error: `HTTP ${response.status}`,
            });
            continue;
          }

          const payload = await response.json().catch(() => null);
          const indicator = typeof payload?.status?.indicator === 'string'
            ? payload.status.indicator
            : 'unknown';
          const providerDescription = typeof payload?.status?.description === 'string'
            ? payload.status.description
            : undefined;

          let mappedStatus: ServiceStatus['status'] = 'unknown';
          if (indicator === 'none') {
            mappedStatus = 'online';
          } else if (indicator === 'minor' || indicator === 'major') {
            mappedStatus = 'degraded';
          } else if (indicator === 'critical') {
            mappedStatus = 'offline';
          }

          newServices.push({
            name: service.name,
            status: mappedStatus,
            responseTime,
            lastChecked: checkedAt,
            url: service.url,
            details: payload,
            error: mappedStatus === 'online'
              ? undefined
              : mappedStatus === 'unknown'
                ? 'Unknown provider status'
                : providerDescription,
          });
        } catch (error: unknown) {
          newServices.push({
            name: service.name,
            status: 'offline',
            lastChecked: checkedAt,
            url: service.url,
            error: error instanceof Error ? error.message : 'Request failed',
          });
        }
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
      const vercelPlatform = newServices.find((s) => s.name === 'Vercel Platform');
      const githubPlatform = newServices.find((s) => s.name === 'GitHub Platform');
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
          cloudRun: getExternalState(backendPublic),
          vercel: getExternalState(vercelPlatform),
          github: getExternalState(githubPlatform),
        },
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkAllServices]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5" style={{ color: 'var(--accent-warning)' }} />;
      case 'offline':
        return <XCircle className="w-5 h-5" style={{ color: 'var(--accent-danger)' }} />;
      default:
        return <Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const overallStatus = () => {
    const onlineCount = services.filter(s => s.status === 'online').length;
    const totalCount = services.length;

    if (totalCount === 0) return 'Checking Services...';
    if (onlineCount === totalCount) return 'All Systems Operational';
    if (onlineCount > totalCount * 0.7) return 'Partial Service Degradation';
    return 'Major Service Outage';
  };

  const overallStatusColor = () => {
    const onlineCount = services.filter(s => s.status === 'online').length;
    const totalCount = services.length;

    if (totalCount === 0) return 'var(--text-secondary)';
    if (onlineCount === totalCount) return 'var(--accent-success)';
    if (onlineCount > totalCount * 0.7) return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  };

  const statusColor = (status: ServiceStatus['status']) => {
    if (status === 'online') return 'var(--accent-success)';
    if (status === 'degraded') return 'var(--accent-warning)';
    if (status === 'offline') return 'var(--accent-danger)';
    return 'var(--text-muted)';
  };

  return (
    <div className="flex h-dvh" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="admin-page-title">System Status</h1>
                <p className="hidden min-[400px]:block admin-page-subtitle">
                  Real-time monitoring of all TradeTaper services
                </p>
              </div>
            </div>
            <button
              onClick={checkAllServices}
              disabled={isRefreshing}
              className="admin-btn-secondary w-full sm:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh Status</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto admin-page-main">
          <div className="admin-shell admin-page-stack">

            {/* Overall Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="admin-card admin-card-panel flex flex-wrap items-center justify-between gap-6 sm:gap-7"
            >
              <div className="space-y-1.5">
                <p className="text-lg font-bold" style={{ color: overallStatusColor() }}>{overallStatus()}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Last updated: {new Date(lastRefresh).toLocaleTimeString()}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full sm:w-auto max-w-sm">
                {[
                  { label: 'Online', count: services.filter(s => s.status === 'online').length, color: 'var(--accent-success)' },
                  { label: 'Degraded', count: services.filter(s => s.status === 'degraded').length, color: 'var(--accent-warning)' },
                  { label: 'Offline', count: services.filter(s => s.status === 'offline').length, color: 'var(--accent-danger)' },
                ].map(stat => (
                  <div key={stat.label} className="admin-muted-block text-center">
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.count}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="admin-card admin-card-panel"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {getStatusIcon(service.status)}
                      <span className="text-base font-semibold leading-6" style={{ color: 'var(--text-primary)' }}>{service.name}</span>
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

                  <div className="admin-list-stack-tight">
                    <div className="admin-muted-block flex items-center justify-between gap-3">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Status</span>
                      <span
                        className="text-sm font-semibold capitalize"
                        style={{ color: statusColor(service.status) }}
                      >
                        {service.status}
                      </span>
                    </div>

                    {service.responseTime != null && (
                      <div className="admin-muted-block flex items-center justify-between gap-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Response</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{service.responseTime}ms</span>
                      </div>
                    )}

                    <div className="admin-muted-block flex items-center justify-between gap-3">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Checked</span>
                      <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(service.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {service.error && (
                      <div className="mt-2 px-3 py-2.5 rounded-lg text-sm"
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
                className="admin-card admin-card-panel"
              >
                <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Server className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  System Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  <div className="admin-muted-block admin-list-stack-tight">
                    <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Deployments</p>
                    <div className="admin-list-stack-tight">
                      {[
                        { label: 'Backend', value: `v${systemInfo.deployment.backend.version}`, ok: systemInfo.deployment.backend.status === 'online' },
                        { label: 'Admin', value: 'Active', ok: true },
                        { label: 'Frontend', value: systemInfo.deployment.frontend.status, ok: systemInfo.deployment.frontend.status === 'online' },
                      ].map(d => (
                        <div key={d.label} className="flex items-center justify-between gap-3">
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                          <span className="text-sm font-semibold" style={{ color: d.ok ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-muted-block admin-list-stack-tight">
                    <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>External Services</p>
                    <div className="admin-list-stack-tight">
                      {[
                        { label: 'GCP Cloud Run', state: systemInfo.external.cloudRun },
                        { label: 'Vercel', state: systemInfo.external.vercel },
                        { label: 'GitHub', state: systemInfo.external.github },
                      ].map(ext => (
                        <div key={ext.label} className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{ext.label}</span>
                          {ext.state === 'online'
                            ? <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--accent-success)' }} />
                            : ext.state === 'degraded'
                              ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--accent-warning)' }} />
                            : ext.state === 'offline'
                              ? <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--accent-danger)' }} />
                              : <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-muted-block admin-list-stack-tight">
                    <p className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Performance</p>
                    <div className="admin-list-stack-tight">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Uptime</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {Math.floor(systemInfo.deployment.backend.uptime / 3600)}h
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>DB Status</span>
                        <span className="text-sm font-semibold" style={{ color: systemInfo.database.status === 'connected' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                          {systemInfo.database.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Response</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{systemInfo.database.responseTime}ms</span>
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
