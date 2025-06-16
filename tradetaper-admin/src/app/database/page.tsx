'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { 
  Database, 
  Table, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Filter, 
  Download, 
  AlertTriangle,
  UserPlus,
  Shield,
  BarChart3,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '@/lib/api';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableStat {
  tableName: string;
  rowCount: number;
  size: string;
  sizeBytes: number;
  canClear: boolean;
  error?: string;
}

interface DatabaseViewerProps {
  tables: string[];
  selectedTable: string | null;
  onTableSelect: (table: string) => void;
}

const DatabaseViewer = ({ tables, selectedTable, onTableSelect }: DatabaseViewerProps) => {
  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center mb-4">
        <Database className="w-5 h-5 text-blue-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Database Tables</h3>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => onTableSelect(table)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              selectedTable === table
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
                : 'hover:bg-gray-800/50 text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Table className="w-4 h-4 mr-2" />
              {table}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Add Test User Management Component
const TestUserManager = ({ onRefresh }: { onRefresh: () => void }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestUser = async () => {
    try {
      setIsCreating(true);
      setError(null);
      const result = await adminApi.createTestUser();
      setResult(result);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create test user');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTestUser = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      const result = await adminApi.deleteTestUser();
      setResult(result);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete test user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center mb-4">
        <UserPlus className="w-5 h-5 text-green-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Test User Management</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-3">
          <button
            onClick={createTestUser}
            disabled={isCreating}
            className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Test User'}
          </button>
          <button
            onClick={deleteTestUser}
            disabled={isDeleting}
            className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg px-4 py-2 text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Test User'}
          </button>
        </div>

        {result && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-green-300 font-medium">Success</span>
            </div>
            <p className="text-blue-200 text-sm mb-2">{result.message}</p>
            {result.user && (
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong>Email:</strong> {result.user.email}</p>
                <p><strong>Password:</strong> TradeTest123!</p>
                {result.stats && (
                  <p><strong>Data Created:</strong> {result.stats.trades} trades, {result.stats.accounts} accounts, {result.stats.strategies} strategies, {result.stats.tags} tags</p>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-4 h-4 text-red-400 mr-2" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
          <p><strong>Test User Credentials:</strong></p>
          <p>Email: trader@tradetaper.com</p>
          <p>Password: TradeTest123!</p>
          <p className="mt-2 text-yellow-400">⚠️ This user includes 50+ realistic trades with P&L data</p>
        </div>
      </div>
    </div>
  );
};

// Add Database Management Component
const DatabaseManager = ({ tableStats, onRefresh }: { 
  tableStats: TableStat[] | null; 
  onRefresh: () => void;
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');
  const [doubleConfirmText, setDoubleConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const clearTable = async () => {
    if (!selectedTable || confirmText !== 'DELETE_ALL_DATA') {
      setError('Please select a table and enter the confirmation text');
      return;
    }

    try {
      setIsClearing(true);
      setError(null);
      const result = await adminApi.clearTable(selectedTable, confirmText);
      setResult(result);
      onRefresh();
      setConfirmText('');
      setSelectedTable('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear table');
    } finally {
      setIsClearing(false);
    }
  };

  const clearAllTables = async () => {
    if (confirmText !== 'DELETE_ALL_DATA' || doubleConfirmText !== 'I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING') {
      setError('Please enter both confirmation texts exactly as shown');
      return;
    }

    try {
      setIsClearing(true);
      setError(null);
      const result = await adminApi.clearAllTables(confirmText, doubleConfirmText);
      setResult(result);
      onRefresh();
      setConfirmText('');
      setDoubleConfirmText('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear all tables');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center mb-4">
        <Shield className="w-5 h-5 text-red-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Database Management</h3>
        <span className="ml-2 px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-300">
          DANGER ZONE
        </span>
      </div>

      {/* Table Stats */}
      {tableStats && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Table Statistics</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {tableStats.map((stat) => (
              <div key={stat.tableName} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{stat.tableName}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{stat.rowCount} rows</span>
                  <span className="text-gray-500">{stat.size}</span>
                  {stat.canClear ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Single Table */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Clear Single Table</h4>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="">Select table to clear...</option>
          {tableStats?.filter(stat => stat.canClear).map((stat) => (
            <option key={stat.tableName} value={stat.tableName}>
              {stat.tableName} ({stat.rowCount} rows)
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Type: DELETE_ALL_DATA"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400"
        />
        <button
          onClick={clearTable}
          disabled={isClearing || !selectedTable || confirmText !== 'DELETE_ALL_DATA'}
          className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg px-4 py-2 text-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isClearing ? 'Clearing...' : 'Clear Selected Table'}
        </button>
      </div>

      {/* Clear All Tables */}
      <div className="space-y-4 border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300">Clear All Tables</h4>
        <input
          type="text"
          placeholder="Type: DELETE_ALL_DATA"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400"
        />
        <input
          type="text"
          placeholder="Type: I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING"
          value={doubleConfirmText}
          onChange={(e) => setDoubleConfirmText(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400"
        />
        <button
          onClick={clearAllTables}
          disabled={isClearing || confirmText !== 'DELETE_ALL_DATA' || doubleConfirmText !== 'I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING'}
          className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg px-4 py-2 text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isClearing ? 'Clearing...' : 'CLEAR ALL TABLES'}
        </button>
      </div>

      {result && (
        <div className="mt-4 bg-green-900/30 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-green-300 font-medium">Success</span>
          </div>
          <p className="text-green-200 text-sm">{result.message}</p>
          {result.deletedCount !== undefined && (
            <p className="text-xs text-gray-400 mt-1">Deleted {result.deletedCount} rows</p>
          )}
          {result.tablesCleared && (
            <p className="text-xs text-gray-400 mt-1">
              Cleared tables: {result.tablesCleared.join(', ')} ({result.totalDeleted} total rows)
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 border-t border-gray-700 pt-3">
        <div className="flex items-center mb-2">
          <AlertTriangle className="w-3 h-3 text-yellow-400 mr-1" />
          <span className="text-yellow-400 font-medium">Safety Features:</span>
        </div>
        <ul className="space-y-1 text-gray-500">
          <li>• Users table is protected and cannot be cleared</li>
          <li>• Double confirmation required for destructive operations</li>
          <li>• Foreign key constraints handled automatically</li>
          <li>• Operations are logged for audit trail</li>
        </ul>
      </div>
    </div>
  );
};

interface TableDataViewerProps {
  table: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const TableDataViewer = ({ 
  table, 
  columns, 
  data, 
  total, 
  page, 
  limit, 
  totalPages, 
  onPageChange, 
  onRefresh 
}: TableDataViewerProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCellValue = (value: any, dataType: string) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
          {value.toString()}
        </span>
      );
    }
    if (dataType.includes('timestamp') || dataType.includes('date')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    if (typeof value === 'object') {
      return <pre className="text-xs text-gray-400">{JSON.stringify(value, null, 2)}</pre>;
    }
    const stringValue = String(value);
    if (stringValue.length > 50) {
      return (
        <span title={stringValue} className="text-gray-300">
          {stringValue.substring(0, 47)}...
        </span>
      );
    }
    return <span className="text-gray-300">{stringValue}</span>;
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Table className="w-5 h-5 text-green-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">{table}</h3>
          <span className="ml-2 px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-400">
            {total} rows
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </button>
          <button className="p-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all">
            <Download className="w-4 h-4 text-green-400" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search table data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              {columns.map((column) => (
                <th
                  key={column.column_name}
                  className="text-left p-3 text-sm font-medium text-gray-300"
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.column_name}</span>
                    <span className="text-xs text-gray-500">({column.data_type})</span>
                    {column.is_nullable === 'NO' && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="text-left p-3 text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                {columns.map((column) => (
                  <td key={column.column_name} className="p-3 text-sm">
                    {formatCellValue(row[column.column_name], column.data_type)}
                  </td>
                ))}
                <td className="p-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-400">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-all"
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-sm text-blue-300">
            {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DatabasePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableStats, setTableStats] = useState<TableStat[] | null>(null);

  useEffect(() => {
    loadTables();
    loadTableStats();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, page]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesList = await adminApi.getDatabaseTables();
      setTables(tablesList);
      if (tablesList.length > 0) {
        setSelectedTable(tablesList[0]);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      setError('Failed to load database tables');
      // Mock data for development
      setTables(['users', 'trades', 'subscriptions', 'mt5_accounts', 'strategies']);
      setSelectedTable('users');
    } finally {
      setLoading(false);
    }
  };

  const loadTableStats = async () => {
    try {
      const stats = await adminApi.getTableStats();
      setTableStats(stats.tables);
    } catch (error) {
      console.error('Failed to load table stats:', error);
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      const [columnsData, rowsData] = await Promise.all([
        adminApi.getDatabaseColumns(selectedTable),
        adminApi.getDatabaseRows(selectedTable, page, limit)
      ]);
      
      setColumns(columnsData);
      setData(rowsData.data);
      setTotal(rowsData.total);
      setTotalPages(rowsData.totalPages);
    } catch (error) {
      console.error('Failed to load table data:', error);
      setError(`Failed to load data for table: ${selectedTable}`);
      // Mock data for development
      setColumns([
        { column_name: 'id', data_type: 'varchar', is_nullable: 'NO', column_default: null },
        { column_name: 'email', data_type: 'varchar', is_nullable: 'NO', column_default: null },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', column_default: 'now()' },
      ]);
      setData([
        { id: '1', email: 'john@example.com', created_at: new Date().toISOString() },
        { id: '2', email: 'jane@example.com', created_at: new Date().toISOString() },
      ]);
      setTotal(2);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    loadTableData();
    loadTableStats();
  };

  const handleRefreshAll = () => {
    loadTables();
    loadTableStats();
    loadTableData();
  };

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl mr-4">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                      Database Management
              </h1>
                    <p className="text-gray-400">Explore database, manage test data, and administrative controls</p>
            </div>
                </div>
                <button
                  onClick={handleRefreshAll}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-300 transition-all flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh All</span>
                </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </motion.div>

            {/* Management Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Test User Management */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <TestUserManager onRefresh={handleRefreshAll} />
              </motion.div>

              {/* Database Management */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <DatabaseManager tableStats={tableStats} onRefresh={handleRefreshAll} />
              </motion.div>
            </div>

            {/* Database Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tables Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <DatabaseViewer
              tables={tables}
              selectedTable={selectedTable}
              onTableSelect={handleTableSelect}
            />
          </motion.div>

          {/* Table Data Viewer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            {selectedTable && columns.length > 0 ? (
              <TableDataViewer
                table={selectedTable}
                columns={columns}
                data={data}
                total={total}
                page={page}
                limit={limit}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onRefresh={handleRefresh}
              />
            ) : loading ? (
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading table data...</p>
              </div>
            ) : (
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Select a table to view its data</p>
              </div>
            )}
          </motion.div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}