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
} from 'lucide-react';
import { adminApi } from '@/lib/api';

const TABS = [
  { key: 'overview', label: 'System Overview', icon: Server },
  { key: 'api', label: 'API Tester', icon: TerminalSquare },
  { key: 'db', label: 'Database Viewer', icon: DatabaseIcon },
  { key: 'logs', label: 'Logs & Debug', icon: Bug },
];

export default function SystemPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tab, setTab] = useState<'overview' | 'api' | 'db' | 'logs'>('overview');

  // Database Viewer state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [dbPage, setDbPage] = useState(1);
  const dbLimit = 20;

  // Database Viewer queries
  const {
    data: dbTables = [],
    isLoading: dbTablesLoading,
    error: dbTablesError,
  } = useQuery<string[]>({
    queryKey: ['db-tables'],
    queryFn: adminApi.getDatabaseTables,
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

  // Helper for error message
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-900/80 border border-red-700 text-red-200 rounded-lg p-4 my-2">
      <span className="font-bold">Error:</span> {message}
    </div>
  );

  // Helper for loading skeleton
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
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
                // onClick={() => refetch()} // systemHealth refetch, not used here
                disabled
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/25" disabled>
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configure</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center space-x-2 px-4 sm:px-6 pt-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`flex items-center px-4 py-2 rounded-t-lg font-medium transition-colors ${
                tab === key
                  ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                  : 'bg-gray-800 text-gray-300 hover:text-blue-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* ... other tabs unchanged ... */}

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

          {/* ... other tabs unchanged ... */}

          {tab === 'api' && (
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
              <TerminalSquare className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">API Endpoint Tester</h2>
              <p className="text-gray-400 mb-4">Test backend endpoints, send requests, and view responses here. (Coming soon)</p>
              {/* TODO: Implement API tester UI */}
            </div>
          )}

          {tab === 'logs' && (
            <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
              <Bug className="w-10 h-10 text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Logs & Debugging</h2>
              <p className="text-gray-400 mb-4">View logs, errors, and debug information from frontend and backend. (Coming soon)</p>
              {/* TODO: Implement logs/debugging UI */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
