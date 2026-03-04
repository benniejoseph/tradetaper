'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  Wallet,
  CreditCard,
  Sun,
  Moon,
  BarChart3,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import adminApi from '@/lib/api';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuSections = [
  {
    section: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
      { icon: Activity, label: 'Live Activity', href: '/activity' },
    ],
  },
  {
    section: 'Data',
    items: [
      { icon: Users, label: 'Users', href: '/users' },
      { icon: BarChart3, label: 'Trades', href: '/trades' },
      { icon: Wallet, label: 'Accounts', href: '/accounts' },
      { icon: CreditCard, label: 'Memberships', href: '/memberships' },
      { icon: DollarSign, label: 'Billing', href: '/billing' },
    ],
  },
  {
    section: 'System',
    items: [
      { icon: Database, label: 'Database', href: '/database' },
      { icon: Terminal, label: 'Logs', href: '/logs' },
      { icon: Server, label: 'System', href: '/system' },
      { icon: HardDrive, label: 'Status', href: '/status' },
    ],
  },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // Best-effort logout: still clear client-side fallback state.
      localStorage.removeItem('admin_token');
    }
    toast.success('Logged out');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-screen flex-shrink-0 relative"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b"
           style={{ borderColor: 'var(--sidebar-border)', minHeight: 64 }}>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 min-w-0"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background: 'var(--gradient-brand)' }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>TradeTaper</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" style={{ color: 'var(--accent-primary)' }} />
                  <p className="text-[10px] font-medium" style={{ color: 'var(--accent-primary)' }}>Admin</p>
                </div>
              </div>
            </motion.div>
          )}
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto"
              style={{ background: 'var(--gradient-brand)' }}
            >
              <TrendingUp className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ml-2"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {menuSections.map((section) => (
          <div key={section.section} className="mb-6">
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
                 style={{ color: 'var(--text-muted)' }}>
                {section.section}
              </p>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative',
                        isCollapsed && 'justify-center'
                      )}
                      style={{
                        background: active ? 'var(--sidebar-item-active)' : 'transparent',
                        color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
                          style={{ background: 'var(--accent-primary)' }}
                        />
                      )}
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>

                    {/* Tooltip for collapsed */}
                    {isCollapsed && hoveredItem === item.href && (
                      <div
                        className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap z-50 shadow-lg"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1',
            isCollapsed && 'justify-center'
          )}
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-item-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
          {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            isCollapsed && 'justify-center'
          )}
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent-danger-subtle)';
            (e.currentTarget as HTMLElement).style.color = 'var(--accent-danger)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
          title="Logout"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
