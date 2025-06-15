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
  UserX,
  Mail,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight
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
    setCurrentPage(1); // Reset to first page when searching
    setTimeout(() => setIsSearching(false), 500);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getUserStatusColor = (user: User) => {
    const isRecent = new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return isRecent ? 'text-green-400' : 'text-gray-400';
  };

  const getUserStatusText = (user: User) => {
    const isRecent = new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return isRecent ? 'New' : 'Active';
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
                <p className="text-gray-400">Manage and monitor platform users</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
              
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    {formatNumber(dashboardStats?.totalUsers || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +{dashboardStats?.userGrowth || 0}% from last month
                </div>
              </div>
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
                    {formatNumber(dashboardStats?.activeUsers || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +{dashboardStats?.activeGrowth || 0}% from last month
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">New This Month</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(Math.floor((dashboardStats?.totalUsers || 0) * 0.08))}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <UserPlus className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +12.3% from last month
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Churned Users</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(Math.floor((dashboardStats?.totalUsers || 0) * 0.02))}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <UserX className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-red-400">
                  ↗ +2.1% from last month
                </div>
              </div>
            </motion.div>
          </div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            {/* Table Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">All Users</h3>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading || isSearching ? (
                    // Loading skeleton
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
                            <div>
                              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-1"></div>
                              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-6 w-16 bg-gray-700 rounded-full animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-8 w-8 bg-gray-700 rounded animate-pulse inline-block"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    usersData?.data.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email.split('@')[0]
                                }
                              </p>
                              <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-white">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserStatusColor(user)} bg-gray-700`}>
                            {getUserStatusText(user)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{timeAgo(new Date(user.createdAt))}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}

                  {!isLoading && !isSearching && usersData?.data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No users found</p>
                        {searchQuery && (
                          <p className="text-sm mt-2">Try adjusting your search query</p>
                        )}
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
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, usersData.total)} of {usersData.total} users
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  
                  <span className="text-sm text-gray-300">
                    Page {currentPage} of {usersData.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
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