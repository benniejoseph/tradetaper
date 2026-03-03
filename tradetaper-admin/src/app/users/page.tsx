'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  UserCheck,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatNumber, timeAgo } from '@/lib/utils';
import { adminApi, User } from '@/lib/api';

export default function UsersPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', currentPage, searchQuery],
    queryFn: () => adminApi.getUsers(currentPage, 20, searchQuery || undefined),
    refetchInterval: 30000,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    setCurrentPage(1);
    setTimeout(() => setIsSearching(false), 500);
  };

  const getUserStatusLabel = (user: User) => {
    const isNew = new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return { label: isNew ? 'New' : 'Active', color: isNew ? 'text-green-400 bg-green-500/10' : 'text-gray-300 bg-gray-700/50' };
  };

  const handleExportCsv = () => {
    if (!usersData?.data) return;
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Created At'];
    const rows = usersData.data.map((u) => [u.id, u.email, u.firstName || '', u.lastName || '', u.createdAt]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradetaper-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <p className="text-gray-400 text-sm">Manage and monitor platform users</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportCsv}
                disabled={!usersData?.data?.length}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {dashboardStats?.totalUsers != null ? formatNumber(dashboardStats.totalUsers) : '—'}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              {dashboardStats?.userGrowth != null && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className={`text-xs ${dashboardStats.userGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats.userGrowth >= 0 ? '↗' : '↘'} {dashboardStats.userGrowth >= 0 ? '+' : ''}{dashboardStats.userGrowth}% from last month
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {dashboardStats?.activeUsers != null ? formatNumber(dashboardStats.activeUsers) : '—'}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-400" />
                </div>
              </div>
              {dashboardStats?.activeGrowth != null && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className={`text-xs ${dashboardStats.activeGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats.activeGrowth >= 0 ? '↗' : '↘'} {dashboardStats.activeGrowth >= 0 ? '+' : ''}{dashboardStats.activeGrowth}% from last month
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Page Results</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {usersData?.total != null ? formatNumber(usersData.total) : '—'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <UserPlus className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                  {searchQuery ? `Matching "${searchQuery}"` : 'All registered users'}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            {/* Table Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">All Users</h3>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading || isSearching ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
                            <div>
                              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-1" />
                              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4"><div className="h-4 w-32 bg-gray-700 rounded animate-pulse" /></td>
                        <td className="py-4 px-4"><div className="h-6 w-16 bg-gray-700 rounded-full animate-pulse" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-700 rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : (
                    usersData?.data.map((user, index) => {
                      const status = getUserStatusLabel(user);
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-medium text-sm">
                                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.email.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}…</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-white text-sm truncate max-w-[200px]">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2 text-gray-300">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm">{timeAgo(new Date(user.createdAt))}</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}

                  {!isLoading && !isSearching && usersData?.data.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>{searchQuery ? `No users matching "${searchQuery}"` : 'No users found'}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersData && usersData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * 20) + 1}–{Math.min(currentPage * 20, usersData.total)} of {usersData.total} users
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-sm text-gray-300 px-2">
                    Page {currentPage} of {usersData.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(usersData.totalPages, p + 1))}
                    disabled={currentPage === usersData.totalPages}
                    className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}