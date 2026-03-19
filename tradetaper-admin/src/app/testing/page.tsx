'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  TestTube, Play, CheckCircle, XCircle, Clock, Database,
  Server, Wifi, Shield, Zap, RefreshCw, Download, Activity,
  LucideIcon,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  duration?: number;
  message?: string;
  timestamp: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tests: TestResult[];
  status: 'idle' | 'running' | 'completed';
}

const SUITE_DEFINITIONS: Omit<TestSuite, 'tests' | 'status'>[] = [
  { id: 'api-endpoints', name: 'API Endpoints', description: 'Test all backend API endpoints for availability', icon: Server },
  { id: 'database', name: 'Database', description: 'Test connectivity and data integrity', icon: Database },
  { id: 'system-health', name: 'System Health', description: 'Monitor system resources and performance', icon: Activity },
  { id: 'security', name: 'Security', description: 'Authentication and authorization checks', icon: Shield },
  { id: 'integration', name: 'Integration', description: 'External service integrations', icon: Wifi },
];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) {
      return maybeMessage;
    }
  }
  return 'Unknown error';
};

const statusIcon = (status: TestResult['status']) => {
  switch (status) {
    case 'passed': return <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />;
    case 'failed': return <XCircle className="w-4 h-4" style={{ color: 'var(--accent-danger)' }} />;
    case 'running': return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-primary)' }} />;
    default: return <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />;
  }
};

export default function TestingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>(
    SUITE_DEFINITIONS.map(d => ({ ...d, tests: [], status: 'idle' }))
  );
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 5000,
  });

  const addResult = (suiteId: string, result: TestResult) =>
    setTestSuites(prev => prev.map(s =>
      s.id === suiteId ? { ...s, tests: [...s.tests, result] } : s
    ));

  const runSuite = async (suiteId: string) => {
    setRunningTests(prev => new Set(prev).add(suiteId));
    setTestSuites(prev => prev.map(s => s.id === suiteId ? { ...s, status: 'running', tests: [] } : s));

    try {
      switch (suiteId) {
        case 'api-endpoints': {
          const checks = [
            { name: 'Dashboard Stats', fn: () => adminApi.getDashboardStats() },
            { name: 'User Analytics', fn: () => adminApi.getUserAnalytics('30d') },
            { name: 'System Health', fn: () => adminApi.getSystemHealth() },
            { name: 'Activity Feed', fn: () => adminApi.getActivityFeed(5) },
            { name: 'Users List', fn: () => adminApi.getUsers(1, 5) },
            { name: 'Revenue Analytics', fn: () => adminApi.getRevenueAnalytics('30d') },
          ];
          for (const { name, fn } of checks) {
            const t = Date.now();
            try {
              await fn();
              addResult(suiteId, { id: `${name}-${t}`, name, status: 'passed', duration: Date.now() - t, message: `OK (${Date.now() - t}ms)`, timestamp: new Date().toISOString() });
            } catch (error: unknown) {
              addResult(suiteId, { id: `${name}-${t}`, name, status: 'failed', duration: Date.now() - t, message: getErrorMessage(error), timestamp: new Date().toISOString() });
            }
          }
          break;
        }
        case 'database': {
          const t = Date.now();
          try {
            const tables = await adminApi.getDatabaseTables();
            addResult(suiteId, { id: `db-conn-${t}`, name: 'Database Connectivity', status: 'passed', duration: Date.now() - t, message: `${tables.length} tables accessible`, timestamp: new Date().toISOString() });
          } catch (error: unknown) {
            addResult(suiteId, { id: `db-conn-${t}`, name: 'Database Connectivity', status: 'failed', duration: Date.now() - t, message: getErrorMessage(error), timestamp: new Date().toISOString() });
          }
          break;
        }
        case 'system-health': {
          const health = await adminApi.getSystemHealth();
          const checks = [
            { name: 'Response Time', pass: health.responseTime < 500, msg: `${health.responseTime}ms` },
            { name: 'Memory Usage', pass: health.memoryUsage < 80, msg: `${health.memoryUsage}%` },
            { name: 'CPU Usage', pass: health.cpuUsage < 80, msg: `${health.cpuUsage}%` },
          ];
          for (const { name, pass, msg } of checks) {
            addResult(suiteId, { id: `health-${name}`, name, status: pass ? 'passed' : 'failed', message: msg, timestamp: new Date().toISOString() });
          }
          break;
        }
        case 'security': {
          addResult(suiteId, { id: 'https', name: 'HTTPS Enforcement', status: window.location.protocol === 'https:' ? 'passed' : 'failed', message: window.location.protocol, timestamp: new Date().toISOString() });
          addResult(suiteId, { id: 'cookie', name: 'HttpOnly Session Cookie', status: !document.cookie.includes('admin_token=') ? 'passed' : 'failed', message: 'Cookie not accessible in JS', timestamp: new Date().toISOString() });
          break;
        }
        case 'integration': {
          const t = Date.now();
          try {
            await adminApi.getSystemHealth();
            addResult(suiteId, { id: `api-gw-${t}`, name: 'API Gateway', status: 'passed', duration: Date.now() - t, message: 'Reachable', timestamp: new Date().toISOString() });
          } catch (error: unknown) {
            addResult(suiteId, { id: `api-gw-${t}`, name: 'API Gateway', status: 'failed', message: getErrorMessage(error), timestamp: new Date().toISOString() });
          }
          break;
        }
      }
    } finally {
      setTestSuites(prev => prev.map(s => s.id === suiteId ? { ...s, status: 'completed' } : s));
      setRunningTests(prev => { const ns = new Set(prev); ns.delete(suiteId); return ns; });
    }
  };

  const runAll = async () => {
    for (const suite of testSuites) {
      if (!runningTests.has(suite.id)) await runSuite(suite.id);
    }
  };

  const exportResults = () => {
    const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), testSuites }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`; a.click();
  };

  const totalTests = testSuites.reduce((s, x) => s + x.tests.length, 0);
  const passedTests = testSuites.reduce((s, x) => s + x.tests.filter(t => t.status === 'passed').length, 0);
  const failedTests = testSuites.reduce((s, x) => s + x.tests.filter(t => t.status === 'failed').length, 0);

  return (
    <div className="flex h-dvh" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header
          className="sticky top-0 z-40 border-b px-6 py-3.5 backdrop-blur-xl"
          style={{
            background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="max-w-[var(--content-max-width)] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TestTube className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Testing Suite</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Run diagnostics on API endpoints, database, and system health</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalTests > 0 && (
                <button className="admin-btn-secondary" onClick={exportResults}>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
              <button className="admin-btn-primary" onClick={runAll} disabled={runningTests.size > 0}>
                <Play className="w-4 h-4" />
                <span>Run All</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-[var(--content-max-width)] mx-auto space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Tests Run', value: totalTests, icon: TestTube, color: 'var(--accent-primary)' },
                { label: 'Passed', value: passedTests, icon: CheckCircle, color: 'var(--accent-success)' },
                { label: 'Failed', value: failedTests, icon: XCircle, color: 'var(--accent-danger)' },
                { label: 'Success Rate', value: totalTests > 0 ? `${Math.round((passedTests / totalTests) * 100)}%` : '—', icon: Zap, color: '#8B5CF6' },
              ].map(({ label, value, icon: Icon, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="admin-card p-5"
                >
                  <div className="p-2.5 rounded-xl mb-3 w-fit" style={{ background: `${color}18` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color }}>{value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Test Suites */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {testSuites.map((suite, i) => (
                <motion.div
                  key={suite.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="admin-card p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary-subtle)' }}>
                        <suite.icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{suite.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{suite.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => runSuite(suite.id)}
                      disabled={runningTests.has(suite.id)}
                      className="admin-btn-primary py-1.5 px-3 text-sm disabled:opacity-50"
                    >
                      {runningTests.has(suite.id)
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Play className="w-3.5 h-3.5" />}
                      <span>Run</span>
                    </button>
                  </div>

                  {suite.tests.length > 0 ? (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {suite.tests.map(test => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-2.5 rounded-xl"
                          style={{ background: 'var(--bg-muted)' }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {statusIcon(test.status)}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{test.name}</p>
                              {test.message && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{test.message}</p>}
                            </div>
                          </div>
                          {test.duration != null && (
                            <span className="text-xs font-mono flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>{test.duration}ms</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-16 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {suite.status === 'idle' ? 'Click Run to start' : 'Running…'}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Live System Status */}
            {systemHealth && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="admin-card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Live System Status</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Uptime', value: `${systemHealth.uptime ?? '—'}%`, ok: (systemHealth.uptime ?? 0) > 99 },
                    { label: 'Response', value: `${systemHealth.responseTime}ms`, ok: systemHealth.responseTime < 500 },
                    { label: 'Memory', value: `${systemHealth.memoryUsage}%`, ok: systemHealth.memoryUsage < 80 },
                    { label: 'CPU', value: `${systemHealth.cpuUsage}%`, ok: systemHealth.cpuUsage < 80 },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color: ok ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
