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
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Terminal,
  HardDrive,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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
    section: 'Revenue',
    items: [
      { icon: DollarSign, label: 'Billing & Revenue', href: '/billing' },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { icon: TrendingUp, label: 'Trades', href: '/trades' },
    ],
  },
  {
    section: 'System',
    items: [
      { icon: Server, label: 'System', href: '/system' },
      { icon: Activity, label: 'Status', href: '/status' },
      { icon: HardDrive, label: 'Database', href: '/database' },
      { icon: Terminal, label: 'Logs', href: '/logs' },
    ],
  },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    toast.success('Admin session ended');
    router.push('/login');
  };

  return (
    <motion.div
      initial={{ width: isCollapsed ? 80 : 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-gray-900 border-r border-gray-800 flex flex-col h-screen relative flex-shrink-0"
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-base font-bold text-white">TradeTaper</h1>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5">
        <nav className="px-3 space-y-6">
          {menuItems.map((section) => (
            <div key={section.section}>
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <item.icon className={cn('w-5 h-5 flex-shrink-0', isCollapsed ? 'mx-auto' : 'mr-3')} />

                      {!isCollapsed && <span className="flex-1">{item.label}</span>}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-16 px-2.5 py-1.5 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                          {item.label}
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 border-l border-t border-gray-700 rotate-45" />
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
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">TradeTaper Admin</p>
                <p className="text-xs text-gray-500 truncate">admin panel</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              'p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white flex-shrink-0',
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
