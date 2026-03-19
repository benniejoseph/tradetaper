'use client';

import { useState, useCallback } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import {
  Database, ChevronLeft, ChevronRight, RefreshCw,
  Table2, Play, AlertTriangle,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { getAdminCapabilities } from '@/lib/admin-access';
import toast from 'react-hot-toast';

type DatabaseColumn = Awaited<ReturnType<typeof adminApi.getDatabaseColumns>>[number];
type DatabaseRowsResponse = Awaited<ReturnType<typeof adminApi.getDatabaseRows>>;
type DatabaseRow = DatabaseRowsResponse['data'][number];
type SqlQueryResponse = Awaited<ReturnType<typeof adminApi.runSqlQuery>>;

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return maybeResponse?.data?.message || maybeResponse?.data?.error || 'Failed to execute SQL';
  }
  return 'Failed to execute SQL';
};

export default function DatabasePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sql, setSql] = useState('SELECT * FROM users LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<SqlQueryResponse | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'sql'>('data');
  const { data: adminSession } = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => adminApi.getAdminSession(),
    staleTime: 60_000,
    retry: false,
  });
  const capabilities = getAdminCapabilities(adminSession?.adminRole);

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['db-tables'],
    queryFn: () => adminApi.getDatabaseTables(),
    enabled: capabilities.canViewDatabase,
  });

  const { data: columns, isLoading: columnsLoading } = useQuery({
    queryKey: ['db-columns', selectedTable],
    queryFn: () => adminApi.getDatabaseColumns(selectedTable!),
    enabled: !!selectedTable && capabilities.canViewDatabase,
  });

  const { data: rows, isLoading: rowsLoading } = useQuery<DatabaseRowsResponse>({
    queryKey: ['db-rows', selectedTable, page],
    queryFn: () => adminApi.getDatabaseRows(selectedTable!, page, 20),
    enabled: !!selectedTable && capabilities.canViewDatabase,
    placeholderData: keepPreviousData,
  });

  const runSql = useCallback(async () => {
    if (!capabilities.canRunSql) {
      toast.error('SQL runner is restricted to super-admin role');
      return;
    }
    if (!sql.trim()) return toast.error('Enter SQL query');
    setSqlLoading(true);
    setSqlResult(null);
    try {
      const data = await adminApi.runSqlQuery(sql);
      setSqlResult(data);
      if (data.success) toast.success(`Query executed — ${Array.isArray(data.result) ? data.result.length : 0} rows`);
      else toast.error(data.error || 'Query failed');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setSqlLoading(false);
    }
  }, [sql, capabilities.canRunSql]);

  const rowData = rows?.data || [];
  const totalRows = rows?.total || 0;
  const totalPages = rows?.totalPages || 1;
  const columnDefs = columns || [];

  if (adminSession && !capabilities.canViewDatabase) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="admin-card p-6 max-w-md w-full text-center">
            <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Database Access Restricted
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Your admin role does not include database viewer permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex overflow-hidden">

        {/* Table list sidebar */}
        <div className="w-56 border-r flex-shrink-0 flex flex-col overflow-hidden"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="px-4 py-3 border-b flex items-center gap-2"
               style={{ borderColor: 'var(--border-subtle)' }}>
            <Database className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Tables</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {tablesLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg mb-1 animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ))
            ) : (tables as string[] || []).map((t) => (
              <button
                key={t}
                onClick={() => { setSelectedTable(t); setPage(1); setActiveTab('data'); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all mb-0.5"
                style={{
                  background: selectedTable === t ? 'var(--accent-primary-subtle)' : 'transparent',
                  color: selectedTable === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                onMouseEnter={e => { if (selectedTable !== t) (e.currentTarget as HTMLElement).style.background = 'var(--bg-muted)'; }}
                onMouseLeave={e => { if (selectedTable !== t) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Table2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="px-6 py-3 border-b flex items-center justify-between"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedTable || 'Database Explorer'}
              </h1>
              {selectedTable && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{totalRows} records</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab('data')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'data' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}>
                Table View
              </button>
              {capabilities.canRunSql && (
                <button onClick={() => setActiveTab('sql')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'sql' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}>
                  SQL Runner
                </button>
              )}
            </div>
          </header>

          {activeTab === 'data' && selectedTable ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Columns strip */}
              {!columnsLoading && columnDefs.length > 0 && (
                <div className="px-4 py-2 border-b flex gap-2 flex-wrap"
                     style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-subtle)' }}>
                  {columnDefs.map((c: DatabaseColumn) => (
                    <span key={c.column_name} className="badge badge-muted text-[10px] font-mono">
                      {c.column_name}: <span style={{ color: 'var(--accent-primary)', opacity: 0.7 }}>{c.data_type}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-auto p-4">
                {rowsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
                  </div>
                ) : rowData.length === 0 ? (
                  <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Empty table</div>
                ) : (
                  <div className="admin-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            {Object.keys(rowData[0]).map((k) => <th key={k}>{k}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {rowData.map((row: DatabaseRow, i: number) => (
                            <tr key={i}>
                              {Object.values(row).map((v, j) => (
                                <td key={j}>
                                  <span className="font-mono text-xs block max-w-xs truncate" title={String(v ?? '')}>
                                    {v == null ? <span style={{ color: 'var(--text-muted)' }}>NULL</span> : String(v)}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page}/{totalPages} • {totalRows} rows</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="admin-btn-secondary py-1 px-3 disabled:opacity-40"
                            aria-label="Previous page"
                            title="Previous page"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="admin-btn-secondary py-1 px-3 disabled:opacity-40"
                            aria-label="Next page"
                            title="Next page"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'sql' && capabilities.canRunSql ? (
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="admin-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>SQL Runner</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent-warning)' }}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Use with caution
                  </div>
                </div>
                <textarea
                  value={sql}
                  onChange={e => setSql(e.target.value)}
                  rows={6}
                  className="admin-input font-mono text-sm resize-none"
                  placeholder="SELECT * FROM users LIMIT 10;"
                  spellCheck={false}
                />
                <div className="flex justify-end mt-2">
                  <button className="admin-btn-primary" onClick={runSql} disabled={sqlLoading}>
                    <Play className="w-4 h-4" />
                    {sqlLoading ? 'Running…' : 'Execute Query'}
                  </button>
                </div>
              </div>

              {sqlResult && (
                <div className="admin-card overflow-hidden">
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs font-semibold" style={{ color: sqlResult.success ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                      {sqlResult.success ? `✓ Success — ${Array.isArray(sqlResult.result) ? sqlResult.result.length : 0} rows` : `✗ Error: ${sqlResult.error}`}
                    </p>
                  </div>
                  {sqlResult.success && Array.isArray(sqlResult.result) && sqlResult.result.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="admin-table">
                        <thead>
                          <tr>{Object.keys(sqlResult.result[0]).map(k => <th key={k}>{k}</th>)}</tr>
                        </thead>
                        <tbody>
                          {sqlResult.result.map((row, i: number) => (
                            <tr key={i}>
                              {Object.values(row).map((v, j) => (
                                <td key={j}><span className="font-mono text-xs">{v == null ? 'NULL' : String(v)}</span></td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Select a table to explore</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Or use the SQL Runner to run custom queries</p>
                <button onClick={() => setActiveTab('sql')} className="admin-btn-primary mt-4">Open SQL Runner</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
