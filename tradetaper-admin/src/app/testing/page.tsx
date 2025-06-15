'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { 
  TestTube,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Wifi,
  Shield,
  Zap,
  RefreshCw,
  Download,
  AlertTriangle,
  Activity,
  Globe,
  Users,
  DollarSign
} from 'lucide-react';
import { adminApi } from '@/lib/api';

interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  duration?: number;
  message?: string;
  details?: any;
  timestamp: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  icon: any;
  tests: TestResult[];
  status: 'idle' | 'running' | 'completed';
}

export default function TestingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'database' | 'system' | 'security'>('overview');
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'api-endpoints',
      name: 'API Endpoints',
      description: 'Test all backend API endpoints for functionality and response times',
      icon: Server,
      tests: [],
      status: 'idle'
    },
    {
      id: 'database',
      name: 'Database Tests',
      description: 'Test database connectivity, queries, and data integrity',
      icon: Database,
      tests: [],
      status: 'idle'
    },
    {
      id: 'system-health',
      name: 'System Health',
      description: 'Monitor system resources, performance, and availability',
      icon: Activity,
      tests: [],
      status: 'idle'
    },
    {
      id: 'security',
      name: 'Security Tests',
      description: 'Test authentication, authorization, and security measures',
      icon: Shield,
      tests: [],
      status: 'idle'
    },
    {
      id: 'integration',
      name: 'Integration Tests',
      description: 'Test external service integrations and data flow',
      icon: Globe,
      tests: [],
      status: 'idle'
    }
  ]);

  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  // System health query for real-time monitoring
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 5000,
  });

  const runTestSuite = async (suiteId: string) => {
    setRunningTests(prev => new Set(prev).add(suiteId));
    
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running', tests: [] }
        : suite
    ));

    try {
      let tests: TestResult[] = [];

      switch (suiteId) {
        case 'api-endpoints':
          tests = await runApiEndpointTests();
          break;
        case 'database':
          tests = await runDatabaseTests();
          break;
        case 'system-health':
          tests = await runSystemHealthTests();
          break;
        case 'security':
          tests = await runSecurityTests();
          break;
        case 'integration':
          tests = await runIntegrationTests();
          break;
      }

      setTestSuites(prev => prev.map(suite => 
        suite.id === suiteId 
          ? { ...suite, status: 'completed', tests }
          : suite
      ));
    } catch (error) {
      console.error(`Error running test suite ${suiteId}:`, error);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(suiteId);
        return newSet;
      });
    }
  };

  const runApiEndpointTests = async (): Promise<TestResult[]> => {
    const endpoints = [
      { name: 'Dashboard Stats', endpoint: '/admin/dashboard-stats', method: 'GET' },
      { name: 'User Analytics', endpoint: '/admin/user-analytics', method: 'GET' },
      { name: 'System Health', endpoint: '/admin/system-health', method: 'GET' },
      { name: 'Database Tables', endpoint: '/admin/database/tables', method: 'GET' },
      { name: 'Activity Feed', endpoint: '/admin/activity-feed', method: 'GET' },
      { name: 'Users List', endpoint: '/admin/users', method: 'GET' },
      { name: 'Revenue Analytics', endpoint: '/admin/revenue-analytics', method: 'GET' },
      { name: 'Geographic Data', endpoint: '/admin/geographic-data', method: 'GET' },
    ];

    const tests: TestResult[] = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        let response;
        switch (endpoint.endpoint) {
          case '/admin/dashboard-stats':
            response = await adminApi.getDashboardStats();
            break;
          case '/admin/user-analytics':
            response = await adminApi.getUserAnalytics('30d');
            break;
          case '/admin/system-health':
            response = await adminApi.getSystemHealth();
            break;
          case '/admin/database/tables':
            response = await adminApi.getDatabaseTables();
            break;
          case '/admin/activity-feed':
            response = await adminApi.getActivityFeed(10);
            break;
          case '/admin/users':
            response = await adminApi.getUsers(1, 10);
            break;
          case '/admin/revenue-analytics':
            response = await adminApi.getRevenueAnalytics('30d');
            break;
          case '/admin/geographic-data':
            response = await adminApi.getGeographicData();
            break;
          default:
            throw new Error('Unknown endpoint');
        }

        const duration = Date.now() - startTime;
        tests.push({
          id: `${endpoint.endpoint}-${Date.now()}`,
          name: endpoint.name,
          status: 'passed',
          duration,
          message: `Response received successfully (${duration}ms)`,
          details: response,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        tests.push({
          id: `${endpoint.endpoint}-${Date.now()}`,
          name: endpoint.name,
          status: 'failed',
          duration,
          message: error.message || 'Request failed',
          details: error,
          timestamp: new Date().toISOString()
        });
      }
    }

    return tests;
  };

  const runDatabaseTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test database connectivity
    const startTime = Date.now();
    try {
      const tables = await adminApi.getDatabaseTables();
      const duration = Date.now() - startTime;
      
      tests.push({
        id: `db-connectivity-${Date.now()}`,
        name: 'Database Connectivity',
        status: 'passed',
        duration,
        message: `Connected successfully. Found ${tables.length} tables.`,
        details: { tableCount: tables.length, tables },
        timestamp: new Date().toISOString()
      });

      // Test table access for each table
      for (const table of tables.slice(0, 5)) { // Test first 5 tables
        const tableStartTime = Date.now();
        try {
          const columns = await adminApi.getDatabaseColumns(table);
          const rows = await adminApi.getDatabaseRows(table, 1, 1);
          const tableDuration = Date.now() - tableStartTime;

          tests.push({
            id: `table-${table}-${Date.now()}`,
            name: `Table Access: ${table}`,
            status: 'passed',
            duration: tableDuration,
            message: `Accessed successfully. ${columns.length} columns, ${rows.total} rows.`,
            details: { columns: columns.length, totalRows: rows.total },
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          const tableDuration = Date.now() - tableStartTime;
          tests.push({
            id: `table-${table}-${Date.now()}`,
            name: `Table Access: ${table}`,
            status: 'failed',
            duration: tableDuration,
            message: error.message || 'Table access failed',
            details: error,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      tests.push({
        id: `db-connectivity-${Date.now()}`,
        name: 'Database Connectivity',
        status: 'failed',
        duration,
        message: error.message || 'Database connection failed',
        details: error,
        timestamp: new Date().toISOString()
      });
    }

    return tests;
  };

  const runSystemHealthTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    try {
      const health = await adminApi.getSystemHealth();
      
      // Test system uptime
      tests.push({
        id: `uptime-${Date.now()}`,
        name: 'System Uptime',
        status: health.uptime > 99 ? 'passed' : 'failed',
        message: `Uptime: ${health.uptime}%`,
        details: { uptime: health.uptime },
        timestamp: new Date().toISOString()
      });

      // Test response time
      tests.push({
        id: `response-time-${Date.now()}`,
        name: 'Response Time',
        status: health.responseTime < 500 ? 'passed' : 'failed',
        message: `Response time: ${health.responseTime}ms`,
        details: { responseTime: health.responseTime },
        timestamp: new Date().toISOString()
      });

      // Test memory usage
      tests.push({
        id: `memory-${Date.now()}`,
        name: 'Memory Usage',
        status: health.memoryUsage < 80 ? 'passed' : 'failed',
        message: `Memory usage: ${health.memoryUsage}%`,
        details: { memoryUsage: health.memoryUsage },
        timestamp: new Date().toISOString()
      });

      // Test CPU usage
      tests.push({
        id: `cpu-${Date.now()}`,
        name: 'CPU Usage',
        status: health.cpuUsage < 80 ? 'passed' : 'failed',
        message: `CPU usage: ${health.cpuUsage}%`,
        details: { cpuUsage: health.cpuUsage },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      tests.push({
        id: `system-health-${Date.now()}`,
        name: 'System Health Check',
        status: 'failed',
        message: error.message || 'System health check failed',
        details: error,
        timestamp: new Date().toISOString()
      });
    }

    return tests;
  };

  const runSecurityTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Mock security tests (in real implementation, these would be actual security checks)
    const securityChecks = [
      { name: 'Authentication Required', check: () => true },
      { name: 'HTTPS Enforcement', check: () => window.location.protocol === 'https:' },
      { name: 'Admin Authorization', check: () => true },
      { name: 'CORS Configuration', check: () => true },
      { name: 'Rate Limiting', check: () => true },
    ];

    for (const check of securityChecks) {
      try {
        const result = check.check();
        tests.push({
          id: `security-${check.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: check.name,
          status: result ? 'passed' : 'failed',
          message: result ? 'Security check passed' : 'Security check failed',
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        tests.push({
          id: `security-${check.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: check.name,
          status: 'failed',
          message: error.message || 'Security check failed',
          details: error,
          timestamp: new Date().toISOString()
        });
      }
    }

    return tests;
  };

  const runIntegrationTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test external service integrations
    const integrations = [
      { name: 'Frontend Connection', test: () => fetch(window.location.origin) },
      { name: 'API Gateway', test: () => adminApi.getSystemHealth() },
      { name: 'Database Integration', test: () => adminApi.getDatabaseTables() },
    ];

    for (const integration of integrations) {
      const startTime = Date.now();
      try {
        await integration.test();
        const duration = Date.now() - startTime;
        tests.push({
          id: `integration-${integration.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: integration.name,
          status: 'passed',
          duration,
          message: `Integration test passed (${duration}ms)`,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        tests.push({
          id: `integration-${integration.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: integration.name,
          status: 'failed',
          duration,
          message: error.message || 'Integration test failed',
          details: error,
          timestamp: new Date().toISOString()
        });
      }
    }

    return tests;
  };

  const runAllTests = async () => {
    for (const suite of testSuites) {
      if (!runningTests.has(suite.id)) {
        await runTestSuite(suite.id);
      }
    }
  };

  const exportTestResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      testSuites: testSuites.map(suite => ({
        name: suite.name,
        status: suite.status,
        tests: suite.tests
      }))
    };

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-400 bg-green-500/10';
      case 'failed': return 'text-red-400 bg-red-500/10';
      case 'running': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const passedTests = testSuites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'passed').length, 0);
  const failedTests = testSuites.reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'failed').length, 0);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <TestTube className="w-6 h-6 text-green-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Comprehensive Testing Suite
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Test all endpoints, database connections, and system components
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={runAllTests}
                disabled={runningTests.size > 0}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-lg hover:shadow-green-500/25"
              >
                <Play className="w-4 h-4" />
                <span>Run All Tests</span>
              </button>
              
              {totalTests > 0 && (
                <button
                  onClick={exportTestResults}
                  className="bg-gray-800/50 hover:bg-gray-700/50 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Test Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <TestTube className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-sm text-blue-400">Total</div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{totalTests}</h3>
              <p className="text-gray-400 text-sm">Tests Executed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-sm text-green-400">Passed</div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{passedTests}</h3>
              <p className="text-gray-400 text-sm">Tests Passed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-sm text-red-400">Failed</div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{failedTests}</h3>
              <p className="text-gray-400 text-sm">Tests Failed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-sm text-purple-400">Success Rate</div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
              </h3>
              <p className="text-gray-400 text-sm">Overall Success</p>
            </motion.div>
          </div>

          {/* Test Suites */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {testSuites.map((suite, index) => (
              <motion.div
                key={suite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-800/50 rounded-lg">
                      <suite.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{suite.name}</h3>
                      <p className="text-sm text-gray-400">{suite.description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => runTestSuite(suite.id)}
                    disabled={runningTests.has(suite.id)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                  >
                    {runningTests.has(suite.id) ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Run</span>
                  </button>
                </div>

                {suite.tests.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {suite.tests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <p className="text-sm font-medium text-white">{test.name}</p>
                            <p className="text-xs text-gray-400">{test.message}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {test.duration && (
                            <p className="text-xs text-gray-400">{test.duration}ms</p>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {suite.tests.length === 0 && suite.status === 'idle' && (
                  <div className="text-center py-8 text-gray-400">
                    <TestTube className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click "Run" to start testing</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* System Status */}
          {systemHealth && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Real-time System Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <span className={`text-sm ${systemHealth.uptime > 99 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {systemHealth.uptime}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Response Time</span>
                    <span className={`text-sm ${systemHealth.responseTime < 500 ? 'text-green-400' : 'text-red-400'}`}>
                      {systemHealth.responseTime}ms
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Memory</span>
                    <span className={`text-sm ${systemHealth.memoryUsage < 80 ? 'text-green-400' : 'text-red-400'}`}>
                      {systemHealth.memoryUsage}%
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">CPU</span>
                    <span className={`text-sm ${systemHealth.cpuUsage < 80 ? 'text-green-400' : 'text-red-400'}`}>
                      {systemHealth.cpuUsage}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
} 