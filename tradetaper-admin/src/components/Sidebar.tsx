'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Globe,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  TestTube,
  Terminal,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { adminLogout } from '@/lib/api';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    section: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
      { icon: Activity, label: 'Activity', href: '/activity' },
    ],
  },
  {
    section: 'User Management',
    items: [
      { icon: Users, label: 'Users', href: '/users' },
    ],
  },
  {
    section: 'Revenue Management',
    items: [
      { icon: DollarSign, label: 'Revenue & Billing', href: '/billing' },
    ],
  },
  {
    section: 'System & Development',
    items: [
      { icon: Database, label: 'System', href: '/system' },
      { icon: Activity, label: 'Status', href: '/status' },
      { icon: TestTube, label: 'Testing', href: '/testing' },
      { icon: HardDrive, label: 'Database', href: '/database' },
      { icon: Terminal, label: 'Logs', href: '/logs' },
    ],
  },
  {
    section: 'Analytics & Reports',
    items: [
      { icon: TrendingUp, label: 'Trades', href: '/trades' },
      { icon: Globe, label: 'Geographic', href: '/geographic' },
    ],
  },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Clear authentication data using the proper logout function
    adminLogout();
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Redirect to login
    router.push('/login');
  };

  return (
    <motion.div
      initial={{ width: isCollapsed ? 80 : 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-gray-900 border-r border-gray-800 flex flex-col h-screen relative"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: isCollapsed ? 0 : 1 }}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">TradeTaper</h1>
                <p className="text-xs text-gray-400">Admin Dashboard</p>
              </div>
            )}
          </motion.div>
          
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-3 space-y-8">
          {menuItems.map((section) => (
            <div key={section.section}>
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.section}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <item.icon className={cn(
                        'w-5 h-5 flex-shrink-0',
                        isCollapsed ? 'mx-auto' : 'mr-3'
                      )} />
                      
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                        </>
                      )}
                      
                      
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-16 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-gray-700">
                          {item.label}
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 border-l border-t border-gray-700 rotate-45"></div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-gray-400 truncate">admin@tradetaper.com</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={cn(
              'p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white',
              isCollapsed && 'mx-auto'
            )}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
