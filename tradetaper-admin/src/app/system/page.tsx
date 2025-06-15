'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import { 
  Server, 
  Database as DatabaseIcon,
  TerminalSquare,
  Bug,
  RefreshCw,
  Settings,
  Play,
  Copy,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Send
} from 'lucide-react';
import { adminApi } from '@/lib/api';

const TABS = [
  { key: 'overview', label: 'System Overview', icon: Server },
  { key: 'api', label: 'API Tester', icon: TerminalSquare },
  { key: 'db', label: 'Database Viewer', icon: DatabaseIcon },
  { key: 'logs', label: 'Logs & Debug', icon: Bug },
];

// API Endpoints for testing
const API_ENDPOINTS = [
  {
    category: 'Authentication',
    endpoints: [
      { method: 'POST', path: '/auth/login', description: 'User login', requiresAuth: false },
      { method: 'POST', path: '/auth/register', description: 'User registration', requiresAuth: false },
      { method: 'POST', path: '/auth/refresh', description: 'Refresh token', requiresAuth: true },
      { method: 'GET', path: '/auth/profile', description: 'Get user profile', requiresAuth: true },
    ]
  },
  {
    category: 'Admin',
    endpoints: [
      { method: 'GET', path: '/admin/dashboard-stats', description: 'Dashboard statistics', requiresAuth: true },
      { method: 'GET', path: '/admin/users', description: 'Get users list', requiresAuth: true },
      { method: 'GET', path: '/admin/system-health', description: 'System health check', requiresAuth: true },
      { method: 'GET', path: '/admin/activity-feed', description: 'Activity feed', requiresAuth: true },
      { method: 'GET', path: '/admin/database/tables', description: 'Database tables', requiresAuth: true },
    ]
  },
  {
    category: 'Trades',
    endpoints: [
      { method: 'GET', path: '/trades', description: 'Get user trades', requiresAuth: true },
      { method: 'POST', path: '/trades', description: 'Create new trade', requiresAuth: true },
      { method: 'GET', path: '/trades/:id', description: 'Get trade by ID', requiresAuth: true },
      { method: 'PUT', path: '/trades/:id', description: 'Update trade', requiresAuth: true },
      { method: 'DELETE', path: '/trades/:id', description: 'Delete trade', requiresAuth: true },
    ]
  },
  {
    category: 'Users',
    endpoints: [
      { method: 'GET', path: '/users/profile', description: 'Get user profile', requiresAuth: true },
      { method: 'PUT', path: '/users/profile', description: 'Update profile', requiresAuth: true },
      { method: 'GET', path: '/users/mt5-accounts', description: 'Get MT5 accounts', requiresAuth: true },
      { method: 'POST', path: '/users/mt5-accounts', description: 'Add MT5 account', requiresAuth: true },
    ]
  },
  {
    category: 'System',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check', requiresAuth: false },
      { method: 'GET', path: '/', description: 'API root', requiresAuth: false },
      { method: 'GET', path: '/test', description: 'Test endpoint', requiresAuth: false },
    ]
  }
];

export default function SystemPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tab, setTab] = useState<'overview' | 'api' | 'db' | 'logs'>('overview');

  // API Tester state
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
  const [requestBody, setRequestBody] = useState('{}');
  const [requestHeaders, setRequestHeaders] = useState('{"Content-Type": "application/json"}');
  const [queryParams, setQueryParams] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<any[]>([]);

  // Database Viewer state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [dbPage, setDbPage] = useState(1);
  const dbLimit = 20;

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState('all');

  // Database Viewer queries
  const {
    data: dbTables = [],
    isLoading: dbTablesLoading,
    error: dbTablesError,
  } = useQuery<string[]>({
    queryKey: ['db-tables'],
    queryFn: () => adminApi.getDatabaseTables(),
  });

  const {
    data: dbColumns = [],
    isLoading: dbColumnsLoading,
    error: dbColumnsError,
    refetch: refetchColumns,
  } = useQuery<Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>>({
    queryKey: ['db-columns', selectedTable],
    queryFn: () => selectedTable ? adminApi.getDatabaseColumns(selectedTable) : Promise.resolve([]),
    enabled: !!selectedTable,
  });

  const {
    data: dbRows = { data: [], total: 0, page: 1, limit: dbLimit, totalPages: 1 },
    isLoading: dbRowsLoading,
    error: dbRowsError,
    refetch: refetchRows,
  } = useQuery<{
    data: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ['db-rows', selectedTable, dbPage, dbLimit],
    queryFn: () => selectedTable ? adminApi.getDatabaseRows(selectedTable, dbPage, dbLimit) : Promise.resolve({ data: [], total: 0, page: 1, limit: dbLimit, totalPages: 1 }),
    enabled: !!selectedTable,
  });

  // System health query
  const { data: systemHealth, isLoading: systemHealthLoading, error: systemHealthError } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      console.log('Fetching system health...');
      try {
        const result = await adminApi.getSystemHealth();
        console.log('System health result:', result);
        return result;
      } catch (error) {
        console.error('System health error:', error);
        throw error;
      }
    },
    refetchInterval: autoRefresh ? 10000 : false,
    retry: 3,
    retryDelay: 1000,
  });

  // API Testing functions
  const executeApiTest = async () => {
    if (!selectedEndpoint) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let headers = {};
      try {
        headers = JSON.parse(requestHeaders);
      } catch (e) {
        headers = { 'Content-Type': 'application/json' };
      }

      let body = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
        try {
          body = JSON.parse(requestBody);
        } catch (e) {
          body = {};
        }
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}${selectedEndpoint.path}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: selectedEndpoint.method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.json().catch(() => ({}));
      const duration = Date.now() - startTime;

      const result = {
        id: Date.now(),
        endpoint: selectedEndpoint,
        request: {
          url,
          method: selectedEndpoint.method,
          headers,
          body,
          queryParams,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
        },
        duration,
        timestamp: new Date().toISOString(),
        success: response.ok,
      };

      setApiResponse(result);
      setTestHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50 tests
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result = {
        id: Date.now(),
        endpoint: selectedEndpoint,
        request: {
          url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}${selectedEndpoint.path}`,
          method: selectedEndpoint.method,
          headers: JSON.parse(requestHeaders),
          body: requestBody,
          queryParams,
        },
        response: {
          status: 0,
          statusText: 'Network Error',
          headers: {},
          data: { error: error.message },
        },
        duration,
        timestamp: new Date().toISOString(),
        success: false,
      };

      setApiResponse(result);
      setTestHistory(prev => [result, ...prev.slice(0, 49)]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportTestResults = () => {
    const dataStr = JSON.stringify(testHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `api-test-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Helper components
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-900/80 border border-red-700 text-red-200 rounded-lg p-4 my-2">
      <span className="font-bold">Error:</span> {message}
    </div>
  );

  const SkeletonBox = ({ height = 32 }: { height?: number }) => (
    <div className="bg-gray-800/60 rounded animate-pulse mb-2" style={{ height }} />
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                System Management
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Monitor system health, test APIs, and debug issues
              </p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <span>Auto-refresh</span>
              </label>
              
              <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-gray-900/30 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6">
          <div className="flex space-x-8">
            {TABS.map((tabItem) => {
              const Icon = tabItem.icon;
              return (
                <button
                  key={tabItem.key}
                  onClick={() => setTab(tabItem.key as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    tab === tabItem.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tabItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* System Overview Tab */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-green-400" />
                  System Health
                </h3>
                {systemHealthLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonBox key={i} height={24} />
                    ))}
                  </div>
                ) : systemHealthError ? (
                  <ErrorMessage message={`Failed to load system health: ${systemHealthError.message}`} />
                ) : systemHealth ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        systemHealth.status === 'healthy' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {systemHealth.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Uptime</span>
                      <span className="text-white">{systemHealth.uptime}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Response Time</span>
                      <span className="text-white">{systemHealth.responseTime}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Memory Usage</span>
                      <span className="text-white">{systemHealth.memoryUsage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">CPU Usage</span>
                      <span className="text-white">{systemHealth.cpuUsage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Cache Hit Rate</span>
                      <span className="text-white">{systemHealth.cacheHitRate}%</span>
                    </div>
                  </div>
                ) : (
                  <ErrorMessage message="No system health data available." />
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setTab('api')}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <TerminalSquare className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Test API Endpoints</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                  
                  <button
                    onClick={() => setTab('db')}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <DatabaseIcon className="w-5 h-5 text-green-400" />
                      <span className="text-white">Browse Database</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                  
                  <button
                    onClick={() => setTab('logs')}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Bug className="w-5 h-5 text-yellow-400" />
                      <span className="text-white">View Logs</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Tester Tab */}
          {tab === 'api' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Endpoint Selection */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <TerminalSquare className="w-5 h-5 mr-2" />
                    API Endpoints
                  </h3>
                  {testHistory.length > 0 && (
                    <button
                      onClick={exportTestResults}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {API_ENDPOINTS.map((category) => (
                    <div key={category.category}>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">{category.category}</h4>
                      <div className="space-y-1">
                        {category.endpoints.map((endpoint, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedEndpoint(endpoint)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedEndpoint === endpoint
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-xs font-mono ${
                                  endpoint.method === 'GET' ? 'bg-green-900 text-green-300' :
                                  endpoint.method === 'POST' ? 'bg-blue-900 text-blue-300' :
                                  endpoint.method === 'PUT' ? 'bg-yellow-900 text-yellow-300' :
                                  endpoint.method === 'DELETE' ? 'bg-red-900 text-red-300' :
                                  'bg-gray-900 text-gray-300'
                                }`}>
                                  {endpoint.method}
                                </span>
                                <span className="font-mono text-sm">{endpoint.path}</span>
                              </div>
                              {endpoint.requiresAuth && (
                                <span className="text-xs text-orange-400">🔒</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{endpoint.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Configuration */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Request Configuration</h3>
                
                {selectedEndpoint ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Query Parameters</label>
                      <input
                        type="text"
                        value={queryParams}
                        onChange={(e) => setQueryParams(e.target.value)}
                        placeholder="page=1&limit=20"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Headers</label>
                      <textarea
                        value={requestHeaders}
                        onChange={(e) => setRequestHeaders(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Request Body</label>
                        <textarea
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          rows={6}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <button
                      onClick={executeApiTest}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Request</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <TerminalSquare className="w-12 h-12 mb-4 opacity-50" />
                    <p>Select an endpoint to configure the request</p>
                  </div>
                )}
              </div>

              {/* Response Display */}
              {apiResponse && (
                <div className="lg:col-span-2 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Code className="w-5 h-5 mr-2" />
                      Response
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                        apiResponse.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {apiResponse.success ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{apiResponse.response.status} {apiResponse.response.statusText}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{apiResponse.duration}ms</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2))}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Request</h4>
                      <pre className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-auto max-h-64">
                        {JSON.stringify(apiResponse.request, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Response</h4>
                      <pre className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-auto max-h-64">
                        {JSON.stringify(apiResponse.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Test History */}
              {testHistory.length > 0 && (
                <div className="lg:col-span-2 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Test History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {testHistory.map((test) => (
                      <div
                        key={test.id}
                        onClick={() => setApiResponse(test)}
                        className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            test.endpoint.method === 'GET' ? 'bg-green-900 text-green-300' :
                            test.endpoint.method === 'POST' ? 'bg-blue-900 text-blue-300' :
                            test.endpoint.method === 'PUT' ? 'bg-yellow-900 text-yellow-300' :
                            test.endpoint.method === 'DELETE' ? 'bg-red-900 text-red-300' :
                            'bg-gray-900 text-gray-300'
                          }`}>
                            {test.endpoint.method}
                          </span>
                          <span className="text-white font-mono text-sm">{test.endpoint.path}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            test.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                          }`}>
                            {test.response.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>{test.duration}ms</span>
                          <span>{new Date(test.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database Viewer Tab */}
          {tab === 'db' && (
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 flex flex-col min-h-[500px]">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Table List */}
                <div className="w-full sm:w-1/4">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                    <DatabaseIcon className="w-5 h-5 mr-2" />
                    Tables
                  </h3>
                  {dbTablesLoading && <SkeletonBox height={32} />}
                  {dbTablesError && <ErrorMessage message="Failed to load tables." />}
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {dbTables && dbTables.map((table: string) => (
                      <button
                        key={table}
                        onClick={() => { setSelectedTable(table); setDbPage(1); }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedTable === table
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {table}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Details */}
                <div className="flex-1">
                  {!selectedTable && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                      <DatabaseIcon className="w-10 h-10 text-gray-500 mb-2" />
                      <p className="text-gray-400">Select a table to view its data.</p>
                    </div>
                  )}

                  {selectedTable && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-white">{selectedTable}</h4>
                        <button
                          onClick={() => { refetchColumns(); refetchRows(); }}
                          className="px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                        >
                          Refresh
                        </button>
                      </div>
                      {/* Columns */}
                      <div className="mb-2">
                        <h5 className="text-sm font-semibold text-gray-300 mb-1">Columns</h5>
                        {dbColumnsLoading && <SkeletonBox height={24} />}
                        {dbColumnsError && <ErrorMessage message="Failed to load columns." />}
                        <div className="flex flex-wrap gap-2">
                          {dbColumns && dbColumns.map((col) => (
                            <span
                              key={col.column_name}
                              className="px-2 py-1 rounded bg-gray-800 text-gray-200 text-xs"
                              title={`${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ''}${col.column_default ? `, default: ${col.column_default}` : ''}`}
                            >
                              {col.column_name}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Rows */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-300 mb-1">Rows</h5>
                        {dbRowsLoading && <SkeletonBox height={48} />}
                        {dbRowsError && <ErrorMessage message="Failed to load rows." />}
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-gray-200">
                            <thead>
                              <tr>
                                {dbColumns && dbColumns.map((col) => (
                                  <th key={col.column_name} className="px-2 py-1 bg-gray-800 font-semibold">
                                    {col.column_name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dbRows && dbRows.data && dbRows.data.length > 0 ? (
                                dbRows.data.map((row, idx) => (
                                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                                    {dbColumns && dbColumns.map((col) => (
                                      <td key={col.column_name} className="px-2 py-1">
                                        {row[col.column_name]?.toString() ?? ''}
                                      </td>
                                    ))}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={dbColumns?.length || 1} className="text-center text-gray-500 py-4">
                                    No data found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {/* Pagination */}
                        {dbRows && dbRows.totalPages > 1 && (
                          <div className="flex items-center justify-end mt-2 space-x-2">
                            <button
                              onClick={() => setDbPage((p) => Math.max(1, p - 1))}
                              disabled={dbPage === 1}
                              className="px-2 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs disabled:opacity-50"
                            >
                              Prev
                            </button>
                            <span className="text-gray-400 text-xs">
                              Page {dbRows.page} of {dbRows.totalPages}
                            </span>
                            <button
                              onClick={() => setDbPage((p) => Math.min(dbRows.totalPages, p + 1))}
                              disabled={dbPage === dbRows.totalPages}
                              className="px-2 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Logs & Debug Tab */}
          {tab === 'logs' && (
            <div className="space-y-6">
              {/* Logs Section */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Bug className="w-5 h-5 mr-2" />
                    System Logs
                  </h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm"
                    >
                      <option value="all">All Logs</option>
                      <option value="error">Errors</option>
                      <option value="warn">Warnings</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                    <button 
                      onClick={() => setLogs([])}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      Clear Logs
                    </button>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      No logs available. Logs will appear here as they are generated.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs
                        .filter(log => logFilter === 'all' || log.level === logFilter)
                        .map((log) => (
                          <div
                            key={log.id}
                            className={`flex items-start space-x-2 py-1 ${
                              log.level === 'error' ? 'text-red-400' :
                              log.level === 'warn' ? 'text-yellow-400' :
                              log.level === 'info' ? 'text-green-400' :
                              log.level === 'debug' ? 'text-blue-400' :
                              'text-gray-300'
                            }`}
                          >
                            <span className="text-gray-500 text-xs">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="uppercase text-xs font-bold min-w-[50px]">
                              [{log.level}]
                            </span>
                            <span className="text-gray-400 text-xs min-w-[80px]">
                              {log.context}:
                            </span>
                            <span className="flex-1">{log.message}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* System Diagnostics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    System Diagnostics
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">Database</div>
                        <div className="text-lg font-semibold text-green-400">Connected</div>
                        <div className="text-xs text-gray-500">12 connections</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">Memory</div>
                        <div className="text-lg font-semibold text-yellow-400">68%</div>
                        <div className="text-xs text-gray-500">2.7GB / 4GB</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">CPU</div>
                        <div className="text-lg font-semibold text-blue-400">23%</div>
                        <div className="text-xs text-gray-500">Load: 0.5</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">Disk</div>
                        <div className="text-lg font-semibold text-green-400">45%</div>
                        <div className="text-xs text-gray-500">15GB / 50GB</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Debug Actions */}
                <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Debug Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Clear Application Cache</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Download className="w-5 h-5 text-green-400" />
                        <span className="text-white">Export Debug Report</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Bug className="w-5 h-5 text-yellow-400" />
                        <span className="text-white">Start Debug Session</span>
                      </div>
                      <span className="text-gray-400">→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Analytics */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Error Analytics (Last 24h)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Errors by Type</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">500 Internal Server Error</span>
                        <span className="text-sm text-red-400">20</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">404 Not Found</span>
                        <span className="text-sm text-yellow-400">15</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">401 Unauthorized</span>
                        <span className="text-sm text-blue-400">7</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Errors by Endpoint</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">/api/v1/trades</span>
                        <span className="text-sm text-red-400">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">/api/v1/users/profile</span>
                        <span className="text-sm text-yellow-400">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">/api/v1/auth/login</span>
                        <span className="text-sm text-blue-400">6</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Performance</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Avg Response Time</span>
                        <span className="text-sm text-green-400">145ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Total Requests</span>
                        <span className="text-sm text-blue-400">45,678</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Error Rate</span>
                        <span className="text-sm text-yellow-400">0.09%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
