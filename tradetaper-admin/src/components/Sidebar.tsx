'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
  WandSparkles,
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
      { icon: WandSparkles, label: 'UI Lab', href: '/ui-lab' },
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
    <aside
      className={cn(
        'flex h-screen flex-shrink-0 flex-col border-r transition-all duration-300 ease-out',
        isCollapsed ? 'w-[92px]' : 'w-[296px]',
      )}
      style={{
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      <div className={cn('border-b', isCollapsed ? 'px-2 py-5' : 'px-5 py-6')} style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className={cn('flex items-center', isCollapsed ? 'flex-col justify-center gap-3' : 'justify-between gap-3')}>
          <Link href="/" className={cn('flex items-center transition-all duration-200', isCollapsed ? 'justify-center' : 'gap-3')}>
            <div className={cn('flex items-center justify-center', isCollapsed ? 'h-11 w-11' : 'h-10 w-10')}>
              <TrendingUp className={cn('text-emerald-500', isCollapsed ? 'h-6 w-6' : 'h-9 w-9')} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-[2rem] leading-none font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  TradeTaper
                </p>
                <span className="mt-1 block text-base font-medium text-emerald-500">Admin</span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggle}
            className="h-10 w-10 rounded-xl transition-colors"
            style={{
              background: 'var(--bg-muted)',
              color: 'var(--text-muted)',
            }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="mx-auto h-5 w-5" /> : <ChevronLeft className="mx-auto h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {menuSections.map((section) => (
          <div key={section.section} className="mb-7">
            {!isCollapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                {section.section}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <div
                    key={item.href}
                    className="relative group"
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center rounded-xl text-base font-medium transition-all duration-200 overflow-hidden',
                        isCollapsed ? 'justify-center px-2 py-3.5' : 'gap-3 px-4 py-3.5',
                        'hover:bg-[var(--sidebar-item-hover)]',
                        active
                          ? 'text-emerald-500'
                          : ''
                      )}
                      style={{
                        color: active ? '#10B981' : 'var(--sidebar-text)',
                        background: active ? 'var(--sidebar-item-active)' : 'transparent',
                      }}
                    >
                      {active && (
                        <>
                          <span className="absolute inset-0 rounded-xl bg-emerald-500/12 border border-emerald-400/20" />
                          <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-8 rounded-full bg-emerald-400/25 blur-xl" />
                        </>
                      )}
                      <item.icon
                        className="relative z-10 h-5 w-5 flex-shrink-0"
                        style={{ color: active ? '#10B981' : 'var(--text-muted)' }}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                      {active && !isCollapsed && <span className="relative z-10 ml-auto h-2 w-2 rounded-full bg-emerald-500" />}
                    </Link>

                    {isCollapsed && hoveredItem === item.href && (
                      <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg z-50 whitespace-nowrap">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-700" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1.5 border-t px-3 py-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'w-full flex items-center rounded-xl text-base font-medium transition-all duration-200',
            isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3.5',
            'hover:bg-[var(--sidebar-item-hover)]'
          )}
          style={{ color: 'var(--sidebar-text)', background: 'transparent' }}
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center rounded-xl text-base font-medium transition-all duration-200',
            isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3.5',
            'hover:bg-red-500/10 hover:text-red-500'
          )}
          style={{ color: 'var(--sidebar-text)' }}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
